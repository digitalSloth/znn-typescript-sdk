import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";

describe("AbiAddress", () => {

    describe("encode", () => {
        it("address", function () {
            const encoded = abi.defaultAbiCoder.encode(["address"], ["z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f"]);
            expect(encoded).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
        });

        it("address[]", function () {
            const encoded = abi.defaultAbiCoder.encode(
                ["address[]"],
                [["z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f", "z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq"]]
            );
            // eslint-disable-next-line max-len
            expect(encoded).to.equal("0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b3f243d034ff0e3f2ecda2d9aa65db857552b");
        });

        it("address round-trip", function () {
            const value = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
            const encoded = abi.defaultAbiCoder.encode(["address"], [value]);
            const decoded = abi.defaultAbiCoder.decode(["address"], encoded);
            expect(decoded[0]).to.equal(value);
        });

        it("throws on incorrect length", function () {
            expect(() => abi.defaultAbiCoder.encode(["address"], ["z1q"])).to.throw();
        });

        it("address[] round-trip", function () {
            const values = ["z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f", "z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq"];
            const encoded = abi.defaultAbiCoder.encode(["address[]"], [values]);
            const decoded = abi.defaultAbiCoder.decode(["address[]"], encoded);
            expect(decoded[0]).to.deep.equal(values);
        });
    })

    describe("decode", () => {
        it("address", function () {
            const decoded = abi.defaultAbiCoder.decode(
                ["address"],
                "0x0000000000000000000000000000000000000000000000000000000000000000"
            );
            expect(decoded[0]).to.equal("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
        });

        it("address[]", function () {
            const decoded = abi.defaultAbiCoder.decode(
                ["address[]"],
                // eslint-disable-next-line max-len
                "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b3f243d034ff0e3f2ecda2d9aa65db857552b"
            );
            expect(decoded[0]).to.deep.equal([
                "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f",
                "z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq"
            ]);
        });
    })
})


