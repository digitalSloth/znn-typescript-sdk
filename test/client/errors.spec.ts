import { expect } from "chai";
import { ZnnClientException } from "../../src/client/errors.js";
import { ZnnSDKException } from "../../src/exception.js";
import { LedgerApi } from "../../src/api/ledger.js";
import { AccountBlockTemplate, BlockTypeEnum } from "../../src/model/nom/accountBlock.js";
import { MockClient } from "../api/mockClient.js";
import {
    mapNodeError,
    ZnnEmbeddedContractException,
    MultisigPolicyLockedException,
    MultisigAccountExistsException,
    MultisigNoPolicyException,
    MultisigInvalidPolicyException,
    MultisigSporkNotActivatedException,
    MultisigThresholdMismatchException,
    AccountBlockPublicKeyNotZeroException,
    AccountBlockSignatureNotZeroException,
    AccountBlockMultisigAuthMissingException,
    AccountBlockMomentumTooOldException,
    MultisigStaleAuthorityException,
    AccountBlockMultisigAuthMustBeZeroException,
    MultisigCreatorMustBeSingleSigException,
} from "../../src/client/nodeErrors.js";

describe("ZnnClientException", () => {
    it("should format error details in toString", () => {
        const err = new ZnnClientException(
            "RPC failure",
            123,
            "ledger.getAccountBlockByHash",
            ["0xabc"],
            { detail: "bad request" }
        );

        const message = err.toString();

        expect(message).to.include("ZnnClientException [123]: RPC failure");
        expect(message).to.include("Method: ledger.getAccountBlockByHash");
        expect(message).to.include("Params: [\"0xabc\"]");
        expect(message).to.include("Data: {\"detail\":\"bad request\"}");
    });

    it("should omit optional fields when not provided", () => {
        const err = new ZnnClientException("Simple error", -1);
        const message = err.toString();

        expect(message).to.equal("ZnnClientException [-1]: Simple error");
    });
});

describe("mapNodeError", () => {
    const cases: Array<{ message: string; type: any }> = [
        { message: "multisig: policy is locked", type: MultisigPolicyLockedException },
        { message: "multisig: account already exists", type: MultisigAccountExistsException },
        { message: "multisig: no policy for this account", type: MultisigNoPolicyException },
        { message: "multisig: invalid policy", type: MultisigInvalidPolicyException },
        { message: "multisig: spork not activated", type: MultisigSporkNotActivatedException },
        { message: "multisig: signature count does not match policy threshold", type: MultisigThresholdMismatchException },
        { message: "account-block publicKey must be zero", type: AccountBlockPublicKeyNotZeroException },
        { message: "account-block signature must be zero", type: AccountBlockSignatureNotZeroException },
        { message: "account-block multisig-auth is missing", type: AccountBlockMultisigAuthMissingException },
        { message: "account-block momentum-acknowledged is too old", type: AccountBlockMomentumTooOldException },
        { message: "multisig: authorization does not satisfy current active policy", type: MultisigStaleAuthorityException },
        { message: "multisig: creator must be a single-sig account", type: MultisigCreatorMustBeSingleSigException },
        { message: "account-block multisig-auth must be zero", type: AccountBlockMultisigAuthMustBeZeroException },
    ];

    for (const { message, type } of cases) {
        it(`maps "${message}" to ${type.name}`, () => {
            const error = mapNodeError(message, -1);

            expect(error).to.be.instanceOf(type);
            expect(error).to.be.instanceOf(ZnnEmbeddedContractException);
            expect(error).to.be.instanceOf(ZnnClientException);
            expect(error).to.be.instanceOf(ZnnSDKException);
            expect(error.message).to.equal(message);
        });
    }

    it("falls through to a plain ZnnClientException for an unknown message", () => {
        const error = mapNodeError("some unrelated node error", -1);

        expect(error).to.be.instanceOf(ZnnClientException);
        expect(error).to.not.be.instanceOf(ZnnEmbeddedContractException);
        expect(error.message).to.equal("some unrelated node error");
    });

    it("does not map the generic pre-activation 'contract does not exist' string", () => {
        const error = mapNodeError("contract does not exist", -1);

        expect(error).to.be.instanceOf(ZnnClientException);
        expect(error).to.not.be.instanceOf(ZnnEmbeddedContractException);
    });

    it("distinguishes 'multisig-auth must be zero' from 'multisig-auth is missing'", () => {
        const error = mapNodeError("account-block multisig-auth must be zero", -1);

        expect(error).to.be.instanceOf(AccountBlockMultisigAuthMustBeZeroException);
        expect(error).to.not.be.instanceOf(AccountBlockMultisigAuthMissingException);
    });
});

describe("LedgerApi.publishRawTransaction — typed errors from a non-null result", () => {
    let ledgerApi: LedgerApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        ledgerApi = new LedgerApi();
        ledgerApi.setClient(mockClient);
    });

    it("throws the typed subclass for a non-null STRING publish result containing a verifier string", async () => {
        const template = new AccountBlockTemplate({ blockType: BlockTypeEnum.UserSend });
        mockClient.setMockResponse("ledger.publishRawTransaction", "multisig: policy is locked");

        let error: Error | null = null;
        try {
            await ledgerApi.publishRawTransaction(template);
        } catch (err) {
            error = err as Error;
        }

        expect(error).to.be.instanceOf(MultisigPolicyLockedException);
    });

    it("degrades to a plain ZnnClientException for a non-null OBJECT publish result (does not throw on .includes)", async () => {
        const template = new AccountBlockTemplate({ blockType: BlockTypeEnum.UserSend });
        mockClient.setMockResponse("ledger.publishRawTransaction", { code: 1, reason: "unknown" });

        let error: Error | null = null;
        try {
            await ledgerApi.publishRawTransaction(template);
        } catch (err) {
            error = err as Error;
        }

        expect(error).to.exist;
        expect(error).to.be.instanceOf(ZnnClientException);
        expect(error).to.not.be.instanceOf(ZnnEmbeddedContractException);
    });

    // Skipped: needs a real node's non-null publish-result shape for an
    // object-bodied verifier error (e.g. multisig threshold/policy failures).
    // Asserting a self-computed shape here would just check the matcher
    // against a guess, not against what the node actually returns.
    it.skip("typed-matches a verifier error carried in an OBJECT publish result", async () => {
    });
});
