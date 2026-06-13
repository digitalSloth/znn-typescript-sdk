import { Address, Hash, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";

export class LiquidityInfo extends Model {
    constructor(
        public administrator: Address,
        public isHalted: boolean,
        public znnReward: bigint,
        public qsrReward: bigint,
        public tokenTuples: Array<TokenTuple>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): LiquidityInfo {
        return new LiquidityInfo(
            Address.parse(json.administrator),
            json.isHalted,
            BigInt(json.znnReward.toString()),
            BigInt(json.qsrReward.toString()),
            json.tokenTuples.map(TokenTuple.fromJson)
        );
    }
}

export class TokenTuple extends Model {
    constructor(
        public tokenStandard: TokenStandard,
        public znnPercentage: number,
        public qsrPercentage: number,
        public minAmount: bigint
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): TokenTuple {
        return new TokenTuple(
            TokenStandard.parse(json.tokenStandard),
            json.znnPercentage,
            json.qsrPercentage,
            BigInt(json.minAmount.toString())
        );
    }
}

export class LiquidityStakeEntry extends Model {
    constructor(
        public amount: bigint,
        public tokenStandard: TokenStandard,
        public weightedAmount: bigint,
        public startTime: number,
        public revokeTime: number,
        public expirationTime: number,
        public stakeAddress: Address,
        public id: Hash
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): LiquidityStakeEntry {
        return new LiquidityStakeEntry(
            BigInt(json.amount.toString()),
            TokenStandard.parse(json.tokenStandard),
            BigInt(json.weightedAmount.toString()),
            json.startTime,
            json.revokeTime,
            json.expirationTime,
            Address.parse(json.stakeAddress),
            Hash.parse(json.id)
        );
    }
}

export class LiquidityStakeList extends Model {
    constructor(
        public totalAmount: bigint,
        public totalWeightedAmount: bigint,
        public count: number,
        public list: Array<LiquidityStakeEntry>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): LiquidityStakeList {
        return new LiquidityStakeList(
            BigInt(json.totalAmount.toString()),
            BigInt(json.totalWeightedAmount.toString()),
            json.count,
            json.list.map(LiquidityStakeEntry.fromJson)
        );
    }
}
