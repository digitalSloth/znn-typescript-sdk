import { expect } from "chai";
import { addNumberDecimals, extractNumberDecimals } from "../../src/utilities/amounts.js";

describe("Amount", () => {
    describe("extractNumberDecimals", () => {
        it("should multiply number by 10^decimals and return BigNumber", () => {
            expect(extractNumberDecimals(5, 2).toString()).to.equal("500");
            expect(extractNumberDecimals(1.23, 3).toString()).to.equal("1230");
            expect(extractNumberDecimals(0.00000001, 8).toString()).to.equal("1");
            expect(extractNumberDecimals(0, 5).toString()).to.equal("0");
        });

        it("should handle whole numbers correctly", () => {
            const result = extractNumberDecimals(123, 2);
            expect(result.toString()).to.equal("12300");
        });

        it("should handle decimal numbers correctly", () => {
            const result = extractNumberDecimals(123.456, 2);
            expect(result.toString()).to.equal("12345");
        });

        it("should handle very small decimals", () => {
            const result = extractNumberDecimals(0.00000001, 8);
            expect(result.toString()).to.equal("1");
        });

        it("should handle large numbers", () => {
            const result = extractNumberDecimals(1000000, 6);
            expect(result.toString()).to.equal("1000000000000");
        });
    });

    describe("addNumberDecimals", () => {
        it("should divide number by 10^decimals and return string", () => {
            expect(addNumberDecimals(500, 2)).to.equal("5");
            expect(addNumberDecimals(1230, 3)).to.equal("1.23");
            expect(addNumberDecimals(1, 8)).to.equal("0.00000001");
            expect(addNumberDecimals(0, 5)).to.equal("0");
        });

        it("should correctly divide by scaling factor", () => {
            const result = addNumberDecimals(12345, 2);
            expect(result).to.equal("123.45");
        });

        it("should handle different decimal places", () => {
            const result = addNumberDecimals(1000, 3);
            expect(result).to.equal("1");
        });

        it("should handle zero decimals", () => {
            const result = addNumberDecimals(100, 0);
            expect(result).to.equal("100");
        });

        it("should handle large numbers", () => {
            const result = addNumberDecimals(1000000000, 6);
            expect(result).to.equal("1000");
        });
    });
});
