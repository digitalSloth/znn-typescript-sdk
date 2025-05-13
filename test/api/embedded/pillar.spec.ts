import { expect } from "chai";
import { PillarApi } from "../../../src/api/embedded/pillar.js";
import { PILLAR_REGISTER_ZNN_AMOUNT } from "../../../src/api/embedded/constants.js";
import { Pillar as PillarContract, Common as CommonContract } from "../../../src/embedded/index.js";
import {
    DelegationInfo,
    PillarEpochHistoryList,
    PillarInfo,
    PillarInfoList,
    RewardHistoryList,
    UncollectedReward
} from "../../../src/model/embedded/index.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import {
    Address,
    PILLAR_ADDRESS,
    ZNN_ZTS
} from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { BigNumber } from "../../../src/utilities/bignumber.js";
import { MockClient } from "../mockClient.js";

const ADDRESS = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const OTHER_ADDRESS = "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp";

const makePillarInfoJson = (overrides: Record<string, any> = {}) => ({
    name: "pillar-a",
    rank: 1,
    type: 1,
    ownerAddress: ADDRESS,
    producerAddress: OTHER_ADDRESS,
    withdrawAddress: ADDRESS,
    giveMomentumRewardPercentage: 30,
    giveDelegateRewardPercentage: 70,
    isRevocable: true,
    revokeCooldown: 100,
    revokeTimestamp: 200,
    currentStats: { producedMomentums: 10, expectedMomentums: 12 },
    weight: "1234",
    ...overrides
});

const makePillarInfoListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [makePillarInfoJson()],
    ...overrides
});

const makeDelegationInfoJson = (overrides: Record<string, any> = {}) => ({
    name: "pillar-a",
    status: 1,
    weight: "500",
    ...overrides
});

const makePillarEpochHistoryListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [{
        name: "pillar-a",
        epoch: 1,
        giveBlockRewardPercentage: 10,
        giveDelegateRewardPercentage: 90,
        producedBlockNum: 5,
        expectedBlockNum: 6,
        weight: "400"
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

describe("PillarApi", () => {
    let pillarApi: PillarApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        pillarApi = new PillarApi();
        pillarApi.setClient(mockClient);
    });

    describe("getQsrRegistrationCost", () => {
        it("should fetch the QSR registration cost", async () => {
            mockClient.setMockResponse("embedded.pillar.getQsrRegistrationCost", "123");

            const result = await pillarApi.getQsrRegistrationCost();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.getQsrRegistrationCost");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result.toString()).to.equal("123");
        });
    });

    describe("getAll", () => {
        it("should fetch and parse pillar list", async () => {
            mockClient.setMockResponse("embedded.pillar.getAll", makePillarInfoListJson());

            const result = await pillarApi.getAll(0, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.getAll");
            expect(lastCall!.parameters).to.deep.equal([0, 5]);

            expect(result).to.be.instanceOf(PillarInfoList);
            expect(result.list[0]).to.be.instanceOf(PillarInfo);
            expect(result.list[0].name).to.equal("pillar-a");
        });
    });

    describe("getByOwner", () => {
        it("should fetch pillars by owner", async () => {
            mockClient.setMockResponse("embedded.pillar.getByOwner", [makePillarInfoJson()]);

            const address = Address.parse(ADDRESS);
            const result = await pillarApi.getByOwner(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.getByOwner");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result[0]).to.be.instanceOf(PillarInfo);
        });
    });

    describe("getByName", () => {
        it("should fetch a pillar by name", async () => {
            mockClient.setMockResponse("embedded.pillar.getByName", makePillarInfoJson());

            const result = await pillarApi.getByName("pillar-a");

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.getByName");
            expect(lastCall!.parameters).to.deep.equal(["pillar-a"]);

            expect(result).to.be.instanceOf(PillarInfo);
        });

        it("should return null when pillar is missing", async () => {
            mockClient.setMockResponse("embedded.pillar.getByName", null);

            const result = await pillarApi.getByName("missing");

            expect(result).to.equal(null);
        });
    });

    describe("checkNameAvailability", () => {
        it("should check name availability", async () => {
            mockClient.setMockResponse("embedded.pillar.checkNameAvailability", true);

            const result = await pillarApi.checkNameAvailability("pillar-a");

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.checkNameAvailability");
            expect(lastCall!.parameters).to.deep.equal(["pillar-a"]);

            expect(result).to.equal(true);
        });
    });

    describe("getDelegatedPillar", () => {
        it("should fetch delegation info", async () => {
            mockClient.setMockResponse("embedded.pillar.getDelegatedPillar", makeDelegationInfoJson());

            const address = Address.parse(ADDRESS);
            const result = await pillarApi.getDelegatedPillar(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.getDelegatedPillar");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result).to.be.instanceOf(DelegationInfo);
            expect(result!.name).to.equal("pillar-a");
        });

        it("should return null when no delegation exists", async () => {
            mockClient.setMockResponse("embedded.pillar.getDelegatedPillar", null);

            const address = Address.parse(ADDRESS);
            const result = await pillarApi.getDelegatedPillar(address);

            expect(result).to.equal(null);
        });
    });

    describe("getPillarEpochHistory", () => {
        it("should fetch pillar epoch history", async () => {
            mockClient.setMockResponse("embedded.pillar.getPillarEpochHistory", makePillarEpochHistoryListJson());

            const result = await pillarApi.getPillarEpochHistory("pillar-a", 0, 2);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.getPillarEpochHistory");
            expect(lastCall!.parameters).to.deep.equal(["pillar-a", 0, 2]);

            expect(result).to.be.instanceOf(PillarEpochHistoryList);
            expect(result.list[0].epoch).to.equal(1);
        });
    });

    describe("getPillarsHistoryByEpoch", () => {
        it("should fetch pillar history by epoch", async () => {
            mockClient.setMockResponse("embedded.pillar.getPillarsHistoryByEpoch", makePillarEpochHistoryListJson());

            const result = await pillarApi.getPillarsHistoryByEpoch(3, 1, 4);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.getPillarsHistoryByEpoch");
            expect(lastCall!.parameters).to.deep.equal([3, 1, 4]);

            expect(result).to.be.instanceOf(PillarEpochHistoryList);
        });
    });

    describe("getDepositedQsr", () => {
        it("should fetch deposited QSR", async () => {
            mockClient.setMockResponse("embedded.pillar.getDepositedQsr", "77");

            const address = Address.parse(ADDRESS);
            const result = await pillarApi.getDepositedQsr(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.getDepositedQsr");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result.toString()).to.equal("77");
        });
    });

    describe("getUncollectedReward", () => {
        it("should fetch uncollected rewards", async () => {
            const mockResponse = { address: ADDRESS, znnAmount: "10", qsrAmount: "20" };
            mockClient.setMockResponse("embedded.pillar.getUncollectedReward", mockResponse);

            const address = Address.parse(ADDRESS);
            const result = await pillarApi.getUncollectedReward(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.getUncollectedReward");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result).to.be.instanceOf(UncollectedReward);
            expect(result.znnAmount.toString()).to.equal("10");
        });
    });

    describe("getFrontierRewardByPage", () => {
        it("should fetch reward history", async () => {
            mockClient.setMockResponse("embedded.pillar.getFrontierRewardByPage", makeRewardHistoryListJson());

            const address = Address.parse(ADDRESS);
            const result = await pillarApi.getFrontierRewardByPage(address, 0, 1);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.pillar.getFrontierRewardByPage");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 0, 1]);

            expect(result).to.be.instanceOf(RewardHistoryList);
        });
    });

    describe("register", () => {
        it("should build a register block", () => {
            const producer = Address.parse(OTHER_ADDRESS);
            const reward = Address.parse(ADDRESS);
            const template = pillarApi.register("pillar-a", producer, reward, 25, 75);

            const expectedData = PillarContract.abi.encodeFunctionData("Register", [
                "pillar-a",
                producer.toString(),
                reward.toString(),
                25,
                75
            ]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(PILLAR_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.amount.toString()).to.equal(PILLAR_REGISTER_ZNN_AMOUNT.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("registerLegacy", () => {
        it("should build a register legacy block", () => {
            const producer = Address.parse(OTHER_ADDRESS);
            const reward = Address.parse(ADDRESS);
            const template = pillarApi.registerLegacy(
                "pillar-a",
                producer,
                reward,
                "pub",
                "sig",
                10,
                90
            );

            const expectedData = PillarContract.abi.encodeFunctionData("RegisterLegacy", [
                "pillar-a",
                producer.toString(),
                reward.toString(),
                10,
                90,
                "pub",
                "sig"
            ]);

            expect(template.amount.toString()).to.equal(PILLAR_REGISTER_ZNN_AMOUNT.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("updatePillar", () => {
        it("should build an update pillar block", () => {
            const producer = Address.parse(OTHER_ADDRESS);
            const reward = Address.parse(ADDRESS);
            const template = pillarApi.updatePillar("pillar-a", producer, reward, 20, 80);

            const expectedData = PillarContract.abi.encodeFunctionData("UpdatePillar", [
                "pillar-a",
                producer.toString(),
                reward.toString(),
                20,
                80
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("revoke", () => {
        it("should build a revoke block", () => {
            const template = pillarApi.revoke("pillar-a");
            const expectedData = PillarContract.abi.encodeFunctionData("Revoke", ["pillar-a"]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("delegate", () => {
        it("should build a delegate block", () => {
            const template = pillarApi.delegate("pillar-a");
            const expectedData = PillarContract.abi.encodeFunctionData("Delegate", ["pillar-a"]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("undelegate", () => {
        it("should build an undelegate block", () => {
            const template = pillarApi.undelegate();
            const expectedData = PillarContract.abi.encodeFunctionData("Undelegate", []);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("collectRewards", () => {
        it("should build a collect rewards block", () => {
            const template = pillarApi.collectRewards();
            const expectedData = CommonContract.abi.encodeFunctionData("CollectReward", []);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("depositQsr", () => {
        it("should build a deposit QSR block", () => {
            const amount = BigNumber.from(100);
            const template = pillarApi.depositQsr(amount);
            const expectedData = CommonContract.abi.encodeFunctionData("DepositQsr", []);

            expect(template.amount.toString()).to.equal(amount.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("withdrawQsr", () => {
        it("should build a withdraw QSR block", () => {
            const template = pillarApi.withdrawQsr();
            const expectedData = CommonContract.abi.encodeFunctionData("WithdrawQsr", []);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
