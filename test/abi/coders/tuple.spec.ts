import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";

describe("Tuple", () => {

    describe("encode/decode", () => {
        it("simple tuple (address,address)", function () {
            const types = ["(address,address)"];
            const values = ["z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f", "z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq"];
            const encoded = abi.defaultAbiCoder.encode(types, [values]);
            const decoded = abi.defaultAbiCoder.decode(types, encoded);
            expect(decoded[0][0]).to.equal(values[0]);
            expect(decoded[0][1]).to.equal(values[1]);
        });

        it("tuple with dynamic elements (string,bytes)", function () {
            const types = ["(string,bytes)"];
            const values: [string, string] = ["hello", "0x1234"];
            const encoded = abi.defaultAbiCoder.encode(types, [values]);
            const decoded = abi.defaultAbiCoder.decode(types, encoded);
            expect(decoded[0][0]).to.equal("hello");
            expect(decoded[0][1]).to.equal("0x1234");
        });

        it("nested tuple (address,(string,bytes4))", function () {
            const types = ["(address,(string,bytes4))"];
            const values = ["z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f", ["world", "0x12345678"]];
            const encoded = abi.defaultAbiCoder.encode(types, [values]);
            const decoded = abi.defaultAbiCoder.decode(types, encoded);
            expect(decoded[0][0]).to.equal(values[0]);
            expect(decoded[0][1][0]).to.equal("world");
            expect(decoded[0][1][1]).to.equal("0x12345678");
        });

        it("tuple array (uint256,string)[]", function () {
            const types = ["(uint256,string)[]"];
            const values = [[1, "first"], [2, "second"]];
            const encoded = abi.defaultAbiCoder.encode(types, [values]);
            const decoded = abi.defaultAbiCoder.decode(types, encoded);
            expect(Number(decoded[0][0][0])).to.equal(1);
            expect(decoded[0][0][1]).to.equal("first");
            expect(Number(decoded[0][1][0])).to.equal(2);
            expect(decoded[0][1][1]).to.equal("second");
        });

        it("tuple with mixed static/dynamic types", function () {
            const types = ["(uint256,string,address)"];
            const values = [42, "hello", "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f"];
            const encoded = abi.defaultAbiCoder.encode(types, [values]);
            const decoded = abi.defaultAbiCoder.decode(types, encoded);
            expect(Number(decoded[0][0])).to.equal(42);
            expect(decoded[0][1]).to.equal("hello");
            expect(decoded[0][2]).to.equal("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
        });
    });
});
