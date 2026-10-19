import { sha3_256 } from "@noble/hashes/sha3";
import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { Address, Hash, TokenStandard, SETTLEMENT_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import {
    SettlementAssetInfo,
    SettlementBatch,
    SettlementBatchList,
    SettlementDeployRecord,
    SettlementDeployRecordList,
    SettlementDomainInfo,
    SettlementDomainInfoList,
    SettlementExecutorList,
    SettlementFeeInfo,
    SettlementPauseInfo,
    SettlementPeripheryConfig,
    SettlementReleaseQueue,
    SettlementTimeChallengeList
} from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Settlement as SettlementContract } from "../../embedded/index.js";
import { arrayify, BytesLike } from "../../utilities/bytes.js";
import {
    MaxCallPayload,
    MaxChunkCount,
    MaxCodeSize,
    MaxContractMetadataSize,
    MaxDeployChunkData,
    MaxInputGas,
} from "../../settlement/constants.js";

export interface RegisterDomainParams {
    domainId: number;
    domainClass: number;
    runtimeKind: number;
    stfSpecHash: Hash;
    inputSource: number;
    execProfile: number;
    foreignProfile: number;
    profileConfig: BytesLike;
    chainBinding: BytesLike;
    minExecutors: number;
    proposerPolicy: number;
    finalityModel: number;
    status: number;
    withdrawalDelay: bigint;
    runtimeUpgradeDelay: bigint;
}

function assertMax(value: number | bigint, max: number | bigint, name: string): void {
    if (value > max) {
        throw new Error(`${name} must be at most ${max}`);
    }
}

function assertPositive(value: bigint, name: string): void {
    if (value <= 0n) {
        throw new Error(`${name} must be greater than 0`);
    }
}

function assertHashOf(data: Uint8Array, expected: Hash, name: string): void {
    if (!expected.getBytes().equals(Buffer.from(sha3_256(data)))) {
        throw new Error(`${name} must equal the SHA3-256 of the data`);
    }
}

export class SettlementApi extends Api {

    //
    // RPC
    //
    // Before the Settlement spork activates every method returns an empty
    // result rather than an error. A record that does not exist is null.

    async getDomainInfo(domainId: number): Promise<SettlementDomainInfo | null> {
        const response = await this.client.sendRequest("embedded.settlement.getDomainInfo", [domainId]);
        return response ? SettlementDomainInfo.fromJson(response) : null;
    }

    async getAllDomains(
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<SettlementDomainInfoList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.settlement.getAllDomains", [
            pageIndex,
            pageSize
        ]);
        return SettlementDomainInfoList.fromJson(response!);
    }

    async getBatch(domainId: number, batchId: number): Promise<SettlementBatch | null> {
        const response = await this.client.sendRequest("embedded.settlement.getBatch", [domainId, batchId]);
        return response ? SettlementBatch.fromJson(response) : null;
    }

    // Newest first
    async getBatches(
        domainId: number,
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<SettlementBatchList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.settlement.getBatches", [
            domainId,
            pageIndex,
            pageSize
        ]);
        return SettlementBatchList.fromJson(response!);
    }

    async getDeployRecord(
        domainId: number,
        deployer: Address,
        codeHash: Hash
    ): Promise<SettlementDeployRecord | null> {
        const response = await this.client.sendRequest("embedded.settlement.getDeployRecord", [
            domainId,
            deployer.toString(),
            codeHash.toString()
        ]);
        return response ? SettlementDeployRecord.fromJson(response) : null;
    }

    async getDeployRecordsByDeployer(
        domainId: number,
        deployer: Address,
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<SettlementDeployRecordList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.settlement.getDeployRecordsByDeployer", [
            domainId,
            deployer.toString(),
            pageIndex,
            pageSize
        ]);
        return SettlementDeployRecordList.fromJson(response!);
    }

    async getPauseState(): Promise<SettlementPauseInfo> {
        const response = await this.client.sendRequest("embedded.settlement.getPauseState", []);
        return SettlementPauseInfo.fromJson(response!);
    }

    // null before the first SetPeripheryConfig
    async getPeripheryConfig(): Promise<SettlementPeripheryConfig | null> {
        const response = await this.client.sendRequest("embedded.settlement.getPeripheryConfig", []);
        return response ? SettlementPeripheryConfig.fromJson(response) : null;
    }

    async getExecutorSet(): Promise<SettlementExecutorList> {
        const response = await this.client.sendRequest("embedded.settlement.getExecutorSet", []);
        return SettlementExecutorList.fromJson(response!);
    }

    async getFeeInfo(): Promise<SettlementFeeInfo> {
        const response = await this.client.sendRequest("embedded.settlement.getFeeInfo", []);
        return SettlementFeeInfo.fromJson(response!);
    }

    async getAssetInfo(domainId: number, assetId: Hash): Promise<SettlementAssetInfo | null> {
        const response = await this.client.sendRequest("embedded.settlement.getAssetInfo", [
            domainId,
            assetId.toString()
        ]);
        return response ? SettlementAssetInfo.fromJson(response) : null;
    }

    async getReleaseQueue(
        domainId: number,
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<SettlementReleaseQueue> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.settlement.getReleaseQueue", [
            domainId,
            pageIndex,
            pageSize
        ]);
        return SettlementReleaseQueue.fromJson(response!);
    }

    async isOutboxProcessed(outboxId: Hash): Promise<boolean> {
        const response = await this.client.sendRequest("embedded.settlement.isOutboxProcessed", [
            outboxId.toString()
        ]);
        return response as boolean;
    }

    async getTimeChallengesInfo(): Promise<SettlementTimeChallengeList> {
        const response = await this.client.sendRequest("embedded.settlement.getTimeChallengesInfo", []);
        return SettlementTimeChallengeList.fromJson(response!);
    }

    //
    // User methods

    deposit(
        domainId: number,
        targetContract: Hash,
        plasmaLimit: bigint,
        token: TokenStandard,
        amount: bigint
    ): AccountBlockTemplate {
        assertMax(plasmaLimit, MaxInputGas, "plasmaLimit");
        assertPositive(amount, "amount");

        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            token,
            amount,
            SettlementContract.abi.encodeFunctionData("Deposit", [
                domainId,
                targetContract.getBytes(),
                plasmaLimit
            ])
        );
    }

    callL2(
        domainId: number,
        targetContract: Hash,
        plasmaLimit: bigint,
        payload: BytesLike,
        token: TokenStandard = ZNN_ZTS,
        amount: bigint = 0n
    ): AccountBlockTemplate {
        const payloadBytes = arrayify(payload);
        assertMax(plasmaLimit, MaxInputGas, "plasmaLimit");
        assertMax(payloadBytes.length, MaxCallPayload, "payload length");

        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            token,
            amount,
            SettlementContract.abi.encodeFunctionData("CallL2", [
                domainId,
                targetContract.getBytes(),
                plasmaLimit,
                payloadBytes
            ])
        );
    }

    deployContractStart(
        domainId: number,
        codeHash: Hash,
        metadataHash: Hash,
        totalSize: bigint,
        chunkCount: number,
        metadata: BytesLike
    ): AccountBlockTemplate {
        const metadataBytes = arrayify(metadata);
        assertMax(metadataBytes.length, MaxContractMetadataSize, "metadata length");
        assertHashOf(metadataBytes, metadataHash, "metadataHash");
        assertPositive(totalSize, "totalSize");
        assertMax(totalSize, BigInt(MaxCodeSize), "totalSize");
        assertMax(chunkCount, MaxChunkCount, "chunkCount");

        const chunkSize = BigInt(MaxDeployChunkData);
        if (BigInt(chunkCount) !== (totalSize + chunkSize - 1n) / chunkSize) {
            throw new Error("chunkCount must equal ceil(totalSize / MaxDeployChunkData)");
        }

        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("DeployContractStart", [
                domainId,
                codeHash.getBytes(),
                metadataHash.getBytes(),
                totalSize,
                chunkCount,
                metadataBytes
            ])
        );
    }

    deployContractChunk(
        domainId: number,
        codeHash: Hash,
        chunkIndex: number,
        chunkHash: Hash,
        chunkData: BytesLike
    ): AccountBlockTemplate {
        const chunkBytes = arrayify(chunkData);
        assertMax(chunkBytes.length, MaxDeployChunkData, "chunkData length");
        assertHashOf(chunkBytes, chunkHash, "chunkHash");

        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("DeployContractChunk", [
                domainId,
                codeHash.getBytes(),
                chunkIndex,
                chunkHash.getBytes(),
                chunkBytes
            ])
        );
    }

    // `fee` is the ZNN attached to the send: totalSize * znnPerByteOfBytecode.
    deployContractFinalize(domainId: number, codeHash: Hash, fee: bigint): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            fee,
            SettlementContract.abi.encodeFunctionData("DeployContractFinalize", [
                domainId,
                codeHash.getBytes()
            ])
        );
    }

    // `fee` is the ZNN attached to the send, priced like deployContractFinalize.
    upgradeContract(
        domainId: number,
        contractId: Hash,
        newCodeHash: Hash,
        fee: bigint
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            fee,
            SettlementContract.abi.encodeFunctionData("UpgradeContract", [
                domainId,
                contractId.getBytes(),
                newCodeHash.getBytes()
            ])
        );
    }

    // The zero address as `newOwner` renounces ownership.
    transferContractOwnership(domainId: number, contractId: Hash, newOwner: Address): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("TransferContractOwnership", [
                domainId,
                contractId.getBytes(),
                newOwner.toString()
            ])
        );
    }

    // `fee` is the ZNN attached to the send: bytes * znnPerByteOfState.
    buyStorage(domainId: number, contractId: Hash, bytes: bigint, fee: bigint): AccountBlockTemplate {
        assertPositive(bytes, "bytes");

        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            fee,
            SettlementContract.abi.encodeFunctionData("BuyStorage", [
                domainId,
                contractId.getBytes(),
                bytes
            ])
        );
    }

    //
    // Permissionless methods

    releaseWithdrawals(domainId: number): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("ReleaseWithdrawals", [domainId])
        );
    }

    relayMessage(
        domainId: number,
        batchId: bigint,
        message: BytesLike,
        inclusionProof: BytesLike
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("RelayMessage", [
                domainId,
                batchId,
                arrayify(message),
                arrayify(inclusionProof)
            ])
        );
    }

    update(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("Update", [])
        );
    }

    collectReward(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("CollectReward", [])
        );
    }

    //
    // Administrator methods

    registerDomain(params: RegisterDomainParams): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("RegisterDomain", [
                params.domainId,
                params.domainClass,
                params.runtimeKind,
                params.stfSpecHash.getBytes(),
                params.inputSource,
                params.execProfile,
                params.foreignProfile,
                arrayify(params.profileConfig),
                arrayify(params.chainBinding),
                params.minExecutors,
                params.proposerPolicy,
                params.finalityModel,
                params.status,
                params.withdrawalDelay,
                params.runtimeUpgradeDelay
            ])
        );
    }

    setDomainConfig(
        domainId: number,
        withdrawalDelay: bigint,
        runtimeUpgradeDelay: bigint
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("SetDomainConfig", [
                domainId,
                withdrawalDelay,
                runtimeUpgradeDelay
            ])
        );
    }

    setAssetConfig(domainId: number, assetId: Hash, maxBatchWithdrawal: bigint): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("SetAssetConfig", [
                domainId,
                assetId.getBytes(),
                maxBatchWithdrawal
            ])
        );
    }

    // `modes` is one DAMode byte per approved mode.
    setApprovedDAModes(domainId: number, modes: number[]): AccountBlockTemplate {
        if (modes.length === 0) {
            throw new Error("modes must not be empty");
        }

        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("SetApprovedDAModes", [
                domainId,
                Uint8Array.from(modes)
            ])
        );
    }

    pause(domainId: number, isGlobal: boolean, scope: number, active: boolean): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("Pause", [
                domainId,
                isGlobal,
                scope,
                active
            ])
        );
    }

    initiateEscapeHatch(domainId: number): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("InitiateEscapeHatch", [domainId])
        );
    }

    registerExecutor(pillarName: string, executorAddress: Address): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("RegisterExecutor", [
                pillarName,
                executorAddress.toString()
            ])
        );
    }

    setPeripheryConfig(znnPerByteOfBytecode: bigint, znnPerByteOfState: bigint): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SETTLEMENT_ADDRESS,
            ZNN_ZTS,
            0n,
            SettlementContract.abi.encodeFunctionData("SetPeripheryConfig", [
                znnPerByteOfBytecode,
                znnPerByteOfState
            ])
        );
    }
}
