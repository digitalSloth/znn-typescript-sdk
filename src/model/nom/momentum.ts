import { Buffer } from "buffer";
import { Model } from "../base.js";
import { Address, Hash } from "../primitives/index.js";
import { AccountHeader } from "./accountHeader.js";

export class Momentum extends Model {
    constructor(
        public version: number,
        public chainIdentifier: number,
        public hash: Hash,
        public previousHash: Hash,
        public height: number,
        public timestamp: number,
        public data: Buffer,
        public content: Array<AccountHeader>,
        public changesHash: Hash,
        public publicKey: string,
        public signature: string,
        public producer: Address,
        public nextFusionPrice?: number,
        public nextWorkPrice?: number
    ){
        super()
    }

    static fromJson(json: {[key: string]: any}): Momentum {
        return new Momentum(
            json.version,
            json.chainIdentifier,
            Hash.parse(json.hash),
            Hash.parse(json.previousHash),
            json.height,
            json.timestamp,
            Buffer.from(json.data, "hex"),
            json.content?.map((header: {[key: string]: any}) => AccountHeader.fromJson(header)),
            Hash.parse(json.changesHash),
            json.publicKey || "",
            json.signature || "",
            Address.parse(json.producer),
            json.nextFusionPrice,
            json.nextWorkPrice
        );
    }

    toJson(): {[key: string]: any}{
        return {
            version: this.version,
            chainIdentifier: this.chainIdentifier,
            hash: this.hash.toString(),
            previousHash: this.previousHash.toString(),
            height: this.height,
            timestamp: this.timestamp,
            data: this.data.toString("hex"),
            content: this.content.map((header: AccountHeader) => header.toString()),
            changesHash: this.changesHash?.toString(),
            publicKey: this.publicKey,
            signature: this.signature,
            producer: this.producer.toString(),
            nextFusionPrice: this.nextFusionPrice,
            nextWorkPrice: this.nextWorkPrice
        };
    }
}

export class MomentumList extends Model {

    constructor(
        public count: number = 0,
        public list: Array<Momentum> = []
    ) {
        super();
    }

    static fromJson(json: {[key: string]: any}): MomentumList{
        return new MomentumList(
            json.count,
            json.list.map(Momentum.fromJson)
        );
    }
}

