import { Buffer } from "buffer";
import { Address, Hash, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
import { BigNumber } from "../../utilities/bignumber.js";

export class HtlcInfo extends Model {
    constructor(
        public id: Hash,
        public timeLocked: Address,
        public hashLocked: Address,
        public tokenStandard: TokenStandard,
        public amount: BigNumber,
        public expirationTime: number,
        public hashType: number,
        public keyMaxSize: number,
        public hashLock: Uint8Array
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): HtlcInfo {
        return new HtlcInfo(
            Hash.parse(json.id),
            Address.parse(json.timeLocked),
            Address.parse(json.hashLocked),
            TokenStandard.parse(json.tokenStandard),
            BigNumber.from(json.amount.toString()),
            json.expirationTime,
            json.hashType,
            json.keyMaxSize,
            Buffer.from(json.hashLock, "base64")
        );
    }
}

