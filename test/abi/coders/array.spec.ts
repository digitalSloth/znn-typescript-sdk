import { expect } from "chai";
import { ArrayCoder } from "../../../src/abi/coders/array.js";
import { NumberCoder } from "../../../src/abi/coders/number.js";
import { Reader, Writer } from "../../../src/abi/coders/abstract-coder.js";
import { Logger } from "../../../src/utilities/logger.js";

describe("ArrayCoder", () => {
    const uint8Coder = new NumberCoder(1, false, "value");

    it("should return default values for fixed length arrays", () => {
        const coder = new ArrayCoder(uint8Coder, 2, "values");
        expect(coder.defaultValue()).to.deep.equal([0, 0]);
    });

    it("should return empty default values for dynamic arrays", () => {
        const coder = new ArrayCoder(uint8Coder, -1, "values");
        expect(coder.defaultValue()).to.deep.equal([]);
    });

    it("should throw when encoding a non-array value", () => {
        const coder = new ArrayCoder(uint8Coder, 1, "values");
        const writer = new Writer();

        expect(() => coder.encode(writer, "not-array" as any)).to.throw("expected array value");
    });

    it("should throw when array length is too short", () => {
        const coder = new ArrayCoder(uint8Coder, 2, "values");
        const writer = new Writer();

        expect(() => coder.encode(writer, [1])).to.throw("missing argument");
    });

    it("should throw when array length is too long", () => {
        const coder = new ArrayCoder(uint8Coder, 1, "values");
        const writer = new Writer();

        expect(() => coder.encode(writer, [1, 2])).to.throw("too many arguments");
    });

    // it("should encode and decode a fixed-length array", () => {
    //     const coder = new ArrayCoder(uint8Coder, 2, "values");
    //     const writer = new Writer();
    //
    //     coder.encode(writer, [7, 9]);
    //     const reader = new Reader(writer.data);
    //     const decoded = coder.decode(reader);
    //
    //     expect(decoded).to.deep.equal([7, 9]);
    // });
    //
    // it("should encode a dynamic array with a length prefix", () => {
    //     const coder = new ArrayCoder(uint8Coder, -1, "values");
    //     const writer = new Writer();
    //
    //     coder.encode(writer, [1, 2, 3]);
    //     const manual = new Writer();
    //     manual.writeValue(3);
    //     manual.writeValue(1);
    //     manual.writeValue(2);
    //     manual.writeValue(3);
    //
    //     expect(writer.data).to.equal(manual.data);
    // });
    //
    // it("should decode a dynamic array", () => {
    //     const coder = new ArrayCoder(uint8Coder, -1, "values");
    //     const manual = new Writer();
    //
    //     manual.writeValue(3);
    //     manual.writeValue(1);
    //     manual.writeValue(2);
    //     manual.writeValue(3);
    //
    //     const reader = new Reader(manual.data);
    //     const decoded = coder.decode(reader);
    //
    //     expect(decoded).to.deep.equal([1, 2, 3]);
    // });

    it("should throw on decode when dynamic array length exceeds data", () => {
        const coder = new ArrayCoder(uint8Coder, -1, "values");
        const writer = new Writer();

        writer.writeValue(2);
        const reader = new Reader(writer.data);

        let error: any = null;
        try {
            coder.decode(reader);
        } catch (err) {
            error = err;
        }

        expect(error).to.exist;
        expect(error.code).to.equal(Logger.errors.BUFFER_OVERRUN);
    });
});
