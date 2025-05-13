import { expect } from "chai";
import { KeyStore } from "../../src/wallet/keyStore.js";

describe("KeyStore", () => {
    describe("fromMnemonic", () => {
        it("should create KeyStore from 24-word mnemonic", () => {
            const mnemonic = "abstract affair idle position alien fluid board ordinary exist afraid chapter wood wood guide sun walnut crew perfect place firm poverty model side million";
            const keyStore = KeyStore.fromMnemonic(mnemonic);

            expect(keyStore.mnemonic).to.equal(mnemonic);
            expect(keyStore.entropy).to.equal("00e089c2d43064b3462ce24fc09099fe9fd2cf3657b6335462972baa911d31fc");

            // Assuming you have a baseAddress method or property
            const baseAddress = keyStore.getKeyPair(0).getAddress();
            expect(baseAddress.toString()).to.equal("z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq");
        });

        it("should create KeyStore from 12-word mnemonic", () => {
            const mnemonic = "room learn castle divide disorder delay empty release mercy moon beauty solar";
            const keyStore = KeyStore.fromMnemonic(mnemonic);

            expect(keyStore.mnemonic).to.equal(mnemonic);
            expect(keyStore.entropy).to.equal("bbefd88e1ff3f673d24da98b51f04ee7");

            const baseAddress = keyStore.getKeyPair(0).getAddress();
            expect(baseAddress.toString()).to.equal("z1qrf825tea0hha086vjnn4dhpl5wsdcesktxh5x");
        });

        it("should throw error for invalid mnemonic", () => {
            const invalidMnemonic = "invalid mnemonic words";
            expect(() => KeyStore.fromMnemonic(invalidMnemonic)).to.throw("Invalid mnemonic!");
        });
    });

    describe("fromEntropy", () => {
        it("should create KeyStore from 24-word entropy", () => {
            const entropy = "00e089c2d43064b3462ce24fc09099fe9fd2cf3657b6335462972baa911d31fc";
            const keyStore = KeyStore.fromEntropy(entropy);

            expect(keyStore.mnemonic).to.equal("abstract affair idle position alien fluid board ordinary exist afraid chapter wood wood guide sun walnut crew perfect place firm poverty model side million");

            const baseAddress = keyStore.getKeyPair(0).getAddress();
            expect(baseAddress.toString()).to.equal("z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq");
        });

        it("should create KeyStore from 12-word entropy", () => {
            const entropy = "bbefd88e1ff3f673d24da98b51f04ee7";
            const keyStore = KeyStore.fromEntropy(entropy);

            expect(keyStore.mnemonic).to.equal("room learn castle divide disorder delay empty release mercy moon beauty solar");

            const baseAddress = keyStore.getKeyPair(0).getAddress();
            expect(baseAddress.toString()).to.equal("z1qrf825tea0hha086vjnn4dhpl5wsdcesktxh5x");
        });

        it("should throw error for invalid entropy", () => {
            const invalidEntropy = "short";
            expect(() => KeyStore.fromEntropy(invalidEntropy)).to.throw("Invalid entropy");
        });
    });

    describe("newRandom", () => {
        it("should generate a new random KeyStore", async () => {
            const keyStore = await KeyStore.newRandom();

            expect(keyStore.mnemonic).to.be.a("string");
            expect(keyStore.entropy).to.be.a("string");
            expect(keyStore.seed).to.be.a("string");
        });
    });

    describe("getKeyPair", () => {
        const mnemonic = "abstract affair idle position alien fluid board ordinary exist afraid chapter wood wood guide sun walnut crew perfect place firm poverty model side million";

        it("should derive index 1 correctly", () => {
            const keyStore = KeyStore.fromMnemonic(mnemonic);
            const keyPair = keyStore.getKeyPair(1);

            expect(keyPair.getAddress().toString()).to.equal("z1qq6eg8n43g032hanpsfp02qcdmv7zfj3y2lt5d");
        });

        it("should derive index 70000 correctly", () => {
            const keyStore = KeyStore.fromMnemonic(mnemonic);
            const keyPair = keyStore.getKeyPair(70000);

            expect(keyPair.getAddress().toString()).to.equal("z1qrcp90g99k5yal3p28w7kx90dmqsgr8n7llzv4");
        });
    });
});
