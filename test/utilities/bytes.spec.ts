import { expect } from "chai";
import {
    arrayify,
    concat,
    hexConcat,
    hexDataLength,
    hexDataSlice,
    hexStripZeros,
    hexValue,
    hexZeroPad,
    hexlify,
    isBytes,
    isBytesLike,
    isHexString,
    isInteger,
    isObject,
    numberOrStringToBytes,
    numberToBytes,
    stringToBytes,
    stripZeros,
    zeroPad
} from "../../src/utilities/bytes.js";
import { BigNumber } from "../../src/utilities/bignumber.js";

describe("Bytes", () => {

    describe("numberToBytes", () => {
        it("should convert number to bytes with specified length", () => {
            const num = 42;
            const numBytes = 4;
            const result = numberToBytes(num, numBytes);

            expect(result).to.be.instanceOf(Buffer);
            expect(result.length).to.equal(numBytes);
            expect(result).to.deep.equal(Buffer.from([0, 0, 0, 42]));
        });

        it("should handle larger numbers", () => {
            const num = 16909060; // 0x01020304 in hex
            const numBytes = 4;
            const result = numberToBytes(num, numBytes);
            expect(result).to.deep.equal(Buffer.from([1, 2, 3, 4]));
        });
    });

    /**
     * TODO - Fix
     */
    // describe('stringToBytes', () => {
    //     it('should convert string to bytes with correct padding', () => {
    //         const str = '16909060'; // 0x01020304 in hex (decimal: 16909060)
    //         const numBytes = 4;
    //         const result = BytesUtils.stringToBytes(str, numBytes);
    //
    //         // Create expected buffer based on the actual conversion
    //         const bigN = new BigNumber(str);
    //         const expectedHex = bigN.toString(16).padStart(numBytes * 2, '0');
    //         const expectedBuffer = Buffer.from(expectedHex, 'hex');
    //
    //         expect(result).to.deep.equal(expectedBuffer);
    //     });
    //
    //     it('should handle larger string numbers', () => {
    //         const str = '16909060'; // 0x01020304 in hex (decimal: 16909060)
    //         const numBytes = 4;
    //         const result = BytesUtils.stringToBytes(str, numBytes);
    //         expect(result).to.deep.equal(Buffer.from([1, 2, 3, 4]));
    //     });
    // });

    describe("numberOrStringToBytes", () => {
        it("should handle number input", () => {
            const num = 42;
            const result = numberOrStringToBytes(num);

            expect(result).to.be.instanceOf(Buffer);
            expect(result.length).to.equal(32);

            // Check that only the last byte is non-zero
            for (let i = 0; i < 31; i++) {
                expect(result[i]).to.equal(0);
            }
            expect(result[31]).to.equal(42);
        });

        it("should handle string input", () => {
            const str = "42";
            const result = numberOrStringToBytes(str);

            expect(result).to.be.instanceOf(Buffer);
            expect(result.length).to.equal(32);
        });

        it("should handle BigNumber input", () => {
            const bn = new BigNumber("16909060"); // 0x01020304 in hex
            const result = numberOrStringToBytes(bn);

            expect(result).to.be.instanceOf(Buffer);
            expect(result.length).to.equal(32);
        });
    });

    describe("zeroPad", () => {
        it("should pad bytes with zeros to reach the specified size", () => {
            const bytes = Buffer.from([1, 2, 3]);
            const result = zeroPad(bytes, 5);

            expect(result.length).to.equal(5);
            expect(Buffer.from([0, 0, 1, 2, 3])).to.deep.equal(result);
        });

        it("should throw if value exceeds length", () => {
            const bytes = Buffer.from([1, 2, 3, 4, 5]);
            expect(() => zeroPad(bytes, 3)).to.throw();
        });
    });

    describe("arrayify", () => {
        it("should convert hex string to Uint8Array", () => {
            const result = arrayify("0x0102");
            expect(result).to.deep.equal(new Uint8Array([1, 2]));
        });

        it("should convert number to Uint8Array", () => {
            const result = arrayify(255);
            expect(result).to.deep.equal(new Uint8Array([255]));
        });

        it("should handle hex string with odd length using hexPad left", () => {
            const result = arrayify("0x123", { hexPad: "left" });
            expect(result).to.deep.equal(new Uint8Array([1, 35]));
        });

        it("should handle hex string with odd length using hexPad right", () => {
            const result = arrayify("0x123", { hexPad: "right" });
            expect(result).to.deep.equal(new Uint8Array([18, 48]));
        });

        it("should handle allowMissingPrefix option", () => {
            const result = arrayify("0102", { allowMissingPrefix: true });
            expect(result).to.deep.equal(new Uint8Array([1, 2]));
        });

        it("should convert bytes to Uint8Array", () => {
            const bytes = Buffer.from([1, 2, 3]);
            const result = arrayify(bytes);
            expect(result).to.deep.equal(new Uint8Array([1, 2, 3]));
        });
    });

    describe("hexlify", () => {
        it("should convert bytes to hex string", () => {
            const bytes = new Uint8Array([1, 2, 3]);
            expect(hexlify(bytes)).to.equal("0x010203");
        });

        it("should convert number to hex string", () => {
            expect(hexlify(255)).to.equal("0xff");
        });

        it("should convert bigint to hex string", () => {
            expect(hexlify(255n)).to.equal("0xff");
        });

        it("should handle hex string input", () => {
            expect(hexlify("0x0102")).to.equal("0x0102");
        });

        it("should handle odd-length hex with hexPad left", () => {
            expect(hexlify("0x123", { hexPad: "left" })).to.equal("0x0123");
        });

        it("should handle odd-length hex with hexPad right", () => {
            expect(hexlify("0x123", { hexPad: "right" })).to.equal("0x1230");
        });
    });

    describe("isBytes", () => {
        it("should return true for Uint8Array", () => {
            expect(isBytes(new Uint8Array([1, 2, 3]))).to.be.true;
        });

        it("should return true for array of valid bytes", () => {
            expect(isBytes([0, 255, 128])).to.be.true;
        });

        it("should return false for string", () => {
            expect(isBytes("0x0102")).to.be.false;
        });

        it("should return false for null", () => {
            expect(isBytes(null)).to.be.false;
        });

        it("should return false for array with invalid bytes", () => {
            expect(isBytes([0, 256])).to.be.false;
            expect(isBytes([0, -1])).to.be.false;
        });
    });

    describe("isHexString", () => {
        it("should return true for valid hex string", () => {
            expect(isHexString("0x0102")).to.be.true;
        });

        it("should return true for valid hex string with specific length", () => {
            expect(isHexString("0x0102", 2)).to.be.true;
        });

        it("should return false for hex string with wrong length", () => {
            expect(isHexString("0x0102", 3)).to.be.false;
        });

        it("should return false for non-hex string", () => {
            expect(isHexString("hello")).to.be.false;
        });

        it("should return false for hex without 0x prefix", () => {
            expect(isHexString("0102")).to.be.false;
        });
    });

    describe("isInteger", () => {
        it("should return true for integers", () => {
            expect(isInteger(42)).to.be.true;
            expect(isInteger(0)).to.be.true;
            expect(isInteger(-5)).to.be.true;
        });

        it("should return false for non-integers", () => {
            expect(isInteger(3.14)).to.be.false;
            expect(isInteger("42")).to.be.false;
            expect(isInteger(NaN)).to.be.false;
        });
    });

    describe("isBytesLike", () => {
        it("should return true for hex string with even length", () => {
            expect(isBytesLike("0x0102")).to.be.true;
        });

        it("should return true for bytes", () => {
            expect(isBytesLike(new Uint8Array([1, 2]))).to.be.true;
        });

        it("should return false for hex string with odd length", () => {
            expect(isBytesLike("0x012")).to.be.false;
        });
    });

    describe("isObject", () => {
        it("should return true for objects", () => {
            expect(isObject({})).to.be.true;
            expect(isObject([])).to.be.true;
        });

        it("should return true for functions", () => {
            expect(isObject(() => {})).to.be.true;
        });

        it("should return false for primitives", () => {
            expect(isObject(42)).to.be.false;
            expect(isObject("hello")).to.be.false;
            expect(isObject(null)).to.be.false;
        });
    });

    describe("concat", () => {
        it("should concatenate multiple byte arrays", () => {
            const result = concat([
                new Uint8Array([1, 2]),
                new Uint8Array([3, 4]),
                new Uint8Array([5])
            ]);
            expect(result).to.deep.equal(new Uint8Array([1, 2, 3, 4, 5]));
        });

        it("should handle hex strings", () => {
            const result = concat(["0x0102", "0x0304"]);
            expect(result).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
        });

        it("should handle empty array", () => {
            const result = concat([]);
            expect(result).to.deep.equal(new Uint8Array([]));
        });
    });

    describe("stripZeros", () => {
        it("should remove leading zeros", () => {
            const result = stripZeros(new Uint8Array([0, 0, 1, 2, 3]));
            expect(result).to.deep.equal(new Uint8Array([1, 2, 3]));
        });

        it("should handle all zeros", () => {
            const result = stripZeros(new Uint8Array([0, 0, 0]));
            expect(result).to.deep.equal(new Uint8Array([]));
        });

        it("should handle no leading zeros", () => {
            const result = stripZeros(new Uint8Array([1, 2, 3]));
            expect(result).to.deep.equal(new Uint8Array([1, 2, 3]));
        });
    });

    describe("hexDataLength", () => {
        it("should return length for valid hex string", () => {
            expect(hexDataLength("0x0102")).to.equal(2);
        });

        it("should return null for invalid hex string", () => {
            expect(hexDataLength("0x012")).to.be.null;
        });

        it("should handle bytes input", () => {
            expect(hexDataLength(new Uint8Array([1, 2, 3]))).to.equal(3);
        });
    });

    describe("hexDataSlice", () => {
        it("should slice hex data with start and end offset", () => {
            expect(hexDataSlice("0x01020304", 1, 3)).to.equal("0x0203");
        });

        it("should slice hex data with only start offset", () => {
            expect(hexDataSlice("0x01020304", 2)).to.equal("0x0304");
        });

        it("should handle bytes input", () => {
            const bytes = new Uint8Array([1, 2, 3, 4]);
            expect(hexDataSlice(bytes, 1, 3)).to.equal("0x0203");
        });
    });

    describe("hexConcat", () => {
        it("should concatenate hex values", () => {
            const result = hexConcat(["0x0102", "0x0304", new Uint8Array([5, 6])]);
            expect(result).to.equal("0x010203040506");
        });

        it("should handle empty array", () => {
            expect(hexConcat([])).to.equal("0x");
        });
    });

    describe("hexValue", () => {
        it("should strip leading zeros", () => {
            expect(hexValue("0x00000123")).to.equal("0x123");
        });

        it("should handle all zeros", () => {
            expect(hexValue("0x0000")).to.equal("0x0");
        });

        it("should handle bytes", () => {
            expect(hexValue(new Uint8Array([0, 0, 1, 2, 3]))).to.equal("0x10203");
        });
    });

    describe("hexStripZeros", () => {
        it("should strip leading zeros from hex string", () => {
            expect(hexStripZeros("0x00000123")).to.equal("0x123");
        });

        it("should handle all zeros", () => {
            expect(hexStripZeros("0x0000")).to.equal("0x");
        });

        it("should handle bytes input", () => {
            expect(hexStripZeros(new Uint8Array([0, 0, 1, 2]))).to.equal("0x102");
        });
    });

    describe("hexZeroPad", () => {
        it("should pad hex string with zeros", () => {
            expect(hexZeroPad("0x123", 4)).to.equal("0x00000123");
        });

        it("should handle already padded value", () => {
            expect(hexZeroPad("0x01020304", 4)).to.equal("0x01020304");
        });

        it("should throw if value exceeds length", () => {
            expect(() => hexZeroPad("0x0102030405", 4)).to.throw();
        });
    });

    describe("stringToBytes", () => {
        it("should convert string number to bytes", () => {
            const result = stringToBytes("255", 2);
            expect(result).to.deep.equal(Buffer.from([0, 255]));
        });

        it("should handle large string numbers", () => {
            const result = stringToBytes("16909060", 4);
            expect(result).to.deep.equal(Buffer.from([1, 2, 3, 4]));
        });

        it("should handle padding correctly", () => {
            const result = stringToBytes("42", 4);
            expect(result).to.deep.equal(Buffer.from([0, 0, 0, 42]));
        });
    });

});
