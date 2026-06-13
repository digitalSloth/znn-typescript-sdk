import { expect } from "chai";
import {
    MaxInt256,
    MaxUint256,
    MinInt256,
    NegativeOne,
    One,
    Two,
    Zero,
    fromTwos,
    mask,
    toBigInt,
    toHexString,
    toTwos,
} from "../../src/utilities/bignumber.js";

describe("utilities/bignumber", () => {
    describe("toBigInt", () => {
        it("accepts decimal strings", () => {
            expect(toBigInt("255")).to.equal(255n);
        });

        it("accepts hex strings", () => {
            expect(toBigInt("0xff")).to.equal(255n);
        });

        it("accepts negative hex strings", () => {
            expect(toBigInt("-0x2a")).to.equal(-42n);
        });

        it("accepts numbers (safe integers only)", () => {
            expect(toBigInt(42)).to.equal(42n);
            expect(() => toBigInt(1.5)).to.throw();
        });

        it("accepts bigint passthrough", () => {
            expect(toBigInt(9007199254740991n)).to.equal(9007199254740991n);
        });

        it("accepts BytesLike (Uint8Array)", () => {
            expect(toBigInt(new Uint8Array([0x01, 0x02]))).to.equal(0x0102n);
        });

        it("accepts Hexable objects", () => {
            const obj = { toHexString: () => "0x1234" };
            expect(toBigInt(obj)).to.equal(0x1234n);
        });

        it("accepts legacy JSON-like {_hex}", () => {
            expect(toBigInt({ _hex: "0x0a" } as any)).to.equal(10n);
        });

        it("rejects invalid strings", () => {
            expect(() => toBigInt("not-a-number")).to.throw();
            expect(() => toBigInt("--0x04")).to.throw();
        });
    });

    describe("toHexString", () => {
        it("returns 0x00 for zero", () => {
            expect(toHexString(0n)).to.equal("0x00");
        });

        it("returns normalized hex with even length", () => {
            expect(toHexString(15n)).to.equal("0x0f");
            expect(toHexString(255n)).to.equal("0xff");
        });

        it("returns -0x.. for negatives (never -0x00)", () => {
            expect(toHexString(-42n)).to.equal("-0x2a");
        });

        it("roundtrips with toBigInt", () => {
            expect(toHexString(toBigInt("-0x2a"))).to.equal("-0x2a");
            expect(toHexString(9007199254740991n)).to.equal("0x1fffffffffffff");
            expect(toHexString(toBigInt(new Uint8Array([0x01, 0x02])))).to.equal("0x0102");
        });
    });

    describe("toTwos / fromTwos", () => {
        it("toTwos and fromTwos roundtrip for -1 at width 8", () => {
            const asUnsigned = toTwos(-1n, 8);
            expect(asUnsigned).to.equal(0xffn);
            expect(fromTwos(asUnsigned, 8)).to.equal(-1n);
        });

        it("toTwos and fromTwos roundtrip for -2 at width 16", () => {
            const asUnsigned = toTwos(-2n, 16);
            expect(asUnsigned).to.equal(0xfffen);
            expect(fromTwos(asUnsigned, 16)).to.equal(-2n);
        });

        it("fromTwos interprets sign bit correctly", () => {
            expect(fromTwos(0x80n, 8)).to.equal(-128n);
        });
    });

    describe("mask", () => {
        it("keeps only the lowest N bits", () => {
            expect(mask(0x2dn, 3)).to.equal(5n); // 0b101101 & 0b111 = 0b101 = 5
        });

        it("throws on negative width", () => {
            expect(() => mask(5n, -1)).to.throw();
        });

        it("throws on negative value", () => {
            expect(() => mask(-5n, 3)).to.throw();
        });
    });

    describe("constants", () => {
        it("exports well-known constants", () => {
            expect(NegativeOne).to.equal(-1n);
            expect(Zero).to.equal(0n);
            expect(One).to.equal(1n);
            expect(Two).to.equal(2n);
            expect(toHexString(MaxUint256)).to.match(/^0x[0-9a-f]+$/);
            expect(toHexString(MinInt256)).to.match(/^-0x[0-9a-f]+$/);
            expect(toHexString(MaxInt256)).to.match(/^0x[0-9a-f]+$/);
        });
    });
});
