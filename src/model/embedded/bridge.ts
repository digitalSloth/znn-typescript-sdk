import { Address, Hash, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { TimeChallengeInfo } from "./common.js";

export class BridgeInfo extends Model {
    constructor(
        public administrator: Address,
        public compressedTssECDSAPubKey: string,
        public decompressedTssECDSAPubKey: string,
        public allowKeyGen: boolean,
        public halted: boolean,
        public unhaltedAt: number,
        public unhaltDurationInMomentums: number,
        public tssNonce: number,
        public metadata: string
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): BridgeInfo {
        return new BridgeInfo(
            Address.parse(json.administrator),
            json.compressedTssECDSAPubKey,
            json.decompressedTssECDSAPubKey,
            json.allowKeyGen,
            json.halted,
            json.unhaltedAt,
            json.unhaltDurationInMomentums,
            json.tssNonce,
            json.metadata
        );
    }
}

export class OrchestratorInfo extends Model {
    constructor(
        public windowSize: number,
        public keyGenThreshold: number,
        public confirmationsToFinality: number,
        public estimatedMomentumTime: number,
        public allowKeyGenHeight: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): OrchestratorInfo {
        return new OrchestratorInfo(
            json.windowSize,
            json.keyGenThreshold,
            json.confirmationsToFinality,
            json.estimatedMomentumTime,
            json.allowKeyGenHeight
        );
    }
}

export class TokenPair extends Model {
    constructor(
        public tokenStandard: TokenStandard,
        public tokenAddress: string,
        public bridgeable: boolean,
        public redeemable: boolean,
        public owned: boolean,
        public minAmount: BigNumber,
        public feePercentage: number,
        public redeemDelay: number,
        public metadata: string
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): TokenPair {
        return new TokenPair(
            TokenStandard.parse(json.tokenStandard),
            json.tokenAddress,
            json.bridgeable,
            json.redeemable,
            json.owned,
            BigNumber.from(json.minAmount.toString()),
            json.feePercentage,
            json.redeemDelay,
            json.metadata
        );
    }
}

export class BridgeNetworkInfo extends Model {
    constructor(
        public networkClass: number,
        public chainId: number,
        public name: string,
        public contractAddress: string,
        public metadata: string,
        public tokenPairs: Array<TokenPair>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): BridgeNetworkInfo {
        return new BridgeNetworkInfo(
            json.networkClass,
            json.chainId,
            json.name,
            json.contractAddress,
            json.metadata,
            json.tokenPairs != null ? json.tokenPairs.map(TokenPair.fromJson) : []
        );
    }
}

export class BridgeNetworkInfoList extends Model {
    constructor(
        public count: number,
        public list: Array<BridgeNetworkInfo>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): BridgeNetworkInfoList {
        return new BridgeNetworkInfoList(
            json.count,
            json.list.map(BridgeNetworkInfo.fromJson)
        );
    }
}

export class WrapTokenRequest extends Model {
    constructor(
        public networkClass: number,
        public chainId: number,
        public id: Hash,
        public toAddress: string,
        public tokenStandard: TokenStandard,
        public tokenAddress: string,
        public amount: BigNumber,
        public fee: BigNumber,
        public signature: string,
        public creationMomentumHeight: number,
        public confirmationsToFinality: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): WrapTokenRequest {
        return new WrapTokenRequest(
            json.networkClass,
            json.chainId,
            Hash.parse(json.id),
            json.toAddress,
            TokenStandard.parse(json.tokenStandard),
            json.tokenAddress,
            BigNumber.from(json.amount.toString()),
            BigNumber.from(json.fee.toString()),
            json.signature,
            json.creationMomentumHeight,
            json.confirmationsToFinality,
        );
    }
}

export class WrapTokenRequestList extends Model {
    constructor(
        public count: number,
        public list: Array<WrapTokenRequest>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): WrapTokenRequestList {
        return new WrapTokenRequestList(
            json.count,
            json.list != null ? json.list.map(WrapTokenRequest.fromJson) : []
        );
    }
}

export class UnwrapTokenRequest extends Model {
    constructor(
        public registrationMomentumHeight: number,
        public networkClass: number,
        public chainId: number,
        public transactionHash: Hash,
        public logIndex: number,
        public toAddress: Address,
        public tokenAddress: string,
        public tokenStandard: TokenStandard,
        public amount: BigNumber,
        public signature: string,
        public redeemed: number,
        public revoked: number,
        public redeemableIn: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): UnwrapTokenRequest {
        return new UnwrapTokenRequest(
            json.registrationMomentumHeight,
            json.networkClass,
            json.chainId,
            Hash.parse(json.transactionHash),
            json.logIndex,
            Address.parse(json.toAddress),
            json.tokenAddress,
            TokenStandard.parse(json.tokenStandard),
            BigNumber.from(json.amount.toString()),
            json.signature,
            json.redeemed,
            json.revoked,
            json.redeemableIn,
        );
    }
}

export class UnwrapTokenRequestList extends Model {
    constructor(
        public count: number,
        public list: Array<UnwrapTokenRequest>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): UnwrapTokenRequestList {
        return new UnwrapTokenRequestList(
            json.count,
            json.list != null ? json.list.map(UnwrapTokenRequest.fromJson) : []
        );
    }
}

export class ZtsFeesInfo extends Model {
    constructor(
        public tokenStandard: TokenStandard,
        public accumulatedFee: BigNumber
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): ZtsFeesInfo {
        return new ZtsFeesInfo(
            TokenStandard.parse(json.tokenStandard),
            BigNumber.from(json.accumulatedFee.toString())
        );
    }
}

export class TimeChallengesList extends Model {
    constructor(
        public count: number,
        public list: Array<TimeChallengeInfo>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): TimeChallengesList {
        return new TimeChallengesList(
            json.count,
            json.list.map(TimeChallengeInfo.fromJson)
        );
    }
}
