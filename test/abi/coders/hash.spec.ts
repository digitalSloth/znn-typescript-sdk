import { expect } from "chai";
import * as abi from "../../../src/abi/index.js";

describe("Hash", () => {

    describe("encode", () => {
        it("hash", function () {
            const encoded = abi.defaultAbiCoder.encode(["hash"], ["0x3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392"]);
            expect(encoded).to.equal("0x3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392");
        });

        it("hash[]", function () {
            const encoded = abi.defaultAbiCoder.encode(["hash[]"], [["0x3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392", "0x420baf620e3fcd9b3715b42b92506e9304d56e02d3a103499a3a292560cb66b2"]]);
            expect(encoded).to.equal("0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000023338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392420baf620e3fcd9b3715b42b92506e9304d56e02d3a103499a3a292560cb66b2");
        });

        it("hash[] round-trip", function () {
            const values = ["0x3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392", "0x420baf620e3fcd9b3715b42b92506e9304d56e02d3a103499a3a292560cb66b2"];
            const encoded = abi.defaultAbiCoder.encode(["hash[]"], [values]);
            const decoded = abi.defaultAbiCoder.decode(["hash[]"], encoded);
            expect(decoded[0]).to.deep.equal(values);
        });

        it("throws on incorrect length", function () {
            expect(() => abi.defaultAbiCoder.encode(["hash"], ["0x1234"])).to.throw();
        });

        it("hash round-trip", function () {
            const value = "0x3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392";
            const encoded = abi.defaultAbiCoder.encode(["hash"], [value]);
            const decoded = abi.defaultAbiCoder.decode(["hash"], encoded);
            expect(decoded[0]).to.equal(value);
        });
    })

    describe("decode", () => {
        it("hash", function () {
            const decoded = abi.defaultAbiCoder.decode(["hash"], "0x3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392");
            expect(decoded[0]).to.equal("0x3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392");
        });

        it("hash[]", function () {
            const decoded = abi.defaultAbiCoder.decode(["hash[]"], "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000023338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392420baf620e3fcd9b3715b42b92506e9304d56e02d3a103499a3a292560cb66b2");
            expect(decoded[0]).to.deep.equal([
                "0x3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392",
                "0x420baf620e3fcd9b3715b42b92506e9304d56e02d3a103499a3a292560cb66b2"
            ]);
        });

        it("hash[] round-trip", function () {
            const value = "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000023338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392420baf620e3fcd9b3715b42b92506e9304d56e02d3a103499a3a292560cb66b2"
            const decoded = abi.defaultAbiCoder.decode(["hash[]"], value);
            const encoded = abi.defaultAbiCoder.encode(["hash[]"], decoded);
            expect(encoded).to.deep.equal("0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000023338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392420baf620e3fcd9b3715b42b92506e9304d56e02d3a103499a3a292560cb66b2");
        });
    })
});
