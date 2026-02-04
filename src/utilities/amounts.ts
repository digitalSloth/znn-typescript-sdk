import { BigNumber, BigNumberish } from "./bignumber.js";
import { Decimal } from "decimal.js";

/**
 * Extract decimals from a number - converts human-readable amount to base units
 * @param num - The amount as BigNumberish (e.g., 1.5, "1.5", bigint)
 * @param decimals - Number of decimals (e.g., 8 for ZNN)
 * @returns BigNumber representing the amount in base units
 * @example extractNumberDecimals(1.5, 8) => BigNumber(150000000)
 */
export function extractNumberDecimals(num: BigNumberish, decimals: number): BigNumber {
    const decimal = new Decimal(num.toString());
    const scalingFactor = new Decimal(10).pow(decimals);
    const result = decimal.times(scalingFactor);
    // Truncate to remove any fractional part (matching Dart SDK behavior)
    return BigNumber.from(result.toDecimalPlaces(0, Decimal.ROUND_DOWN).toFixed(0));
}

/**
 * Add decimals to a number - converts base units to human-readable amount
 * @param num - The amount in base units as a number
 * @param decimals - Number of decimals (e.g., 8 for ZNN)
 * @returns String representing the human-readable amount
 * @example addNumberDecimals(150000000, 8) => "1.5"
 */
export function addNumberDecimals(num: BigNumberish, decimals: number): string {
    const decimal = new Decimal(num.toString());
    const scalingFactor = new Decimal(10).pow(decimals);
    const result = decimal.dividedBy(scalingFactor);
    return result.toFixed();
}

