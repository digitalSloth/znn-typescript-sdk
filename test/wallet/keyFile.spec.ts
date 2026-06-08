import { expect } from "chai";
import { KeyFile, KeyFileEncryptedData, KdfConfig } from "../../src/wallet/keyFile.js";
import { KeyStore } from "../../src/wallet/keyStore.js";

// -------------------------------------------------------------------------
// Regression vectors — fixed known-good ciphertexts produced by the
// original argon2id implementation (timeCost:1, memoryCost:64k).
// If these ever fail the argon2 library has changed behaviour.
// -------------------------------------------------------------------------

describe("KeyFile regression (known vectors)", () => {
    describe("Decrypt", () => {
        it("should decrypt correct 24 word mnemonic", async () => {
            const password = "password";
            const json = {
                "baseAddress": "z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq",
                "crypto": {
                    "argon2Params": {
                        "salt": "0xab4801d422d25662820f75b53878bf08"
                    },
                    "cipherData": "0x652514c94526bbca6d82f5c663d047803b18819ef7be0dd6bc45822343b70a46d7ffda6730ccd8a26f636bacfcb318d3",
                    "cipherName": "aes-256-gcm",
                    "kdf": "argon2.IDKey",
                    "nonce": "0xf52d55466f05414a5a9f528b"
                },
                "timestamp": 1639039880,
                "version": 1
            };

            const store = await KeyFile.setPassword(password).decrypt(json);
            expect(store.entropy.toString()).to.equal("00e089c2d43064b3462ce24fc09099fe9fd2cf3657b6335462972baa911d31fc");
            expect(store.getBaseAddress().toString()).to.equal("z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq");
        });

        it("should decrypt correct 12 word mnemonic", async () => {
            const password = "password";
            const json = {
                "baseAddress": "z1qrf825tea0hha086vjnn4dhpl5wsdcesktxh5x",
                "crypto": {
                    "argon2Params": {"salt": "0x4cb0009a61148aa2874dbb8450c2cfca"},
                    "cipherData": "0x142b5bcfdac54ad3a6a2cfb627f30f80a4080e02500cab75a9b79b3ccf2752ef",
                    "cipherName": "aes-256-gcm",
                    "kdf": "argon2.IDKey",
                    "nonce": "0xa31fb4d6027c482fd9d85c1d"
                },
                "timestamp": 1639637010,
                "version": 1
            };

            const store = await KeyFile.setPassword(password).decrypt(json);
            expect(store.entropy).to.equal("bbefd88e1ff3f673d24da98b51f04ee7");
            expect(store.getBaseAddress().toString()).to.equal("z1qrf825tea0hha086vjnn4dhpl5wsdcesktxh5x");
        });
    });

    describe("Encrypt", () => {
        it("should encrypt and round-trip a 24 word keystore", async () => {
            const password = "password";
            const initialEntropy = "00e089c2d43064b3462ce24fc09099fe9fd2cf3657b6335462972baa911d31fc";
            const keyStore = KeyStore.fromEntropy(initialEntropy);
            const json = await KeyFile.setPassword(password).encrypt(keyStore);

            const store = await KeyFile.setPassword(password).decrypt(json);
            expect(store.entropy).to.equal(initialEntropy);
        });
    });
});

// -------------------------------------------------------------------------
// New KDF config / upgrade tests
// -------------------------------------------------------------------------

// Use very low cost params so tests run fast
const FAST_CONFIG: KdfConfig = {
    timeCost: 1,
    memoryCost: 8 * 1024,
    hashLength: 32,
    parallelism: 1,
};

const PASSWORD = "correct-horse-battery-staple";
const MNEMONIC = "room learn castle divide disorder delay empty release mercy moon beauty solar";

describe("KeyFile", () => {

    let keyStore: KeyStore;

    before(async () => {
        keyStore = KeyStore.fromMnemonic(MNEMONIC);
    });

    // -------------------------------------------------------------------------
    // encrypt / decrypt round-trip
    // -------------------------------------------------------------------------

    describe("encrypt / decrypt", () => {
        it("round-trips a keystore with default config", async () => {
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, FAST_CONFIG);
            const decrypted = await KeyFile.setPassword(PASSWORD).decrypt(encrypted);
            expect(decrypted.getBaseAddress().toString()).to.equal(keyStore.getBaseAddress().toString());
        });

        it("stores KDF params in the keyfile JSON", async () => {
            const config: KdfConfig = { ...FAST_CONFIG, timeCost: 2 };
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, config);

            expect(encrypted.crypto.argon2Params.timeCost).to.equal(2);
            expect(encrypted.crypto.argon2Params.memoryCost).to.equal(config.memoryCost);
            expect(encrypted.crypto.argon2Params.hashLength).to.equal(config.hashLength);
            expect(encrypted.crypto.argon2Params.parallelism).to.equal(config.parallelism);
        });

        it("decrypt reads KDF params from keyfile, not DEFAULT_CONFIG", async () => {
            // Encrypt with timeCost: 2
            const config: KdfConfig = { ...FAST_CONFIG, timeCost: 2 };
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, config);

            // Should still decrypt correctly even though DEFAULT_CONFIG.timeCost is 1
            const decrypted = await KeyFile.setPassword(PASSWORD).decrypt(encrypted);
            expect(decrypted.getBaseAddress().toString()).to.equal(keyStore.getBaseAddress().toString());
        });

        it("wrong password throws", async () => {
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, FAST_CONFIG);
            try {
                await KeyFile.setPassword("wrong-password").decrypt(encrypted);
                expect.fail("should have thrown");
            } catch (e: unknown) {
                expect((e as Error).message).to.not.include("should have thrown");
            }
        });
    });

    // -------------------------------------------------------------------------
    // legacy keyfile (no KDF params in JSON) - backwards compatibility
    // -------------------------------------------------------------------------

    describe("legacy keyfile compatibility", () => {
        it("decrypts a keyfile that has no KDF params stored (uses DEFAULT_CONFIG fallback)", async () => {
            // Produce a keyfile using DEFAULT_CONFIG cost then strip the params
            // to simulate a pre-format-change keyfile
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, {
                timeCost: KeyFile.DEFAULT_CONFIG.timeCost,
                memoryCost: KeyFile.DEFAULT_CONFIG.memoryCost,
                hashLength: KeyFile.DEFAULT_CONFIG.hashLength,
                parallelism: KeyFile.DEFAULT_CONFIG.parallelism,
            });

            // Strip the KDF params to simulate a legacy keyfile
            const legacy: KeyFileEncryptedData = {
                ...encrypted,
                crypto: {
                    ...encrypted.crypto,
                    argon2Params: {
                        salt: encrypted.crypto.argon2Params.salt,
                    },
                },
            };

            const decrypted = await KeyFile.setPassword(PASSWORD).decrypt(legacy);
            expect(decrypted.getBaseAddress().toString()).to.equal(keyStore.getBaseAddress().toString());
        });
    });

    // -------------------------------------------------------------------------
    // needsUpgrade
    // -------------------------------------------------------------------------

    describe("needsUpgrade", () => {
        it("returns true for a legacy keyfile (no params stored)", async () => {
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, FAST_CONFIG);
            const legacy: KeyFileEncryptedData = {
                ...encrypted,
                crypto: {
                    ...encrypted.crypto,
                    argon2Params: { salt: encrypted.crypto.argon2Params.salt },
                },
            };
            expect(KeyFile.needsUpgrade(legacy, { timeCost: 1 })).to.be.true;
        });

        it("returns true when stored timeCost is below target", async () => {
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, { ...FAST_CONFIG, timeCost: 1 });
            expect(KeyFile.needsUpgrade(encrypted, { timeCost: 3 })).to.be.true;
        });

        it("returns false when stored timeCost meets target", async () => {
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, { ...FAST_CONFIG, timeCost: 3 });
            expect(KeyFile.needsUpgrade(encrypted, { timeCost: 3 })).to.be.false;
        });

        it("returns false when stored timeCost exceeds target", async () => {
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, { ...FAST_CONFIG, timeCost: 5 });
            expect(KeyFile.needsUpgrade(encrypted, { timeCost: 3 })).to.be.false;
        });

        it("returns true when memoryCost is below target", async () => {
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, { ...FAST_CONFIG, memoryCost: 8 * 1024 });
            expect(KeyFile.needsUpgrade(encrypted, { memoryCost: 64 * 1024 })).to.be.true;
        });

        it("uses DEFAULT_CONFIG as default target", async () => {
            // Encrypting with DEFAULT_CONFIG params should NOT need upgrade
            const encrypted = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, KeyFile.DEFAULT_CONFIG);
            expect(KeyFile.needsUpgrade(encrypted)).to.be.false;
        });
    });

    // -------------------------------------------------------------------------
    // upgrade-on-unlock pattern
    // -------------------------------------------------------------------------

    describe("upgrade-on-unlock pattern", () => {
        it("re-encrypts with stronger params and decrypts correctly", async () => {
            // Start with weak params (timeCost: 1)
            const weak = await KeyFile.setPassword(PASSWORD).encrypt(keyStore, { ...FAST_CONFIG, timeCost: 1 });
            expect(KeyFile.needsUpgrade(weak, { timeCost: 2 })).to.be.true;

            // Decrypt, then re-encrypt with stronger params
            const intermediate = await KeyFile.setPassword(PASSWORD).decrypt(weak);
            const strong = await KeyFile.setPassword(PASSWORD).encrypt(intermediate, { ...FAST_CONFIG, timeCost: 2 });

            // Upgraded keyfile should no longer need upgrade
            expect(KeyFile.needsUpgrade(strong, { timeCost: 2 })).to.be.false;

            // And should still decrypt to the same keystore
            const final = await KeyFile.setPassword(PASSWORD).decrypt(strong);
            expect(final.getBaseAddress().toString()).to.equal(keyStore.getBaseAddress().toString());
        });
    });
});
