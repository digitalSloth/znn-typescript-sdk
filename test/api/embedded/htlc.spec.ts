import { expect } from "chai";
import { HtlcApi } from "../../../src/api/embedded/htlc.js";
import { Htlc as HtlcContract } from "../../../src/embedded/index.js";
import { HtlcInfo } from "../../../src/model/embedded/htlc.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import {
    Address,
    Hash,
    HTLC_ADDRESS,
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

const makeHtlcInfoJson = (overrides: Record<string, any> = {}) => ({
    id: HASH_A,
    timeLocked: ADDRESS,
    hashLocked: OTHER_ADDRESS,
    tokenStandard: TOKEN_STANDARD,
    amount: "1000",
    expirationTime: 1700000000,
    hashType: 1,
    keyMaxSize: 32,
    hashLock: Buffer.from("deadbeef", "hex").toString("base64"),
    ...overrides
});

describe("HtlcApi", () => {
    let htlcApi: HtlcApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        htlcApi = new HtlcApi();
        htlcApi.setClient(mockClient);
    });

    describe("getById", () => {
        it("should fetch and parse HTLC info", async () => {
            mockClient.setMockResponse("embedded.htlc.getById", makeHtlcInfoJson());

            const result = await htlcApi.getById(Hash.parse(HASH_A));

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.htlc.getById");
            expect(lastCall!.parameters).to.deep.equal([HASH_A]);

            expect(result).to.be.instanceOf(HtlcInfo);
            expect(result.id.toString()).to.equal(HASH_A);
            expect(result.amount.toString()).to.equal("1000");
            expect(Buffer.from(result.hashLock).toString("hex")).to.equal("deadbeef");
        });
    });

    describe("getProxyUnlockStatus", () => {
        it("should fetch proxy unlock status", async () => {
            mockClient.setMockResponse("embedded.htlc.getProxyUnlockStatus", true);

            const address = Address.parse(ADDRESS);
            const result = await htlcApi.getProxyUnlockStatus(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.htlc.getProxyUnlockStatus");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result).to.equal(true);
        });
    });

    describe("create", () => {
        it("should build a create block", () => {
            const tokenStandard = TokenStandard.parse(TOKEN_STANDARD);
            const amount = BigNumber.from(500);
            const hashLocked = Address.parse(OTHER_ADDRESS);
            const hashLock = Buffer.from("cafe", "hex");

            const template = htlcApi.create(
                tokenStandard,
                amount,
                hashLocked,
                1700000000,
                1,
                32,
                hashLock
            );

            const expectedData = HtlcContract.abi.encodeFunctionData("Create", [
                hashLocked.toString(),
                1700000000,
                1,
                32,
                hashLock
            ]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(HTLC_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(tokenStandard.toString());
            expect(template.amount.toString()).to.equal(amount.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("reclaim", () => {
        it("should build a reclaim block", () => {
            const id = Hash.parse(HASH_A);
            const template = htlcApi.reclaim(id);

            const expectedData = HtlcContract.abi.encodeFunctionData("Reclaim", [
                id.getBytes()
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("unlock", () => {
        it("should build an unlock block", () => {
            const id = Hash.parse(HASH_A);
            const preimage = Buffer.from("bead", "hex");
            const template = htlcApi.unlock(id, preimage);

            const expectedData = HtlcContract.abi.encodeFunctionData("Unlock", [
                id.getBytes(),
                preimage
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("denyProxyUnlock", () => {
        it("should build a deny proxy unlock block", () => {
            const template = htlcApi.denyProxyUnlock();
            const expectedData = HtlcContract.abi.encodeFunctionData("DenyProxyUnlock", []);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("allowProxyUnlock", () => {
        it("should build an allow proxy unlock block", () => {
            const template = htlcApi.allowProxyUnlock();
            const expectedData = HtlcContract.abi.encodeFunctionData("AllowProxyUnlock", []);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
