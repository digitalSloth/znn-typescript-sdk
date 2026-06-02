import { expect } from "chai";
import { PlasmaApi } from "../../../src/api/embedded/plasma.js";
import { Plasma as PlasmaContract } from "../../../src/embedded/plasma.js";
import {
    FusionEntry,
    FusionEntryList,
    GetRequiredPowParam,
    GetRequiredPowResponse,
    PlasmaInfo,
    PlasmaVariables
} from "../../../src/model/embedded/plasma.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import {
    Address,
    Hash,
    PLASMA_ADDRESS,
    QSR_ZTS
} from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { BigNumber } from "../../../src/utilities/bignumber.js";
import { MockClient } from "../mockClient.js";

const ADDRESS = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const OTHER_ADDRESS = "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp";
const HASH_A = "a".repeat(64);

const makePlasmaInfoJson = (overrides: Record<string, any> = {}) => ({
    currentPlasma: 100,
    maxPlasma: 1000,
    qsrAmount: "500",
    ...overrides
});

const makeFusionEntryListJson = (overrides: Record<string, any> = {}) => ({
    qsrAmount: "200",
    count: 1,
    list: [{
        qsrAmount: "100",
        beneficiary: ADDRESS,
        expirationHeight: 123,
        id: HASH_A
    }],
    ...overrides
});

describe("PlasmaApi", () => {
    let plasmaApi: PlasmaApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        plasmaApi = new PlasmaApi();
        plasmaApi.setClient(mockClient);
    });

    describe("get", () => {
        it("should fetch and parse plasma info", async () => {
            mockClient.setMockResponse("embedded.plasma.get", makePlasmaInfoJson());

            const address = Address.parse(ADDRESS);
            const result = await plasmaApi.get(address);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.plasma.get");
            expect(lastCall!.parameters).to.deep.equal([address.toString()]);

            expect(result).to.be.instanceOf(PlasmaInfo);
            expect(result.qsrAmount.toString()).to.equal("500");
        });
    });

    describe("getEntriesByAddress", () => {
        it("should fetch and parse fusion entries", async () => {
            mockClient.setMockResponse("embedded.plasma.getEntriesByAddress", makeFusionEntryListJson());

            const address = Address.parse(ADDRESS);
            const result = await plasmaApi.getEntriesByAddress(address, 0, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.plasma.getEntriesByAddress");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 0, 5]);

            expect(result).to.be.instanceOf(FusionEntryList);
            expect(result.list[0]).to.be.instanceOf(FusionEntry);
            expect(result.list[0].id.toString()).to.equal(HASH_A);
        });
    });

    describe("getRequiredPoWForAccountBlock", () => {
        it("should fetch and parse required PoW", async () => {
            const mockResponse = { availablePlasma: 1, basePlasma: 2, requiredDifficulty: 3 };
            mockClient.setMockResponse("embedded.plasma.getRequiredPoWForAccountBlock", mockResponse);

            const powParam = new GetRequiredPowParam(
                Address.parse(ADDRESS),
                2,
                Address.parse(OTHER_ADDRESS),
                Buffer.from("deadbeef", "hex")
            );
            const result = await plasmaApi.getRequiredPoWForAccountBlock(powParam);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.plasma.getRequiredPoWForAccountBlock");
            expect(lastCall!.parameters).to.deep.equal([powParam.toJson()]);

            expect(result).to.be.instanceOf(GetRequiredPowResponse);
            expect(result.requiredDifficulty).to.equal(3);
        });
    });

    describe("fuse", () => {
        it("should build a fuse block", async () => {
            const beneficiary = Address.parse(ADDRESS);
            const template = await plasmaApi.fuse(beneficiary, "100");

            const expectedData = PlasmaContract.abi.encodeFunctionData("Fuse", [
                beneficiary.toString()
            ]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(PLASMA_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(QSR_ZTS.toString());
            expect(template.amount.toString()).to.equal("100");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("cancel", () => {
        it("should build a cancel fuse block", async () => {
            const id = Hash.parse(HASH_A);
            const template = await plasmaApi.cancel(id);

            const expectedData = PlasmaContract.abi.encodeFunctionData("CancelFuse", [
                id.getBytes()
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.tokenStandard.toString()).to.equal(QSR_ZTS.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("getVariables", () => {
        it("should fetch and parse plasma variables", async () => {
            const mockResponse = {
                MaxBasePlasmaInMomentum: 4200000,
                FusedPlasmaTarget: 1050000,
                PowPlasmaTarget: 1050000,
                MaxPriceChangePercent: 10,
                PriceChangeDenominator: 20
            };
            mockClient.setMockResponse("embedded.plasma.getVariables", mockResponse);

            const result = await plasmaApi.getVariables();

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.plasma.getVariables");
            expect(lastCall!.parameters).to.deep.equal([]);

            expect(result).to.be.instanceOf(PlasmaVariables);
            expect(result.maxBasePlasmaInMomentum).to.equal(4200000);
            expect(result.fusedPlasmaTarget).to.equal(1050000);
            expect(result.powPlasmaTarget).to.equal(1050000);
            expect(result.maxPriceChangePercent).to.equal(10);
            expect(result.priceChangeDenominator).to.equal(20);
        });
    });

    describe("setVariables", () => {
        it("should build a set variables block", async () => {
            const template = await plasmaApi.setVariables(4200000, 1050000, 1050000, 10, 20);

            const expectedData = PlasmaContract.abi.encodeFunctionData("SetVariables", [
                4200000, 1050000, 1050000, 10, 20
            ]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(PLASMA_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(QSR_ZTS.toString());
            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
