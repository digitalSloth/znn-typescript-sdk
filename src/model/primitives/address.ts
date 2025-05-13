import { Buffer } from "buffer";
import { bech32 } from "bech32";
import { Crypto } from "../../crypto/crypto.js";

/**
 * Represents an address for a system utilizing the bech32 encoding.
 */
export class Address {

    static prefix: string = "z";
    static userByte: number = 0;
    static coreSize: number = 20;

    constructor(
        public hrp: string,
        public core: Buffer
    ) {}

    public static parse(address: string): Address {
        let prefix: string;
        let words: number[];

        try {
            const decoded = bech32.decode(address);
            prefix = decoded.prefix;
            words = decoded.words;
        } catch (error) {
            throw new Error(`invalid bech32 encoding for address: ${address}`);
        }

        const extractedCore = Buffer.from(bech32.fromWords(words));

        if (prefix !== this.prefix) {
            throw Error(`invalid prefix ${prefix}; should be '${this.prefix}'`);
        }

        if (extractedCore.length !== this.coreSize) {
            throw Error(`invalid length ${extractedCore.length}; should be '${this.coreSize}'`);
        }

        return new Address(prefix, extractedCore)
    }

    public static fromPublicKey(publicKey: Buffer): Address {
        const digest = Crypto.digest(publicKey).subarray(0, 19);
        return new Address(this.prefix, Buffer.concat([Buffer.from([this.userByte]), Buffer.from(digest)]));
    }

    public static fromCore(address: | Buffer | Uint8Array): Address {
        const coreBuf = Buffer.isBuffer(address) ? address : Buffer.from(address);
        if (coreBuf.length !== this.coreSize) {
            throw new Error(`invalid length ${coreBuf.length}; should be '${this.coreSize}'`);
        }
        return new Address(this.prefix, Buffer.from(coreBuf));
    }

    public static isAddress(value: any): boolean {
        return (value.constructor.name === "Address")
    }

    public getBytes(): Buffer {
        return this.core;
    }

    public toString(): string {
        if (typeof(this.core) === typeof("string")){
            return this.core.toString();
        } else {
            return bech32.encode(this.hrp, bech32.toWords(Buffer.from(this.core)));
        }
    }
}


const EMPTY_ADDRESS = Address.parse("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
const PLASMA_ADDRESS = Address.parse("z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp");
const PILLAR_ADDRESS = Address.parse("z1qxemdeddedxpyllarxxxxxxxxxxxxxxxsy3fmg");
const TOKEN_ADDRESS = Address.parse("z1qxemdeddedxt0kenxxxxxxxxxxxxxxxxh9amk0");
const SENTINEL_ADDRESS = Address.parse("z1qxemdeddedxsentynelxxxxxxxxxxxxxwy0r2r");
const SWAP_ADDRESS = Address.parse("z1qxemdeddedxswapxxxxxxxxxxxxxxxxxxl4yww");
const STAKE_ADDRESS = Address.parse("z1qxemdeddedxstakexxxxxxxxxxxxxxxxjv8v62");
const LIQUIDITY_ADDRESS = Address.parse("z1qxemdeddedxlyquydytyxxxxxxxxxxxxflaaae");
const SPORK_ADDRESS = Address.parse("z1qxemdeddedxsp0rkxxxxxxxxxxxxxxxx956u48");
const ACCELERATOR_ADDRESS = Address.parse("z1qxemdeddedxaccelerat0rxxxxxxxxxxp4tk22");
const BRIDGE_ADDRESS = Address.parse("z1qxemdeddedxdrydgexxxxxxxxxxxxxxxmqgr0d");
const HTLC_ADDRESS = Address.parse("z1qxemdeddedxhtlcxxxxxxxxxxxxxxxxxygecvw");

export {
    EMPTY_ADDRESS,
    PLASMA_ADDRESS,
    PILLAR_ADDRESS,
    TOKEN_ADDRESS,
    SENTINEL_ADDRESS,
    SWAP_ADDRESS,
    STAKE_ADDRESS,
    LIQUIDITY_ADDRESS,
    SPORK_ADDRESS,
    ACCELERATOR_ADDRESS,
    BRIDGE_ADDRESS,
    HTLC_ADDRESS,
}

