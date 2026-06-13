import { Logger } from "./logger.js";
import { hexlify, isBytes, isHexString } from "./bytes.js";

export type BigNumberish = bigint | string | number;

export interface Hexable {
    toHexString(): string;
}

const logger = Logger.globalLogger();
const MAX_SAFE = 0x1fffffffffffff;

/**
 * Convert any BigNumberish (or bytes/Hexable/legacy JSON) value to a native bigint.
 * Replaces `BigNumber.from(...)`.
 */
export function toBigInt(value: BigNumberish | Uint8Array | Hexable | any): bigint {
    if (typeof value === "bigint") {
        return value;
    }

    if (typeof value === "number") {
        if (value % 1) {
            logger.throwArgumentError("underflow", "toBigInt", value);
        }
        if (value >= MAX_SAFE || value <= -MAX_SAFE) {
            logger.throwArgumentError("overflow", "toBigInt", value);
        }
        return BigInt(value);
    }

    if (typeof value === "string") {
        if (value.match(/^-0x[0-9a-f]+$/i)) {
            return -BigInt("0x" + value.slice(3));
        }
        if (value.match(/^0x[0-9a-f]+$/i)) {
            return BigInt(value);
        }
        if (value.match(/^-?[0-9]+$/)) {
            return BigInt(value);
        }
        return logger.throwArgumentError("invalid BigNumber string", "value", value);
    }

    const anyValue = value as any;

    if (isBytes(anyValue)) {
        const hex = hexlify(anyValue);
        if (hex === "0x") return 0n;
        return BigInt(hex);
    }

    if (anyValue && typeof anyValue.toHexString === "function") {
        return toBigInt(anyValue.toHexString() as string);
    }

    if (anyValue) {
        // Legacy JSON-ified {_hex} or {type:"BigNumber",hex}
        let hex = anyValue._hex;
        if (hex == null && anyValue.type === "BigNumber") {
            hex = anyValue.hex;
        }
        if (typeof hex === "string") {
            if (isHexString(hex) || (hex[0] === "-" && isHexString(hex.substring(1)))) {
                return toBigInt(hex);
            }
        }
    }

    return logger.throwArgumentError("invalid BigNumber value", "value", value);
}

/**
 * Produce a normalized hex string from a bigint.
 * Output: `0x`-prefixed, lowercase, even-length, smallest even-length form.
 * `0n` → "0x00", negative values → "-0x.." (never "-0x00").
 * Replaces `.toHexString()` / the old `toHex` helper.
 */
export function toHexString(value: bigint): string {
    if (value < 0n) {
        const pos = toHexString(-value);
        return pos === "0x00" ? "0x00" : "-" + pos;
    }
    let hex = value.toString(16);
    if (hex.length % 2) hex = "0" + hex;
    return "0x" + hex;
}

/**
 * Keep the lowest `width` bits of `value`.
 * Throws NUMERIC_FAULT for negative value or negative width.
 */
export function mask(value: bigint, width: number): bigint {
    if (value < 0n || width < 0) {
        logger.throwError("negative-width", Logger.errors.NUMERIC_FAULT, {
            operation: "mask",
            fault: "negative-width"
        });
    }
    return value & ((1n << BigInt(width)) - 1n);
}

/**
 * Interpret `value` as a two's-complement signed integer of bit-width `width`.
 */
export function fromTwos(value: bigint, width: number): bigint {
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
    const w = BigInt(width);
    const twoPow = 1n << w;
    let v = ((value % twoPow) + twoPow) % twoPow;
    if (w > 0n && v >= (1n << (w - 1n))) v -= twoPow;
    return v;
}

/**
 * Convert a possibly-negative signed integer to its two's-complement unsigned
 * representation in `width` bits.
 */
export function toTwos(value: bigint, width: number): bigint {
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
    const twoPow = 1n << BigInt(width);
    const v = value < 0n ? value + twoPow : value;
    return ((v % twoPow) + twoPow) % twoPow;
}

// Constants
export const NegativeOne: bigint = -1n;
export const Zero: bigint = 0n;
export const One: bigint = 1n;
export const Two: bigint = 2n;
export const MaxUint256: bigint = (1n << 256n) - 1n;
export const MinInt256: bigint = -(1n << 255n);
export const MaxInt256: bigint = (1n << 255n) - 1n;
