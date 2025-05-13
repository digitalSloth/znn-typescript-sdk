import { BigNumber } from "../../utilities/bignumber.js";
import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";

export class UncollectedReward extends Model {

    constructor(
        public address: Address,
        public znnAmount: BigNumber,
        public qsrAmount: BigNumber
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): UncollectedReward {
        return new UncollectedReward(
            Address.parse(json.address),
            BigNumber.from(json.znnAmount.toString()),
            BigNumber.from(json.qsrAmount.toString()));
    }
}

export class RewardHistoryEntry extends Model {

    constructor(
        public epoch: number,
        public znnAmount: BigNumber,
        public qsrAmount: BigNumber
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): RewardHistoryEntry {
        return new RewardHistoryEntry(
            json.epoch,
            BigNumber.from(json.znnAmount.toString()),
            BigNumber.from(json.qsrAmount.toString())
        );
    }
}

export class RewardHistoryList extends Model {

    constructor(
        public count: number,
        public list: Array<RewardHistoryEntry>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): RewardHistoryList {
        return new RewardHistoryList(
            json.count,
            json.list.map(RewardHistoryEntry.fromJson)
        );
    }
}

export class VoteBreakdown extends Model {

    constructor(
        public id: Hash,
        public yes: number,
        public no: number,
        public total: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): VoteBreakdown {
        return new VoteBreakdown(
            Hash.parse(json.id),
            json.yes,
            json.no,
            json.total,
        );
    }
}

export class PillarVote extends Model {

    constructor(
        public id: Hash,
        public name: string,
        public vote: number,
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): PillarVote {
        return new PillarVote(
            Hash.parse(json.id),
            json.name,
            json.vote,
        );
    }
}

export class SecurityInfo extends Model {

    constructor(
        public guardians: Array<Address>,
        public guardiansVotes: Array<Address>,
        public administratorDelay: number,
        public softDelay: number,
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SecurityInfo {
        return new SecurityInfo(
            json.guardians.map((guardian: string) => Address.parse(guardian)),
            json.guardiansVotes.map((guardiansVote:  string) => Address.parse(guardiansVote)),
            json.administratorDelay,
            json.softDelay,
        );
    }
}

export class RewardDeposit extends Model {

    constructor(
        public address: Address,
        public znnAmount: BigNumber,
        public qsrAmount: BigNumber,
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): RewardDeposit {
        return new RewardDeposit(
            Address.parse(json.address),
            BigNumber.from(json.znnAmount),
            BigNumber.from(json.qsrAmount),
        );
    }
}

export class TimeChallengeInfo extends Model {

    constructor(
        public methodName: string,
        public paramsHash: Hash,
        public challengeStartHeight: number,
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): TimeChallengeInfo {
        return new TimeChallengeInfo(
            json.methodName,
            Hash.parse(json.paramsHash),
            json.challengeStartHeight,
        );
    }
}
