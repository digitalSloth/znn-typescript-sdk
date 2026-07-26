import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";
import { Multisig } from "../../../src/embedded/multisig.js";

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

        // Cross-checked against go-zenon's own ABIMultisig.PackMethod for the same
        // (nonce, threshold, signers) triple - byte-for-byte identical, confirming
        // this SDK's bytes[] encoding matches the real node's ABI packer.
        it("bytes[] (CreateMultisig calldata) matches go-zenon packer output", function () {
            const nonce = 1782933252398n;
            const threshold = 2;
            const signers = [
                Buffer.from("79a01ae9efde740e4916a911b89cf738cb211a5402df61de18e987801bab4fd3", "hex"),
                Buffer.from("471fa0f6897cc2b7e873888a27d1fc70f5baaca94ece3d4bf29ff7b7cac532f7", "hex"),
                Buffer.from("a918b3e5f35461a72fe4ce67d18cccda485ef50c7de497f3a34e96f342690324", "hex"),
            ];

            const calldata = "0x2adf7a330000000000000000000000000000000000000000000000000000019f1f1a692e000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000002079a01ae9efde740e4916a911b89cf738cb211a5402df61de18e987801bab4fd30000000000000000000000000000000000000000000000000000000000000020471fa0f6897cc2b7e873888a27d1fc70f5baaca94ece3d4bf29ff7b7cac532f70000000000000000000000000000000000000000000000000000000000000020a918b3e5f35461a72fe4ce67d18cccda485ef50c7de497f3a34e96f342690324";

            const encoded = Multisig.encodeCall("CreateMultisig", [nonce, threshold, signers]);
            expect(encoded).to.equal(calldata);
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
