import { expect } from "chai";
import { readFileSync } from "node:fs";
import { SettlementApi } from "../../../src/api/embedded/settlement.js";
import {
    SettlementAssetInfo,
    SettlementBatch,
    SettlementBatchList,
    SettlementDeployRecord,
    SettlementDeployRecordList,
    SettlementDomainInfo,
    SettlementDomainInfoList,
    SettlementExecutorList,
    SettlementFeeInfo,
    SettlementPauseInfo,
    SettlementPeripheryConfig,
    SettlementReleaseQueue,
    SettlementTimeChallengeList,
} from "../../../src/model/embedded/index.js";
import { Address, Hash } from "../../../src/model/primitives/index.js";
import { RPC_MAX_PAGE_SIZE } from "../../../src/zenon.js";
import { MockClient } from "../mockClient.js";

// JSON marshalled by the go-zenon Settlement RPC types.
const fixture: Record<string, any> = JSON.parse(
    readFileSync(new URL("../../fixtures/settlement-rpc-go.json", import.meta.url), "utf8")
);

const models: [string, { fromJson(json: any): { toJson(): any } }][] = [
    ["domainInfo", SettlementDomainInfo],
    ["domainInfoBare", SettlementDomainInfo],
    ["allDomains", SettlementDomainInfoList],
    ["emptyDomains", SettlementDomainInfoList],
    ["batch", SettlementBatch],
    ["batches", SettlementBatchList],
    ["deployRecord", SettlementDeployRecord],
    ["deployRecords", SettlementDeployRecordList],
    ["pauseState", SettlementPauseInfo],
    ["peripheryConfig", SettlementPeripheryConfig],
    ["executorSet", SettlementExecutorList],
    ["feeInfo", SettlementFeeInfo],
    ["feeInfoNoHead", SettlementFeeInfo],
    ["assetInfo", SettlementAssetInfo],
    ["releaseQueue", SettlementReleaseQueue],
    ["timeChallenges", SettlementTimeChallengeList],
    ["emptyChallenges", SettlementTimeChallengeList],
];

const DEPLOYER = Address.parse("z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp");
const HASH = Hash.parse("ab".repeat(32));

describe("Settlement models", () => {
    for (const [key, model] of models) {
        it(`round-trips the go-zenon ${key} response`, () => {
            expect(model.fromJson(fixture[key]).toJson()).to.deep.equal(fixture[key]);
        });
    }

    it("decodes typed fields", () => {
        const domain = SettlementDomainInfo.fromJson(fixture.domainInfo);
        expect(domain.domainId).to.equal(3);
        expect(domain.profileConfig.equals(Buffer.from([1, 2, 3]))).to.equal(true);
        expect(domain.approvedDAModes).to.deep.equal([0]);
        expect(domain.pauseState!.relayPaused).to.equal(true);
        expect(domain.escapeHatch!.triggeredAtHeight).to.equal(555);

        const fees = SettlementFeeInfo.fromJson(fixture.feeInfo);
        expect(fees.totalFeesBurned).to.equal(300n);
        expect(SettlementFeeInfo.fromJson(fixture.feeInfoNoHead).pendingEpochHead).to.equal(null);

        expect(SettlementBatch.fromJson(fixture.batch).isFinalized).to.equal(true);
        expect(SettlementDeployRecord.fromJson(fixture.deployRecord).expiresAtHeight).to.equal(2980);
        expect(SettlementTimeChallengeList.fromJson(fixture.timeChallenges).list[0].dueHeight).to.equal(1801);
    });

    it("treats null lists as empty", () => {
        expect(SettlementPauseInfo.fromJson({ global: null, domains: null }).domains).to.deep.equal([]);
        expect(SettlementDomainInfoList.fromJson({ count: 0, list: null }).list).to.deep.equal([]);
    });
});

describe("SettlementApi read RPC", () => {
    let client: MockClient;
    let api: SettlementApi;

    beforeEach(() => {
        client = new MockClient();
        api = new SettlementApi();
        api.setClient(client);
    });

    it("getDomainInfo sends the domain id and returns null for an unregistered domain", async () => {
        client.setMockResponse("embedded.settlement.getDomainInfo", fixture.domainInfo);
        expect((await api.getDomainInfo(3))!.domainId).to.equal(3);
        expect(client.getLastCall()!.parameters).to.deep.equal([3]);

        client.setMockResponse("embedded.settlement.getDomainInfo", null);
        expect(await api.getDomainInfo(9)).to.equal(null);
    });

    it("getAllDomains pages and caps the page size", async () => {
        client.setMockResponse("embedded.settlement.getAllDomains", fixture.allDomains);
        const list = await api.getAllDomains(1, 10);
        expect(list.count).to.equal(2);
        expect(client.getLastCall()!.parameters).to.deep.equal([1, 10]);

        let thrown: unknown;
        try { await api.getAllDomains(0, RPC_MAX_PAGE_SIZE + 1); } catch (e) { thrown = e; }
        expect(thrown).to.be.instanceOf(Error);
    });

    it("getBatch and getBatches", async () => {
        client.setMockResponse("embedded.settlement.getBatch", fixture.batch);
        expect((await api.getBatch(3, 1))!.executorPillar).to.equal("pillar-one");
        expect(client.getLastCall()!.parameters).to.deep.equal([3, 1]);

        client.setMockResponse("embedded.settlement.getBatch", null);
        expect(await api.getBatch(3, 99)).to.equal(null);

        client.setMockResponse("embedded.settlement.getBatches", fixture.batches);
        expect((await api.getBatches(3, 0, 5)).list).to.have.length(1);
        expect(client.getLastCall()!.parameters).to.deep.equal([3, 0, 5]);
    });

    it("getDeployRecord and getDeployRecordsByDeployer send the deployer and code hash", async () => {
        client.setMockResponse("embedded.settlement.getDeployRecord", fixture.deployRecord);
        await api.getDeployRecord(3, DEPLOYER, HASH);
        expect(client.getLastCall()!.parameters).to.deep.equal([3, DEPLOYER.toString(), HASH.toString()]);

        client.setMockResponse("embedded.settlement.getDeployRecord", null);
        expect(await api.getDeployRecord(3, DEPLOYER, HASH)).to.equal(null);

        client.setMockResponse("embedded.settlement.getDeployRecordsByDeployer", fixture.deployRecords);
        expect((await api.getDeployRecordsByDeployer(3, DEPLOYER, 0, 20)).count).to.equal(1);
        expect(client.getLastCall()!.parameters).to.deep.equal([3, DEPLOYER.toString(), 0, 20]);
    });

    it("reads network-wide state", async () => {
        client.setMockResponse("embedded.settlement.getPauseState", fixture.pauseState);
        expect((await api.getPauseState()).global!.submitPaused).to.equal(true);

        client.setMockResponse("embedded.settlement.getPeripheryConfig", fixture.peripheryConfig);
        expect((await api.getPeripheryConfig())!.znnPerByteOfState).to.equal(200n);
        client.setMockResponse("embedded.settlement.getPeripheryConfig", null);
        expect(await api.getPeripheryConfig()).to.equal(null);

        client.setMockResponse("embedded.settlement.getExecutorSet", fixture.executorSet);
        expect((await api.getExecutorSet()).list[0].pillarName).to.equal("pillar-one");

        client.setMockResponse("embedded.settlement.getFeeInfo", fixture.feeInfo);
        expect((await api.getFeeInfo()).pendingEpochHead!.epoch).to.equal(4);
    });

    it("reads per-domain custody state", async () => {
        client.setMockResponse("embedded.settlement.getAssetInfo", fixture.assetInfo);
        expect((await api.getAssetInfo(3, HASH))!.totalDeposited).to.equal(400n);
        expect(client.getLastCall()!.parameters).to.deep.equal([3, HASH.toString()]);
        client.setMockResponse("embedded.settlement.getAssetInfo", null);
        expect(await api.getAssetInfo(3, HASH)).to.equal(null);

        client.setMockResponse("embedded.settlement.getReleaseQueue", fixture.releaseQueue);
        expect((await api.getReleaseQueue(3, 0, 50)).list[0].amount).to.equal(77n);

        client.setMockResponse("embedded.settlement.isOutboxProcessed", true);
        expect(await api.isOutboxProcessed(HASH)).to.equal(true);
        expect(client.getLastCall()!.parameters).to.deep.equal([HASH.toString()]);
    });

    it("getTimeChallengesInfo lists pending challenges with their due height", async () => {
        client.setMockResponse("embedded.settlement.getTimeChallengesInfo", fixture.timeChallenges);
        const challenges = await api.getTimeChallengesInfo();
        expect(challenges.list[0].methodName).to.match(/^SetAssetConfig\/3\//);
        expect(challenges.list[0].challengeStartHeight).to.equal(800);
    });
});
