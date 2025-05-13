import { Address } from "../primitives/index.js";
import { Model } from "../base.js";
import { BigNumber } from "../../utilities/bignumber.js";

export class PillarInfo extends Model {
    static unknownType: number = 0;
    static legacyPillarType: number = 1;
    static regularPillarType: number = 1;

    constructor(
        public name: string,
        public rank: number,
        public type: number,
        public ownerAddress: Address,
        public producerAddress: Address,
        public withdrawAddress: Address,
        public giveMomentumRewardPercentage: number,
        public giveDelegateRewardPercentage: number,
        public isRevocable: boolean,
        public revokeCooldown: number,
        public revokeTimestamp: number,
        public currentStats: PillarEpochStats,
        public weight: BigNumber
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): PillarInfo {
        return new PillarInfo(
            json.name,
            json.rank,
            json.type ?? PillarInfo.unknownType,
            Address.parse(json.ownerAddress),
            Address.parse(json.producerAddress),
            Address.parse(json.withdrawAddress),
            json.giveMomentumRewardPercentage,
            json.giveDelegateRewardPercentage,
            json.isRevocable,
            json.revokeCooldown,
            json.revokeTimestamp,
            PillarEpochStats.fromJson(json.currentStats),
            BigNumber.from(json.weight.toString())
        );
    }
}

export class PillarInfoList extends Model {

    constructor(
        public count: number,
        public list: Array<PillarInfo>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): PillarInfoList {
        return new PillarInfoList(
            json.count,
            json.list.map(PillarInfo.fromJson)
        );
    }
}

export class PillarEpochStats extends Model {

    constructor(
        public producedMomentums: number,
        public expectedMomentums: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): PillarEpochStats {
        return new PillarEpochStats(
            json.producedMomentums,
            json.expectedMomentums
        );
    }
}

export class PillarEpochHistory extends Model {

    constructor(
        public name: string,
        public epoch: number,
        public giveBlockRewardPercentage: number,
        public giveDelegateRewardPercentage: number,
        public producedBlockNum: number,
        public expectedBlockNum: number,
        public weight: BigNumber
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): PillarEpochHistory {
        return new PillarEpochHistory(
            json.name,
            json.epoch,
            json.giveBlockRewardPercentage,
            json.giveDelegateRewardPercentage,
            json.producedBlockNum,
            json.expectedBlockNum,
            BigNumber.from(json.weight.toString())
        );
    }
}

export class PillarEpochHistoryList extends Model {

    constructor(
        public count: number,
        public list: Array<PillarEpochHistory>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): PillarEpochHistoryList {
        return new PillarEpochHistoryList(
            json.count,
            json.list.map(PillarEpochHistory.fromJson)
        );
    }
}

export class DelegationInfo extends Model {

    constructor(
        public name: string,
        public status: number,
        public weight: BigNumber
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): DelegationInfo {
        return new DelegationInfo(
            json.name,
            json.status,
            BigNumber.from(json.weight.toString())
        );
    }

    isPillarActive(): boolean {
        return this.status == 1;
    }
}
