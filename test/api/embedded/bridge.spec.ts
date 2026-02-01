import { expect } from "chai";
import { BridgeApi } from "../../../src/api/embedded/bridge.js";
import { Bridge as BridgeContract } from "../../../src/embedded/index.js";
import {
    BridgeInfo,
    BridgeNetworkInfo,
    BridgeNetworkInfoList,
    OrchestratorInfo,
    SecurityInfo,
    TimeChallengesList,
    UnwrapTokenRequest,
    UnwrapTokenRequestList,
    WrapTokenRequest,
    WrapTokenRequestList,
    ZtsFeesInfo
} from "../../../src/model/embedded/index.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import {
    Address,
    BRIDGE_ADDRESS,
    Hash,
    TokenStandard,
    ZNN_ZTS
} from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { BigNumber } from "../../../src/utilities/bignumber.js";
import { MockClient } from "../mockClient.js";

const ADDRESS = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const OTHER_ADDRESS = "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp";
const TOKEN_STANDARD = "zts1znnxxxxxxxxxxxxx9z4ulx";
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);

const makeBridgeInfoJson = (overrides: Record<string, any> = {}) => ({
    administrator: ADDRESS,
    compressedTssECDSAPubKey: "compressed",
    decompressedTssECDSAPubKey: "decompressed",
    allowKeyGen: true,
    halted: false,
    unhaltedAt: 123,
    unhaltDurationInMomentums: 10,
    tssNonce: 7,
    metadata: "bridge-metadata",
    ...overrides
});

const makeOrchestratorInfoJson = (overrides: Record<string, any> = {}) => ({
    windowSize: 5,
    keyGenThreshold: 3,
    confirmationsToFinality: 15,
    estimatedMomentumTime: 10,
    allowKeyGenHeight: 42,
    ...overrides
});

const makeBridgeNetworkInfoJson = (overrides: Record<string, any> = {}) => ({
    networkClass: 1,
    chainId: 2,
    name: "Ethereum",
    contractAddress: "0x123",
    metadata: "network-metadata",
    tokenPairs: [{
        tokenStandard: TOKEN_STANDARD,
        tokenAddress: "0xabc",
        bridgeable: true,
        redeemable: true,
        owned: false,
        minAmount: "100",
        feePercentage: 10,
        redeemDelay: 5,
        metadata: "token-metadata"
    }],
    ...overrides
});

const makeBridgeNetworkInfoListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [makeBridgeNetworkInfoJson()],
    ...overrides
});

const makeWrapTokenRequestJson = (overrides: Record<string, any> = {}) => ({
    networkClass: 1,
    chainId: 2,
    id: HASH_A,
    toAddress: "0xrecipient",
    tokenStandard: TOKEN_STANDARD,
    tokenAddress: "0xabc",
    amount: "1000",
    fee: "10",
    signature: "sig",
    creationMomentumHeight: 123,
    confirmationsToFinality: 500,
    ...overrides
});

const makeWrapTokenRequestListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [makeWrapTokenRequestJson()],
    ...overrides
});

const makeUnwrapTokenRequestJson = (overrides: Record<string, any> = {}) => ({
    registrationMomentumHeight: 50,
    networkClass: 1,
    chainId: 2,
    transactionHash: HASH_B,
    logIndex: 4,
    toAddress: ADDRESS,
    tokenAddress: "0xdef",
    tokenStandard: TOKEN_STANDARD,
    amount: "2000",
    signature: "sig",
    redeemed: 0,
    revoked: 0,
    redeemableIn: 500,
    ...overrides
});

const makeUnwrapTokenRequestListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [makeUnwrapTokenRequestJson()],
    ...overrides
});

const makeTimeChallengesListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [{
        methodName: "SetNetwork",
        paramsHash: HASH_C,
        challengeStartHeight: 99
    }],
    ...overrides
});

describe("BridgeApi", () => {
    let bridgeApi: BridgeApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        bridgeApi = new BridgeApi();
        bridgeApi.setClient(mockClient);
    });

    describe("getBridgeInfo", () => {
        it("should fetch and parse bridge info", async () => {
            mockClient.setMockResponse("embedded.bridge.getBridgeInfo", makeBridgeInfoJson());

            const result = await bridgeApi.getBridgeInfo();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getBridgeInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(BridgeInfo);
            expect(result.administrator.toString()).to.equal(ADDRESS);
            expect(result.halted).to.equal(false);
        });
    });

    describe("getOrchestratorInfo", () => {
        it("should fetch and parse orchestrator info", async () => {
            mockClient.setMockResponse("embedded.bridge.getOrchestratorInfo", makeOrchestratorInfoJson());

            const result = await bridgeApi.getOrchestratorInfo();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getOrchestratorInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(OrchestratorInfo);
            expect(result.windowSize).to.equal(5);
        });
    });

    describe("getNetworkInfo", () => {
        it("should fetch and parse a network info entry", async () => {
            mockClient.setMockResponse("embedded.bridge.getNetworkInfo", makeBridgeNetworkInfoJson());

            const result = await bridgeApi.getNetworkInfo(1, 2);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getNetworkInfo");
            expect(lastCall!.parameters).to.deep.equal([1, 2]);

            expect(result).to.be.instanceOf(BridgeNetworkInfo);
            expect(result.name).to.equal("Ethereum");
            expect(result.tokenPairs[0].tokenStandard.toString()).to.equal(TOKEN_STANDARD);
        });
    });

    describe("getAllNetworks", () => {
        it("should fetch and parse all networks", async () => {
            mockClient.setMockResponse("embedded.bridge.getAllNetworks", makeBridgeNetworkInfoListJson());

            const result = await bridgeApi.getAllNetworks(0, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getAllNetworks");
            expect(lastCall!.parameters).to.deep.equal([0, 5]);

            expect(result).to.be.instanceOf(BridgeNetworkInfoList);
            expect(result.list[0]).to.be.instanceOf(BridgeNetworkInfo);
        });
    });

    describe("getWrapTokenRequestById", () => {
        it("should fetch and parse a wrap token request", async () => {
            mockClient.setMockResponse("embedded.bridge.getWrapTokenRequestById", makeWrapTokenRequestJson());

            const result = await bridgeApi.getWrapTokenRequestById(Hash.parse(HASH_A));

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getWrapTokenRequestById");
            expect(lastCall!.parameters).to.deep.equal([HASH_A]);

            expect(result).to.be.instanceOf(WrapTokenRequest);
            expect(result.id.toString()).to.equal(HASH_A);
        });
    });

    describe("getAllWrapTokenRequests", () => {
        it("should fetch and parse wrap token requests", async () => {
            mockClient.setMockResponse("embedded.bridge.getAllWrapTokenRequests", makeWrapTokenRequestListJson());

            const result = await bridgeApi.getAllWrapTokenRequests(1, 3);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getAllWrapTokenRequests");
            expect(lastCall!.parameters).to.deep.equal([1, 3]);

            expect(result).to.be.instanceOf(WrapTokenRequestList);
            expect(result.list[0]).to.be.instanceOf(WrapTokenRequest);
        });
    });

    describe("getAllWrapTokenRequestsByToAddress", () => {
        it("should fetch wrap token requests by address", async () => {
            mockClient.setMockResponse("embedded.bridge.getAllWrapTokenRequestsByToAddress", makeWrapTokenRequestListJson());

            const result = await bridgeApi.getAllWrapTokenRequestsByToAddress("0xrecipient", 0, 2);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getAllWrapTokenRequestsByToAddress");
            expect(lastCall!.parameters).to.deep.equal(["0xrecipient", 0, 2]);

            expect(result).to.be.instanceOf(WrapTokenRequestList);
        });
    });

    describe("getAllWrapTokenRequestsByToAddressNetworkClassAndChainId", () => {
        it("should fetch wrap token requests by address and network", async () => {
            mockClient.setMockResponse(
                "embedded.bridge.getAllWrapTokenRequestsByToAddressNetworkClassAndChainId",
                makeWrapTokenRequestListJson()
            );

            const result = await bridgeApi.getAllWrapTokenRequestsByToAddressNetworkClassAndChainId(
                "0xrecipient",
                1,
                2,
                0,
                5
            );

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method)
                .to.equal("embedded.bridge.getAllWrapTokenRequestsByToAddressNetworkClassAndChainId");
            expect(lastCall!.parameters).to.deep.equal(["0xrecipient", 1, 2, 0, 5]);

            expect(result).to.be.instanceOf(WrapTokenRequestList);
        });
    });

    describe("getAllUnsignedWrapTokenRequests", () => {
        it("should fetch unsigned wrap token requests", async () => {
            mockClient.setMockResponse("embedded.bridge.getAllUnsignedWrapTokenRequests", makeWrapTokenRequestListJson());

            const result = await bridgeApi.getAllUnsignedWrapTokenRequests(0, 1);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getAllUnsignedWrapTokenRequests");
            expect(lastCall!.parameters).to.deep.equal([0, 1]);

            expect(result).to.be.instanceOf(WrapTokenRequestList);
        });
    });

    describe("getUnwrapTokenRequestByHashAndLog", () => {
        it("should fetch and parse an unwrap token request", async () => {
            mockClient.setMockResponse("embedded.bridge.getUnwrapTokenRequestByHashAndLog", makeUnwrapTokenRequestJson());

            const result = await bridgeApi.getUnwrapTokenRequestByHashAndLog(Hash.parse(HASH_B), 4);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getUnwrapTokenRequestByHashAndLog");
            expect(lastCall!.parameters).to.deep.equal([HASH_B, 4]);

            expect(result).to.be.instanceOf(UnwrapTokenRequest);
            expect(result.transactionHash.toString()).to.equal(HASH_B);
        });
    });

    describe("getAllUnwrapTokenRequests", () => {
        it("should fetch unwrap token requests", async () => {
            mockClient.setMockResponse("embedded.bridge.getAllUnwrapTokenRequests", makeUnwrapTokenRequestListJson());

            const result = await bridgeApi.getAllUnwrapTokenRequests(1, 4);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getAllUnwrapTokenRequests");
            expect(lastCall!.parameters).to.deep.equal([1, 4]);

            expect(result).to.be.instanceOf(UnwrapTokenRequestList);
            expect(result.list[0]).to.be.instanceOf(UnwrapTokenRequest);
        });
    });

    describe("getAllUnwrapTokenRequestsByToAddress", () => {
        it("should fetch unwrap token requests by address", async () => {
            mockClient.setMockResponse("embedded.bridge.getAllUnwrapTokenRequestsByToAddress", makeUnwrapTokenRequestListJson());

            const result = await bridgeApi.getAllUnwrapTokenRequestsByToAddress(ADDRESS, 0, 3);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getAllUnwrapTokenRequestsByToAddress");
            expect(lastCall!.parameters).to.deep.equal([ADDRESS, 0, 3]);

            expect(result).to.be.instanceOf(UnwrapTokenRequestList);
        });
    });

    describe("getFeeTokenPair", () => {
        it("should fetch and parse fee token info", async () => {
            const mockResponse = { tokenStandard: TOKEN_STANDARD, accumulatedFee: "500" };
            mockClient.setMockResponse("embedded.bridge.getFeeTokenPair", mockResponse);

            const result = await bridgeApi.getFeeTokenPair(TokenStandard.parse(TOKEN_STANDARD));

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getFeeTokenPair");
            expect(lastCall!.parameters).to.deep.equal([TOKEN_STANDARD]);

            expect(result).to.be.instanceOf(ZtsFeesInfo);
            expect(result.accumulatedFee.toString()).to.equal("500");
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
            mockClient.setMockResponse("embedded.bridge.getSecurityInfo", mockResponse);

            const result = await bridgeApi.getSecurityInfo();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getSecurityInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(SecurityInfo);
            expect(result.guardians[0].toString()).to.equal(ADDRESS);
        });
    });

    describe("getTimeChallengesInfo", () => {
        it("should fetch and parse time challenges", async () => {
            mockClient.setMockResponse("embedded.bridge.getTimeChallengesInfo", makeTimeChallengesListJson());

            const result = await bridgeApi.getTimeChallengesInfo();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.bridge.getTimeChallengesInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(TimeChallengesList);
            expect(result.list[0].paramsHash.toString()).to.equal(HASH_C);
        });
    });

    describe("wrapToken", () => {
        it("should build a wrap token block", () => {
            const tokenStandard = TokenStandard.parse(TOKEN_STANDARD);
            const amount = BigNumber.from(100);

            const template = bridgeApi.wrapToken(1, 2, "0xrecipient", amount, tokenStandard);

            const expectedData = BridgeContract.abi.encodeFunctionData("WrapToken", [
                1,
                2,
                "0xrecipient"
            ]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(BRIDGE_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(tokenStandard.toString());
            expect(template.amount.toString()).to.equal(amount.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("updateWrapRequest", () => {
        it("should build an update wrap request block", () => {
            const id = Hash.parse(HASH_A);
            const template = bridgeApi.updateWrapRequest(id, "signature");

            const expectedData = BridgeContract.abi.encodeFunctionData("UpdateWrapRequest", [
                id.getBytes(),
                "signature"
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("halt", () => {
        it("should build a halt block", () => {
            const template = bridgeApi.halt("signature");

            const expectedData = BridgeContract.abi.encodeFunctionData("Halt", ["signature"]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("changeTssECDSAPubKey", () => {
        it("should build a change key block", () => {
            const template = bridgeApi.changeTssECDSAPubKey("pub", "oldSig", "newSig");

            const expectedData = BridgeContract.abi.encodeFunctionData("ChangeTssECDSAPubKey", [
                "pub",
                "oldSig",
                "newSig"
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("redeem", () => {
        it("should build a redeem block", () => {
            const hash = Hash.parse(HASH_A);
            const template = bridgeApi.redeem(hash, 2);

            const expectedData = BridgeContract.abi.encodeFunctionData("Redeem", [
                hash.getBytes(),
                2
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("unwrapToken", () => {
        it("should build an unwrap token block", () => {
            const hash = Hash.parse(HASH_B);
            const toAddress = Address.parse(ADDRESS);
            const amount = BigNumber.from(300);

            const template = bridgeApi.unwrapToken(
                1,
                2,
                hash,
                4,
                toAddress,
                "0xdef",
                amount,
                "sig"
            );

            const expectedData = BridgeContract.abi.encodeFunctionData("UnwrapToken", [
                1,
                2,
                hash.getBytes(),
                4,
                toAddress.toString(),
                "0xdef",
                amount.toString(),
                "sig"
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("proposeAdministrator", () => {
        it("should build a propose administrator block", () => {
            const address = Address.parse(ADDRESS);
            const template = bridgeApi.proposeAdministrator(address);

            const expectedData = BridgeContract.abi.encodeFunctionData("ProposeAdministrator", [
                address.toString()
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("setNetwork", () => {
        it("should build a set network block", () => {
            const template = bridgeApi.setNetwork(1, 2, "Ethereum", "0x123", "meta");

            const expectedData = BridgeContract.abi.encodeFunctionData("SetNetwork", [
                1,
                2,
                "Ethereum",
                "0x123",
                "meta"
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("removeNetwork", () => {
        it("should build a remove network block", () => {
            const template = bridgeApi.removeNetwork(1, 2);

            const expectedData = BridgeContract.abi.encodeFunctionData("RemoveNetwork", [1, 2]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("setTokenPair", () => {
        it("should build a set token pair block", () => {
            const tokenStandard = TokenStandard.parse(TOKEN_STANDARD);
            const minAmount = BigNumber.from(1000);

            const template = bridgeApi.setTokenPair(
                1,
                2,
                tokenStandard,
                "0xabc",
                true,
                false,
                true,
                minAmount,
                5,
                10,
                "meta"
            );

            const expectedData = BridgeContract.abi.encodeFunctionData("SetTokenPair", [
                1,
                2,
                tokenStandard.toString(),
                "0xabc",
                true,
                false,
                true,
                minAmount.toString(),
                5,
                10,
                "meta"
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("setNetworkMetadata", () => {
        it("should build a set network metadata block", () => {
            const template = bridgeApi.setNetworkMetadata(1, 2, "meta");

            const expectedData = BridgeContract.abi.encodeFunctionData("SetNetworkMetadata", [
                1,
                2,
                "meta"
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("removeTokenPair", () => {
        it("should build a remove token pair block", () => {
            const tokenStandard = TokenStandard.parse(TOKEN_STANDARD);
            const template = bridgeApi.removeTokenPair(1, 2, tokenStandard, "0xabc");

            const expectedData = BridgeContract.abi.encodeFunctionData("RemoveTokenPair", [
                1,
                2,
                tokenStandard.toString(),
                "0xabc"
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("unhalt", () => {
        it("should build an unhalt block", () => {
            const template = bridgeApi.unhalt();
            const expectedData = BridgeContract.abi.encodeFunctionData("Unhalt", []);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("emergency", () => {
        it("should build an emergency block", () => {
            const template = bridgeApi.emergency();
            const expectedData = BridgeContract.abi.encodeFunctionData("Emergency", []);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("changeAdministrator", () => {
        it("should build a change administrator block", () => {
            const address = Address.parse(ADDRESS);
            const template = bridgeApi.changeAdministrator(address);

            const expectedData = BridgeContract.abi.encodeFunctionData("ChangeAdministrator", [
                address.toString()
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("setAllowKeyGen", () => {
        it("should build a set allow key gen block", () => {
            const template = bridgeApi.setAllowKeyGen(true);
            const expectedData = BridgeContract.abi.encodeFunctionData("SetAllowKeyGen", [true]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("setBridgeMetadata", () => {
        it("should build a set bridge metadata block", () => {
            const template = bridgeApi.setBridgeMetadata("meta");
            const expectedData = BridgeContract.abi.encodeFunctionData("SetBridgeMetadata", ["meta"]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("revokeUnwrapRequest", () => {
        it("should build a revoke unwrap request block", () => {
            const hash = Hash.parse(HASH_A);
            const template = bridgeApi.revokeUnwrapRequest(hash, 3);

            const expectedData = BridgeContract.abi.encodeFunctionData("RevokeUnwrapRequest", [
                hash.getBytes(),
                3
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("nominateGuardians", () => {
        it("should build a nominate guardians block", () => {
            const guardians = [ADDRESS, OTHER_ADDRESS];
            const template = bridgeApi.nominateGuardians(guardians as unknown as Address[]);

            const expectedData = BridgeContract.abi.encodeFunctionData("NominateGuardians", [guardians]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("setOrchestratorInfo", () => {
        it("should build a set orchestrator info block", () => {
            const template = bridgeApi.setOrchestratorInfo(10, 3, 15, 20);

            const expectedData = BridgeContract.abi.encodeFunctionData("SetOrchestratorInfo", [
                10,
                3,
                15,
                20
            ]);

            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
