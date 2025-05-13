import { expect } from "chai";
import { EMPTY_HASH } from "../../src/model/primitives/hash.js";
import { KeyPair } from "../../src/wallet/keyPair.js";
import { KeyStore } from "../../src/wallet/keyStore.js";


describe("KeyPair", () => {

    describe("fromPrivateKey", () => {
        it("should throw an error for invalid private key", () => {
            expect(() => {
                KeyPair.fromPrivateKey(Buffer.alloc(0));
            }).to.throw(Error);
        });

        it("should create KeyPair from different private keys", () => {
            const privateKey1 = Buffer.from("f58cb2e1add0382c2004fa8e04895a65a3c755553e60187d697c2e5ab9df67ea", "hex");
            const privateKey2 = Buffer.from("a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", "hex");

            const keyPair1 = KeyPair.fromPrivateKey(privateKey1);
            const keyPair2 = KeyPair.fromPrivateKey(privateKey2);

            expect(keyPair1.getPrivateKey()).to.not.deep.equal(keyPair2.getPrivateKey());
            expect(keyPair1.getPublicKey()).to.not.deep.equal(keyPair2.getPublicKey());
            expect(keyPair1.getAddress().toString()).to.not.equal(keyPair2.getAddress().toString());
        });

        it("should generate consistent public key and address", () => {
            const privateKey = Buffer.from("f58cb2e1add0382c2004fa8e04895a65a3c755553e60187d697c2e5ab9df67ea", "hex");
            const keyPair = KeyPair.fromPrivateKey(privateKey);

            const publicKey = keyPair.getPublicKey();
            const address = keyPair.getAddress();

            expect(address.toString()).to.equal("z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq");
            expect(publicKey.toString("hex")).to.equal("881967d6529347a07f73ee2c5f0596b1b4bce44b828ac0a1fd77a0c3f1903559");
        });
    });


    describe("getPrivateKey", () => {
        it("gets parses and returns the private key", () => {
            const privateKey = Buffer.from("f58cb2e1add0382c2004fa8e04895a65a3c755553e60187d697c2e5ab9df67ea", "hex")
            const keyPair = KeyPair.fromPrivateKey(privateKey)
            expect(keyPair.privateKey.toString("hex")).to.equal("f58cb2e1add0382c2004fa8e04895a65a3c755553e60187d697c2e5ab9df67ea")
        })
    });

    describe("getPublicKey", () => {
        it("gets public key from private key", () => {
            const privateKey = Buffer.from("f58cb2e1add0382c2004fa8e04895a65a3c755553e60187d697c2e5ab9df67ea", "hex")
            const keyPair = KeyPair.fromPrivateKey(privateKey)
            expect(keyPair.publicKey.toString("hex")).to.equal("881967d6529347a07f73ee2c5f0596b1b4bce44b828ac0a1fd77a0c3f1903559")
        })
    });

    describe("getAddress", () => {
        it("gets address from private key", () => {
            const privateKey = Buffer.from("f58cb2e1add0382c2004fa8e04895a65a3c755553e60187d697c2e5ab9df67ea", "hex")
            const keyPair = KeyPair.fromPrivateKey(privateKey)
            expect(keyPair.address.toString()).to.equal("z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq")
        });
    });

    describe("sign", () => {
        it("ensures signature length is valid", () => {
            const entropy = "bbefd88e1ff3f673d24da98b51f04ee7";
            const kp = KeyStore.fromEntropy(entropy).getKeyPair();
            // @ts-ignore
            const signature = kp.sign(EMPTY_HASH.getBytes()).toString("base64")
            expect(signature.length).to.equal(88);
        })
    });
});
