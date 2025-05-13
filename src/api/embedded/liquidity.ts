import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE, MEMORY_POOL_PAGE_SIZE } from "../../zenon.js";
import { Address, Hash, TokenStandard, LIQUIDITY_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import {
    LiquidityInfo,
    LiquidityStakeList,
    TimeChallengesList,
    RewardDeposit,
    RewardHistoryList,
    SecurityInfo
} from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Liquidity as LiquidityContract, Common as CommonContract } from "../../embedded/index.js";

export class LiquidityApi extends Api {

    //
    // RPC

    async getLiquidityInfo(): Promise<LiquidityInfo> {
        const response = await this.client.sendRequest("embedded.liquidity.getLiquidityInfo", []);
        return LiquidityInfo.fromJson(response!);
    }

    async getLiquidityStakeEntriesByAddress(
        address: Address,
        pageIndex: number = 0,
        pageSize: number = MEMORY_POOL_PAGE_SIZE
    ): Promise<LiquidityStakeList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, MEMORY_POOL_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.liquidity.getLiquidityStakeEntriesByAddress", [
            address.toString(),
            pageIndex,
            pageSize
        ]);

        return LiquidityStakeList.fromJson(response!);
    }

    //
    // Common RPC

    async getUncollectedReward(address: Address): Promise<RewardDeposit> {
        const response = await this.client.sendRequest("embedded.liquidity.getUncollectedReward", [
            address.toString()
        ]);
        return RewardDeposit.fromJson(response!);
    }

    async getFrontierRewardByPage(
        address: Address,
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<RewardHistoryList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.liquidity.getFrontierRewardByPage", [
            address.toString(),
            pageIndex,
            pageSize
        ]);

        return RewardHistoryList.fromJson(response!);
    }

    async getSecurityInfo(): Promise<SecurityInfo> {
        const response = await this.client.sendRequest("embedded.liquidity.getSecurityInfo", []);
        return SecurityInfo.fromJson(response!);
    }

    async getTimeChallengesInfo(): Promise<TimeChallengesList> {
        const response = await this.client.sendRequest("embedded.liquidity.getTimeChallengesInfo", []);
        return TimeChallengesList.fromJson(response!);
    }

    //
    // Contract methods

    liquidityStake(
        durationInSec: number,
        amount: BigNumber,
        zts: TokenStandard
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            zts,
            amount,
            LiquidityContract.abi.encodeFunctionData("LiquidityStake", [
                durationInSec
            ])
        );
    }

    cancelLiquidityStake(id: Hash): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            LiquidityContract.abi.encodeFunctionData("CancelLiquidityStake", [
                id.getBytes()
            ])
        );
    }

    unlockLiquidityStakeEntries(zts: TokenStandard): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            zts,
            BigNumber.from(0),
            LiquidityContract.abi.encodeFunctionData("UnlockLiquidityStakeEntries", [])
        );
    }

    //
    // Administrator contract methods

    setTokenTuple(
        tokenStandards: string,
        znnPercentages: number,
        qsrPercentages: number,
        minAmounts: BigNumber
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            LiquidityContract.abi.encodeFunctionData("SetTokenTuple", [
                tokenStandards,
                znnPercentages,
                qsrPercentages,
                minAmounts.toString(),
            ])
        );
    }

    nominateGuardians(guardians: Address[]): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            LiquidityContract.abi.encodeFunctionData("NominateGuardians", [
                guardians.map(address => address.toString())
            ])
        );
    }

    proposeAdministrator(address: Address): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            LiquidityContract.abi.encodeFunctionData("ProposeAdministrator", [
                address.toString()
            ])
        );
    }

    setIsHalted(isHalted: boolean): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            LiquidityContract.abi.encodeFunctionData("SetIsHalted", [
                isHalted
            ])
        );
    }

    setAdditionalReward(znnReward: number, qsrReward: number): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            LiquidityContract.abi.encodeFunctionData("SetAdditionalReward", [
                znnReward,
                qsrReward
            ])
        );
    }

    changeAdministrator(administrator: Address): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            LiquidityContract.abi.encodeFunctionData("ChangeAdministrator", [
                administrator.toString()
            ])
        );
    }

    //
    // Common contract methods

    collectReward(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            CommonContract.abi.encodeFunctionData("CollectReward", [])
        );
    }

    emergency(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            LIQUIDITY_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            LiquidityContract.abi.encodeFunctionData("Emergency", [])
        );
    }
}
