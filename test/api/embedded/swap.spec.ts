import { expect } from "chai";
import { SwapApi } from "../../../src/api/embedded/swap.js";
import { Swap as SwapContract } from "../../../src/embedded/swap.js";
import {
    SwapAssetEntry,
    SwapAssetList,
    SwapLegacyPillarList
} from "../../../src/model/embedded/swap.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import { Hash, SWAP_ADDRESS, ZNN_ZTS } from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { BigNumber } from "../../../src/utilities/bignumber.js";
import { MockClient } from "../mockClient.js";

const HASH_A = "a".repeat(64);

const makeSwapAssetListJson = (overrides: Record<string, any> = {}) => ({
    [HASH_A]: { qsr: "10", znn: "20" },
    ...overrides
});

const makeLegacyPillarListJson = (overrides: Array<Record<string, any>> = []) => ([
    { numPillars: 2, keyIdHash: HASH_A },
    ...overrides
]);

describe("SwapApi", () => {
    let swapApi: SwapApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        swapApi = new SwapApi();
        swapApi.setClient(mockClient);
    });

    describe("getAssetsByKeyIdHash", () => {
        it("should fetch swap assets by key id hash", async () => {
            const mockResponse = { qsr: "10", znn: "20" };
            mockClient.setMockResponse("embedded.swap.getAssetsByKeyIdHash", mockResponse);

            const result = await swapApi.getAssetsByKeyIdHash(HASH_A);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.swap.getAssetsByKeyIdHash");
            expect(lastCall!.parameters).to.deep.equal([HASH_A]);

            expect(result).to.be.instanceOf(SwapAssetEntry);
            expect(result!.keyIdHash.toString()).to.equal(HASH_A);
        });

        it("should return null when entry is missing", async () => {
            mockClient.setMockResponse("embedded.swap.getAssetsByKeyIdHash", null);

            const result = await swapApi.getAssetsByKeyIdHash(HASH_A);

            expect(result).to.equal(null);
        });
    });

    describe("getAssets", () => {
        it("should fetch and parse swap assets", async () => {
            mockClient.setMockResponse("embedded.swap.getAssets", makeSwapAssetListJson());

            const result = await swapApi.getAssets();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.swap.getAssets");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(SwapAssetList);
            expect(result.list[HASH_A]).to.be.instanceOf(SwapAssetEntry);
        });
    });

    describe("getLegacyPillars", () => {
        it("should fetch legacy pillars", async () => {
            mockClient.setMockResponse("embedded.swap.getLegacyPillars", makeLegacyPillarListJson());

            const result = await swapApi.getLegacyPillars();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.swap.getLegacyPillars");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(SwapLegacyPillarList);
            expect(result.list[0].keyIdHash.toString()).to.equal(HASH_A);
        });
    });

    describe("retrieveAssets", () => {
        it("should build a retrieve assets block", () => {
            const template = swapApi.retrieveAssets("pub", "sig");
            const expectedData = SwapContract.abi.encodeFunctionData("RetrieveAssets", ["pub", "sig"]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(SWAP_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.amount.toString()).to.equal(BigNumber.from(0).toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
