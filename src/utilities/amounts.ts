import { BigNumberish } from "./bignumber.js";

/**
 * Parse a decimal value (including scientific notation, as produced by
 * `Number.prototype.toString`) into an unscaled integer coefficient and a
 * base-10 exponent, such that `value === sign * coefficient * 10 ** exponent`.
 */
function parseDecimal(value: string): { sign: bigint; coefficient: bigint; exponent: number } {
    const match = value.trim().match(/^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);
    if (!match || (match[2] === "" && !match[3])) {
        throw new Error(`invalid decimal value: ${value}`);
    }
    const sign = match[1] === "-" ? -1n : 1n;
    const intPart = match[2] || "";
    const fracPart = match[3] || "";
    const exponent = (match[4] ? parseInt(match[4], 10) : 0) - fracPart.length;
    return { sign, coefficient: BigInt(intPart + fracPart || "0"), exponent };
}

/**
 * Extract decimals from a number - converts human-readable amount to base units
 * @param num - The amount as BigNumberish (e.g., 1.5, "1.5", bigint)
 * @param decimals - Number of decimals (e.g., 8 for ZNN)
 * @returns bigint representing the amount in base units
 * @example extractNumberDecimals(1.5, 8) => 150000000n
 */
export function extractNumberDecimals(num: BigNumberish, decimals: number): bigint {
    const { sign, coefficient, exponent } = parseDecimal(num.toString());
    const shift = exponent + decimals;
    if (shift >= 0) {
        return sign * coefficient * 10n ** BigInt(shift);
    }
    // Truncate toward zero, matching Decimal.ROUND_DOWN.
    return sign * (coefficient / 10n ** BigInt(-shift));
}

/**
 * Add decimals to a number - converts base units to human-readable amount
 * @param num - The amount in base units as a number
 * @param decimals - Number of decimals (e.g., 8 for ZNN)
 * @returns String representing the human-readable amount
 * @example addNumberDecimals(150000000, 8) => "1.5"
 */
export function addNumberDecimals(num: BigNumberish, decimals: number): string {
    const { sign, coefficient, exponent } = parseDecimal(num.toString());

    // value = coefficient * 10 ** (exponent - decimals); express it as an
    // integer string with `fracLen` digits after the decimal point.
    let digits = coefficient;
    let fracLen = decimals - exponent;
    if (fracLen < 0) {
        digits *= 10n ** BigInt(-fracLen);
        fracLen = 0;
    }

    const padded = digits.toString().padStart(fracLen + 1, "0");
    const intPart = fracLen === 0 ? padded : padded.slice(0, -fracLen);
    const fracPart = (fracLen === 0 ? "" : padded.slice(-fracLen)).replace(/0+$/, "");
    const negative = sign < 0n && digits !== 0n;

    return (negative ? "-" : "") + intPart + (fracPart ? "." + fracPart : "");
}
