import { expect } from "chai";
import { SporkApi } from "../../../src/api/embedded/spork.js";
import { Spork as SporkContract } from "../../../src/embedded/index.js";
import { Spork, SporkList } from "../../../src/model/embedded/spork.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import { Hash, SPORK_ADDRESS, ZNN_ZTS } from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { BigNumber } from "../../../src/utilities/bignumber.js";
import { MockClient } from "../mockClient.js";

const HASH_A = "a".repeat(64);

const makeSporkListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [{
        id: HASH_A,
        name: "spork-a",
        description: "Spork description",
        activated: true,
        enforcementHeight: 123
    }],
    ...overrides
});

describe("SporkApi", () => {
    let sporkApi: SporkApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        sporkApi = new SporkApi();
        sporkApi.setClient(mockClient);
    });

    describe("getAll", () => {
        it("should fetch and parse sporks", async () => {
            mockClient.setMockResponse("embedded.spork.getAll", makeSporkListJson());

            const result = await sporkApi.getAll(0, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.spork.getAll");
            expect(lastCall!.parameters).to.deep.equal([0, 5]);

            expect(result).to.be.instanceOf(SporkList);
            expect(result.list[0]).to.be.instanceOf(Spork);
            expect(result.list[0].id.toString()).to.equal(HASH_A);
        });
    });

    describe("createSpork", () => {
        it("should build a create spork block", () => {
            const template = sporkApi.createSpork("spork-a", "Spork description");
            const expectedData = SporkContract.abi.encodeFunctionData("CreateSpork", [
                "spork-a",
                "Spork description"
            ]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(SPORK_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.amount.toString()).to.equal(BigNumber.from(0).toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("activateSpork", () => {
        it("should build an activate spork block", () => {
            const id = Hash.parse(HASH_A);
            const template = sporkApi.activateSpork(id);
            const expectedData = SporkContract.abi.encodeFunctionData("ActivateSpork", [
                id.getBytes()
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
