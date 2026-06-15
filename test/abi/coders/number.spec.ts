import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";
import { toHexString } from "../../../src/utilities/bignumber.js";

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

    describe("encode bounds", () => {
        it("uint8 accepts max (255)", function () {
            expect(() => abi.defaultAbiCoder.encode(["uint8"], [255])).to.not.throw();
        });

        it("uint8 rejects overflow (256)", function () {
            expect(() => abi.defaultAbiCoder.encode(["uint8"], [256])).to.throw("value out-of-bounds");
        });

        it("uint8 rejects negative", function () {
            expect(() => abi.defaultAbiCoder.encode(["uint8"], [-1])).to.throw("value out-of-bounds");
        });

        it("int8 accepts bounds (127 and -128)", function () {
            expect(() => abi.defaultAbiCoder.encode(["int8"], [127])).to.not.throw();
            expect(() => abi.defaultAbiCoder.encode(["int8"], [-128])).to.not.throw();
        });

        it("int8 rejects overflow (128)", function () {
            expect(() => abi.defaultAbiCoder.encode(["int8"], [128])).to.throw("value out-of-bounds");
        });

        it("int8 rejects underflow (-129)", function () {
            expect(() => abi.defaultAbiCoder.encode(["int8"], [-129])).to.throw("value out-of-bounds");
        });
    })

    describe("decode", () => {
        it("uint (alias uint256)", function () {
            const decoded = abi.defaultAbiCoder.decode(["uint"], "0x0000000000000000000000000000000000000000000000000000000000000002");
            // Values > 48 bits are returned as bigint
            expect(toHexString(decoded[0])).to.equal("0x02");
        });

        it("uint256[]", function () {
            const decoded = abi.defaultAbiCoder.decode(["uint256[]"], "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002");
            expect(decoded[0].map((x: any) => toHexString(x))).to.deep.equal(["0x01", "0x02"]);
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
            expect(toHexString(decoded[0])).to.equal("-0x02");
        });

        // Reader.coerce hard constraint: bit-width <= 48 → JS number; > 48 → bigint
        it("uint48 decodes to JS number (threshold boundary)", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint48"], [12345]);
            const decoded = abi.defaultAbiCoder.decode(["uint48"], encoded);
            expect(typeof decoded[0]).to.equal("number");
            expect(decoded[0]).to.equal(12345);
        });

        it("uint56 decodes to bigint (just above threshold)", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint56"], [99999]);
            const decoded = abi.defaultAbiCoder.decode(["uint56"], encoded);
            expect(typeof decoded[0]).to.equal("bigint");
            expect(decoded[0]).to.equal(99999n);
        });

        it("uint256 decodes to bigint", function () {
            const encoded = abi.defaultAbiCoder.encode(["uint256"], [42]);
            const decoded = abi.defaultAbiCoder.decode(["uint256"], encoded);
            expect(typeof decoded[0]).to.equal("bigint");
            expect(decoded[0]).to.equal(42n);
        });

        it("int48 decodes to JS number (signed threshold boundary)", function () {
            const encoded = abi.defaultAbiCoder.encode(["int48"], [-1]);
            const decoded = abi.defaultAbiCoder.decode(["int48"], encoded);
            expect(typeof decoded[0]).to.equal("number");
            expect(decoded[0]).to.equal(-1);
        });

        it("int56 decodes to bigint (signed just above threshold)", function () {
            const encoded = abi.defaultAbiCoder.encode(["int56"], [-2]);
            const decoded = abi.defaultAbiCoder.decode(["int56"], encoded);
            expect(typeof decoded[0]).to.equal("bigint");
            expect(decoded[0]).to.equal(-2n);
        });
    })
});
