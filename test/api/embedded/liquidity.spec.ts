import { expect } from "chai";
import { LiquidityApi } from "../../../src/api/embedded/liquidity.js";
import { Liquidity as LiquidityContract, Common as CommonContract } from "../../../src/embedded/index.js";
import {
    LiquidityInfo,
    LiquidityStakeEntry,
    LiquidityStakeList,
    RewardDeposit,
    RewardHistoryList,
    SecurityInfo,
    TimeChallengesList
} from "../../../src/model/embedded/index.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import {
    Address,
    Hash,
    LIQUIDITY_ADDRESS,
    TokenStandard,
    ZNN_ZTS
} from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { MockClient } from "../mockClient.js";

const ADDRESS = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const OTHER_ADDRESS = "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp";
const TOKEN_STANDARD = "zts1znnxxxxxxxxxxxxx9z4ulx";
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

const makeLiquidityInfoJson = (overrides: Record<string, any> = {}) => ({
    administrator: ADDRESS,
    isHalted: false,
    znnReward: "100",
    qsrReward: "200",
    tokenTuples: [{
        tokenStandard: TOKEN_STANDARD,
        znnPercentage: 60,
        qsrPercentage: 40,
        minAmount: "500"
    }],
    ...overrides
});

const makeLiquidityStakeListJson = (overrides: Record<string, any> = {}) => ({
    totalAmount: "1000",
    totalWeightedAmount: "2000",
    count: 1,
    list: [{
        amount: "100",
        tokenStandard: TOKEN_STANDARD,
        weightedAmount: "200",
        startTime: 1,
        revokeTime: 2,
        expirationTime: 3,
        stakeAddress: ADDRESS,
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

const makeTimeChallengesListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [{
        MethodName: "SetTokenTuple",
        ParamsHash: HASH_B,
        ChallengeStartHeight: 99
    }],
    ...overrides
});

describe("LiquidityApi", () => {
    let liquidityApi: LiquidityApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        liquidityApi = new LiquidityApi();
        liquidityApi.setClient(mockClient);
    });

    describe("getLiquidityInfo", () => {
        it("should fetch and parse liquidity info", async () => {
            mockClient.setMockResponse("embedded.liquidity.getLiquidityInfo", makeLiquidityInfoJson());

            const result = await liquidityApi.getLiquidityInfo();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.liquidity.getLiquidityInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(LiquidityInfo);
            expect(result.administrator.toString()).to.equal(ADDRESS);
            expect(result.tokenTuples[0].tokenStandard.toString()).to.equal(TOKEN_STANDARD);
        });
    });

    describe("getLiquidityStakeEntriesByAddress", () => {
        it("should fetch and parse liquidity stake entries", async () => {
            mockClient.setMockResponse(
                "embedded.liquidity.getLiquidityStakeEntriesByAddress",
                makeLiquidityStakeListJson()
            );

            const address = Address.parse(ADDRESS);
            const result = await liquidityApi.getLiquidityStakeEntriesByAddress(address, 1, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.liquidity.getLiquidityStakeEntriesByAddress");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 1, 5]);

            expect(result).to.be.instanceOf(LiquidityStakeList);
            expect(result.list[0]).to.be.instanceOf(LiquidityStakeEntry);
            expect(result.list[0].id.toString()).to.equal(HASH_A);
        });
    });

    describe("getUncollectedReward", () => {
        it("should fetch and parse uncollected rewards", async () => {
            const mockResponse = { address: ADDRESS, znnAmount: "10", qsrAmount: "20" };
            mockClient.setMockResponse("embedded.liquidity.getUncollectedReward", mockResponse);

            const address = Address.parse(ADDRESS);
            const result = await liquidityApi.getUncollectedReward(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.liquidity.getUncollectedReward");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result).to.be.instanceOf(RewardDeposit);
            expect(result.znnAmount.toString()).to.equal("10");
        });
    });

    describe("getFrontierRewardByPage", () => {
        it("should fetch and parse frontier rewards", async () => {
            mockClient.setMockResponse("embedded.liquidity.getFrontierRewardByPage", makeRewardHistoryListJson());

            const address = Address.parse(ADDRESS);
            const result = await liquidityApi.getFrontierRewardByPage(address, 0, 2);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.liquidity.getFrontierRewardByPage");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 0, 2]);

            expect(result).to.be.instanceOf(RewardHistoryList);
            expect(result.list[0].epoch).to.equal(1);
        });
    });

    describe("getSecurityInfo", () => {
        it("should fetch and parse security info", async () => {
            const mockResponse = {
                guardians: [ADDRESS, OTHER_ADDRESS],
                guardiansVotes: [OTHER_ADDRESS],
                administratorDelay: 10,
                softDelay: 5
            };
            mockClient.setMockResponse("embedded.liquidity.getSecurityInfo", mockResponse);

            const result = await liquidityApi.getSecurityInfo();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.liquidity.getSecurityInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(SecurityInfo);
            expect(result.guardians[0].toString()).to.equal(ADDRESS);
        });
    });

    describe("getTimeChallengesInfo", () => {
        it("should fetch and parse time challenges info", async () => {
            mockClient.setMockResponse("embedded.liquidity.getTimeChallengesInfo", makeTimeChallengesListJson());

            const result = await liquidityApi.getTimeChallengesInfo();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.liquidity.getTimeChallengesInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(TimeChallengesList);
            expect(result.list[0].methodName).to.equal("SetTokenTuple");
            expect(result.list[0].paramsHash.toString()).to.equal(HASH_B);
            expect(result.list[0].challengeStartHeight).to.equal(99);
            expect(result.list[0].toJson()).to.deep.equal({
                MethodName: "SetTokenTuple",
                ParamsHash: HASH_B,
                ChallengeStartHeight: 99,
            });
        });
    });

    describe("liquidityStake", () => {
        it("should build a liquidity stake block", () => {
            const tokenStandard = TokenStandard.parse(TOKEN_STANDARD);
            const amount = BigInt(100);
            const template = liquidityApi.liquidityStake(3600, amount, tokenStandard);

            const expectedData = LiquidityContract.abi.encodeFunctionData("LiquidityStake", [3600]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(LIQUIDITY_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(tokenStandard.toString());
            expect(template.amount.toString()).to.equal(amount.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("cancelLiquidityStake", () => {
        it("should build a cancel liquidity stake block", () => {
            const id = Hash.parse(HASH_A);
            const template = liquidityApi.cancelLiquidityStake(id);

            const expectedData = LiquidityContract.abi.encodeFunctionData("CancelLiquidityStake", [
                id.getBytes()
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("unlockLiquidityStakeEntries", () => {
        it("should build an unlock liquidity stake entries block", () => {
            const tokenStandard = TokenStandard.parse(TOKEN_STANDARD);
            const template = liquidityApi.unlockLiquidityStakeEntries(tokenStandard);

            const expectedData = LiquidityContract.abi.encodeFunctionData("UnlockLiquidityStakeEntries", []);

            expect(template.amount.toString()).to.equal("0");
            expect(template.tokenStandard.toString()).to.equal(tokenStandard.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("setTokenTuple", () => {
        it("should encode the token tuple arrays", () => {
            const template = liquidityApi.setTokenTuple(
                [TOKEN_STANDARD],
                [10000],
                [10000],
                [100000000n]
            );
            const word = (hex: string) => hex.padStart(64, "0");
            const expectedData = "f0ad68db" + [
                "80",
                "100",
                "140",
                "180",
                "1",
                "20",
                "1a",
                "7a7473317a6e6e" + "78".repeat(13) + "397a34756c78" + "0".repeat(12),
                "1",
                "2710",
                "1",
                "2710",
                "1",
                "5f5e100",
            ].map((hex, index) => (index === 7 ? hex : word(hex))).join("");

            expect(template.toAddress.toString()).to.equal(LIQUIDITY_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex")).to.equal(expectedData);
        });
    });

    describe("nominateGuardians", () => {
        it("should build a nominate guardians block", () => {
            const guardians = [Address.parse(ADDRESS), Address.parse(OTHER_ADDRESS)];
            const template = liquidityApi.nominateGuardians(guardians);

            const expectedData = LiquidityContract.abi.encodeFunctionData("NominateGuardians", [
                guardians.map(address => address.toString())
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("proposeAdministrator", () => {
        it("should build a propose administrator block", () => {
            const address = Address.parse(ADDRESS);
            const template = liquidityApi.proposeAdministrator(address);

            const expectedData = LiquidityContract.abi.encodeFunctionData("ProposeAdministrator", [
                address.toString()
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("setIsHalted", () => {
        it("should build a set is halted block", () => {
            const template = liquidityApi.setIsHalted(true);
            const expectedData = LiquidityContract.abi.encodeFunctionData("SetIsHalted", [true]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("setAdditionalReward", () => {
        it("should build a set additional reward block", () => {
            const template = liquidityApi.setAdditionalReward(100, 200);

            const expectedData = LiquidityContract.abi.encodeFunctionData("SetAdditionalReward", [100, 200]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("changeAdministrator", () => {
        it("should build a change administrator block", () => {
            const address = Address.parse(ADDRESS);
            const template = liquidityApi.changeAdministrator(address);

            const expectedData = LiquidityContract.abi.encodeFunctionData("ChangeAdministrator", [
                address.toString()
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("collectReward", () => {
        it("should build a collect reward block", () => {
            const template = liquidityApi.collectReward();
            const expectedData = CommonContract.abi.encodeFunctionData("CollectReward", []);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("emergency", () => {
        it("should build an emergency block", () => {
            const template = liquidityApi.emergency();
            const expectedData = LiquidityContract.abi.encodeFunctionData("Emergency", []);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
