import { Buffer } from "buffer";
import * as crypto from "crypto";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2";
import { derivePath, getPublicKey } from "ed25519-hd-key";
import { sha3_256 } from "@noble/hashes/sha3";
import {BytesLike, arrayify} from "../utilities/bytes.js";

// Set SHA-512 hash function for @noble/ed25519
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export class Crypto {

    public static getPublicKey(privateKey: Buffer): Buffer {
        return getPublicKey(privateKey, false)
    }

    public static deriveKey(path: string, seed: string): Buffer {
        return derivePath(path, seed).key
    }

    public static sign(message: Buffer, privateKey: Buffer): Buffer {
        const signature = ed.sign(message, privateKey.toString("hex"))
        return Buffer.from(signature)
    }

    public static digest(data: Buffer): Uint8Array<ArrayBufferLike> {
        return sha3_256.create().update(data).digest()
    }

    public static keccak256(data: BytesLike): string {
        const dataArray = arrayify(data);
        const digest = sha3_256.create().update(dataArray).digest();
        return "0x" + Buffer.from(digest).toString("hex");
    }

    public static randomBytes(length: number = 32): Buffer {
        return crypto.randomBytes(length);
    }
}

