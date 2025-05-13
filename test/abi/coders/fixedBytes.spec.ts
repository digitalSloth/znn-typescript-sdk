import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";

describe("FixedBytes", () => {

    describe("encode", () => {
        it("bytes4", function () {
            const encoded = abi.defaultAbiCoder.encode(["bytes4"], ["0x12345678"]);
            // right-padded to 32 bytes
            expect(encoded).to.equal(
                "0x" + "12345678" + "00000000000000000000000000000000000000000000000000000000"
            );
        });

        it("bytes32 (all zeros)", function () {
            const encoded = abi.defaultAbiCoder.encode(["bytes32"], ["0x0000000000000000000000000000000000000000000000000000000000000000"]);
            expect(encoded).to.equal(
                "0x0000000000000000000000000000000000000000000000000000000000000000"
            );
        });

        it("throws on incorrect length", function () {
            expect(() => abi.defaultAbiCoder.encode(["bytes4"], ["0x123456"])).to.throw();
        });

        it("bytes8 round-trip", function () {
            const value = "0x0123456789abcdef";
            const encoded = abi.defaultAbiCoder.encode(["bytes8"], [value]);
            const decoded = abi.defaultAbiCoder.decode(["bytes8"], encoded);
            expect(decoded[0]).to.equal(value.toLowerCase());
        });

        it("bytes16 round-trip", function () {
            const value = "0x0123456789abcdef0123456789abcdef";
            const encoded = abi.defaultAbiCoder.encode(["bytes16"], [value]);
            const decoded = abi.defaultAbiCoder.decode(["bytes16"], encoded);
            expect(decoded[0]).to.equal(value.toLowerCase());
        });
    });

    describe("decode", () => {
        it("bytes4", function () {
            const encoded = "0x" + "12345678" + "00000000000000000000000000000000000000000000000000000000";
            const decoded = abi.defaultAbiCoder.decode(["bytes4"], encoded);
            expect(decoded[0]).to.equal("0x12345678");
        });

        it("bytes32 round-trip", function () {
            const value = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
            const encoded = abi.defaultAbiCoder.encode(["bytes32"], [value]);
            const decoded = abi.defaultAbiCoder.decode(["bytes32"], encoded);
            expect(decoded[0]).to.equal(value.toLowerCase());
        });
    });
});
