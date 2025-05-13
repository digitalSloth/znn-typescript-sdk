import BigNumberJs from "bignumber.js";
import { Logger } from "./logger.js";
import { hexlify, isBytes, isHexString } from "./bytes.js";

export type BigNumberish = bigint | string | number | BigNumberJs.Value;

const logger = Logger.globalLogger();
const MAX_SAFE = 0x1fffffffffffff;

// Attach an ethers-like BigNumber.from to the bignumber.js constructor
// We expose it by monkey-patching the imported constructor function and exporting it.
const BigNumberOverride: any = (BigNumberJs as any);

BigNumberOverride.from = function(value: any): BigNumber {
    if (value instanceof BigNumberJs) { return value; }

    if (typeof(value) === "string") {
        if (value.match(/^-?0x[0-9a-f]+$/i)) {
            return new BigNumberJs(toHex(value));
        }

        if (value.match(/^-?[0-9]+$/)) {
            return new BigNumberJs(toHex(new BigNumberJs(value)));
        }

        return logger.throwArgumentError("invalid BigNumber string", "value", value);
    }

    if (typeof(value) === "number") {
        if (value % 1) {
            logger.throwArgumentError("underflow", "BigNumber.from", value);
        }

        if (value >= MAX_SAFE || value <= -MAX_SAFE) {
            logger.throwArgumentError("overflow", "BigNumber.from", value);
        }

        return BigNumberOverride.from(String(value));
    }

    const anyValue = <any>value;

    if (typeof(anyValue) === "bigint") {
        return BigNumberOverride.from(anyValue.toString());
    }

    if (isBytes(anyValue)) {
        return BigNumberOverride.from(hexlify(anyValue));
    }

    if (anyValue) {

        // Hexable interface (takes priority)
        if (anyValue.toHexString) {
            const hex = anyValue.toHexString();
            if (typeof(hex) === "string") {
                return BigNumberOverride.from(hex);
            }

        } else {
            // For now, handle legacy JSON-ified values (goes away in v6)
            let hex = anyValue._hex;

            // New-form JSON
            if (hex == null && anyValue.type === "BigNumber") {
                hex = anyValue.hex;
            }

            if (typeof(hex) === "string") {
                if (isHexString(hex) || (hex[0] === "-" && isHexString(hex.substring(1)))) {
                    return BigNumberOverride.from(hex);
                }
            }
        }
    }

    return logger.throwArgumentError("invalid BigNumber value", "value", value);
};

BigNumberOverride.prototype.toHexString = function(): string {
    return toHex(this);
};

// Export the patched BigNumber constructor as the module's BigNumber value
export const BigNumber = BigNumberOverride as any;

function toHex(value: BigNumberish): string {

    // For BN, call on the hex string
    if (typeof(value) !== "string") {
        return toHex(value.toString(16));
    }

    // If negative, prepend the negative sign to the normalized positive value
    if (value[0] === "-") {
        // Strip off the negative sign
        value = value.substring(1);

        // Cannot have multiple negative signs (e.g. "--0x04")
        if (value[0] === "-") { logger.throwArgumentError("invalid hex", "value", value); }

        // Call toHex on the positive component
        value = toHex(value);

        // Do not allow "-0x00"
        if (value === "0x00") { return value; }

        // Negate the value
        return "-" + value;
    }

    // Add a "0x" prefix if missing
    if (value.substring(0, 2) !== "0x") { value = "0x" + value; }

    // Normalize zero
    if (value === "0x") { return "0x00"; }

    // Make the string even length
    if (value.length % 2) { value = "0x0" + value.substring(2); }

    // Trim to smallest even-length string
    while (value.length > 4 && value.substring(0, 4) === "0x00") {
        value = "0x" + value.substring(4);
    }

    return value;
}

function toBigNumber(value: BigNumberish): BigNumber {
    return BigNumberOverride.from(toHex(value));
}

function toBN(value: BigNumberish): BigNumber {
    // Normalize the input to a hex string using our toHex helper
    const normalized = BigNumberOverride.from(value);
    const hex = toHex(normalized as any);
    if (hex[0] === "-") {
        return new BigNumberJs("-" + hex.substring(3), 16);
    }
    return new BigNumberJs(hex.substring(2), 16);
}

export function fromTwos(bn: BigNumberish, width: number): BigNumber {
    // Replicates bn.js BN.prototype.fromTwos(width)
    // Interpret the input as a signed two's complement integer with the given bit width
    if (!Number.isFinite(width) || width % 1 !== 0) {
        logger.throwError("invalid-width", Logger.errors.NUMERIC_FAULT, {
            operation: "fromTwos",
            fault: "invalid-width",
            width
        });
    }
    if (width < 0) {
        logger.throwError("negative-width", Logger.errors.NUMERIC_FAULT, {
            operation: "fromTwos",
            fault: "negative-width"
        });
    }

    let value = toBN(bn);

    // Mask to the lowest `width` bits first (bn.js behavior effectively ignores higher bits)
    const twoPow = new BigNumberJs(2).exponentiatedBy(width);
    value = value.mod(twoPow);

    // If the sign bit (bit width-1) is set, interpret as negative by subtracting 2^width
    if (width > 0) {
        const signBit = new BigNumberJs(2).exponentiatedBy(width - 1);
        if (value.gte(signBit)) {
            value = value.minus(twoPow);
        }
    }

    return toBigNumber(value);
}

export function toTwos(bn: BigNumberish, width: number): BigNumber {
    // Replicates bn.js BN.prototype.toTwos(width)
    // Convert a possibly negative signed number into its unsigned two's complement representation
    if (!Number.isFinite(width) || width % 1 !== 0) {
        logger.throwError("invalid-width", Logger.errors.NUMERIC_FAULT, {
            operation: "toTwos",
            fault: "invalid-width",
            width
        });
    }
    if (width < 0) {
        logger.throwError("negative-width", Logger.errors.NUMERIC_FAULT, {
            operation: "toTwos",
            fault: "negative-width"
        });
    }

    let value = toBN(bn);
    const twoPow = new BigNumberJs(2).exponentiatedBy(width);

    if (value.isNegative()) {
        value = value.plus(twoPow);
    }

    // Keep only the lowest `width` bits
    value = value.mod(twoPow);

    return toBigNumber(value);
}

export function mask(bn: BigNumber, value?: BigNumberish): BigNumber {
    // Support accidental call pattern mask(width) by returning the width as a BigNumber, so callers
    // that then pass it into mask(x, mask(width)) still work.
    if (arguments.length === 1) {
        return BigNumberOverride.from(bn as any);
    }

    const bignumber = BigNumberJs(bn as any);
    const width = BigNumberJs(value as any);

    // Match eth-abi semantics: throw a numeric fault for negative widths or negative values
    if (bignumber.isNegative() || width.isNegative()) {
        logger.throwError("negative-width", Logger.errors.NUMERIC_FAULT, {
            operation: "mask",
            fault: "negative-width"
        });
    }

    // bn.js maskn keeps only the lowest `value` bits, which is equivalent to modulo 2^value
    const twoPow = BigNumberJs(2).exponentiatedBy(width);

    // Normalize via toBigNumber (ethers-like hex normalization) to match original behavior
    return toBigNumber(bignumber.mod(twoPow));
}

export const NegativeOne: BigNumber = BigNumberOverride.from(-1);
export const Zero: BigNumber = BigNumberOverride.from(0);
export const One: BigNumber = BigNumberOverride.from(1);
export const Two: BigNumber = BigNumberOverride.from(2);

export const MaxUint256: BigNumber = BigNumberOverride.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
export const MinInt256: BigNumber = BigNumberOverride.from("-0x8000000000000000000000000000000000000000000000000000000000000000");
export const MaxInt256: BigNumber = BigNumberOverride.from("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

