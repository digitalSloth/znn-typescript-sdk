import { expect } from "chai";
import { Crypto } from "../../src/crypto/crypto.js";

describe("Crypto", () => {
    describe("deriveKey", () => {
        const seed = Buffer.from(Crypto.randomBytes(64)).toString("hex");

        it("should throw for a non-hardened derivation path", () => {
            expect(() => Crypto.deriveKey("m/44'/73404'/0", seed)).to.throw("Invalid derivation path");
        });

        it("should not throw for a fully hardened derivation path", () => {
            expect(() => Crypto.deriveKey("m/44'/73404'/0'", seed)).to.not.throw();
        });

        it("should throw for an empty seed", () => {
            expect(() => Crypto.deriveKey("m/0'", "")).to.throw("Invalid seed");
        });

        it("should throw for a seed shorter than 16 bytes", () => {
            expect(() => Crypto.deriveKey("m/0'", "00".repeat(15))).to.throw("Invalid seed");
        });

        it("should accept a 16-byte seed", () => {
            expect(() => Crypto.deriveKey("m/0'", "00".repeat(16))).to.not.throw();
        });
    });
});
