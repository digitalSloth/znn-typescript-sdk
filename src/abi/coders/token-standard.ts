// @ts-nocheck
import { Buffer } from "buffer";
import { BytesLike, hexlify } from "../../utilities/bytes.js";
import { TokenStandard } from "../../model/primitives/tokenStandard.js";
import { Coder, Reader, Writer } from "./abstract-coder.js";

export class TokenStandardCoder extends Coder {
    size: number;

    constructor(localName: string) {
        super("tokenStandard", "tokenStandard", localName, false);
        this.size = 10;
    }

    defaultValue(): string {
        return "0x00000000000000000000";
    }

    encode(writer: Writer, value: BytesLike): number {
        try {
            const tokenStandard = TokenStandard.parse(value);
            return writer.writeValue(hexlify(tokenStandard.getBytes()));
        } catch (error) {
            this._throwError(error.message, value);
        }
    }

    decode(reader: Reader): any {
        const core = reader.readBytes(32).slice(32 - this.size);
        try {
            const tokenStandard = TokenStandard.fromCore(Buffer.from(core));
            return tokenStandard.toString();
        } catch (error) {
            this._throwError((error as Error).message, core);
        }
    }
}
