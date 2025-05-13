import { BigNumber } from "../../utilities/bignumber.js";
import { Hash } from "../primitives/index.js";
import { Model } from "../base.js";

export class SwapAssetEntry extends Model {
    constructor(
        public keyIdHash: Hash,
        public qsr: BigNumber,
        public znn: BigNumber
    ) {
        super()
    }

    static fromJson(keyIdHash: Hash, json: {[key: string]: any}): SwapAssetEntry {
        return new SwapAssetEntry(
            keyIdHash,
            BigNumber.from(json.qsr.toString()),
            BigNumber.from(json.znn.toString())
        );
    }
}

export class SwapAssetList extends Model {
    constructor(
        public list: {[key: string]: SwapAssetEntry} = {}
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SwapAssetList {
        const list: {[key: string]: SwapAssetEntry} = {};
        for (const [key, value] of Object.entries(json)) {
            list[key] = SwapAssetEntry.fromJson(Hash.parse(key), value as {[key: string]: any});
        }
        return new SwapAssetList(list);
    }

    toJson(): {[key: string]: any} {
        const result: {[key: string]: any} = {};
        for (const [key, value] of Object.entries(this.list)) {
            result[key] = value.toJson();
        }
        return result;
    }
}

export class SwapLegacyPillarEntry extends Model {
    constructor(
        public numPillars: number,
        public keyIdHash: Hash,
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SwapLegacyPillarEntry {
        return new SwapLegacyPillarEntry(
            json.numPillars,
            Hash.parse(json.keyIdHash),
        );
    }
}

export class SwapLegacyPillarList extends Model {
    constructor(
        public list: Array<SwapLegacyPillarEntry> = []
    ) {
        super()
    }

    static fromJson(json: Array<{[key: string]: any}>): SwapLegacyPillarList {
        return new SwapLegacyPillarList(
            json.map((entry) => SwapLegacyPillarEntry.fromJson(entry))
        );
    }
}
