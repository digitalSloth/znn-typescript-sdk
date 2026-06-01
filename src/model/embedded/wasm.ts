import { BigNumber } from "../../utilities/bignumber.js";
import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";

export class WasmContractResponse extends Model {

    constructor(
        public address: Address,
        public deployer: Address,
        public version: number,
        public upgradeable: boolean,
        public activated: boolean,
        public bytecodeHash: Hash,
        public bytecodeCost: BigNumber,
        public halted: boolean,
        public administrator: Address
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): WasmContractResponse {
        return new WasmContractResponse(
            Address.parse(json.address),
            Address.parse(json.deployer),
            json.version,
            json.upgradeable,
            json.activated ?? false,
            Hash.parse(json.bytecodeHash),
            BigNumber.from((json.bytecodeCost ?? json.bytecodeDeposit ?? 0).toString()),
            json.halted,
            Address.parse(json.administrator)
        );
    }
}

export class WasmHaltStatusResponse extends Model {

    constructor(
        public halted: boolean,
        public administrator: Address
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): WasmHaltStatusResponse {
        return new WasmHaltStatusResponse(
            json.halted,
            Address.parse(json.administrator)
        );
    }
}

export class WasmEventResponse extends Model {

    constructor(
        public contractAddress: Address,
        public topic: Hash,
        public indexed: boolean,
        public data: Buffer,
        public blockHash: Hash,
        public blockHeight: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): WasmEventResponse {
        return new WasmEventResponse(
            Address.parse(json.contractAddress),
            Hash.parse(json.topic),
            json.indexed,
            Buffer.from(json.data, "base64"),
            Hash.parse(json.blockHash),
            json.blockHeight
        );
    }
}

export class WasmEventList extends Model {

    constructor(
        public count: number,
        public list: Array<WasmEventResponse>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): WasmEventList {
        return new WasmEventList(
            json.count,
            json.list.map(WasmEventResponse.fromJson)
        );
    }
}

export class WasmStatsResponse extends Model {

    constructor(
        public pendingReceiveBacklog: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): WasmStatsResponse {
        return new WasmStatsResponse(
            json.pendingReceiveBacklog
        );
    }
}
