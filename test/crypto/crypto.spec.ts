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
    });
});
