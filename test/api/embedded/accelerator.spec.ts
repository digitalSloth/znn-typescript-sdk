import { expect } from "chai";
import { AcceleratorApi } from "../../../src/api/embedded/accelerator.js";
import { PROPOSAL_CREATION_COST_IN_ZNN } from "../../../src/api/embedded/constants.js";
import { Accelerator as AcceleratorContract } from "../../../src/embedded/index.js";
import {
    Phase,
    PillarVote,
    Project,
    ProjectList,
    VoteBreakdown
} from "../../../src/model/embedded/index.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import {
    ACCELERATOR_ADDRESS,
    Hash,
    TokenStandard,
    ZNN_ZTS
} from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { BigNumber } from "../../../src/utilities/bignumber.js";
import { MockClient } from "../mockClient.js";

const ADDRESS = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const PROJECT_ID = "a".repeat(64);
const PHASE_ID = "b".repeat(64);
const OTHER_HASH = "c".repeat(64);

const makeVoteBreakdownJson = (overrides: Record<string, any> = {}) => ({
    id: PROJECT_ID,
    yes: 10,
    no: 2,
    total: 12,
    ...overrides
});

const makePhaseJson = (overrides: Record<string, any> = {}) => ({
    phase: {
        id: PHASE_ID,
        projectID: PROJECT_ID,
        name: "Phase 1",
        description: "Phase description",
        url: "phase.example.com",
        znnFundsNeeded: "100",
        qsrFundsNeeded: "200",
        creationTimestamp: 1700000000,
        acceptedTimestamp: 1700000100,
        status: 1
    },
    votes: makeVoteBreakdownJson({ id: PHASE_ID }),
    ...overrides
});

const makeProjectJson = (overrides: Record<string, any> = {}) => ({
    id: PROJECT_ID,
    name: "Project Alpha",
    owner: ADDRESS,
    description: "Project description",
    url: "project.example.com",
    znnFundsNeeded: "1000",
    qsrFundsNeeded: "2000",
    creationTimestamp: 1700000000,
    lastUpdateTimestamp: 1700000200,
    status: 1,
    phaseIds: [PHASE_ID],
    votes: makeVoteBreakdownJson({ id: PROJECT_ID }),
    phases: [makePhaseJson()],
    ...overrides
});

const makeProjectListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [makeProjectJson()],
    ...overrides
});

describe("AcceleratorApi", () => {
    let acceleratorApi: AcceleratorApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        acceleratorApi = new AcceleratorApi();
        acceleratorApi.setClient(mockClient);
    });

    describe("getAll", () => {
        it("should fetch and parse projects", async () => {
            const mockResponse = makeProjectListJson();
            mockClient.setMockResponse("embedded.accelerator.getAll", mockResponse);

            const result = await acceleratorApi.getAll(1, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.accelerator.getAll");
            expect(lastCall!.parameters).to.deep.equal([1, 5]);

            expect(result).to.be.instanceOf(ProjectList);
            expect(result.list[0]).to.be.instanceOf(Project);
            expect(result.list[0].phaseIds[0].toString()).to.equal(PHASE_ID);
            expect(result.list[0].phases[0]).to.be.instanceOf(Phase);
        });
    });

    describe("getProjectById", () => {
        it("should fetch and parse a project", async () => {
            const mockResponse = makeProjectJson();
            mockClient.setMockResponse("embedded.accelerator.getProjectById", mockResponse);

            const result = await acceleratorApi.getProjectById(PROJECT_ID);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.accelerator.getProjectById");
            expect(lastCall!.parameters).to.deep.equal([PROJECT_ID]);

            expect(result).to.be.instanceOf(Project);
            expect(result.id.toString()).to.equal(PROJECT_ID);
            expect(result.owner.toString()).to.equal(ADDRESS);
        });
    });

    describe("getPhaseById", () => {
        it("should fetch and parse a phase", async () => {
            const mockResponse = makePhaseJson();
            mockClient.setMockResponse("embedded.accelerator.getPhaseById", mockResponse);

            const phaseId = Hash.parse(PHASE_ID);
            const result = await acceleratorApi.getPhaseById(phaseId);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.accelerator.getPhaseById");
            expect(lastCall!.parameters).to.deep.equal([phaseId.toString()]);

            expect(result).to.be.instanceOf(Phase);
            expect(result.id.toString()).to.equal(PHASE_ID);
        });
    });

    describe("getPillarVotes", () => {
        it("should fetch and parse pillar votes with null entries", async () => {
            const mockResponse = [
                null,
                { id: OTHER_HASH, name: "pillar-a", vote: 1 }
            ];
            mockClient.setMockResponse("embedded.accelerator.getPillarVotes", mockResponse);

            const result = await acceleratorApi.getPillarVotes("pillar", [PROJECT_ID]);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.accelerator.getPillarVotes");
            expect(lastCall!.parameters).to.deep.equal(["pillar", [PROJECT_ID]]);

            expect(result[0]).to.equal(null);
            expect(result[1]).to.be.instanceOf(PillarVote);
            expect(result[1]!.id.toString()).to.equal(OTHER_HASH);
        });
    });

    describe("getVoteBreakdown", () => {
        it("should fetch and parse the vote breakdown", async () => {
            const mockResponse = makeVoteBreakdownJson({ id: PROJECT_ID });
            mockClient.setMockResponse("embedded.accelerator.getVoteBreakdown", mockResponse);

            const result = await acceleratorApi.getVoteBreakdown(Hash.parse(PROJECT_ID));

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.accelerator.getVoteBreakdown");
            expect(lastCall!.parameters).to.deep.equal([PROJECT_ID]);

            expect(result).to.be.instanceOf(VoteBreakdown);
            expect(result.id.toString()).to.equal(PROJECT_ID);
            expect(result.total).to.equal(12);
        });
    });

    describe("createProject", () => {
        it("should build a create project block", () => {
            const znnFunds = BigNumber.from(1000);
            const qsrFunds = BigNumber.from(2000);

            const template = acceleratorApi.createProject(
                "Project Alpha",
                "Project description",
                "project.example.com",
                znnFunds,
                qsrFunds
            );

            const expectedData = AcceleratorContract.abi.encodeFunctionData("CreateProject", [
                "Project Alpha",
                "Project description",
                "project.example.com",
                znnFunds.toString(),
                qsrFunds.toString()
            ]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(ACCELERATOR_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.amount.toString()).to.equal(String(PROPOSAL_CREATION_COST_IN_ZNN));
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("addPhase", () => {
        it("should build an add phase block", () => {
            const id = Hash.parse(PHASE_ID);
            const znnFunds = BigNumber.from(100);
            const qsrFunds = BigNumber.from(200);

            const template = acceleratorApi.addPhase(
                id,
                "Phase 1",
                "Phase description",
                "phase.example.com",
                znnFunds,
                qsrFunds
            );

            const expectedData = AcceleratorContract.abi.encodeFunctionData("AddPhase", [
                id.getBytes(),
                "Phase 1",
                "Phase description",
                "phase.example.com",
                znnFunds.toString(),
                qsrFunds.toString()
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("updatePhase", () => {
        it("should build an update phase block", () => {
            const id = Hash.parse(PHASE_ID);
            const znnFunds = BigNumber.from(110);
            const qsrFunds = BigNumber.from(220);

            const template = acceleratorApi.updatePhase(
                id,
                "Phase 1",
                "Phase description",
                "phase.example.com",
                znnFunds,
                qsrFunds
            );

            const expectedData = AcceleratorContract.abi.encodeFunctionData("UpdatePhase", [
                id.getBytes(),
                "Phase 1",
                "Phase description",
                "phase.example.com",
                znnFunds.toString(),
                qsrFunds.toString()
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("donate", () => {
        it("should build a donate block", () => {
            const amount = BigNumber.from(123);
            const tokenStandard = TokenStandard.parse("zts1znnxxxxxxxxxxxxx9z4ulx");

            const template = acceleratorApi.donate(amount, tokenStandard);

            const expectedData = AcceleratorContract.abi.encodeFunctionData("Donate", []);

            expect(template.amount.toString()).to.equal(amount.toString());
            expect(template.tokenStandard.toString()).to.equal(tokenStandard.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("voteByName", () => {
        it("should build a vote-by-name block", () => {
            const id = Hash.parse(PHASE_ID);
            const template = acceleratorApi.voteByName(id, "pillar-a", 1);

            const expectedData = AcceleratorContract.abi.encodeFunctionData("VoteByName", [
                id.getBytes(),
                "pillar-a",
                1
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("voteByProdAddress", () => {
        it("should build a vote-by-address block", () => {
            const id = Hash.parse(PHASE_ID);
            const template = acceleratorApi.voteByProdAddress(id, 2);

            const expectedData = AcceleratorContract.abi.encodeFunctionData("VoteByProdAddress", [
                id.getBytes(),
                2
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
