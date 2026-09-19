import { expect } from "chai";
import { MultisigApi } from "../../../src/api/embedded/multisig.js";
import { Multisig as MultisigContract } from "../../../src/embedded/multisig.js";
import { ONE_ZNN } from "../../../src/api/embedded/constants.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import { Address, MULTISIG_ADDRESS, ZNN_ZTS } from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { MultisigCreatorMustBeSingleSigException } from "../../../src/client/nodeErrors.js";
import { MockClient } from "../mockClient.js";

describe("MultisigApi", () => {
    let multisigApi: MultisigApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        multisigApi = new MultisigApi();
        multisigApi.setClient(mockClient);
    });

    describe("createMultisig", () => {
        it("should build a create multisig block burning 1 ZNN", () => {
            const creator = Address.fromPublicKey(Buffer.alloc(32, 1));
            const nonce = 1n;
            const threshold = 2;
            const signers = [Buffer.alloc(32, 1), Buffer.alloc(32, 2)];

            const template = multisigApi.createMultisig(creator, nonce, threshold, signers);
            const expectedData = MultisigContract.abi.encodeFunctionData("CreateMultisig", [nonce, threshold, signers]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(MULTISIG_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.amount.toString()).to.equal(BigInt(ONE_ZNN).toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });

        it("should throw when the creator is itself a multisig address", () => {
            const multisigCreator = Address.fromMultisigCreation(Buffer.alloc(32, 1), 1n);
            const nonce = 1n;
            const threshold = 2;
            const signers = [Buffer.alloc(32, 1), Buffer.alloc(32, 2)];

            expect(() => multisigApi.createMultisig(multisigCreator, nonce, threshold, signers))
                .to.throw(MultisigCreatorMustBeSingleSigException);

            expect(mockClient.getLastCall()).to.not.exist;
        });
    });
});
