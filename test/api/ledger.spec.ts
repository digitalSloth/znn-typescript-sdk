import { expect } from "chai";
import { LedgerApi } from "../../src/api/ledger.js";
import {
    AccountBlock,
    AccountBlockConfirmationDetail,
    AccountBlockList,
    AccountBlockTemplate,
    AccountInfo,
    BlockTypeEnum,
    DetailedMomentumList,
    Momentum,
    MomentumList
} from "../../src/model/nom/index.js";
import { Address, Hash } from "../../src/model/primitives/index.js";
import { MockClient } from "./mockClient.js";

const ADDRESS = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const OTHER_ADDRESS = "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp";
const TOKEN_STANDARD = "zts1znnxxxxxxxxxxxxx9z4ulx";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);
const HASH_D = "d".repeat(64);
const HASH_E = "e".repeat(64);
const HASH_F = "f".repeat(64);
const HASH_1 = "1".repeat(64);
const HASH_2 = "2".repeat(64);
const HASH_3 = "3".repeat(64);

const TOKEN_JSON = {
    name: "Zenon",
    symbol: "ZNN",
    domain: "zenon",
    totalSupply: "1000000",
    decimals: 8,
    owner: OTHER_ADDRESS,
    tokenStandard: TOKEN_STANDARD,
    maxSupply: "100000000",
    isBurnable: true,
    isMintable: true,
    isUtility: true
};

const makeAccountBlockJson = (overrides: Record<string, any> = {}) => ({
    version: 1,
    chainIdentifier: 1,
    blockType: 2,
    hash: HASH_A,
    previousHash: HASH_B,
    height: 10,
    momentumAcknowledged: { hash: HASH_C, height: 9 },
    address: ADDRESS,
    toAddress: OTHER_ADDRESS,
    amount: "1000",
    tokenStandard: TOKEN_STANDARD,
    fromBlockHash: HASH_D,
    data: "",
    fusedPlasma: 0,
    difficulty: 0,
    nonce: "nonce",
    publicKey: "publicKey",
    signature: "signature",
    token: TOKEN_JSON,
    descendantBlocks: [],
    basePlasma: 100,
    usedPlasma: 10,
    changesHash: HASH_E,
    confirmationDetail: {
        numConfirmations: 2,
        momentumHeight: 100,
        momentumHash: HASH_F,
        momentumTimestamp: 1700000000
    },
    ...overrides
});

const makeAccountBlockListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [makeAccountBlockJson()],
    more: false,
    ...overrides
});

const ACCOUNT_HEADER_JSON = {
    address: ADDRESS,
    hash: HASH_1,
    height: 1
};

const makeMomentumJson = (overrides: Record<string, any> = {}) => ({
    version: 1,
    chainIdentifier: 1,
    hash: HASH_2,
    previousHash: HASH_3,
    height: 100,
    timestamp: 1700000000,
    data: "deadbeef",
    content: [ACCOUNT_HEADER_JSON],
    changesHash: HASH_A,
    publicKey: "pub",
    signature: "sig",
    producer: OTHER_ADDRESS,
    ...overrides
});

const makeMomentumListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [makeMomentumJson()],
    ...overrides
});

const makeDetailedMomentumListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [{
        blocks: [makeAccountBlockJson()],
        momentum: makeMomentumJson()
    }],
    ...overrides
});

describe("LedgerApi", () => {
    let ledgerApi: LedgerApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        ledgerApi = new LedgerApi();
        ledgerApi.setClient(mockClient);
    });

    describe("publishRawTransaction", () => {
        it("should publish a transaction template successfully", async () => {
            const template = new AccountBlockTemplate({ blockType: BlockTypeEnum.UserSend });
            mockClient.setMockResponse("ledger.publishRawTransaction", null);

            const result = await ledgerApi.publishRawTransaction(template);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.publishRawTransaction");
            expect(lastCall!.parameters).to.deep.equal([template.toJson()]);
            expect(result).to.equal(template);
        });

        it("should throw when the RPC returns an error", async () => {
            const template = new AccountBlockTemplate({ blockType: BlockTypeEnum.UserSend });
            mockClient.setMockResponse("ledger.publishRawTransaction", "failure");

            let error: Error | null = null;
            try {
                await ledgerApi.publishRawTransaction(template);
            } catch (err) {
                error = err as Error;
            }

            expect(error).to.exist;
            expect(error!.message).to.equal("Error publishing transaction: failure (code=NETWORK_ERROR)");
        });
    });

    describe("getUnconfirmedBlocksByAddress", () => {
        it("should fetch and parse unconfirmed blocks", async () => {
            const mockResponse = makeAccountBlockListJson();
            mockClient.setMockResponse("ledger.getUnconfirmedBlocksByAddress", mockResponse);

            const address = Address.parse(ADDRESS);
            const result = await ledgerApi.getUnconfirmedBlocksByAddress(address, 1, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getUnconfirmedBlocksByAddress");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 1, 5]);

            expect(result).to.be.instanceOf(AccountBlockList);
            expect(result.count).to.equal(1);
            expect(result.list[0]).to.be.instanceOf(AccountBlock);
            expect(result.list[0].amount.toString()).to.equal("1000");
            expect(result.list[0].token?.symbol).to.equal("ZNN");
            expect(result.list[0].confirmationDetail).to.be.instanceOf(AccountBlockConfirmationDetail);
        });
    });

    describe("getUnreceivedBlocksByAddress", () => {
        it("should fetch and parse unreceived blocks", async () => {
            const mockResponse = makeAccountBlockListJson();
            mockClient.setMockResponse("ledger.getUnreceivedBlocksByAddress", mockResponse);

            const address = Address.parse(ADDRESS);
            const result = await ledgerApi.getUnreceivedBlocksByAddress(address, 0, 10);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getUnreceivedBlocksByAddress");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 0, 10]);

            expect(result).to.be.instanceOf(AccountBlockList);
            expect(result.list[0].hash.toString()).to.equal(HASH_A);
        });
    });

    describe("getFrontierAccountBlock", () => {
        it("should return a frontier account block when present", async () => {
            const mockResponse = makeAccountBlockJson();
            mockClient.setMockResponse("ledger.getFrontierAccountBlock", mockResponse);

            const address = Address.parse(ADDRESS);
            const result = await ledgerApi.getFrontierAccountBlock(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getFrontierAccountBlock");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result).to.be.instanceOf(AccountBlock);
            expect(result!.hash.toString()).to.equal(HASH_A);
        });

        it("should return null when no frontier block exists", async () => {
            mockClient.setMockResponse("ledger.getFrontierAccountBlock", null);

            const address = Address.parse(ADDRESS);
            const result = await ledgerApi.getFrontierAccountBlock(address);

            expect(result).to.equal(null);
        });
    });

    describe("getAccountBlockByHash", () => {
        it("should fetch a block by hash", async () => {
            const mockResponse = makeAccountBlockJson({ hash: HASH_B });
            mockClient.setMockResponse("ledger.getAccountBlockByHash", mockResponse);

            const hash = Hash.parse(HASH_B);
            const result = await ledgerApi.getAccountBlockByHash(hash);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getAccountBlockByHash");
            expect(lastCall!.parameters).to.deep.equal([hash.toString()]);

            expect(result).to.be.instanceOf(AccountBlock);
            expect(result!.hash.toString()).to.equal(HASH_B);
        });

        it("should return null when the block is missing", async () => {
            mockClient.setMockResponse("ledger.getAccountBlockByHash", null);

            const result = await ledgerApi.getAccountBlockByHash(Hash.parse(HASH_A));

            expect(result).to.equal(null);
        });
    });

    describe("getAccountBlocksByHeight", () => {
        it("should fetch blocks by height", async () => {
            const mockResponse = makeAccountBlockListJson();
            mockClient.setMockResponse("ledger.getAccountBlocksByHeight", mockResponse);

            const address = Address.parse(ADDRESS);
            const result = await ledgerApi.getAccountBlocksByHeight(address, 2, 3);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getAccountBlocksByHeight");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 2, 3]);

            expect(result).to.be.instanceOf(AccountBlockList);
            expect(result.list).to.have.length(1);
        });
    });

    describe("getAccountBlocksByPage", () => {
        it("should fetch blocks by page", async () => {
            const mockResponse = makeAccountBlockListJson();
            mockClient.setMockResponse("ledger.getAccountBlocksByPage", mockResponse);

            const address = Address.parse(ADDRESS);
            const result = await ledgerApi.getAccountBlocksByPage(address, 4, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getAccountBlocksByPage");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 4, 5]);

            expect(result).to.be.instanceOf(AccountBlockList);
            expect(result.more).to.equal(false);
        });
    });

    describe("getAccountInfoByAddress", () => {
        it("should fetch and parse account info", async () => {
            const mockResponse = {
                address: ADDRESS,
                accountHeight: 5,
                balanceInfoMap: {
                    [TOKEN_STANDARD]: {
                        token: TOKEN_JSON,
                        balance: "1000"
                    }
                }
            };

            mockClient.setMockResponse("ledger.getAccountInfoByAddress", mockResponse);

            const address = Address.parse(ADDRESS);
            const result = await ledgerApi.getAccountInfoByAddress(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getAccountInfoByAddress");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result).to.be.instanceOf(AccountInfo);
            expect(result!.blockCount).to.equal(5);
            expect(result!.balanceInfoMap[TOKEN_STANDARD].balance.toString()).to.equal("1000");
            expect(result!.balanceInfoMap[TOKEN_STANDARD].token.symbol).to.equal("ZNN");
        });

        it("should return null when account info is missing", async () => {
            mockClient.setMockResponse("ledger.getAccountInfoByAddress", null);

            const address = Address.parse(ADDRESS);
            const result = await ledgerApi.getAccountInfoByAddress(address);

            expect(result).to.equal(null);
        });
    });

    describe("getFrontierMomentum", () => {
        it("should fetch the frontier momentum", async () => {
            const mockResponse = makeMomentumJson();
            mockClient.setMockResponse("ledger.getFrontierMomentum", mockResponse);

            const result = await ledgerApi.getFrontierMomentum();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getFrontierMomentum");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(Momentum);
            expect(result.height).to.equal(100);
            expect(result.content[0].hash.toString()).to.equal(HASH_1);
        });
    });

    describe("getMomentumBeforeTime", () => {
        it("should fetch momentum before a given time", async () => {
            const mockResponse = makeMomentumJson({ height: 50 });
            mockClient.setMockResponse("ledger.getMomentumBeforeTime", mockResponse);

            const result = await ledgerApi.getMomentumBeforeTime(123);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getMomentumBeforeTime");
            expect(lastCall!.parameters).to.deep.equal([123]);

            expect(result).to.be.instanceOf(Momentum);
            expect(result!.height).to.equal(50);
        });

        it("should return null when no momentum exists", async () => {
            mockClient.setMockResponse("ledger.getMomentumBeforeTime", null);

            const result = await ledgerApi.getMomentumBeforeTime(123);

            expect(result).to.equal(null);
        });
    });

    describe("getMomentumByHash", () => {
        it("should fetch momentum by hash", async () => {
            const mockResponse = makeMomentumJson({ hash: HASH_B });
            mockClient.setMockResponse("ledger.getMomentumByHash", mockResponse);

            const hash = Hash.parse(HASH_B);
            const result = await ledgerApi.getMomentumByHash(hash);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getMomentumByHash");
            expect(lastCall!.parameters).to.deep.equal([hash.toString()]);

            expect(result).to.be.instanceOf(Momentum);
            expect(result!.hash.toString()).to.equal(HASH_B);
        });
    });

    describe("getMomentumsByHeight", () => {
        it("should fetch momentums by height", async () => {
            const mockResponse = makeMomentumListJson();
            mockClient.setMockResponse("ledger.getMomentumsByHeight", mockResponse);

            const result = await ledgerApi.getMomentumsByHeight(10, 2);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getMomentumsByHeight");
            expect(lastCall!.parameters).to.deep.equal([10, 2]);

            expect(result).to.be.instanceOf(MomentumList);
            expect(result.list[0]).to.be.instanceOf(Momentum);
        });
    });

    describe("getMomentumsByPage", () => {
        it("should fetch momentums by page", async () => {
            const mockResponse = makeMomentumListJson();
            mockClient.setMockResponse("ledger.getMomentumsByPage", mockResponse);

            const result = await ledgerApi.getMomentumsByPage(1, 3);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getMomentumsByPage");
            expect(lastCall!.parameters).to.deep.equal([1, 3]);

            expect(result).to.be.instanceOf(MomentumList);
            expect(result.count).to.equal(1);
        });
    });

    describe("getDetailedMomentumsByHeight", () => {
        it("should fetch detailed momentums", async () => {
            const mockResponse = makeDetailedMomentumListJson();
            mockClient.setMockResponse("ledger.getDetailedMomentumsByHeight", mockResponse);

            const result = await ledgerApi.getDetailedMomentumsByHeight(1, 1);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("ledger.getDetailedMomentumsByHeight");
            expect(lastCall!.parameters).to.deep.equal([1, 1]);

            expect(result).to.be.instanceOf(DetailedMomentumList);
            expect(result!.list[0].blocks[0]).to.be.instanceOf(AccountBlock);
            expect(result!.list[0].momentum).to.be.instanceOf(Momentum);
        });

        it("should return null when no detailed momentums exist", async () => {
            mockClient.setMockResponse("ledger.getDetailedMomentumsByHeight", null);

            const result = await ledgerApi.getDetailedMomentumsByHeight(1, 1);

            expect(result).to.equal(null);
        });
    });
});
