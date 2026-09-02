import { Buffer } from "buffer";
import { gcm } from "@noble/ciphers/aes";
import { Crypto } from "../crypto/crypto.js";

export class Encryptor {

    private aadString: string = "zenon";
    private nonceLength: number = 12;
    private readonly key: Buffer;
    private readonly aad: Buffer;

    constructor(key: Buffer) {

        if (key.length !== 32) {
            throw new Error(`Invalid key length. Expected 32 bytes, got ${key.length}`);
        }

        this.key = key;
        this.aad = Buffer.from(this.aadString, "utf8");
    }

    public static setKey(key: Buffer): Encryptor {
        return new Encryptor(key);
    }

    public encrypt(data: string): [string, Buffer<ArrayBufferLike>] {
        const nonce = Crypto.randomBytes(this.nonceLength);
        const sealed = gcm(this.key, nonce, this.aad).encrypt(Buffer.from(data, "hex"));
        return [Buffer.from(sealed).toString("hex"), nonce];
    }

    public decrypt(encrypted: Buffer, iv: Buffer, authTag: Buffer): Buffer {
        return Buffer.from(gcm(this.key, iv, this.aad).decrypt(Buffer.concat([encrypted, authTag])));
    }
}
