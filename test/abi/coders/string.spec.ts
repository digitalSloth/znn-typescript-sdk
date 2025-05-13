import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";

describe("String", () => {

    describe("encode", () => {
        it("string", function () {
            const encoded = abi.defaultAbiCoder.encode(["string"], ["hello"]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000");
        });

        it("string[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["string[]"], [["hello", "world"]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000568656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005776f726c64000000000000000000000000000000000000000000000000000000");
        });

        it("string[] round-trip", function () {
            const values = ["dont", "trust", "verify", ""];
            const encoded = abi.defaultAbiCoder.encode(["string[]"], [values]);
            const decoded = abi.defaultAbiCoder.decode(["string[]"], encoded);
            expect(decoded[0]).to.deep.equal(values);
        });

        it("empty string", function () {
            const encoded = abi.defaultAbiCoder.encode(["string"], [""]);
            const decoded = abi.defaultAbiCoder.decode(["string"], encoded);
            expect(decoded[0]).to.equal("");
        });

        it("long string round-trip", function () {
            const longString = "a".repeat(100);
            const encoded = abi.defaultAbiCoder.encode(["string"], [longString]);
            const decoded = abi.defaultAbiCoder.decode(["string"], encoded);
            expect(decoded[0]).to.equal(longString);
        });
    })

    describe("decode", () => {
        it("string", function () {
            const decoded = abi.defaultAbiCoder.decode(["string"], "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000");
            expect(decoded[0]).to.equal("hello");
        });

        it("string[]", function () {
            const decoded = abi.defaultAbiCoder.decode(["string[]"], "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000568656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005776f726c64000000000000000000000000000000000000000000000000000000");
            expect(decoded[0]).to.deep.equal(["hello", "world"]);
        });
    })
});
