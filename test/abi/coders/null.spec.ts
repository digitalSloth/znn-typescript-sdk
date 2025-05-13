import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";

describe("Null", () => {

    describe("encode", () => {
        it("null", function () {
            const encoded = abi.defaultAbiCoder.encode([""], [null]);
            expect(encoded).to.equal("0x");
        });
    });

    describe("decode", () => {
        it("null", function () {
            const decoded = abi.defaultAbiCoder.decode([""], "0x");
            expect(decoded[0]).to.be.undefined;
        });
    });

    describe("defaults", () => {
        it("getDefaultValue returns null", function () {
            const defaults = abi.defaultAbiCoder.getDefaultValue([""]);
            expect(defaults[0]).to.equal(null);
        });
    });
});
