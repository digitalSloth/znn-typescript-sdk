import { Buffer } from "buffer";
import { hexlify } from "../../utilities/bytes.js";
import { toUtf8Bytes } from "../../utilities/utf8.js";
import { Crypto } from "../../crypto/crypto.js";


/**
 * Represents a cryptographic hash with utility methods for manipulation and validation.
 */
export class Hash {

    static coreSize: number = 32;

    constructor(public core: Buffer) {}

    public static parse(hash: string): Hash {
        if (hash.length != 2 * Hash.coreSize) {
            throw Error("invalid hash length");
        }
        return new Hash(Buffer.from(hash, "hex"));
    }

    public static digest(data: Buffer): Hash {
        const digest = Crypto.digest(data);
        return new Hash(Buffer.from(digest));
    }

    public static id(text: string): string {
        return Crypto.keccak256(toUtf8Bytes(text)).toString();
    }

    public static isHash(value: any): boolean {
        return (value.constructor.name === "Hash")
    }

    public getBytes(): Buffer {
        return this.core;
    }

    public toString(): string {
        if (typeof(this.core) === typeof("string")){
            return this.core.toString();
        } else {
            return hexlify(this.core).substring(2);
        }
    }
}

const EMPTY_HASH = Hash.parse("0000000000000000000000000000000000000000000000000000000000000000");

export {
    EMPTY_HASH
}

