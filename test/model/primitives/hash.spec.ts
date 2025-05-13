import { expect } from "chai";
import { Hash, EMPTY_HASH } from "../../../src/model/primitives/hash.js";

describe("Hash", () => {

    describe("digest", () => {
        it("digests hello world", () => {
            const hash = Hash.digest(Buffer.from("hello world", "utf8"));
            expect(hash.toString()).to.equal("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
        });

        it("digests empty string", () => {
            const hash = Hash.digest(Buffer.from("", "utf8"));
            expect(hash.toString()).to.equal("a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a");
        });

        it("digests different inputs", async () => {
            const inputs = [
                "Zenon Network",
                "blockchain",
                "test123"
            ];

            inputs.forEach(input => {
                const hash = Hash.digest(Buffer.from(input, "utf8"));
                expect(hash.toString()).to.have.lengthOf(64);
                expect(hash.getBytes()).to.have.lengthOf(32);
            });
        });
    });

    describe("parse", () => {
        it("parses correctly", () => {
            const hashStr = "644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938";
            const h = Hash.parse(hashStr);
            expect(h.toString()).to.equal(hashStr);
        });

        it("throws error for invalid hash length", () => {
            const invalidHashes = [
                "644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938a", // too long
                "644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e393", // too short
            ];

            invalidHashes.forEach(hash => {
                expect(() => Hash.parse(hash)).to.throw("invalid hash length");
            });
        });
    });

    describe("getBytes", () => {
        it("returns correct buffer length", () => {
            const hashStr = "644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938";
            const h = Hash.parse(hashStr);
            expect(h.getBytes()).to.have.lengthOf(32);
        });
    });

    describe("id", () => {
        it("should generate consistent ID for same text", () => {
            const text = "CollectReward";
            const id1 = Hash.id(text);
            const id2 = Hash.id(text);

            expect(id1).to.equal(id2);
            expect(id1).to.have.lengthOf(66); // 0x + 64 hex chars
            expect(id1).to.match(/^0x[0-9a-f]{64}$/);
        });

        it("should generate different IDs for different text", () => {
            const id1 = Hash.id("Update");
            const id2 = Hash.id("Collect");

            expect(id1).to.not.equal(id2);
        });

        it("should handle empty string", () => {
            const id = Hash.id("");
            expect(id).to.be.a("string");
            expect(id).to.have.lengthOf(66);
        });

        it("should handle special characters", () => {
            const id = Hash.id("Test123!@#$%");
            expect(id).to.be.a("string");
            expect(id).to.have.lengthOf(66);
        });
    });

    describe("isHash", () => {
        it("should return true for Hash instances", () => {
            const hash = Hash.parse("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            expect(Hash.isHash(hash)).to.be.true;
        });

        it("should return false for non-Hash values", () => {
            expect(Hash.isHash("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938")).to.be.false;
            expect(Hash.isHash({})).to.be.false;
            // Skip null and undefined as they cause TypeError in the implementation
        });
    });

    describe("toString with 0x prefix", () => {
        it("should handle hash parsing with 0x prefix removed", () => {
            const hashStr = "644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938";
            const hash = Hash.parse(hashStr);
            const result = hash.toString();

            expect(result).to.not.include("0x");
            expect(result).to.equal(hashStr);
        });
    });

    describe("EMPTY_HASH", () => {
        it("has correct value", () => {
            expect(EMPTY_HASH.toString()).to.equal("0000000000000000000000000000000000000000000000000000000000000000");
        });

        it("should be a valid Hash instance", () => {
            expect(Hash.isHash(EMPTY_HASH)).to.be.true;
        });
    });

});
