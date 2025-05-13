import { Address } from "./primitives/address.js";
import { Model } from "./base.js";

export enum SyncState {
    Unknown = 0,
    Syncing = 1,
    SyncDone = 2,
    NotEnoughPeers = 3,
}

export class Peer extends Model {
    constructor(
        public publicKey: string,
        public ip: string
    ) {
        super()
    }

    static fromJson(json: { [key: string]: any }): Peer {
        return new Peer(json.publicKey, json.ip);
    }
}

export class NetworkInfo extends Model {
    constructor(
        public numPeers: number,
        public self: Peer,
        public peers: Peer[]
    ) {
        super()
    }

    static fromJson(json: { [key: string]: any }): NetworkInfo {
        const peers = (json.peers as any[]).map((peerJson) => Peer.fromJson(peerJson));
        return new NetworkInfo(json.numPeers, Peer.fromJson(json.self), peers);
    }
}

export class ProcessInfo extends Model {
    constructor(
        public commit: string,
        public version: string
    ) {
        super()
    }

    static fromJson(json: { [key: string]: any }): ProcessInfo {
        return new ProcessInfo(json.commit, json.version);
    }
}

export class OsInfo extends Model {
    constructor(
        public os: string,
        public platform: string,
        public platformFamily: string,
        public platformVersion: string,
        public kernelVersion: string,
        public memoryTotal: number,
        public memoryFree: number,
        public numCPU: number,
        public numGoroutine: number
    ) {
        super()
    }

    static fromJson(json: { [key: string]: any }): OsInfo {
        return new OsInfo(
            json.os,
            json.platform,
            json.platformFamily,
            json.platformVersion,
            json.kernelVersion,
            json.memoryTotal,
            json.memoryFree,
            json.numCPU,
            json.numGoroutine
        );
    }
}

export class SyncInfo extends Model {
    constructor(
        public state: SyncState,
        public currentHeight: number,
        public targetHeight: number
    ) {
        super()
    }

    static fromJson(json: { [key: string]: any }): SyncInfo {
        return new SyncInfo(json.state as SyncState, json.currentHeight, json.targetHeight);
    }
}

export class ExtraData extends Model {
    constructor(
        public affiliate: Address
    ) {
        super()
    }

    static fromJson(json: { [key: string]: any }): ExtraData {
        return new ExtraData(Address.parse(json.affiliate));
    }
}
