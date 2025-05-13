// @ts-nocheck

import {
    BigNumber, BigNumberish,
    toTwos, fromTwos, mask,
    MaxUint256, NegativeOne, One, Zero
} from "../../utilities/bignumber.js";
import { Coder, Reader, Writer } from "./abstract-coder.js";


export class NumberCoder extends Coder {
    readonly size: number; // in bytes
    readonly signed: boolean;

    constructor(size: number, signed: boolean, localName: string) {
        const name = (signed ? "int" : "uint") + size * 8;
        super(name, name, localName, false);

        this.size = size;
        this.signed = signed;
    }

    defaultValue(): number {
        return 0;
    }

    encode(writer: Writer, value: BigNumberish): number {
        let v = BigNumber.from(value);

        // Check bounds are safe for encoding
        const maxUintValue = mask(MaxUint256, writer.wordSize * 8);
        if (this.signed) {
            const bounds = mask(maxUintValue, this.size * 8 - 1);
            if (v.isGreaterThan(bounds) || v.isLessThan(bounds.plus(One).multipliedBy(NegativeOne))) {
                this._throwError("value out-of-bounds", value);
            }
        } else if (v.isLessThan(Zero) || v.isGreaterThan(mask(maxUintValue, this.size * 8))) {
            this._throwError("value out-of-bounds", value);
        }

        v = toTwos(value, this.size * 8)
        v = mask(v, mask(this.size * 8));

        if (this.signed) {
            v = toTwos(fromTwos(v, this.size * 8), 8 * writer.wordSize);
        }

        return writer.writeValue(v);
    }

    decode(reader: Reader): any {
        let value = reader.readValue();
        value = mask(value, this.size * 8);

        if (this.signed) {
            value = fromTwos(value, this.size * 8);
        }

        return reader.coerce(this.name, value);
    }
}
