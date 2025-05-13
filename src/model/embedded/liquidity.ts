import { Address, Hash, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
import { BigNumber } from "../../utilities/bignumber.js";

export class LiquidityInfo extends Model {
    constructor(
        public administrator: Address,
        public isHalted: boolean,
        public znnReward: BigNumber,
        public qsrReward: BigNumber,
        public tokenTuples: Array<TokenTuple>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): LiquidityInfo {
        return new LiquidityInfo(
            Address.parse(json.administrator),
            json.isHalted,
            BigNumber.from(json.znnReward.toString()),
            BigNumber.from(json.qsrReward.toString()),
            json.tokenTuples.map(TokenTuple.fromJson)
        );
    }
}

export class TokenTuple extends Model {
    constructor(
        public tokenStandard: TokenStandard,
        public znnPercentage: number,
        public qsrPercentage: number,
        public minAmount: BigNumber
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): TokenTuple {
        return new TokenTuple(
            TokenStandard.parse(json.tokenStandard),
            json.znnPercentage,
            json.qsrPercentage,
            BigNumber.from(json.minAmount.toString())
        );
    }
}

export class LiquidityStakeEntry extends Model {
    constructor(
        public amount: BigNumber,
        public tokenStandard: TokenStandard,
        public weightedAmount: BigNumber,
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
            BigNumber.from(json.amount.toString()),
            TokenStandard.parse(json.tokenStandard),
            BigNumber.from(json.weightedAmount.toString()),
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
        public totalAmount: BigNumber,
        public totalWeightedAmount: BigNumber,
        public count: number,
        public list: Array<LiquidityStakeEntry>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): LiquidityStakeList {
        return new LiquidityStakeList(
            BigNumber.from(json.totalAmount.toString()),
            BigNumber.from(json.totalWeightedAmount.toString()),
            json.count,
            json.list.map(LiquidityStakeEntry.fromJson)
        );
    }
}
