import { Buffer } from "buffer";
import { Crypto } from "../crypto/crypto.js";
import { isBrowser } from "../utilities/global.js";
import { Encryptor } from "./encryptor.js";
import { KeyStore } from "./keyStore.js";

export interface KdfConfig {
    timeCost: number;
    memoryCost: number;
    hashLength: number;
    parallelism: number;
}

export class KeyFile {

    private readonly password: string;

    public static readonly DEFAULT_CONFIG: KdfConfig = {
        timeCost: 1,
        memoryCost: 64 * 1024,
        hashLength: 32,
        parallelism: 4,
    };

    constructor(password: string) {
        this.password = password;
    }

    public static setPassword(password: string) {
        return new KeyFile(password);
    }

    /**
     * Returns true if the keyfile was encrypted with weaker KDF params than
     * the supplied target, meaning it should be re-encrypted on next unlock.
     * Keyfiles that predate the self-describing format (no params stored) are
     * always considered to need an upgrade.
     */
    public static needsUpgrade(json: KeyFileEncryptedData, target: Partial<KdfConfig> = KeyFile.DEFAULT_CONFIG): boolean {
        const params = json.crypto.argon2Params;

        // Legacy keyfile — no KDF params stored, always upgrade
        if (params.timeCost === undefined) return true;

        if (target.timeCost !== undefined && params.timeCost < target.timeCost) return true;
        if (target.memoryCost !== undefined && (params.memoryCost ?? 0) < target.memoryCost) return true;
        if (target.hashLength !== undefined && (params.hashLength ?? 0) < target.hashLength) return true;
        if (target.parallelism !== undefined && (params.parallelism ?? 0) < target.parallelism) return true;

        return false;
    }

    public async encrypt(keyStore: KeyStore, config: Partial<KdfConfig> = {}): Promise<KeyFileEncryptedData> {

        const resolvedConfig: KdfConfig = { ...KeyFile.DEFAULT_CONFIG, ...config };
        const salt = Buffer.from(Crypto.randomBytes(16)).toString("hex");
        const key = await this.hashPassword(this.password, salt, resolvedConfig);
        const keyHash = Buffer.from(key);
        const [encrypted, nonce] = Encryptor.setKey(keyHash).encrypt(keyStore.entropy);

        return {
            baseAddress: keyStore.getBaseAddress().toString(),
            crypto: {
                argon2Params: {
                    salt: `0x${salt}`,
                    timeCost: resolvedConfig.timeCost,
                    memoryCost: resolvedConfig.memoryCost,
                    hashLength: resolvedConfig.hashLength,
                    parallelism: resolvedConfig.parallelism,
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

        // Read KDF params from the keyfile; fall back to DEFAULT_CONFIG for
        // legacy keyfiles that were created before params were persisted.
        const config: KdfConfig = {
            timeCost:   json.crypto.argon2Params.timeCost   ?? KeyFile.DEFAULT_CONFIG.timeCost,
            memoryCost: json.crypto.argon2Params.memoryCost ?? KeyFile.DEFAULT_CONFIG.memoryCost,
            hashLength: json.crypto.argon2Params.hashLength ?? KeyFile.DEFAULT_CONFIG.hashLength,
            parallelism: json.crypto.argon2Params.parallelism ?? KeyFile.DEFAULT_CONFIG.parallelism,
        };

        const salt = json.crypto.argon2Params.salt.substring(2);
        const cipherData = json.crypto.cipherData.substring(2);
        const aesNonce = json.crypto.nonce.substring(2);
        const key = await this.hashPassword(this.password, salt, config);
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

    private async hashPassword(password: string, salt: string, config: KdfConfig): Promise<Uint8Array> {

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
                type: 2, // Argon2id
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
            // KDF params are stored in the keyfile so decrypt() is always
            // self-contained. Fields are optional for backwards compatibility
            // with keyfiles created before this format change.
            timeCost?: number;
            memoryCost?: number;
            hashLength?: number;
            parallelism?: number;
        };
        cipherData: string;
        cipherName: string;
        kdf: string;
        nonce: string;
    };
    timestamp: number;
    version: number;
}
