import { expect } from "chai";
import { StakeApi } from "../../../src/api/embedded/stake.js";
import { Stake as StakeContract, Common as CommonContract } from "../../../src/embedded/index.js";
import {
    RewardHistoryList,
    StakeEntry,
    StakeList,
    UncollectedReward
} from "../../../src/model/embedded/index.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import {
    Address,
    Hash,
    STAKE_ADDRESS,
    ZNN_ZTS
} from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { BigNumber } from "../../../src/utilities/bignumber.js";
import { MockClient } from "../mockClient.js";

const ADDRESS = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const HASH_A = "a".repeat(64);

const makeStakeListJson = (overrides: Record<string, any> = {}) => ({
    totalAmount: 1000,
    totalWeightedAmount: 2000,
    count: 1,
    list: [{
        amount: "100",
        weightedAmount: "200",
        startTimestamp: 1,
        expirationTimestamp: 2,
        address: ADDRESS,
        id: HASH_A
    }],
    ...overrides
});

const makeRewardHistoryListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [{
        epoch: 1,
        znnAmount: "5",
        qsrAmount: "6"
    }],
    ...overrides
});

describe("StakeApi", () => {
    let stakeApi: StakeApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        stakeApi = new StakeApi();
        stakeApi.setClient(mockClient);
    });

    describe("getEntriesByAddress", () => {
        it("should fetch and parse stake entries", async () => {
            mockClient.setMockResponse("embedded.stake.getEntriesByAddress", makeStakeListJson());

            const address = Address.parse(ADDRESS);
            const result = await stakeApi.getEntriesByAddress(address, 0, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.stake.getEntriesByAddress");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 0, 5]);

            expect(result).to.be.instanceOf(StakeList);
            expect(result.list[0]).to.be.instanceOf(StakeEntry);
            expect(result.list[0].id.toString()).to.equal(HASH_A);
        });
    });

    describe("getUncollectedReward", () => {
        it("should fetch uncollected rewards", async () => {
            const mockResponse = { address: ADDRESS, znnAmount: "10", qsrAmount: "20" };
            mockClient.setMockResponse("embedded.stake.getUncollectedReward", mockResponse);

            const address = Address.parse(ADDRESS);
            const result = await stakeApi.getUncollectedReward(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.stake.getUncollectedReward");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result).to.be.instanceOf(UncollectedReward);
            expect(result.znnAmount.toString()).to.equal("10");
        });
    });

    describe("getFrontierRewardByPage", () => {
        it("should fetch reward history", async () => {
            mockClient.setMockResponse("embedded.stake.getFrontierRewardByPage", makeRewardHistoryListJson());

            const address = Address.parse(ADDRESS);
            const result = await stakeApi.getFrontierRewardByPage(address, 0, 2);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.stake.getFrontierRewardByPage");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 0, 2]);

            expect(result).to.be.instanceOf(RewardHistoryList);
        });
    });

    describe("stake", () => {
        it("should build a stake block", () => {
            const amount = BigNumber.from(100);
            const template = stakeApi.stake(3600, amount);

            const expectedData = StakeContract.abi.encodeFunctionData("Stake", [3600]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(STAKE_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.amount.toString()).to.equal(amount.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("cancel", () => {
        it("should build a cancel stake block", () => {
            const id = Hash.parse(HASH_A);
            const template = stakeApi.cancel(id);

            const expectedData = StakeContract.abi.encodeFunctionData("Cancel", [id.getBytes()]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("collectReward", () => {
        it("should build a collect reward block", () => {
            const template = stakeApi.collectReward();
            const expectedData = CommonContract.abi.encodeFunctionData("CollectReward", []);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
