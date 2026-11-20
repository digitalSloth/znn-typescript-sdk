import { ErrorCode, Logger } from "../utilities/logger.js";
import { Zenon } from "../zenon.js";
import { Client as ClientInterface } from "./interfaces.js";
import { ZnnClientException } from "./errors.js";
import { Client as WebSocketClient } from "rpc-websockets";

const logger = Logger.globalLogger();
const webSocket = WebSocketClient;

export enum WebsocketStatus {
    Uninitialized,
    Connecting,
    Running,
    Stopped,
}

export interface WsClientOptions {
    autoconnect?: boolean;
    reconnect?: boolean;
    reconnect_interval?: number;
    max_reconnects?: number;
}

type WSSubscriptionCallback = (data: any[]) => void;

class WSSubscriptions {
    callbacks: Map<string, WSSubscriptionCallback>;

    constructor() {
        this.callbacks = new Map<string, WSSubscriptionCallback>();
    }

    setCallback(id: string, callback: WSSubscriptionCallback) {
        this.callbacks.set(id, callback);
    }

    handleGlobalNotification(data: any) {
        const id = data.subscription;
        if (this.callbacks.has(id)) {
            const callback = this.callbacks.get(id);
            if (callback) {
                callback(data.result);
            }
        }
    }

    newUpdateStream(jsonResponse: string) {
        // jsonResponse is just the ID actually
        return new WSUpdateStream(jsonResponse, this);
    }
}

export class WSUpdateStream {
    id: string;
    wsSubscribers: WSSubscriptions;

    constructor(id: string, wsSubscribers: WSSubscriptions) {
        this.id = id;
        this.wsSubscribers = wsSubscribers;
    }

    onNotification(callback: WSSubscriptionCallback) {
        this.wsSubscribers.setCallback(this.id, callback);
    }
}

export type WsCloseListener = (code: number, reason: string) => void;

export class WsClient implements ClientInterface {
    _wsRpc2Client?: any;
    _websocketIntendedState: WebsocketStatus = WebsocketStatus.Uninitialized;
    url: string;
    subscriptions: WSSubscriptions;
    private closeListeners = new Set<WsCloseListener>();
    private pendingConnect?: { reject: (reason: Error) => void; timer: ReturnType<typeof setTimeout> };

    constructor(url: string) {
        this.url = url;
        this._websocketIntendedState = WebsocketStatus.Uninitialized;
        this.subscriptions = new WSSubscriptions();
    }

    /**
     * Opens a websocket to `url` and resolves once it is open. Replaces any
     * socket this client already holds. On timeout, or when stop() runs
     * first, the attempt rejects and the socket stops reconnecting.
     */
    initialize(url: string, timeout = 30000, options?: WsClientOptions): Promise<void> {
        this.closeSocket(new Error("Connection replaced by a new initialize()"));
        this.url = url;
        this._websocketIntendedState = WebsocketStatus.Connecting;

        // Merge default options with user-provided options
        const wsOptions = {
            autoconnect: true,
            reconnect: true,
            reconnect_interval: 1000,
            max_reconnects: 0, // 0 = unlimited reconnects
            ...options
        };

        let socket: any;
        try {
            socket = new webSocket(this.url, wsOptions);
        } catch (err: any) {
            logger.warn(`Error connecting to node. ${err}`);
            this._websocketIntendedState = WebsocketStatus.Stopped;
            return Promise.reject(err);
        }
        this._wsRpc2Client = socket;

        logger.info(
            `Initializing websocket connection to:${this.url} on chainIdentifier ${Zenon.getChainIdentifier()}`
        );

        // register listeners on subscribe events
        socket.on(
            "ledger.subscription",
            this.subscriptions.handleGlobalNotification.bind(this.subscriptions)
        );
        socket.on("close", (code: number, reason: string) => {
            if (this._wsRpc2Client !== socket) return;
            for (const listener of this.closeListeners) listener(code, reason);
        });

        return new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingConnect = undefined;
                this.closeSocket();
                this._websocketIntendedState = WebsocketStatus.Stopped;
                reject(new Error(`Timeout after ${timeout / 1000} seconds`));
            }, timeout);
            this.pendingConnect = { reject, timer };

            socket.once("open", () => {
                if (this._wsRpc2Client !== socket) return;
                clearTimeout(timer);
                this.pendingConnect = undefined;
                this._websocketIntendedState = WebsocketStatus.Running;
                logger.info("Websocket connection successfully established");
                resolve();
            });
        });
    }

    /**
     * Calls `listener` each time an open connection closes, including drops
     * the client then reconnects from. A close from stop() or initialize()
     * is not reported. Returns a function that removes the listener.
     */
    onClose(listener: WsCloseListener): () => void {
        this.closeListeners.add(listener);
        return () => {
            this.closeListeners.delete(listener);
        };
    }

    // used to register new subscription handlers after a subscribe call has been made
    newSubscription(id: string): WSUpdateStream {
        return this.subscriptions.newUpdateStream(id);
    }

    status(): WebsocketStatus {
        return this._websocketIntendedState;
    }

    async restart(options?: WsClientOptions): Promise<void> {
        if (this._websocketIntendedState != WebsocketStatus.Running) {
            return;
        }
        if (this._wsRpc2Client != null && this._wsRpc2Client.ready !== true) {
            logger.info("Restarting websocket connection ...");
            await this.initialize(this.url!, 30000, options);
            logger.info("Websocket connection successfully restarted");
        }
    }

    /**
     * Closes the connection for good: rejects a pending initialize(), cancels
     * any scheduled reconnect, and drops subscription callbacks.
     */
    stop(): void {
        this._websocketIntendedState = WebsocketStatus.Stopped;
        this.subscriptions.callbacks.clear();

        if (!this._wsRpc2Client) {
            logger.info("Websocket client is already closed");
            return;
        }

        logger.info("Closing websocket connection...");
        this.closeSocket(new Error("Connection stopped"));
        logger.info("Websocket client is now closed");
    }

    /**
     * Detaches and closes the current socket, and rejects a pending
     * initialize() with `reason`. rpc-websockets' close() only reaches a
     * socket that exists, and an unreachable node leaves none between
     * retries, only a scheduled reconnect. Turning reconnect off and
     * clearing that timer is what stops the retry loop.
     */
    private closeSocket(reason?: Error): void {
        const pending = this.pendingConnect;
        this.pendingConnect = undefined;
        if (pending) {
            clearTimeout(pending.timer);
            if (reason) pending.reject(reason);
        }

        const socket = this._wsRpc2Client;
        if (!socket) return;
        this._wsRpc2Client = undefined;
        try {
            socket.setAutoReconnect(false);
            // rpc-websockets keeps the scheduled reconnect in a private field
            // and has no public way to cancel it.
            clearTimeout(socket.reconnect_timer_id);
            socket.close();
        } catch (err) {
            logger.warn("Error closing websocket:", err);
        }
    }

    async sendRequest(method: string, parameters?: any[]): Promise<any> {
        if (!this._wsRpc2Client) {
            logger.throwError("No connection to the Zenon node", ErrorCode.NETWORK_ERROR)
        }

        try {
            return await this._wsRpc2Client.call(method, parameters);
        } catch (error: any) {
            // Extract error details from the WebSocket RPC error
            const code = error?.code ?? -1;
            const message = error?.message || error?.toString() || "Unknown error occurred";
            const data = error?.data;

            throw new ZnnClientException(message, code, method, parameters, data);
        }
    }
}
