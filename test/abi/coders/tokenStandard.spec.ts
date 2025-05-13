import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";

describe("TokenStandard", () => {

    describe("encode", () => {
        it("tokenStandard", function () {
            const encoded = abi.defaultAbiCoder.encode(["tokenStandard"], ["zts1znnxxxxxxxxxxxxx9z4ulx"]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000014e66318c6318c6318c6");
        });

        it("tokenStandard[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["tokenStandard[]"], [["zts1znnxxxxxxxxxxxxx9z4ulx", "zts1qsrxxxxxxxxxxxxxmrhjll"]]);
            expect(encoded).to.equal("0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000014e66318c6318c6318c60000000000000000000000000000000000000000000004066318c6318c6318c6");
        });

        it("tokenStandard[] round-trip", function () {
            const values = ["zts1znnxxxxxxxxxxxxx9z4ulx", "zts1qsrxxxxxxxxxxxxxmrhjll"];
            const encoded = abi.defaultAbiCoder.encode(["tokenStandard[]"], [values]);
            const decoded = abi.defaultAbiCoder.decode(["tokenStandard[]"], encoded);
            expect(decoded[0]).to.deep.equal(values);
        });

        it("throws on incorrect length", function () {
            expect(() => abi.defaultAbiCoder.encode(["tokenStandard"], ["0x1234"])).to.throw();
        });
    })

    describe("decode", () => {
        it("tokenStandard", function () {
            const decoded = abi.defaultAbiCoder.decode(["tokenStandard"], "0x0000000000000000000000000000000000000000000014e66318c6318c6318c6");
            expect(decoded[0]).to.equal("zts1znnxxxxxxxxxxxxx9z4ulx");
        });

        it("tokenStandard[]", function () {
            const decoded = abi.defaultAbiCoder.decode(["tokenStandard[]"], "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000014e66318c6318c6318c60000000000000000000000000000000000000000000004066318c6318c6318c6");
            expect(decoded[0]).to.deep.equal([
                "zts1znnxxxxxxxxxxxxx9z4ulx",
                "zts1qsrxxxxxxxxxxxxxmrhjll"
            ]);
        });
    })
});
