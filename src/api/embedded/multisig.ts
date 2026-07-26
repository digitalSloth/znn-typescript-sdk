import { Api } from "../base.js";
import { Address, MULTISIG_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { MultisigRecordInfo } from "../../model/embedded/multisig.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Multisig as MultisigContract } from "../../embedded/index.js";
import { MULTISIG_CREATION_FEE_IN_ZNN } from "./constants.js";
import { MultisigCreatorMustBeSingleSigException } from "../../client/nodeErrors.js";

export class MultisigApi extends Api {

    //
    // RPC

    async getPolicy(address: Address, height?: number): Promise<MultisigRecordInfo | null> {
        const response = await this.client.sendRequest("embedded.multisig.getPolicy", [
            address.toString(),
            height !== undefined ? height : null,
        ]);
        return response === null ? null : MultisigRecordInfo.fromJson(response);
    }

    //
    // Contract-call templates (unsigned). createMultisig is sent by a normal user
    // (feed to the existing send(zenon, tpl, keyPair)); changePolicy is sent BY the
    // multisig account (feed to the freeze/sign/assemble path).

    createMultisig(creator: Address, nonce: bigint, threshold: number, signers: Buffer[]): AccountBlockTemplate {
        if (Address.isMultisigAddress(creator)) {
            throw new MultisigCreatorMustBeSingleSigException("multisig: creator must be a single-sig account", 0);
        }
        return AccountBlockTemplate.callContract(
            MULTISIG_ADDRESS, ZNN_ZTS, MULTISIG_CREATION_FEE_IN_ZNN,
            MultisigContract.abi.encodeFunctionData("CreateMultisig", [nonce, threshold, signers]),
        );
    }

    changePolicy(threshold: number, signers: Buffer[], lock: boolean): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            MULTISIG_ADDRESS, ZNN_ZTS, 0n,
            MultisigContract.abi.encodeFunctionData("ChangePolicy", [threshold, signers, lock]),
        );
    }
}
