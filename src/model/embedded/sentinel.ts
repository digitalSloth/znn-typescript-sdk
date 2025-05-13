import { Address } from "../primitives/index.js";
import { Model } from "../base.js";

export class SentinelInfo extends Model {

    constructor(
        public owner: Address,
        public registrationTimestamp: number,
        public isRevocable: boolean,
        public revokeCooldown: number,
        public active: boolean
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SentinelInfo {
        return new SentinelInfo(
            Address.parse(json.owner),
            json.registrationTimestamp,
            json.isRevocable,
            json.revokeCooldown,
            json.active,
        );
    }
}

export class SentinelInfoList extends Model {

    constructor(
        public count: number,
        public list: Array<SentinelInfo>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SentinelInfoList {
        return new SentinelInfoList(
            json.count,
            json.list.map(SentinelInfo.fromJson)
        );
    }
}
