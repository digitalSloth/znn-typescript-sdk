import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { Address, Hash, TokenStandard, BRIDGE_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import {
    BridgeInfo,
    OrchestratorInfo,
    BridgeNetworkInfo,
    BridgeNetworkInfoList,
    WrapTokenRequest,
    WrapTokenRequestList,
    UnwrapTokenRequest,
    UnwrapTokenRequestList,
    ZtsFeesInfo,
    TimeChallengesList,
    SecurityInfo
} from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Bridge as BridgeContract } from "../../embedded/index.js";

export class BridgeApi extends Api {

    //
    // RPC

    async getBridgeInfo(): Promise<BridgeInfo> {
        const response = await this.client.sendRequest("embedded.bridge.getBridgeInfo", []);
        return BridgeInfo.fromJson(response!);
    }

    async getOrchestratorInfo(): Promise<OrchestratorInfo> {
        const response = await this.client.sendRequest("embedded.bridge.getOrchestratorInfo", []);
        return OrchestratorInfo.fromJson(response!);
    }

    async getNetworkInfo(
        networkClass: number,
        chainId: number
    ): Promise<BridgeNetworkInfo> {
        const response = await this.client.sendRequest("embedded.bridge.getNetworkInfo", [
            networkClass,
            chainId
        ]);
        return BridgeNetworkInfo.fromJson(response!);
    }

    async getAllNetworks(
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<BridgeNetworkInfoList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.bridge.getAllNetworks", [
            pageIndex,
            pageSize
        ]);

        return BridgeNetworkInfoList.fromJson(response!);
    }

    async getWrapTokenRequestById(id: Hash): Promise<WrapTokenRequest> {
        const response = await this.client.sendRequest("embedded.bridge.getWrapTokenRequestById", [
            id.toString()
        ]);
        return WrapTokenRequest.fromJson(response!);
    }

    async getAllWrapTokenRequests(
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<WrapTokenRequestList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.bridge.getAllWrapTokenRequests", [
            pageIndex,
            pageSize
        ]);

        return WrapTokenRequestList.fromJson(response!);
    }

    async getAllWrapTokenRequestsByToAddress(
        toAddress: string,
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<WrapTokenRequestList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.bridge.getAllWrapTokenRequestsByToAddress", [
            toAddress,
            pageIndex,
            pageSize
        ]);

        return WrapTokenRequestList.fromJson(response!);
    }

    async getAllWrapTokenRequestsByToAddressNetworkClassAndChainId(
        toAddress: string,
        networkClass: number,
        chainId: number,
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<WrapTokenRequestList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest(
            "embedded.bridge.getAllWrapTokenRequestsByToAddressNetworkClassAndChainId",
            [
                toAddress,
                networkClass,
                chainId,
                pageIndex,
                pageSize
            ]
        );

        return WrapTokenRequestList.fromJson(response!);
    }

    async getAllUnsignedWrapTokenRequests(
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<WrapTokenRequestList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.bridge.getAllUnsignedWrapTokenRequests", [
            pageIndex,
            pageSize
        ]);

        return WrapTokenRequestList.fromJson(response!);
    }

    async getUnwrapTokenRequestByHashAndLog(
        txHash: Hash,
        logIndex: number
    ): Promise<UnwrapTokenRequest> {
        const response = await this.client.sendRequest("embedded.bridge.getUnwrapTokenRequestByHashAndLog", [
            txHash.toString(),
            logIndex
        ]);
        return UnwrapTokenRequest.fromJson(response!);
    }

    async getAllUnwrapTokenRequests(
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<UnwrapTokenRequestList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.bridge.getAllUnwrapTokenRequests", [
            pageIndex,
            pageSize
        ]);

        return UnwrapTokenRequestList.fromJson(response!);
    }

    async getAllUnwrapTokenRequestsByToAddress(
        toAddress: string,
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<UnwrapTokenRequestList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.bridge.getAllUnwrapTokenRequestsByToAddress", [
            toAddress,
            pageIndex,
            pageSize
        ]);

        return UnwrapTokenRequestList.fromJson(response!);
    }

    async getFeeTokenPair(zts: TokenStandard): Promise<ZtsFeesInfo> {
        const response = await this.client.sendRequest("embedded.bridge.getFeeTokenPair", [
            zts.toString()
        ]);
        return ZtsFeesInfo.fromJson(response!);
    }

    //
    // Common RPC

    async getSecurityInfo(): Promise<SecurityInfo> {
        const response = await this.client.sendRequest("embedded.bridge.getSecurityInfo", []);
        return SecurityInfo.fromJson(response!);
    }

    async getTimeChallengesInfo(): Promise<TimeChallengesList> {
        const response = await this.client.sendRequest("embedded.bridge.getTimeChallengesInfo", []);
        return TimeChallengesList.fromJson(response!);
    }

    //
    // Contract methods

    wrapToken(
        networkClass: number,
        chainId: number,
        toAddress: string,
        amount: BigNumber,
        tokenStandard: TokenStandard
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            tokenStandard,
            amount,
            BridgeContract.abi.encodeFunctionData("WrapToken", [
                networkClass,
                chainId,
                toAddress
            ])
        );
    }

    updateWrapRequest(id: Hash, signature: string): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("UpdateWrapRequest", [
                id.getBytes(),
                signature
            ])
        );
    }

    halt(signature: string): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("Halt", [
                signature
            ])
        );
    }

    changeTssECDSAPubKey(
        pubKey: string,
        oldPubKeySignature: string,
        newPubKeySignature: string
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("ChangeTssECDSAPubKey", [
                pubKey,
                oldPubKeySignature,
                newPubKeySignature
            ])
        );
    }

    redeem(transactionHash: Hash, logIndex: number): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("Redeem", [
                transactionHash.getBytes(),
                logIndex
            ])
        );
    }

    unwrapToken(
        networkClass: number,
        chainId: number,
        transactionHash: Hash,
        logIndex: number,
        toAddress: Address,
        tokenAddress: string,
        amount: BigNumber,
        signature: string
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("UnwrapToken", [
                networkClass,
                chainId,
                transactionHash.getBytes(),
                logIndex,
                toAddress.toString(),
                tokenAddress,
                amount.toString(),
                signature
            ])
        );
    }

    //
    // Guardian contract methods

    proposeAdministrator(address: Address): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("ProposeAdministrator", [
                address.toString()
            ])
        );
    }

    //
    // Administrator contract methods

    setNetwork(
        networkClass: number,
        chainId: number,
        name: string,
        contractAddress: string,
        metadata: string
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("SetNetwork", [
                networkClass,
                chainId,
                name,
                contractAddress,
                metadata
            ])
        );
    }

    removeNetwork(networkClass: number, chainId: number): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("RemoveNetwork", [
                networkClass,
                chainId
            ])
        );
    }

    setTokenPair(
        networkClass: number,
        chainId: number,
        tokenStandard: TokenStandard,
        tokenAddress: string,
        bridgeable: boolean,
        redeemable: boolean,
        owned: boolean,
        minAmount: BigNumber,
        feePercentage: number,
        redeemDelay: number,
        metadata: string
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("SetTokenPair", [
                networkClass,
                chainId,
                tokenStandard.toString(),
                tokenAddress,
                bridgeable,
                redeemable,
                owned,
                minAmount.toString(),
                feePercentage,
                redeemDelay,
                metadata
            ])
        );
    }

    setNetworkMetadata(
        networkClass: number,
        chainId: number,
        metadata: string
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("SetNetworkMetadata", [
                networkClass,
                chainId,
                metadata
            ])
        );
    }

    removeTokenPair(
        networkClass: number,
        chainId: number,
        tokenStandard: TokenStandard,
        tokenAddress: string
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("RemoveTokenPair", [
                networkClass,
                chainId,
                tokenStandard.toString(),
                tokenAddress
            ])
        );
    }

    unhalt(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("Unhalt", [])
        );
    }

    emergency(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("Emergency", [])
        );
    }

    changeAdministrator(administrator: Address): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("ChangeAdministrator", [
                administrator.toString()
            ])
        );
    }

    setAllowKeyGen(allowKeyGen: boolean): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("SetAllowKeyGen", [
                allowKeyGen
            ])
        );
    }

    setBridgeMetadata(metadata: string): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("SetBridgeMetadata", [
                metadata
            ])
        );
    }

    revokeUnwrapRequest(transactionHash: Hash, logIndex: number): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("RevokeUnwrapRequest", [
                transactionHash.getBytes(),
                logIndex
            ])
        );
    }

    nominateGuardians(guardians: Address[]): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("NominateGuardians", [
                guardians.map(address => address.toString())
            ])
        );
    }

    setOrchestratorInfo(
        windowSize: number,
        keyGenThreshold: number,
        confirmationsToFinality: number,
        estimatedMomentumTime: number
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            BRIDGE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            BridgeContract.abi.encodeFunctionData("SetOrchestratorInfo", [
                windowSize,
                keyGenThreshold,
                confirmationsToFinality,
                estimatedMomentumTime
            ])
        );
    }
}
