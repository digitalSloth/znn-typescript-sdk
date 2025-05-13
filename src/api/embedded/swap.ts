import { Api } from "../base.js";
import { SwapAssetEntry, SwapAssetList, SwapLegacyPillarList } from "../../model/embedded/swap.js";
import { SWAP_ADDRESS, ZNN_ZTS, Hash } from "../../model/primitives/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { Swap as SwapContract } from "../../embedded/swap.js";


export class SwapApi extends Api {

    //
    // RPC

    async getAssetsByKeyIdHash(
        keyIdHash: string,
    ): Promise<SwapAssetEntry|null> {
        const response = await this.client.sendRequest("embedded.swap.getAssetsByKeyIdHash", [
            keyIdHash,
        ]);
        return response === null ? null : SwapAssetEntry.fromJson(Hash.parse(keyIdHash), response);
    }

    async getAssets(): Promise<SwapAssetList> {
        const response = await this.client.sendRequest("embedded.swap.getAssets", []);
        return SwapAssetList.fromJson(response!);
    }

    async getLegacyPillars(): Promise<SwapLegacyPillarList> {
        const response = await this.client.sendRequest("embedded.swap.getLegacyPillars", []);
        return SwapLegacyPillarList.fromJson(response);
    }

    //
    // Contract methods

    retrieveAssets(
        pubKey: string,
        signature: string,
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            SWAP_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            SwapContract.abi.encodeFunctionData("RetrieveAssets", [
                pubKey,
                signature,
            ])
        );
    }
}
