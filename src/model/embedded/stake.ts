import { BigNumber } from "../../utilities/bignumber.js";
import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";

export class StakeEntry extends Model {

    constructor(
        public amount: BigNumber,
        public weightedAmount: BigNumber,
        public startTimestamp: number,
        public expirationTimestamp: number,
        public address: Address,
        public id: Hash
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): StakeEntry {
        return new StakeEntry(
            BigNumber.from(json.amount.toString()),
            BigNumber.from(json.weightedAmount.toString()),
            json.startTimestamp,
            json.expirationTimestamp,
            Address.parse(json.address),
            Hash.parse(json.id)
        );
    }
}

export class StakeList extends Model {

    constructor(
        public totalAmount: number,
        public totalWeightedAmount: number,
        public count: number,
        public list: Array<StakeEntry>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): StakeList {
        return new StakeList(
            json.totalAmount,
            json.totalWeightedAmount,
            json.count,
            json.list.map(StakeEntry.fromJson)
        );
    }
}
