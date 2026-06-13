import { BigNumberish } from "../../utilities/bignumber.js";
import { MEMORY_POOL_PAGE_SIZE, RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { Api } from "../base.js";
import { Plasma } from "../../embedded/plasma.js";
import { FusionEntryList, GetRequiredPowParam, GetRequiredPowResponse, PlasmaInfo } from "../../model/embedded/plasma.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Address, PLASMA_ADDRESS, Hash, QSR_ZTS } from "../../model/primitives/index.js";


export class PlasmaApi extends Api {

    //
    // RPC

    async get(address: Address): Promise<PlasmaInfo> {
        const response = await this.client.sendRequest("embedded.plasma.get", [
            address.toString()
        ]);
        return PlasmaInfo.fromJson(response!);
    }

    async getEntriesByAddress(
        address: Address,
        pageIndex = 0,
        pageSize = RPC_MAX_PAGE_SIZE
    ): Promise<FusionEntryList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.plasma.getEntriesByAddress", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return FusionEntryList.fromJson(response);
    }

    async getRequiredPoWForAccountBlock(powParam: GetRequiredPowParam): Promise<GetRequiredPowResponse> {
        const response = await this.client.sendRequest("embedded.plasma.getRequiredPoWForAccountBlock", [
            powParam.toJson(),
        ]);
        return GetRequiredPowResponse.fromJson(response);
    }

    //
    // Contract methods

    fuse(beneficiary: Address, amount: BigNumberish): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PLASMA_ADDRESS,
            QSR_ZTS,
            amount,
            Plasma.abi.encodeFunctionData("Fuse", [
                beneficiary.toString()
            ])
        );
    }

    cancel(id: Hash): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            PLASMA_ADDRESS,
            QSR_ZTS,
            0n,
            Plasma.abi.encodeFunctionData("CancelFuse", [
                id.getBytes()
            ])
        );
    }
}
