import { Buffer } from "buffer";
import { BigNumber } from "../../utilities/bignumber.js";
import { BlockTypeEnum } from "../nom/accountBlock.js";
import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";

export class PlasmaInfo extends Model {
    constructor(
        public currentPlasma: number,
        public maxPlasma: number,
        public qsrAmount: BigNumber
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): PlasmaInfo {
        return new PlasmaInfo(
            json.currentPlasma,
            json.maxPlasma,
            BigNumber.from(json.qsrAmount.toString())
        );
    }
}

export class FusionEntryList extends Model {

    constructor(
        public qsrAmount: BigNumber = BigNumber.from(0),
        public count: number = 0,
        public list: Array<FusionEntry> = []
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): FusionEntryList {
        return new FusionEntryList(
            BigNumber.from(json.qsrAmount.toString()),
            json.count,
            json.list.map(FusionEntry.fromJson)
        );
    }
}

export class FusionEntry extends Model {
    constructor(
        public qsrAmount: BigNumber,
        public beneficiary: Address,
        public expirationHeight: number,
        public id: Hash,
        public isRevocable: boolean
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): FusionEntry {
        return new FusionEntry(
            BigNumber.from(json.qsrAmount.toString()),
            Address.parse(json.beneficiary),
            json.expirationHeight,
            Hash.parse(json.id),
            json.isRevocable
        );
    }
}

export class GetRequiredPowParam extends Model {

    constructor(
        public address: Address,
        public blockType: number,
        public toAddress: Address|undefined = undefined,
        public data: Buffer|undefined = undefined
    ) {
        super()

        if (blockType == BlockTypeEnum.UserReceive) {
            this.toAddress = address;
        } else {
            this.toAddress = toAddress;
        }
    }

    static fromJson(json: {[key: string]: any}): GetRequiredPowParam {
        return new GetRequiredPowParam(
            Address.parse(json.address),
            json.blockType,
            json.toAddress !== undefined ? Address.parse(json.toAddress) : undefined,
            json.data !== undefined ? Buffer.from(json.data, "hex") : undefined
        );
    }
}

export class GetRequiredPowResponse extends Model {

    constructor(
        public availablePlasma: number,
        public basePlasma: number,
        public requiredDifficulty: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): GetRequiredPowResponse {
        return new GetRequiredPowResponse(
            json.availablePlasma,
            json.basePlasma,
            json.requiredDifficulty
        );
    }
}

