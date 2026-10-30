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

    describe("sha3_256", () => {
        it("should return the FIPS SHA3-256 digest, not Keccak-256", () => {
            expect(Crypto.sha3_256(new Uint8Array(0)))
                .to.equal("0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a");
        });

        it("should return the FIPS SHA3-256 digest of abc", () => {
            expect(Crypto.sha3_256(Buffer.from("abc")))
                .to.equal("0x3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532");
        });

        it("should no longer expose keccak256", () => {
            expect(Crypto).to.not.have.property("keccak256");
        });
    });
});
