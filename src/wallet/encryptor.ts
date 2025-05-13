import { Buffer } from "buffer";
import * as crypto from "crypto";
import { Crypto } from "../crypto/crypto.js";
import { isBrowser } from "../utilities/global.js";

export class Encryptor {

    private algorithm: string = "aes-256-gcm";
    private aadString: string = "zenon";
    private nonceLength: number = 12;
    private driver: any;
    private readonly key: Buffer;
    private readonly aad: Buffer;

    constructor(key: Buffer) {

        if (key.length !== 32) {
            throw new Error(`Invalid key length. Expected 32 bytes, got ${key.length}`);
        }

        this.key = key;
        this.aad = Buffer.from(this.aadString, "utf8");

        this.setEncryptionDriver();
    }

    public static setKey(key: Buffer): Encryptor {
        return new Encryptor(key);
    }

    public encrypt(data: string): [string, Buffer<ArrayBufferLike>] {

        const nonce = Crypto.randomBytes(this.nonceLength);

        const cipher = this.driver.createCipheriv(
            this.algorithm,
            this.key,
            nonce
        );

        cipher.setAAD(this.aad);

        let encrypted = cipher.update(Buffer.from(data, "hex"), undefined, "hex");
        encrypted += cipher.final("hex");
        encrypted += cipher.getAuthTag().toString("hex");

        return [encrypted, nonce];
    }

    public decrypt(encrypted: Buffer, iv: Buffer, authTag: Buffer): Buffer {
        const decipher = this.driver.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAAD(this.aad)
        decipher.setAuthTag(authTag);

        const decrypted = decipher.update(encrypted);

        return Buffer.concat([decrypted, decipher.final()]);
    }

    private setEncryptionDriver(): any {
        if (this.driver) {
            return;
        }

        if (isBrowser()) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            this.driver = require("crypto-browserify");
        } else {
            this.driver = crypto;
        }
    }
}

