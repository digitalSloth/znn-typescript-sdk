import { Buffer } from "buffer";
import { numberToBytes } from "../../utilities/bytes.js";
import { EMPTY_HASH, Hash } from "./hash.js";

export class HashHeight {
    constructor(
        public hash: Hash = EMPTY_HASH,
        public height: number
    ) {}

    static fromJson(json: {[key: string]: any}): HashHeight {
        return new HashHeight(
            Hash.parse(json["hash"]),
            json["height"]
        );
    }

    toJson(): {[key: string]: any} {
        return {
            hash: this.hash.toString(),
            height: this.height
        };
    }

    toString(): string {
        return JSON.stringify(this.toJson());
    }

    getBytes(): Buffer {
        return Buffer.concat([
            this.hash?.getBytes() || EMPTY_HASH.getBytes(),
            numberToBytes(this.height!, 8)
        ]);
    }
}

const EMPTY_HASH_HEIGHT = new HashHeight(EMPTY_HASH, 0);

export {
    EMPTY_HASH_HEIGHT
}

