// @ts-nocheck

import { Coder, Reader, Writer } from "./abstract-coder.js";

export class BooleanCoder extends Coder {
    constructor(localName: string) {
        super("bool", "bool", localName, false);
    }

    defaultValue(): boolean {
        return false;
    }

    encode(writer: Writer, value: boolean): number {
        if (typeof value !== "boolean") {
            this._throwError("invalid boolean value", value);
        }
        return writer.writeValue(value ? 1 : 0);
    }

    decode(reader: Reader): any {
        const value = reader.readValue();
        if (value !== 0n && value !== 1n) {
            this._throwError("invalid boolean value", value);
        }
        return reader.coerce(this.type, value === 1n);
    }
}
