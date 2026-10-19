import { Buffer } from "buffer";
import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";

// u32 and u64 counters, ids and heights are `number`; token amounts are `bigint`.
// Byte fields arrive base64-encoded, and a null byte field decodes as empty.
const bytes = (value: string | null | undefined): Buffer => Buffer.from(value ?? "", "base64");

export class SettlementPauseState extends Model {
    constructor(
        public submitPaused: boolean,
        public relayPaused: boolean
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementPauseState {
        return new SettlementPauseState(json.submitPaused, json.relayPaused);
    }
}

export class SettlementDomainPauseState extends Model {
    constructor(
        public domainId: number,
        public submitPaused: boolean,
        public relayPaused: boolean
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementDomainPauseState {
        return new SettlementDomainPauseState(json.domainId, json.submitPaused, json.relayPaused);
    }
}

export class SettlementInputCursor extends Model {
    constructor(
        public consumedInputCount: number,
        public nextBatchId: number,
        public recordsSweptThrough: number,
        public sweptInputCount: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementInputCursor {
        return new SettlementInputCursor(
            json.consumedInputCount,
            json.nextBatchId,
            json.recordsSweptThrough,
            json.sweptInputCount
        );
    }
}

export class SettlementEscapeHatch extends Model {
    constructor(public triggeredAtHeight: number) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementEscapeHatch {
        return new SettlementEscapeHatch(json.triggeredAtHeight);
    }
}

export class SettlementDomainInfo extends Model {
    constructor(
        public domainId: number,
        public domainClass: number,
        public runtimeKind: number,
        public stfSpecHash: Hash,
        public inputSource: number,
        public execProfile: number,
        public foreignProfile: number,
        public profileConfig: Buffer,
        public chainBinding: Buffer,
        public minExecutors: number,
        public proposerPolicy: number,
        public finalityModel: number,
        public status: number,
        public withdrawalDelay: number,
        public runtimeUpgradeDelay: number,
        public approvedDAModes: Array<number>,
        public pauseState: SettlementPauseState | null,
        public inputCursor: SettlementInputCursor | null,
        public receivedInputCount: number,
        public escapeHatch: SettlementEscapeHatch | null
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementDomainInfo {
        return new SettlementDomainInfo(
            json.domainId,
            json.domainClass,
            json.runtimeKind,
            Hash.parse(json.stfSpecHash),
            json.inputSource,
            json.execProfile,
            json.foreignProfile,
            bytes(json.profileConfig),
            bytes(json.chainBinding),
            json.minExecutors,
            json.proposerPolicy,
            json.finalityModel,
            json.status,
            json.withdrawalDelay,
            json.runtimeUpgradeDelay,
            json.approvedDAModes ?? [],
            json.pauseState ? SettlementPauseState.fromJson(json.pauseState) : null,
            json.inputCursor ? SettlementInputCursor.fromJson(json.inputCursor) : null,
            json.receivedInputCount,
            json.escapeHatch ? SettlementEscapeHatch.fromJson(json.escapeHatch) : null
        );
    }
}

export class SettlementDomainInfoList extends Model {
    constructor(
        public count: number,
        public list: Array<SettlementDomainInfo>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementDomainInfoList {
        return new SettlementDomainInfoList(
            json.count,
            (json.list ?? []).map(SettlementDomainInfo.fromJson)
        );
    }
}

export class SettlementBatch extends Model {
    constructor(
        public domainId: number,
        public batchId: number,
        public protocolVersion: number,
        public firstInputSeq: number,
        public lastInputSeq: number,
        public preStateRoot: Hash,
        public postStateRoot: Hash,
        public inputRoot: Hash,
        public receiptRoot: Hash,
        public eventRoot: Hash,
        public outboxRoot: Hash,
        public daHash: Hash,
        public daMode: number,
        public executorPillar: string,
        public submittedAtHeight: number,
        public finalizeAtHeight: number,
        public assetFlowSummary: Buffer,
        public proofData: Buffer,
        public state: number,
        // Evaluated at the frontier; the stored `state` is not the authority on finality.
        public isFinalized: boolean
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementBatch {
        return new SettlementBatch(
            json.domainId,
            json.batchId,
            json.protocolVersion,
            json.firstInputSeq,
            json.lastInputSeq,
            Hash.parse(json.preStateRoot),
            Hash.parse(json.postStateRoot),
            Hash.parse(json.inputRoot),
            Hash.parse(json.receiptRoot),
            Hash.parse(json.eventRoot),
            Hash.parse(json.outboxRoot),
            Hash.parse(json.daHash),
            json.daMode,
            json.executorPillar,
            json.submittedAtHeight,
            json.finalizeAtHeight,
            bytes(json.assetFlowSummary),
            bytes(json.proofData),
            json.state,
            json.isFinalized
        );
    }
}

export class SettlementBatchList extends Model {
    constructor(
        public count: number,
        public list: Array<SettlementBatch>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementBatchList {
        return new SettlementBatchList(
            json.count,
            (json.list ?? []).map(SettlementBatch.fromJson)
        );
    }
}

export class SettlementDeployRecord extends Model {
    constructor(
        public domainId: number,
        public deployer: Address,
        public codeHash: Hash,
        public metadataHash: Hash,
        public totalSize: number,
        public chunkCount: number,
        public startHeight: number,
        public receivedCount: number,
        public expiresAtHeight: number,
        // An expired record not yet swept is still returned with isExpired = true.
        public isExpired: boolean
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementDeployRecord {
        return new SettlementDeployRecord(
            json.domainId,
            Address.parse(json.deployer),
            Hash.parse(json.codeHash),
            Hash.parse(json.metadataHash),
            json.totalSize,
            json.chunkCount,
            json.startHeight,
            json.receivedCount,
            json.expiresAtHeight,
            json.isExpired
        );
    }
}

export class SettlementDeployRecordList extends Model {
    constructor(
        public count: number,
        public list: Array<SettlementDeployRecord>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementDeployRecordList {
        return new SettlementDeployRecordList(
            json.count,
            (json.list ?? []).map(SettlementDeployRecord.fromJson)
        );
    }
}

export class SettlementPauseInfo extends Model {
    constructor(
        public global: SettlementPauseState | null,
        public domains: Array<SettlementDomainPauseState>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementPauseInfo {
        return new SettlementPauseInfo(
            json.global ? SettlementPauseState.fromJson(json.global) : null,
            (json.domains ?? []).map(SettlementDomainPauseState.fromJson)
        );
    }
}

export class SettlementPeripheryConfig extends Model {
    constructor(
        public znnPerByteOfBytecode: bigint,
        public znnPerByteOfState: bigint
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementPeripheryConfig {
        return new SettlementPeripheryConfig(
            BigInt(json.znnPerByteOfBytecode),
            BigInt(json.znnPerByteOfState)
        );
    }
}

export class SettlementExecutor extends Model {
    constructor(
        public pillarName: string,
        public executorAddress: Address,
        public registrationHeight: number,
        public status: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementExecutor {
        return new SettlementExecutor(
            json.pillarName,
            Address.parse(json.executorAddress),
            json.registrationHeight,
            json.status
        );
    }
}

export class SettlementExecutorList extends Model {
    constructor(
        public count: number,
        public list: Array<SettlementExecutor>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementExecutorList {
        return new SettlementExecutorList(
            json.count,
            (json.list ?? []).map(SettlementExecutor.fromJson)
        );
    }
}

export class SettlementFeeEpoch extends Model {
    constructor(
        public epoch: number,
        public finalityHeight: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementFeeEpoch {
        return new SettlementFeeEpoch(json.epoch, json.finalityHeight);
    }
}

export class SettlementFeeInfo extends Model {
    constructor(
        public totalFeesCollected: bigint,
        public totalFeesBurned: bigint,
        public totalFeesCredited: bigint,
        public totalRewardsCollected: bigint,
        public pendingEpochHead: SettlementFeeEpoch | null
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementFeeInfo {
        return new SettlementFeeInfo(
            BigInt(json.totalFeesCollected),
            BigInt(json.totalFeesBurned),
            BigInt(json.totalFeesCredited),
            BigInt(json.totalRewardsCollected),
            json.pendingEpochHead ? SettlementFeeEpoch.fromJson(json.pendingEpochHead) : null
        );
    }
}

export class SettlementAssetInfo extends Model {
    constructor(
        public domainId: number,
        public assetId: Hash,
        public maxBatchWithdrawal: bigint,
        public cumulativeDeposited: bigint,
        public totalDeposited: bigint,
        public pendingWithdrawalReserve: bigint,
        public totalReleased: bigint
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementAssetInfo {
        return new SettlementAssetInfo(
            json.domainId,
            Hash.parse(json.assetId),
            BigInt(json.maxBatchWithdrawal),
            BigInt(json.cumulativeDeposited),
            BigInt(json.totalDeposited),
            BigInt(json.pendingWithdrawalReserve),
            BigInt(json.totalReleased)
        );
    }
}

export class SettlementReleaseQueueEntry extends Model {
    constructor(
        public registrationIndex: number,
        public recipient: Address,
        public assetId: Hash,
        public amount: bigint,
        public outboxId: Hash
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementReleaseQueueEntry {
        return new SettlementReleaseQueueEntry(
            json.registrationIndex,
            Address.parse(json.recipient),
            Hash.parse(json.assetId),
            BigInt(json.amount),
            Hash.parse(json.outboxId)
        );
    }
}

export class SettlementReleaseQueue extends Model {
    constructor(
        public head: number,
        public tail: number,
        public count: number,
        public list: Array<SettlementReleaseQueueEntry>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementReleaseQueue {
        return new SettlementReleaseQueue(
            json.head,
            json.tail,
            json.count,
            (json.list ?? []).map(SettlementReleaseQueueEntry.fromJson)
        );
    }
}

export class SettlementTimeChallenge extends Model {
    constructor(
        public methodName: string,
        public paramsHash: Hash,
        public challengeStartHeight: number,
        // The first frontier height at which the apply passes.
        public dueHeight: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementTimeChallenge {
        return new SettlementTimeChallenge(
            json.methodName,
            Hash.parse(json.paramsHash),
            json.challengeStartHeight,
            json.dueHeight
        );
    }
}

export class SettlementTimeChallengeList extends Model {
    constructor(
        public count: number,
        public list: Array<SettlementTimeChallenge>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SettlementTimeChallengeList {
        return new SettlementTimeChallengeList(
            json.count,
            (json.list ?? []).map(SettlementTimeChallenge.fromJson)
        );
    }
}
