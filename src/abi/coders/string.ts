// @ts-nocheck

import { toUtf8Bytes, toUtf8String } from "../../utilities/utf8.js";
import { Reader, Writer } from "./abstract-coder.js";
import { DynamicBytesCoder } from "./bytes.js";


export class StringCoder extends DynamicBytesCoder {
    constructor(localName: string) {
        super("string", localName);
    }

    defaultValue(): string {
        return "";
    }

    encode(writer: Writer, value: any): number {
        return super.encode(writer, toUtf8Bytes(value));
    }

    decode(reader: Reader): any {
        return toUtf8String(super.decode(reader));
    }
}
