import { ErrorCode, Logger } from "../utilities/logger.js";
import { Zenon } from "../zenon.js";
import { Client as ClientInterface } from "./interfaces.js";
import { ZnnClientException } from "./errors.js";
import { Client as WebSocketClient } from "rpc-websockets";

const logger = Logger.globalLogger();
const webSocket = WebSocketClient;

enum WebsocketStatus {
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

export class WsClient implements ClientInterface {
    _wsRpc2Client?: any;
    _websocketIntendedState: WebsocketStatus = WebsocketStatus.Uninitialized;
    url: string;
    subscriptions: WSSubscriptions;

    constructor(url: string) {
        this.url = url;
        this._websocketIntendedState = WebsocketStatus.Uninitialized;
        this.subscriptions = new WSSubscriptions();
    }

    initialize(url: string, timeout = 30000, options?: WsClientOptions): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                this.url = url;

                // Merge default options with user-provided options
                const wsOptions = {
                    autoconnect: true,
                    reconnect: true,
                    reconnect_interval: 1000,
                    max_reconnects: 0, // 0 = unlimited reconnects
                    ...options
                };

                this._wsRpc2Client = new webSocket(this.url, wsOptions);

                logger.info(
                    `Initializing websocket connection to:${this.url} on chainIdentifier ${Zenon.getChainIdentifier()}`
                );

                this._wsRpc2Client.on("open", function () {
                    logger.info("Websocket connection successfully established");
                    resolve();
                });

                // register listeners on subscribe events
                this._wsRpc2Client.on(
                    "ledger.subscription",
                    this.subscriptions.handleGlobalNotification.bind(this.subscriptions)
                );

                await new Promise((resolve) => setTimeout(resolve, timeout));
                reject(`Timeout after ${timeout / 1000} seconds`);
            } catch (err: any) {
                logger.warn(`Error connecting to node. ${err}`);
                reject(err);
            }
        });
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
        if (this._wsRpc2Client != null && this._wsRpc2Client!.isClosed == true) {
            logger.info("Restarting websocket connection ...");
            await this.initialize(this.url!, 30000, options);
            logger.info("Websocket connection successfully restarted");
        }
    }

    stop(): void {
        this._websocketIntendedState = WebsocketStatus.Stopped;
        this.subscriptions.callbacks.clear();

        if (!this._wsRpc2Client) {
            logger.info("Websocket client is already closed");
            return;
        }

        logger.info("Closing websocket connection...");
        try {
            const closeResult = this._wsRpc2Client.close();
            Promise.resolve(closeResult)
                .then(() => logger.info("Websocket client is now closed"))
                .catch((err: any) => logger.warn("Error closing websocket:", err));
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
