import { expect } from "chai";
import { BigNumber } from "bignumber.js";
import {
    MaxInt256,
    MaxUint256,
    MinInt256,
    NegativeOne,
    One,
    Two,
    Zero,
    fromTwos,
    toTwos,
} from "../../src/utilities/bignumber.js";

// Import the monkey-patched static from and prototype methods by importing the module
import * as BigNumberModule from "../../src/utilities/bignumber.js";

// Helper to access the patched BigNumber.from
const BNfrom = (BigNumber as any).from as (v: any) => BigNumber;

describe("utilities/bignumber", () => {
    describe("BigNumber.from patch", () => {
        it("accepts decimal strings", () => {
            const bn = BNfrom("255");
            expect(bn.toString(10)).to.equal("255");
            expect((bn as any).toHexString()).to.equal("0xff");
        });

        it("accepts hex strings (with sign)", () => {
            const bn = BNfrom("0xff");
            expect((bn as any).toHexString()).to.equal("0xff");

            const neg = BNfrom("-0x2a");
            expect((neg as any).toHexString()).to.equal("-0x2a");
        });

        it("accepts number (safe integer only)", () => {
            const bn = BNfrom(42);
            expect((bn as any).toHexString()).to.equal("0x2a");
            expect(() => BNfrom(1.5)).to.throw();
        });

        it("accepts bigint", () => {
            const bn = BNfrom(9007199254740991n); // MAX_SAFE_INTEGER
            expect((bn as any).toHexString()).to.equal("0x1fffffffffffff");
        });

        it("accepts BytesLike (Uint8Array)", () => {
            const arr = new Uint8Array([0x01, 0x02]);
            const bn = BNfrom(arr);
            expect((bn as any).toHexString()).to.equal("0x0102");
        });

        it("accepts Hexable objects", () => {
            const obj = { toHexString: () => "0x1234" };
            const bn = BNfrom(obj);
            expect((bn as any).toHexString()).to.equal("0x1234");
        });

        it("accepts legacy JSON-like {_hex}", () => {
            const bn = BNfrom({ _hex: "0x0a" } as any);
            expect((bn as any).toHexString()).to.equal("0x0a");
        });

        it("rejects invalid strings", () => {
            expect(() => BNfrom("not-a-number")).to.throw();
            expect(() => BNfrom("--0x04")).to.throw();
        });
    });

    describe("toHexString prototype", () => {
        it("returns normalized hex with 0x prefix and even length", () => {
            const bn = BNfrom("15");
            expect((bn as any).toHexString()).to.equal("0x0f");
        });
    });

    describe("two's complement conversions", () => {
        it("toTwos and fromTwos roundtrip for -1 at width 8", () => {
            const asUnsigned = toTwos(NegativeOne, 8);
            expect((asUnsigned as any).toHexString()).to.equal("0xff");
            const back = fromTwos(asUnsigned, 8);
            expect(back.toString(10)).to.equal(NegativeOne.toString(10));
        });

        it("toTwos and fromTwos roundtrip for -2 at width 16", () => {
            const negTwo = BNfrom(-2);
            const asUnsigned = toTwos(negTwo, 16);
            expect((asUnsigned as any).toHexString()).to.equal("0xfffe");
            const back = fromTwos(asUnsigned, 16);
            expect(back.toString(10)).to.equal(negTwo.toString(10));
        });

        it("fromTwos interprets sign bit correctly", () => {
            const unsigned = BNfrom("0x80"); // 128 with width 8 => -128
            const signed = fromTwos(unsigned, 8);
            expect(signed.toString(10)).to.equal("-128");
        });
    });

    describe("mask", () => {
        const { mask } = BigNumberModule as any;

        it("keeps only the lowest N bits", () => {
            // bignumber.js cannot parse 0b, construct via hex 0x2d (45)
            const fortyFive = BNfrom("0x2d"); // 0b101101
            const masked = mask(fortyFive, 3);
            expect(masked.toString(10)).to.equal("5"); // 0b101
        });

        it("supports single-arg accidental call pattern", () => {
            const value = BNfrom(12);
            const out = mask(value as any);
            expect(out.toString(10)).to.equal("12");
        });

        it("throws on negative width or value", () => {
            const value = BNfrom(5);
            expect(() => mask(value, BNfrom(-1))).to.throw();
            // negative value
            expect(() => mask(BNfrom(-5), 3)).to.throw();
        });
    });

    describe("constants", () => {
        it("exports well-known constants", () => {
            expect(NegativeOne.toString(10)).to.equal("-1");
            expect(Zero.toString(10)).to.equal("0");
            expect(One.toString(10)).to.equal("1");
            expect(Two.toString(10)).to.equal("2");
            expect((MaxUint256 as any).toHexString()).to.match(/^0x[0-9a-f]+$/);
            expect((MinInt256 as any).toHexString()).to.match(/^-[0-9a-fx]+$/);
            expect((MaxInt256 as any).toHexString()).to.match(/^0x[0-9a-f]+$/);
        });
    });
});
