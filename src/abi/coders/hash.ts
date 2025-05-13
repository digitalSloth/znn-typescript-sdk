// @ts-nocheck

import { arrayify, BytesLike, hexlify } from "../../utilities/bytes.js";
import { Coder, Reader, Writer } from "./abstract-coder.js";
import { Hash} from "../../model/primitives/hash.js";

export class HashCoder extends Coder {
    size: number;

    constructor(localName: string) {
        super("hash", "hash", localName, false);
        this.size = 32;
    }

    defaultValue(): string {
        return "0x0000000000000000000000000000000000000000000000000000000000000000";
    }

    encode(writer: Writer, value: BytesLike): number {
        const data = arrayify(value);
        if (data.length !== this.size) {
            this._throwError("incorrect data length", value);
        }
        return writer.writeValue(data);
    }

    decode(reader: Reader): any {
        return reader.coerce(this.name, hexlify(reader.readBytes(this.size)));
    }
}
