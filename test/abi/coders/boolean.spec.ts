import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";

describe("Boolean", () => {

    describe("encode", () => {
        it("boolean (true)", function () {
            const encoded = abi.defaultAbiCoder.encode(["bool"], [true]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
        });

        it("boolean (false)", function () {
            const encoded = abi.defaultAbiCoder.encode(["bool"], [false]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
        });

        it("boolean[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["bool[]"], [[true, false]]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000");
        });

        it("boolean[] round-trip", function () {
            const values = [true, false];
            const encoded = abi.defaultAbiCoder.encode(["bool[]"], [values]);
            const decoded = abi.defaultAbiCoder.decode(["bool[]"], encoded);
            expect(decoded[0]).to.deep.equal(values);
        });
    })

    describe("decode", () => {
        it("boolean (true)", function () {
            const decoded = abi.defaultAbiCoder.decode(["bool"], "0x0000000000000000000000000000000000000000000000000000000000000001");
            expect(decoded[0]).to.equal(true);
        });

        it("boolean (false)", function () {
            const decoded = abi.defaultAbiCoder.decode(["bool"], "0x0000000000000000000000000000000000000000000000000000000000000000");
            expect(decoded[0]).to.equal(false);
        });

        it("boolean[]", function () {
            const decoded = abi.defaultAbiCoder.decode(["bool[]"], "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000");
            expect(decoded[0]).to.deep.equal([true, false]);
        });
    })
});
