import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import {Address, PILLAR_ADDRESS, ZNN_ZTS} from "../../model/primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import {
    PillarInfo,
    PillarInfoList,
    DelegationInfo,
    PillarEpochHistoryList,
    RewardHistoryList,
    UncollectedReward
} from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import {Pillar as PillarContract, Common as CommonContract} from "../../embedded/index.js";
import { PILLAR_REGISTER_ZNN_AMOUNT } from "./constants.js";


export class PillarApi extends Api {

    //
    // RPC

    async getQsrRegistrationCost(): Promise<BigNumber> {
        const response = await this.client.sendRequest("embedded.pillar.getQsrRegistrationCost", []);
        return BigNumber.from(response);
    }

    async getAll(
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<PillarInfoList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.pillar.getAll", [
            pageIndex,
            pageSize
        ]);

        return PillarInfoList.fromJson(response!);
    }

    async getByOwner(address: Address): Promise<Array<PillarInfo>> {

        const response = await this.client.sendRequest("embedded.pillar.getByOwner", [
            address.toString()
        ]);

        return response.map(PillarInfo.fromJson);
    }

    async getByName(name: string): Promise<PillarInfo|null> {
        const response = await this.client.sendRequest("embedded.pillar.getByName", [
            name
        ]);
        return response == null ? null : PillarInfo.fromJson(response);
    }

    async checkNameAvailability(name: string): Promise<boolean> {
        return await this.client.sendRequest("embedded.pillar.checkNameAvailability", [
            name
        ]);
    }

    async getDelegatedPillar(address: Address): Promise<DelegationInfo|null> {
        const response = await this.client.sendRequest("embedded.pillar.getDelegatedPillar", [
            address.toString()
        ]);
        return response == null ? null : DelegationInfo.fromJson(response);
    }

    async getPillarEpochHistory(
        name: string,
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<PillarEpochHistoryList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.pillar.getPillarEpochHistory", [
            name,
            pageIndex,
            pageSize,
        ]);

        return PillarEpochHistoryList.fromJson(response!);
    }

    async getPillarsHistoryByEpoch(
        epoch: number,
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<PillarEpochHistoryList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.pillar.getPillarsHistoryByEpoch", [
            epoch,
            pageIndex,
            pageSize,
        ]);

        return PillarEpochHistoryList.fromJson(response!);
    }

    //
    // Common RPC

    async getDepositedQsr(address: Address): Promise<BigNumber> {
        const response = await this.client.sendRequest("embedded.pillar.getDepositedQsr", [
            address.toString()
        ]);
        return BigNumber.from(response);
    }

    async getUncollectedReward(address: Address): Promise<UncollectedReward> {
        const response = await this.client.sendRequest("embedded.pillar.getUncollectedReward", [
            address.toString()
        ]);
        return UncollectedReward.fromJson(response);
    }

    async getFrontierRewardByPage(
        address: Address,
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<RewardHistoryList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.pillar.getFrontierRewardByPage", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);

        return RewardHistoryList.fromJson(response);
    }

    //
    // Contract methods

    register(
        name: string,
        producerAddress: Address,
        rewardAddress: Address,
        giveBlockRewardPercentage: number = 0,
        giveDelegateRewardPercentage: number = 100
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PILLAR_ADDRESS,
            ZNN_ZTS,
            PILLAR_REGISTER_ZNN_AMOUNT,
            PillarContract.abi.encodeFunctionData("Register", [
                name,
                producerAddress.toString(),
                rewardAddress.toString(),
                giveBlockRewardPercentage,
                giveDelegateRewardPercentage
            ])
        );
    }

    registerLegacy(
        name: string,
        producerAddress: Address,
        rewardAddress: Address,
        publicKey: string,
        signature: string,
        giveBlockRewardPercentage: number = 0,
        giveDelegateRewardPercentage: number = 100
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PILLAR_ADDRESS,
            ZNN_ZTS,
            PILLAR_REGISTER_ZNN_AMOUNT,
            PillarContract.abi.encodeFunctionData("RegisterLegacy", [
                name,
                producerAddress.toString(),
                rewardAddress.toString(),
                giveBlockRewardPercentage,
                giveDelegateRewardPercentage,
                publicKey,
                signature,
            ])
        );
    }

    updatePillar(
        name: string,
        producerAddress: Address,
        rewardAddress: Address,
        giveBlockRewardPercentage: number = 0,
        giveDelegateRewardPercentage: number = 100
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PILLAR_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            PillarContract.abi.encodeFunctionData("UpdatePillar", [
                name,
                producerAddress.toString(),
                rewardAddress.toString(),
                giveBlockRewardPercentage,
                giveDelegateRewardPercentage
            ])
        );
    }

    revoke(
        name: string
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PILLAR_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            PillarContract.abi.encodeFunctionData("Revoke", [
                name,
            ])
        );
    }

    delegate(
        name: string
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PILLAR_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            PillarContract.abi.encodeFunctionData("Delegate", [
                name,
            ])
        );
    }

    undelegate(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PILLAR_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            PillarContract.abi.encodeFunctionData("Undelegate", [])
        );
    }


    //
    // Common contract methods

    collectRewards(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PILLAR_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            CommonContract.abi.encodeFunctionData("CollectReward", [])
        );
    }

    depositQsr(amount: BigNumber): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PILLAR_ADDRESS,
            ZNN_ZTS,
            amount,
            CommonContract.abi.encodeFunctionData("DepositQsr", [])
        );
    }

    withdrawQsr(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PILLAR_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            CommonContract.abi.encodeFunctionData("WithdrawQsr", [])
        );
    }
}
