import { Api } from "../base.js";
import { Address, Hash, TokenStandard, HTLC_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { HtlcInfo } from "../../model/embedded/htlc.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Htlc as HtlcContract } from "../../embedded/index.js";

export class HtlcApi extends Api {

    //
    // RPC

    async getById(id: Hash): Promise<HtlcInfo> {
        const response = await this.client.sendRequest("embedded.htlc.getById", [
            id.toString()
        ]);
        return HtlcInfo.fromJson(response!);
    }

    async getProxyUnlockStatus(address: Address): Promise<boolean> {
        return await this.client.sendRequest("embedded.htlc.getProxyUnlockStatus", [
            address.toString()
        ]);
    }

    //
    // Contract methods

    create(
        token: TokenStandard,
        amount: BigNumber,
        hashLocked: Address,
        expirationTime: number,
        hashType: number,
        keyMaxSize: number,
        hashLock: Uint8Array | null
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            HTLC_ADDRESS,
            token,
            amount,
            HtlcContract.abi.encodeFunctionData("Create", [
                hashLocked.toString(),
                expirationTime,
                hashType,
                keyMaxSize,
                hashLock
            ])
        );
    }

    reclaim(id: Hash): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            HTLC_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            HtlcContract.abi.encodeFunctionData("Reclaim", [
                id.getBytes()
            ])
        );
    }

    unlock(id: Hash, preimage: Uint8Array | null): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            HTLC_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            HtlcContract.abi.encodeFunctionData("Unlock", [
                id.getBytes(),
                preimage
            ])
        );
    }

    denyProxyUnlock(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            HTLC_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            HtlcContract.abi.encodeFunctionData("DenyProxyUnlock", [])
        );
    }

    allowProxyUnlock(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            HTLC_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            HtlcContract.abi.encodeFunctionData("AllowProxyUnlock", [])
        );
    }
}
