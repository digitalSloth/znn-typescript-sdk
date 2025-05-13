import { expect } from "chai";
import { SentinelApi } from "../../../src/api/embedded/sentinel.js";
import { SENTINEL_REGISTER_ZNN_AMOUNT } from "../../../src/api/embedded/constants.js";
import { Sentinel as SentinelContract, Common as CommonContract } from "../../../src/embedded/index.js";
import {
    RewardHistoryList,
    SentinelInfo,
    SentinelInfoList,
    UncollectedReward
} from "../../../src/model/embedded/index.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import {
    Address,
    SENTINEL_ADDRESS,
    ZNN_ZTS
} from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { BigNumber } from "../../../src/utilities/bignumber.js";
import { MockClient } from "../mockClient.js";

const ADDRESS = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";

const makeSentinelInfoJson = (overrides: Record<string, any> = {}) => ({
    owner: ADDRESS,
    registrationTimestamp: 1700000000,
    isRevocable: true,
    revokeCooldown: 100,
    active: true,
    ...overrides
});

const makeSentinelInfoListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [makeSentinelInfoJson()],
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

describe("SentinelApi", () => {
    let sentinelApi: SentinelApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        sentinelApi = new SentinelApi();
        sentinelApi.setClient(mockClient);
    });

    describe("getAllActive", () => {
        it("should fetch and parse active sentinels", async () => {
            mockClient.setMockResponse("embedded.sentinel.getAllActive", makeSentinelInfoListJson());

            const result = await sentinelApi.getAllActive(0, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.sentinel.getAllActive");
            expect(lastCall!.parameters).to.deep.equal([0, 5]);

            expect(result).to.be.instanceOf(SentinelInfoList);
            expect(result.list[0]).to.be.instanceOf(SentinelInfo);
        });
    });

    describe("getByOwner", () => {
        it("should fetch sentinel by owner", async () => {
            mockClient.setMockResponse("embedded.sentinel.getByOwner", makeSentinelInfoJson());

            const owner = Address.parse(ADDRESS);
            const result = await sentinelApi.getByOwner(owner);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.sentinel.getByOwner");
            expect(lastCall!.parameters).to.deep.equal([owner.toString()]);

            expect(result).to.be.instanceOf(SentinelInfo);
        });

        it("should return null when sentinel is missing", async () => {
            mockClient.setMockResponse("embedded.sentinel.getByOwner", null);

            const owner = Address.parse(ADDRESS);
            const result = await sentinelApi.getByOwner(owner);

            expect(result).to.equal(null);
        });
    });

    describe("getDepositedQsr", () => {
        it("should fetch deposited QSR", async () => {
            mockClient.setMockResponse("embedded.sentinel.getDepositedQsr", "77");

            const address = Address.parse(ADDRESS);
            const result = await sentinelApi.getDepositedQsr(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.sentinel.getDepositedQsr");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result.toString()).to.equal("77");
        });
    });

    describe("getUncollectedReward", () => {
        it("should fetch uncollected rewards", async () => {
            const mockResponse = { address: ADDRESS, znnAmount: "10", qsrAmount: "20" };
            mockClient.setMockResponse("embedded.sentinel.getUncollectedReward", mockResponse);

            const address = Address.parse(ADDRESS);
            const result = await sentinelApi.getUncollectedReward(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.sentinel.getUncollectedReward");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result).to.be.instanceOf(UncollectedReward);
            expect(result.znnAmount.toString()).to.equal("10");
        });
    });

    describe("getFrontierRewardByPage", () => {
        it("should fetch reward history", async () => {
            mockClient.setMockResponse("embedded.sentinel.getFrontierRewardByPage", makeRewardHistoryListJson());

            const address = Address.parse(ADDRESS);
            const result = await sentinelApi.getFrontierRewardByPage(address, 0, 2);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.sentinel.getFrontierRewardByPage");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 0, 2]);

            expect(result).to.be.instanceOf(RewardHistoryList);
            expect(result.list[0].epoch).to.equal(1);
        });
    });

    describe("register", () => {
        it("should build a register block", () => {
            const template = sentinelApi.register();
            const expectedData = SentinelContract.abi.encodeFunctionData("Register", []);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(SENTINEL_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.amount.toString()).to.equal(SENTINEL_REGISTER_ZNN_AMOUNT.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("revoke", () => {
        it("should build a revoke block", () => {
            const template = sentinelApi.revoke();
            const expectedData = SentinelContract.abi.encodeFunctionData("Revoke", []);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("collectRewards", () => {
        it("should build a collect rewards block", () => {
            const template = sentinelApi.collectRewards();
            const expectedData = CommonContract.abi.encodeFunctionData("CollectReward", []);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("depositQsr", () => {
        it("should build a deposit QSR block", () => {
            const amount = BigNumber.from(100);
            const template = sentinelApi.depositQsr(amount);
            const expectedData = CommonContract.abi.encodeFunctionData("DepositQsr", []);

            expect(template.amount.toString()).to.equal(amount.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("withdrawQsr", () => {
        it("should build a withdraw QSR block", () => {
            const template = sentinelApi.withdrawQsr();
            const expectedData = CommonContract.abi.encodeFunctionData("WithdrawQsr", []);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
