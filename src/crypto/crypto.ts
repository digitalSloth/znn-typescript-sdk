import { Buffer } from "buffer";
import * as ed from "@noble/ed25519";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha2";
import { sha3_256 } from "@noble/hashes/sha3";
import { hexToBytes, randomBytes, utf8ToBytes } from "@noble/hashes/utils";
import {BytesLike, arrayify} from "../utilities/bytes.js";

const DERIVATION_PATH_REGEX = /^m(\/\d+')+$/;

let sha512SyncInitialized = false;

// Set SHA-512 hash function for @noble/ed25519, idempotently, on first use.
function ensureSha512Sync(): void {
    if (sha512SyncInitialized) {
        return;
    }
    ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));
    sha512SyncInitialized = true;
}

export class Crypto {

    public static getPublicKey(privateKey: Buffer): Buffer {
        ensureSha512Sync();
        return Buffer.from(ed.getPublicKey(privateKey));
    }

    public static deriveKey(path: string, seed: string): Buffer {
        if (!DERIVATION_PATH_REGEX.test(path)) {
            throw new Error("Invalid derivation path");
        }

        const segments = path.split("/").slice(1).map((segment) => parseInt(segment.slice(0, -1), 10));

        let I = hmac(sha512, utf8ToBytes("ed25519 seed"), hexToBytes(seed));
        let key = I.slice(0, 32);
        let chainCode = I.slice(32, 64);

        for (const n of segments) {
            const data = new Uint8Array(1 + 32 + 4);
            data[0] = 0x00;
            data.set(key, 1);
            const indexBuffer = Buffer.alloc(4);
            indexBuffer.writeUInt32BE(n + 0x80000000, 0);
            data.set(indexBuffer, 33);

            I = hmac(sha512, chainCode, data);
            key = I.slice(0, 32);
            chainCode = I.slice(32, 64);
        }

        return Buffer.from(key);
    }

    public static sign(message: Buffer, privateKey: Buffer): Buffer {
        ensureSha512Sync();
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
        return Buffer.from(randomBytes(length));
    }
}
