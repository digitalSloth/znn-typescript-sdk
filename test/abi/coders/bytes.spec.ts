import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";

describe("Bytes", () => {

    describe("encode", () => {
        it("bytes (non-empty)", function () {
            const encoded = abi.defaultAbiCoder.encode(["bytes"], ["0x1234"]);
            // head (offset=0x20) + length (0x02) + data (0x1234 right-padded to 32 bytes)
            expect(encoded).to.equal(
                "0x"
                + "0000000000000000000000000000000000000000000000000000000000000020"
                + "0000000000000000000000000000000000000000000000000000000000000002"
                + "1234000000000000000000000000000000000000000000000000000000000000"
            );
        });

        it("bytes (empty)", function () {
            const encoded = abi.defaultAbiCoder.encode(["bytes"], ["0x"]);
            // head (0x20) + length (0x00) + no data (0 bytes)
            expect(encoded).to.equal(
                "0x"
                + "0000000000000000000000000000000000000000000000000000000000000020"
                + "0000000000000000000000000000000000000000000000000000000000000000"
            );
        });

        it("bytes[] round-trip", function () {
            const values = ["0x12", "0x", "0xabcdef"];
            const encoded = abi.defaultAbiCoder.encode(["bytes[]"], [values]);
            const decoded = abi.defaultAbiCoder.decode(["bytes[]"], encoded);
            expect(decoded[0]).to.deep.equal(values.map(v => v.toLowerCase()));
        });

        it("bytes (large data)", function () {
            // 64 bytes of data
            const largeData = "0x" + "12".repeat(64);
            const encoded = abi.defaultAbiCoder.encode(["bytes"], [largeData]);
            const decoded = abi.defaultAbiCoder.decode(["bytes"], encoded);
            expect(decoded[0]).to.equal(largeData.toLowerCase());
        });
    });

    describe("decode", () => {
        it("bytes -> round-trip", function () {
            const value = "0x00ffee";
            const encoded = abi.defaultAbiCoder.encode(["bytes"], [value]);
            const decoded = abi.defaultAbiCoder.decode(["bytes"], encoded);
            expect(decoded[0]).to.equal(value.toLowerCase());
        });

        it("bytes (empty) -> round-trip", function () {
            const value = "0x";
            const encoded = abi.defaultAbiCoder.encode(["bytes"], [value]);
            const decoded = abi.defaultAbiCoder.decode(["bytes"], encoded);
            expect(decoded[0]).to.equal("0x");
        });
    });
});
