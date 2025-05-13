import { Buffer } from "buffer";
import { Crypto } from "../crypto/crypto.js";
import { isBrowser } from "../utilities/global.js";
import { Encryptor } from "./encryptor.js";
import { KeyStore } from "./keyStore.js";

export class KeyFile {

    private readonly password: string;

    private static readonly DEFAULT_CONFIG = {
        timeCost: 1,
        memoryCost: 64 * 1024,
        hashLength: 32,
        parallelism: 4,
        type: 2, // Argon2id
    };

    constructor(password: string) {
        this.password = password;
    }

    public static setPassword(password: string) {
        return new KeyFile(password);
    }

    public async encrypt(keyStore: KeyStore): Promise<KeyFileEncryptedData> {

        const salt = Buffer.from(Crypto.randomBytes(16)).toString("hex");
        const key = await this.hashPassword(this.password, salt);
        const keyHash = Buffer.from(key);
        const [encrypted, nonce] = Encryptor.setKey(keyHash).encrypt(keyStore.entropy);

        return {
            baseAddress: keyStore.getBaseAddress().toString(),
            crypto: {
                argon2Params: {
                    salt: `0x${salt}`,
                },
                cipherData: `0x${encrypted}`,
                cipherName: "aes-256-gcm",
                kdf: "argon2.IDKey",
                nonce: `0x${nonce.toString("hex")}`,
            },
            timestamp: Math.floor(Date.now() / 1000),
            version: 1
        };
    }

    public async decrypt(json: KeyFileEncryptedData) {

        const salt = json.crypto.argon2Params.salt.substring(2);
        const cipherData = json.crypto.cipherData.substring(2);
        const aesNonce = json.crypto.nonce.substring(2);
        const key = await this.hashPassword(this.password, salt);
        const keyHash = Buffer.from(key);

        const authTagLength = 32; // 16 bytes = 32 hex characters
        const encrypted = cipherData.slice(0, -authTagLength);
        const authTag = cipherData.slice(-authTagLength);

        const entropy = Encryptor.setKey(keyHash).decrypt(
            Buffer.from(encrypted, "hex"),
            Buffer.from(aesNonce, "hex"),
            Buffer.from(authTag, "hex")
        );

        const entropyHex = entropy.toString("hex");
        const keyStore = KeyStore.fromEntropy(entropyHex);

        if (keyStore.getBaseAddress().toString() !== json.baseAddress) {
            throw new Error(`Invalid base address. Expected ${json.baseAddress}, got ${keyStore.getBaseAddress()}`);
        }

        return keyStore;
    }

    private async hashPassword(password: string, salt: string): Promise<Uint8Array> {

        const config = KeyFile.DEFAULT_CONFIG;

        if (isBrowser()) {
            const hashDriver = await import(/* webpackMode: "eager" */ "argon2-browser");
            const result = await hashDriver.hash({
                pass: password,
                salt: Buffer.from(salt, "hex"),
                time: config.timeCost,
                mem: config.memoryCost,
                hashLen: config.hashLength,
                parallelism: config.parallelism,
                type: hashDriver.ArgonType?.Argon2id ?? 2,
            });
            return result?.hash ?? result;
        } else {
            const argon2 = await import(/* webpackIgnore: true */ "argon2");
            return await argon2.default.hash(password, {
                salt: Buffer.from(salt, "hex"),
                timeCost: config.timeCost,
                memoryCost: config.memoryCost,
                hashLength: config.hashLength,
                parallelism: config.parallelism,
                type: 2, // Argon2id,
                raw: true,
            })
        }
    }
}

export interface KeyFileEncryptedData {
    baseAddress: string;
    crypto: {
        argon2Params: {
            salt: string;
        };
        cipherData: string;
        cipherName: string;
        kdf: string;
        nonce: string;
    };
    timestamp: number;
    version: number;
}
