import { Client, WsClient, newClient, type WsClientOptions } from "./client/index.js";
import { SubscribeApi, LedgerApi, StatsApi, EmbeddedApi } from "./api/index.js";
import { AccountBlockTemplate } from "./model/nom/accountBlock.js";
import { KeyPair } from "./wallet/index.js";
import { send } from "./utilities/block.js";

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
}
