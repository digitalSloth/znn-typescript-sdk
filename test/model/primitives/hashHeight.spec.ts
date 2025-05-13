import { expect } from "chai";
import { HashHeight, EMPTY_HASH_HEIGHT } from "../../../src/model/primitives/hashHeight.js";
import { Hash, EMPTY_HASH } from "../../../src/model/primitives/hash.js";

describe("HashHeight", () => {

    describe("constructor", () => {
        it("should create instance with hash and height", () => {
            const hash = Hash.parse("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            const height = 1000;
            const hashHeight = new HashHeight(hash, height);

            expect(hashHeight.hash).to.equal(hash);
            expect(hashHeight.height).to.equal(height);
        });

        it("should create instance with default EMPTY_HASH", () => {
            const hashHeight = new HashHeight(undefined as any, 500);

            expect(hashHeight.height).to.equal(500);
        });

        it("should create instance with zero height", () => {
            const hash = Hash.parse("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            const hashHeight = new HashHeight(hash, 0);

            expect(hashHeight.hash).to.equal(hash);
            expect(hashHeight.height).to.equal(0);
        });
    });

    describe("fromJson", () => {
        it("should deserialize from JSON", () => {
            const json = {
                hash: "644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938",
                height: 12345
            };

            const hashHeight = HashHeight.fromJson(json);

            expect(hashHeight).to.be.instanceOf(HashHeight);
            expect(hashHeight.hash).to.be.instanceOf(Hash);
            expect(hashHeight.hash.toString()).to.equal("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            expect(hashHeight.height).to.equal(12345);
        });

        it("should deserialize with zero height", () => {
            const json = {
                hash: "0000000000000000000000000000000000000000000000000000000000000000",
                height: 0
            };

            const hashHeight = HashHeight.fromJson(json);

            expect(hashHeight.height).to.equal(0);
            expect(hashHeight.hash.toString()).to.equal("0000000000000000000000000000000000000000000000000000000000000000");
        });

        it("should deserialize with large height", () => {
            const json = {
                hash: "644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938",
                height: 999999999
            };

            const hashHeight = HashHeight.fromJson(json);

            expect(hashHeight.height).to.equal(999999999);
        });
    });

    describe("toJson", () => {
        it("should serialize to JSON", () => {
            const hash = Hash.parse("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            const hashHeight = new HashHeight(hash, 5000);
            const json = hashHeight.toJson();

            expect(json).to.deep.equal({
                hash: "644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938",
                height: 5000
            });
        });

        it("should serialize with zero height", () => {
            const hash = EMPTY_HASH;
            const hashHeight = new HashHeight(hash, 0);
            const json = hashHeight.toJson();

            expect(json.height).to.equal(0);
            expect(json.hash).to.equal("0000000000000000000000000000000000000000000000000000000000000000");
        });
    });

    describe("toString", () => {
        it("should convert to JSON string", () => {
            const hash = Hash.parse("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            const hashHeight = new HashHeight(hash, 2500);
            const jsonString = hashHeight.toString();

            expect(jsonString).to.be.a("string");
            expect(jsonString).to.equal('{"hash":"644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938","height":2500}');
        });

        it("should produce valid JSON", () => {
            const hash = Hash.parse("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            const hashHeight = new HashHeight(hash, 1000);
            const jsonString = hashHeight.toString();

            expect(() => JSON.parse(jsonString)).to.not.throw();
            const parsed = JSON.parse(jsonString);
            expect(parsed.hash).to.equal("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            expect(parsed.height).to.equal(1000);
        });
    });

    describe("getBytes", () => {
        it("should return concatenated hash and height bytes", () => {
            const hash = Hash.parse("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            const hashHeight = new HashHeight(hash, 100);
            const bytes = hashHeight.getBytes();

            expect(bytes).to.be.instanceOf(Buffer);
            // 32 bytes for hash + 8 bytes for height
            expect(bytes).to.have.lengthOf(40);
        });

        it("should use EMPTY_HASH when hash is undefined", () => {
            const hashHeight = new HashHeight(undefined as any, 500);
            const bytes = hashHeight.getBytes();

            expect(bytes).to.be.instanceOf(Buffer);
            expect(bytes).to.have.lengthOf(40);
            // First 32 bytes should be EMPTY_HASH
            const hashBytes = bytes.subarray(0, 32);
            expect(hashBytes.toString("hex")).to.equal(EMPTY_HASH.getBytes().toString("hex"));
        });

        it("should encode height as 8 bytes", () => {
            const hash = EMPTY_HASH;
            const hashHeight = new HashHeight(hash, 255);
            const bytes = hashHeight.getBytes();

            // Last 8 bytes should contain the height
            const heightBytes = bytes.subarray(32, 40);
            expect(heightBytes).to.have.lengthOf(8);
        });

        it("should handle zero height", () => {
            const hash = Hash.parse("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            const hashHeight = new HashHeight(hash, 0);
            const bytes = hashHeight.getBytes();

            expect(bytes).to.have.lengthOf(40);
        });

        it("should handle large height values", () => {
            const hash = Hash.parse("644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938");
            const hashHeight = new HashHeight(hash, 999999999);
            const bytes = hashHeight.getBytes();

            expect(bytes).to.have.lengthOf(40);
        });
    });

    describe("round-trip serialization", () => {
        it("should maintain data through fromJson and toJson", () => {
            const original = {
                hash: "644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938",
                height: 7500
            };

            const hashHeight = HashHeight.fromJson(original);
            const serialized = hashHeight.toJson();

            expect(serialized).to.deep.equal(original);
        });

        it("should maintain data through constructor and toJson", () => {
            const hash = Hash.parse("3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392");
            const height = 12345;

            const hashHeight = new HashHeight(hash, height);
            const json = hashHeight.toJson();
            const deserialized = HashHeight.fromJson(json);

            expect(deserialized.hash.toString()).to.equal(hash.toString());
            expect(deserialized.height).to.equal(height);
        });
    });

    describe("EMPTY_HASH_HEIGHT", () => {
        it("should have EMPTY_HASH and zero height", () => {
            expect(EMPTY_HASH_HEIGHT).to.be.instanceOf(HashHeight);
            expect(EMPTY_HASH_HEIGHT.hash.toString()).to.equal(EMPTY_HASH.toString());
            expect(EMPTY_HASH_HEIGHT.height).to.equal(0);
        });

        it("should serialize correctly", () => {
            const json = EMPTY_HASH_HEIGHT.toJson();

            expect(json).to.deep.equal({
                hash: "0000000000000000000000000000000000000000000000000000000000000000",
                height: 0
            });
        });

        it("should have correct byte representation", () => {
            const bytes = EMPTY_HASH_HEIGHT.getBytes();

            expect(bytes).to.have.lengthOf(40);
        });
    });
});
