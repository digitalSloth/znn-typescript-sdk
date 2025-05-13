import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { Address, Hash, STAKE_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { StakeList, RewardHistoryList, UncollectedReward } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Stake as StakeContract, Common as CommonContract } from "../../embedded/index.js";
import { BigNumber } from "../../utilities/bignumber.js";

export class StakeApi extends Api {

    //
    // RPC

    async getEntriesByAddress(
        address: Address,
        pageIndex = 0,
        pageSize = RPC_MAX_PAGE_SIZE
    ): Promise<StakeList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.stake.getEntriesByAddress", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);

        return StakeList.fromJson(response);
    }

    //
    // Common RPC

    async getUncollectedReward(address: Address): Promise<UncollectedReward> {
        const response = await this.client.sendRequest("embedded.stake.getUncollectedReward", [
            address.toString()
        ]);
        return UncollectedReward.fromJson(response!);
    }

    async getFrontierRewardByPage(
        address: Address,
        pageIndex = 0,
        pageSize = RPC_MAX_PAGE_SIZE
    ): Promise<RewardHistoryList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.stake.getFrontierRewardByPage", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);

        return RewardHistoryList.fromJson(response!);
    }

    //
    // Contract methods

    stake(durationInSec: number, amount: BigNumber): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            STAKE_ADDRESS,
            ZNN_ZTS,
            amount,
            StakeContract.abi.encodeFunctionData("Stake", [
                durationInSec
            ])
        );
    }

    cancel(id: Hash): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            STAKE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from("0"),
            StakeContract.abi.encodeFunctionData("Cancel", [
                id.getBytes()
            ])
        );
    }

    //
    // Common contract methods

    collectReward(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            STAKE_ADDRESS,
            ZNN_ZTS,
            BigNumber.from("0"),
            CommonContract.abi.encodeFunctionData("CollectReward", [])
        );
    }
}
