import { Buffer } from "buffer";
import { bech32 } from "bech32";

export class TokenStandard {

    static prefix: string = "zts";
    static coreSize: number = 10;

    constructor(public core: Buffer) {}

    public static parse(zts: string): TokenStandard {

        let prefix: string;
        let words: number[];

        try {
            const decoded = bech32.decode(zts);
            prefix = decoded.prefix;
            words = decoded.words;
        } catch (error) {
            throw new Error(`invalid bech32 encoding for zts: ${zts}`);
        }

        const extractedCore = Buffer.from(bech32.fromWords(words));

        if (prefix !== this.prefix) {
            throw Error(`invalid prefix ${prefix}; should be '${this.prefix}'`);
        }

        if (extractedCore.length !== this.coreSize) {
            throw Error(`invalid length ${extractedCore.length}; should be '${this.coreSize}'`);
        }

        return new TokenStandard(extractedCore)
    }

    public static fromCore(zts: | Buffer | Uint8Array): TokenStandard {
        const coreBuf = Buffer.isBuffer(zts) ? zts : Buffer.from(zts);
        if (coreBuf.length !== this.coreSize) {
            throw new Error(`invalid length ${coreBuf.length}; should be '${this.coreSize}'`);
        }
        return new TokenStandard(Buffer.from(coreBuf));
    }

    public static isTokenStandard(value: any): boolean {
        return (value.constructor.name === "TokenStandard")
    }

    public getBytes(): Buffer {
        return this.core;
    }

    public toString(): string {
        if (typeof(this.core) === typeof("string")){
            return this.core.toString();
        } else {
            return bech32.encode("zts", bech32.toWords(this.core));
        }
    }
}

const ZNN_ZTS = TokenStandard.parse("zts1znnxxxxxxxxxxxxx9z4ulx");
const QSR_ZTS = TokenStandard.parse("zts1qsrxxxxxxxxxxxxxmrhjll");
const EMPTY_ZTS = TokenStandard.parse("zts1qqqqqqqqqqqqqqqqtq587y");

export {
    ZNN_ZTS,
    QSR_ZTS,
    EMPTY_ZTS
}

