import { Buffer } from "buffer";
import { BigNumber, BigNumberish } from "./bignumber.js";
import { Logger } from "./logger.js";

const logger = Logger.globalLogger();

export type Bytes = ArrayLike<number>;
export type BytesLike = Bytes | string;

export type DataOptions = {
    allowMissingPrefix?: boolean;
    hexPad?: "left" | "right" | null;
};

export interface Hexable {
    toHexString(): string;
}

const HexCharacters: string = "0123456789abcdef";

function isHexable(value: any): value is Hexable {
    return !!(value.toHexString);
}

function addSlice(array: Uint8Array): Uint8Array {
    if ((array as any).slice) { return array; }

    (array as any).slice = function() {
        const args = Array.prototype.slice.call(arguments);
        // @ts-ignore
        return addSlice(new Uint8Array(Array.prototype.slice.apply(array, args)));
    }

    return array;
}

export function isBytesLike(value: any): value is BytesLike {
    return ((isHexString(value) && !(value.length % 2)) || isBytes(value));
}

export function isInteger(value: any) {
    return (typeof(value) === "number" && value == value && (value % 1) === 0);
}

export function isBytes(value: any): value is Bytes {
    if (value == null) { return false; }

    if (value.constructor === Uint8Array) { return true; }
    if (typeof(value) === "string") { return false; }
    if (!isInteger(value.length) || value.length < 0) { return false; }

    for (let i = 0; i < value.length; i++) {
        const v = value[i];
        if (!isInteger(v) || v < 0 || v >= 256) { return false; }
    }
    return true;
}

export function isHexString(value: any, length?: number): boolean {
    if (typeof(value) !== "string" || !(value as string).match(/^0x[0-9A-Fa-f]*$/)) {
        return false
    }
    return !(length && (value as string).length !== 2 + 2 * length);
}

export function isObject(value: any): boolean {
    const type = typeof value;
    return type === "function" || type === "object" && !!value;
}

export function concat(items: ReadonlyArray<BytesLike>): Uint8Array {
    const objects = items.map(item => arrayify(item));
    const length = objects.reduce((accum, item) => (accum + item.length), 0);

    const result = new Uint8Array(length);

    objects.reduce((offset, object) => {
        result.set(object, offset);
        return offset + object.length;
    }, 0);

    return addSlice(result);
}

export function arrayify(value: BytesLike | Hexable | number, options?: DataOptions): Uint8Array {
    if (!options) { options = { }; }

    if (typeof(value) === "number") {
        logger.checkSafeUint53(value, "invalid arrayify value");

        const result = [];
        while (value) {
            result.unshift(value & 0xff);
            value = parseInt(String(value / 256));
        }
        if (result.length === 0) { result.push(0); }

        return addSlice(new Uint8Array(result));
    }

    if (options.allowMissingPrefix && typeof(value) === "string" && value.substring(0, 2) !== "0x") {
        value = "0x" + value;
    }

    if (isHexable(value)) { value = value.toHexString(); }

    if (isHexString(value)) {
        let hex = (<string>value).substring(2);
        if (hex.length % 2) {
            if (options.hexPad === "left") {
                hex = "0" + hex;
            } else if (options.hexPad === "right") {
                hex += "0";
            } else {
                logger.throwArgumentError("hex data is odd-length", "value", value);
            }
        }

        const result = [];
        for (let i = 0; i < hex.length; i += 2) {
            result.push(parseInt(hex.substring(i, i + 2), 16));
        }

        return addSlice(new Uint8Array(result));
    }

    if (isBytes(value)) {
        return addSlice(new Uint8Array(value));
    }

    return logger.throwArgumentError("invalid arrayify value", "value", value);
}

export function hexlify(value: BytesLike | Hexable | number | bigint, options?: DataOptions): string {
    if (!options) { options = { }; }

    if (typeof(value) === "number") {
        if (value < 0 || value >= 0x1fffffffffffff || value % 1) {
            throw new Error("invalid hexlify value");
        }

        let hex = "";
        while (value) {
            hex = HexCharacters[value & 0xf] + hex;
            value = Math.floor(value / 16);
        }

        if (hex.length) {
            if (hex.length % 2) { hex = "0" + hex; }
            return "0x" + hex;
        }

        return "0x00";
    }

    if (typeof(value) === "bigint") {
        value = value.toString(16);
        if ((value as string).length % 2) { return ("0x0" + value); }
        return "0x" + value;
    }

    if (options.allowMissingPrefix && typeof(value) === "string" && (value as string).substring(0, 2) !== "0x") {
        value = "0x" + value;
    }

    if (isHexable(value)) { return (value as any).toHexString(); }

    if (isHexString(value)) {
        if ((<string>value).length % 2) {
            if (options.hexPad === "left") {
                value = "0x0" + (<string>value).substring(2);
            } else if (options.hexPad === "right") {
                value += "0";
            } else {
                throw new Error("hex data is odd-length");
            }
        }
        return (<string>value).toLowerCase();
    }

    if (isBytes(value)) {
        let result = "0x";
        for (let i = 0; i < (value as any).length; i++) {
            const v = (value as any)[i];
            result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
        }
        return result;
    }

    return logger.throwArgumentError("invalid hexlify value", "value", value) as never;
}


export function stripZeros(value: BytesLike): Uint8Array {
    let result: Uint8Array = arrayify(value);

    if (result.length === 0) { return result; }

    // Find the first non-zero entry
    let start = 0;
    while (start < result.length && result[start] === 0) { start++ }

    // If we started with zeros, strip them
    if (start) {
        result = result.slice(start);
    }

    return result;
}

export function zeroPad(value: BytesLike, length: number): Uint8Array {
    value = arrayify(value);

    if (value.length > length) {
        logger.throwArgumentError("value out of range", "value", value);
    }

    const result = new Uint8Array(length);
    result.set(value, length - value.length);
    return addSlice(result);
}

// /**
//  * Determine an array's maximum depth. Returns 0 if the input is not an array.
//  * @param value
//  */
// export function getArrayDepth(value: any): number {
//     return Array.isArray(value) ? 1 + Math.max(0, ...value.map(getArrayDepth)) : 0;
// }

export function hexDataLength(data: BytesLike) {
    if (typeof(data) !== "string") {
        data = hexlify(data);
    } else if (!isHexString(data) || ((data as string).length % 2)) {
        return null;
    }

    return ((data as string).length - 2) / 2;
}

export function hexDataSlice(data: BytesLike, offset: number, endOffset?: number): string {
    if (typeof(data) !== "string") {
        data = hexlify(data);
    } else if (!isHexString(data) || ((data as string).length % 2)) {
        logger.throwArgumentError("invalid hexData", "value", data);
    }

    offset = 2 + 2 * offset;

    if (endOffset != null) {
        return "0x" + (data as string).substring(offset, 2 + 2 * endOffset);
    }

    return "0x" + (data as string).substring(offset);
}

export function hexConcat(items: ReadonlyArray<BytesLike>): string {
    let result = "0x";
    items.forEach((item) => {
        result += hexlify(item).substring(2);
    });
    return result;
}

export function hexValue(value: BytesLike | Hexable | number | bigint): string {
    const trimmed = hexStripZeros(hexlify(value, { hexPad: "left" }));
    if (trimmed === "0x") { return "0x0"; }
    return trimmed;
}

export function hexStripZeros(value: BytesLike): string {
    if (typeof(value) !== "string") { value = hexlify(value); }

    if (!isHexString(value)) {
        logger.throwArgumentError("invalid hex string", "value", value);
    }
    value = (value as string).substring(2);
    let offset = 0;
    while (offset < (value as string).length && (value as string)[offset] === "0") { offset++; }
    return "0x" + (value as string).substring(offset);
}

export function hexZeroPad(value: BytesLike, length: number): string {
    if (typeof(value) !== "string") {
        value = hexlify(value);
    } else if (!isHexString(value)) {
        logger.throwArgumentError("invalid hex string", "value", value);
    }

    if ((value as string).length > 2 * length + 2) {
        logger.throwArgumentError("value out of range", "value", arguments[1]);
    }

    while ((value as string).length < 2 * length + 2) {
        value = "0x0" + (value as string).substring(2);
    }

    return value as string;
}

/**
 * Convert number to Buffer of specified length (big-endian)
 */
export function numberToBytes(num: number, numBytes: number): Buffer {
    const byteArray = Buffer.alloc(numBytes);

    for (let index = 0; index < byteArray.length; index++) {
        const byte = num & 0xff;
        byteArray[index] = byte;
        num = (num - byte) / 256;
    }
    return Buffer.from(byteArray.reverse());
}

/**
 * Convert string representation of big number to Buffer
 * Simplified to use existing utility functions
 */
export function stringToBytes(str: string, numBytes: number): Buffer {
    const bigN = BigNumber.from(str);
    let hex = bigN.toString(16);
    // Ensure even length for hex string
    if (hex.length % 2) hex = "0" + hex;
    const bytes = arrayify("0x" + hex);
    return Buffer.from(zeroPad(bytes, numBytes))
}

export function numberOrStringToBytes(input: number | string | BigNumberish): Buffer {
    if (typeof input === "number") {
        return numberToBytes(input, 32);
    } else if (typeof input === "string") {
        return stringToBytes(input, 32);
    } else {
        // BigNumber
        return stringToBytes(input.toString(), 32);
    }
}

