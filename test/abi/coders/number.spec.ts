import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";

// Test vectors are adapted from test/abi.js; our encoder/decoder returns 0x-prefixed hex.

describe("Number", () => {

    describe("encode", () => {
        it("uint (alias uint256)", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("uint256[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint256[]"], [[1, 2]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
        });

        it("uint8", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint8"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("uint8[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint8[]"], [[1, 2]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
        });

        it("uint16", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint16"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("uint16[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint16[]"], [[1, 2]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
        });

        it("uint32", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint32"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("uint32[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint32[]"], [[1, 2]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
        });

        it("uint64", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint64"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("uint64[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint64[]"], [[1, 2]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int (alias int256) positive", function () {
            const encoded = abi.defaultAbiCoder.encode(["int"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int (alias int256) negative", function () {
            const encoded = abi.defaultAbiCoder.encode(["int"], [-2]);
            expect(encoded).to.equal("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe");
        });

        it("int8", function () {
            const encoded = abi.defaultAbiCoder.encode(["int8"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int8 -2", function () {
            const encoded = abi.defaultAbiCoder.encode(["int8"], [-2]);
            expect(encoded).to.equal("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe");
        });

        it("int8[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["int8[]"], [[1, 2]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int8[] negatives", function () {
            const encoded = abi.defaultAbiCoder.encode(["int8[]"], [[-2, -99]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020" +
                "0000000000000000000000000000000000000000000000000000000000000002" +
                "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe" +
                "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9d");
        });

        it("int16", function () {
            const encoded = abi.defaultAbiCoder.encode(["int16"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int16 -2", function () {
            const encoded = abi.defaultAbiCoder.encode(["int16"], [-2]);
            expect(encoded).to.equal("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe");
        });

        it("int16[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["int16[]"], [[1, 2]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int16[] negatives", function () {
            const encoded = abi.defaultAbiCoder.encode(["int16[]"], [[-2, -99]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020" +
                "0000000000000000000000000000000000000000000000000000000000000002" +
                "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe" +
                "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9d");
        });

        it("int32", function () {
            const encoded = abi.defaultAbiCoder.encode(["int32"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int32 -2", function () {
            const encoded = abi.defaultAbiCoder.encode(["int32"], [-2]);
            expect(encoded).to.equal("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe");
        });

        it("int32[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["int32[]"], [[1, 2]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int64", function () {
            const encoded = abi.defaultAbiCoder.encode(["int64"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int64 -2", function () {
            const encoded = abi.defaultAbiCoder.encode(["int64"], [-2]);
            expect(encoded).to.equal("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe");
        });

        it("int64[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["int64[]"], [[1, 2]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int256", function () {
            const encoded = abi.defaultAbiCoder.encode(["int256"], [2]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002");
        });

        it("int256 -2", function () {
            const encoded = abi.defaultAbiCoder.encode(["int256"], [-2]);
            expect(encoded).to.equal("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe");
        });
    })

    describe("decode", () => {
        it("uint (alias uint256)", function () {
            const decoded = abi.defaultAbiCoder.decode(["uint"], "0x0000000000000000000000000000000000000000000000000000000000000002");
            // Values > 48 bits remain as BigNumber-like wrappers; compare via hex
            expect(decoded[0].toHexString()).to.equal("0x02");
        });

        it("uint256[]", function () {
            const decoded = abi.defaultAbiCoder.decode(["uint256[]"], "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
            expect(decoded[0].map((x: any) => x.toHexString())).to.deep.equal(["0x01", "0x02"]);
        });

        it("uint8", function () {
            const decoded = abi.defaultAbiCoder.decode(["uint8"], "0x0000000000000000000000000000000000000000000000000000000000000002");
            expect(decoded[0]).to.equal(2);
        });

        it("uint8[]", function () {
            const decoded = abi.defaultAbiCoder.decode(["uint8[]"], "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
            expect(decoded[0]).to.deep.equal([1, 2]);
        });

        it("int8 positive", function () {
            const decoded = abi.defaultAbiCoder.decode(["int8"], "0x0000000000000000000000000000000000000000000000000000000000000002");
            expect(decoded[0]).to.equal(2);
        });

        it("int8 negative", function () {
            const decoded = abi.defaultAbiCoder.decode(["int8"], "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe");
            expect(decoded[0]).to.equal(-2);
        });

        it("int8[] negatives", function () {
            const decoded = abi.defaultAbiCoder.decode(["int8[]"], "0x0000000000000000000000000000000000000000000000000000000000000020" +
                "0000000000000000000000000000000000000000000000000000000000000002" +
                "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe" +
                "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9d");
            expect(decoded[0]).to.deep.equal([-2, -99]);
        });

        it("int256 negative", function () {
            const decoded = abi.defaultAbiCoder.decode(["int256"], "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe");
            // For 256-bit, compare using two's complement hex
            expect(decoded[0].toHexString()).to.equal("-0x02");
        });
    })
});
