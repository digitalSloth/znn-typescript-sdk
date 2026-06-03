import { Client, WsClient, newClient, type WsClientOptions } from "./client/index.js";
import { SubscribeApi, LedgerApi, StatsApi, EmbeddedApi } from "./api/index.js";
import { AccountBlockTemplate } from "./model/nom/accountBlock.js";
import { KeyPair } from "./wallet/index.js";
import { prepareBlock, send } from "./utilities/block.js";
import { PowWorker, isPowWorkerSupported } from "./pow/powWorker.js";

/**
 * A pluggable Proof-of-Work provider.
 *
 * Receives the PoW data as a 64-character hex string and the required
 * difficulty, and resolves to the 8-byte nonce as a hex string. Register one
 * via {@link Zenon.setPowProvider} to run PoW off the main thread (e.g. in a
 * Web Worker), keeping the WebSocket heartbeat and reconnect timers alive
 * during generation.
 */
export type PowProvider = (hashHex: string, difficulty: number) => Promise<string>;

// Network
export const ZNN_SDK_VERSION: string = "0.0.8";
export const DEFAULT_NET_ID: number = 1;
export const DEFAULT_CHAIN_ID: number = 1;
export const DEFAULT_POW_BASE_PATH: string = "/";

// RPC
export const RPC_MAX_PAGE_SIZE: number = 1024;
export const MEMORY_POOL_PAGE_SIZE: number = 50;

export class Zenon {
    static _singleton: Zenon;
    defaultServerUrl: string = "ws://127.0.0.1:35998";
    static chainID: number = DEFAULT_CHAIN_ID;
    static networkID: number = DEFAULT_NET_ID;
    static powBasePath: string = DEFAULT_POW_BASE_PATH;
    static powProvider?: PowProvider;
    static powWorker?: PowWorker;

    client?: Client;

    ledger: LedgerApi;
    stats: StatsApi;
    embedded: EmbeddedApi;
    subscribe: SubscribeApi;

    public static getInstance(): Zenon {
        if (!Zenon._singleton) {
            Zenon._singleton = new Zenon();
        }
        return Zenon._singleton;
    }

    private constructor() {
        this.ledger = new LedgerApi();
        this.stats = new StatsApi();
        this.embedded = new EmbeddedApi();
        this.subscribe = new SubscribeApi();
    }

    private _setClient(client: Client) {
        this.ledger.setClient(client);
        this.stats.setClient(client);
        this.embedded.setClient(client);

        // set client for subscribe environment only when the client is a WS Connection
        if (client instanceof WsClient) {
            this.subscribe.setClient(client);
        }
    }

    async initialize(serverUrl = this.defaultServerUrl, timeout = 30000, wsOptions?: WsClientOptions) {
        this.client = newClient(serverUrl);

        // If it's a WebSocket client, initialize it
        if (this.client instanceof WsClient) {
            await this.client.initialize(serverUrl, timeout, wsOptions);
        }

        this._setClient(this.client);
    }

    public clearConnection() {
        if (this.client instanceof WsClient) {
            this.client.stop();
        }
        this.client = undefined;
    }

    async send(
        transaction: AccountBlockTemplate,
        currentKeyPair: KeyPair
    ): Promise<AccountBlockTemplate> {
        return send(
            Zenon.getInstance(),
            transaction,
            currentKeyPair
        );
    }

    /**
     * Prepare a block for publishing (autofill, PoW, hash, signature) without
     * publishing it. Use this when you need to control the connection lifecycle
     * around PoW, then call `ledger.publishRawTransaction` yourself.
     */
    async prepareBlock(
        transaction: AccountBlockTemplate,
        currentKeyPair: KeyPair
    ): Promise<AccountBlockTemplate> {
        return prepareBlock(
            Zenon.getInstance(),
            transaction,
            currentKeyPair
        );
    }

    public static setNetworkID(networkId: number = DEFAULT_NET_ID): void {
    	this.networkID = networkId;
    }

    public static getNetworkID(): number {
    	return this.networkID;
    }

    public static setChainID(chainId: number = DEFAULT_CHAIN_ID): void {
    	this.chainID = chainId;
    }

    public static getChainIdentifier(): number {
    	return this.chainID;
    }

    public static setPowBasePath(basePath: string = DEFAULT_POW_BASE_PATH): void {
        // Ensure trailing slash
        if (!basePath.endsWith("/")) {
            basePath += "/";
        }

        // Ensure valid module specifier for browsers (must start with /, ./, or ../)
        // Skip if already valid or is a full URL
        if (!basePath.startsWith("/") &&
            !basePath.startsWith("./") &&
            !basePath.startsWith("../") &&
            !basePath.startsWith("http://") &&
            !basePath.startsWith("https://")) {
            basePath = "./" + basePath;
        }

        this.powBasePath = basePath;
    }

    public static getPowBasePath(): string {
        return this.powBasePath;
    }

    /**
     * Register a custom Proof-of-Work provider. When set, it is used instead of
     * the built-in WASM module during `send`/`prepareBlock`. Supply one backed
     * by a Web Worker to run PoW off the main thread, so the WebSocket
     * heartbeat and reconnect timers keep running during generation.
     */
    public static setPowProvider(provider: PowProvider): void {
        this.powProvider = provider;
    }

    public static getPowProvider(): PowProvider | undefined {
        return this.powProvider;
    }

    /**
     * Remove a previously registered PoW provider, restoring the built-in
     * WASM-based generator. Also stops the managed PoW worker, if one is
     * running.
     */
    public static clearPowProvider(): void {
        this.powProvider = undefined;
        this.stopPowWorker();
    }

    /**
     * Register the SDK's built-in Web Worker as the PoW provider. PoW then runs
     * off the main thread, keeping the WebSocket connection alive and the UI
     * responsive during generation. Browser-only.
     *
     * Uses the current PoW base path (see {@link setPowBasePath}) to locate
     * `pow.js` / `pow.wasm`, so call {@link setPowBasePath} first if needed. The
     * worker is created lazily on the first transaction that requires PoW.
     *
     * @returns the managed {@link PowWorker} instance.
     */
    public static usePowWorker(): PowWorker {
        if (!isPowWorkerSupported()) {
            throw new Error("usePowWorker is only supported in browser environments with Web Worker support");
        }

        this.stopPowWorker();
        this.powWorker = new PowWorker({ basePath: this.getPowBasePath() });
        this.powProvider = this.powWorker.generate;
        return this.powWorker;
    }

    /**
     * Stop the managed PoW worker (if running) and clear it as the provider.
     */
    public static stopPowWorker(): void {
        if (this.powWorker) {
            // Only clear the provider if it still points at the worker we own.
            if (this.powProvider === this.powWorker.generate) {
                this.powProvider = undefined;
            }
            this.powWorker.terminate();
            this.powWorker = undefined;
        }
    }
}
