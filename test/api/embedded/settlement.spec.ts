import { expect } from "chai";
import { readFileSync } from "node:fs";
import { sha3_256 } from "@noble/hashes/sha3";
import { SettlementApi } from "../../../src/api/embedded/settlement.js";
import {
    Address,
    Hash,
    SETTLEMENT_ADDRESS,
    TokenStandard,
    ZNN_ZTS,
} from "../../../src/model/primitives/index.js";
import {
    MaxCallPayload,
    MaxDeployChunkData,
    MaxInputGas,
    settlementChallengeKey,
    settlementParamsHash,
} from "../../../src/settlement/index.js";

const fixture = JSON.parse(
    readFileSync(new URL("../../fixtures/settlement-go.json", import.meta.url), "utf8")
) as {
    calls: { method: string; data: string }[];
    paramsHashes: Record<string, string>;
};

const sha3Hash = (data: Uint8Array) => new Hash(Buffer.from(sha3_256(data)));
const hashOf = (text: string) => sha3Hash(Buffer.from(text));

const ZERO_ADDRESS = Address.parse("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
const OTHER_ADDRESS = Address.parse("z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp");

const hashA = hashOf("a");
const hashB = hashOf("b");
const bytesA = Uint8Array.of(0x01, 0x02, 0x03, 0xff);
const big1 = 123456789n * 1_000_000_000_000n;
const big2 = 42n;

const goData = (method: string): string => {
    const call = fixture.calls.find((c) => c.method === method);
    if (!call) throw new Error(`no fixture for ${method}`);
    return call.data;
};

const dataOf = (block: { data: Buffer | Uint8Array }) => Buffer.from(block.data).toString("hex");

describe("SettlementApi block builders", () => {
    const api = new SettlementApi();

    describe("calldata matches go-zenon ABISettlement.PackMethod", () => {
        const cases: [string, () => { data: Buffer | Uint8Array }][] = [
            ["Update", () => api.update()],
            ["CollectReward", () => api.collectReward()],
            ["ReleaseWithdrawals", () => api.releaseWithdrawals(7)],
            ["RegisterExecutor", () => api.registerExecutor("pillar-one", ZERO_ADDRESS)],
            ["SetPeripheryConfig", () => api.setPeripheryConfig(big1, big2)],
            ["RegisterDomain", () => api.registerDomain({
                domainId: 3, domainClass: 0, runtimeKind: 0, stfSpecHash: hashA,
                inputSource: 0, execProfile: 2, foreignProfile: 0,
                profileConfig: bytesA, chainBinding: new Uint8Array(),
                minExecutors: 2, proposerPolicy: 0,
                finalityModel: 2, status: 0,
                withdrawalDelay: 100800n, runtimeUpgradeDelay: 201600n,
            })],
            ["SetDomainConfig", () => api.setDomainConfig(3, 100800n, 201600n)],
            ["SetAssetConfig", () => api.setAssetConfig(3, hashB, big1)],
            ["SetApprovedDAModes", () => api.setApprovedDAModes(3, [0])],
            ["Pause", () => api.pause(3, true, 1, false)],
            ["InitiateEscapeHatch", () => api.initiateEscapeHatch(3)],
            ["Deposit", () => api.deposit(3, hashA, 500000n, ZNN_ZTS, 1n)],
            ["RelayMessage", () => api.relayMessage(3, 9n, bytesA, bytesA)],
            ["DeployContractStart", () => api.deployContractStart(3, hashA, sha3Hash(bytesA), 40000n, 3, bytesA)],
            ["DeployContractChunk", () => api.deployContractChunk(3, hashA, 2, sha3Hash(bytesA), bytesA)],
            ["DeployContractFinalize", () => api.deployContractFinalize(3, hashA, 5n)],
            ["CallL2", () => api.callL2(3, hashA, 500000n, bytesA)],
            ["UpgradeContract", () => api.upgradeContract(3, hashA, hashB, 5n)],
            ["TransferContractOwnership", () => api.transferContractOwnership(3, hashA, OTHER_ADDRESS)],
            ["BuyStorage", () => api.buyStorage(3, hashA, 1024n, 5n)],
        ];

        for (const [method, build] of cases) {
            it(method, () => {
                const block = build();
                expect(dataOf(block)).to.equal(goData(method));
            });
        }
    });

    describe("block shape", () => {
        it("targets the Settlement contract", () => {
            const block = api.update();
            expect(block.toAddress.toString()).to.equal(SETTLEMENT_ADDRESS.toString());
        });

        it("attaches the deposited token and amount", () => {
            const zts = TokenStandard.parse("zts1qsrxxxxxxxxxxxxxmrhjll");
            const block = api.deposit(3, hashA, 1n, zts, 99n);
            expect(block.tokenStandard.toString()).to.equal(zts.toString());
            expect(BigInt(block.amount.toString())).to.equal(99n);
        });

        it("attaches the fee as ZNN on finalize, upgrade and buyStorage", () => {
            for (const block of [
                api.deployContractFinalize(3, hashA, 77n),
                api.upgradeContract(3, hashA, hashB, 77n),
                api.buyStorage(3, hashA, 1n, 77n),
            ]) {
                expect(block.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
                expect(BigInt(block.amount.toString())).to.equal(77n);
            }
        });

        it("defaults callL2 to no deposit", () => {
            const block = api.callL2(3, hashA, 1n, bytesA);
            expect(BigInt(block.amount.toString())).to.equal(0n);
        });
    });

    describe("local validation", () => {
        it("rejects a plasmaLimit above MaxInputGas", () => {
            expect(() => api.deposit(3, hashA, MaxInputGas + 1n, ZNN_ZTS, 1n)).to.throw();
            expect(() => api.callL2(3, hashA, MaxInputGas + 1n, bytesA)).to.throw();
        });

        it("rejects a zero deposit amount", () => {
            expect(() => api.deposit(3, hashA, 1n, ZNN_ZTS, 0n)).to.throw();
        });

        it("rejects a payload above MaxCallPayload", () => {
            expect(() => api.callL2(3, hashA, 1n, new Uint8Array(MaxCallPayload + 1))).to.throw();
            expect(() => api.callL2(3, hashA, 1n, new Uint8Array(MaxCallPayload))).to.not.throw();
        });

        it("rejects a metadataHash that is not SHA3-256(metadata)", () => {
            expect(() => api.deployContractStart(3, hashA, hashB, 40000n, 3, bytesA)).to.throw();
        });

        it("rejects a chunkCount that is not ceil(totalSize / MaxDeployChunkData)", () => {
            const metadataHash = sha3Hash(bytesA);
            expect(() => api.deployContractStart(3, hashA, metadataHash, 40000n, 2, bytesA)).to.throw();
            expect(() => api.deployContractStart(3, hashA, metadataHash, 0n, 0, bytesA)).to.throw();
            expect(() => api.deployContractStart(3, hashA, metadataHash, BigInt(MaxDeployChunkData), 1, bytesA)).to.not.throw();
        });

        it("rejects chunk data above MaxDeployChunkData or with a wrong chunkHash", () => {
            const big = new Uint8Array(MaxDeployChunkData + 1);
            expect(() => api.deployContractChunk(3, hashA, 0, sha3Hash(big), big)).to.throw();
            expect(() => api.deployContractChunk(3, hashA, 0, hashB, bytesA)).to.throw();
        });

        it("rejects zero bytes in buyStorage and an empty DA mode set", () => {
            expect(() => api.buyStorage(3, hashA, 0n, 0n)).to.throw();
            expect(() => api.setApprovedDAModes(3, [])).to.throw();
        });
    });
});

describe("settlement time-challenge hashes", () => {
    const expectHash = (method: string, actual: Hash) =>
        expect(actual.toString()).to.equal(fixture.paramsHashes[method]);

    it("matches go-zenon for every challenged method", () => {
        expectHash("RegisterDomain", settlementParamsHash("RegisterDomain", {
            domainId: 3, stfSpecHash: hashA, minExecutors: 2,
            withdrawalDelay: 100800n, runtimeUpgradeDelay: 201600n,
        }));
        expectHash("SetDomainConfig", settlementParamsHash("SetDomainConfig", {
            domainId: 3, withdrawalDelay: 100800n, runtimeUpgradeDelay: 201600n,
        }));
        expectHash("SetAssetConfig", settlementParamsHash("SetAssetConfig", {
            domainId: 3, assetId: hashB, maxBatchWithdrawal: big1,
        }));
        expectHash("SetApprovedDAModes", settlementParamsHash("SetApprovedDAModes", {
            domainId: 3, modes: Uint8Array.of(0),
        }));
        expectHash("InitiateEscapeHatch", settlementParamsHash("InitiateEscapeHatch", { domainId: 3 }));
        expectHash("RegisterExecutor", settlementParamsHash("RegisterExecutor", {
            pillarName: "pillar-one", executorAddress: ZERO_ADDRESS,
        }));
        expectHash("SetPeripheryConfig", settlementParamsHash("SetPeripheryConfig", {
            znnPerByteOfBytecode: big1, znnPerByteOfState: big2,
        }));
    });

    it("builds the challenge key each method is scoped under", () => {
        expect(settlementChallengeKey("SetDomainConfig", {
            domainId: 3, withdrawalDelay: 1n, runtimeUpgradeDelay: 1n,
        })).to.equal("SetDomainConfig/3");
        expect(settlementChallengeKey("SetAssetConfig", {
            domainId: 3, assetId: hashB, maxBatchWithdrawal: 1n,
        })).to.equal(`SetAssetConfig/3/${hashB.toString()}`);
        expect(settlementChallengeKey("SetApprovedDAModes", { domainId: 4, modes: Uint8Array.of(0) }))
            .to.equal("SetApprovedDAModes/4");
        expect(settlementChallengeKey("InitiateEscapeHatch", { domainId: 3 })).to.equal("InitiateEscapeHatch");
        expect(settlementChallengeKey("SetPeripheryConfig", {
            znnPerByteOfBytecode: 1n, znnPerByteOfState: 1n,
        })).to.equal("SetPeripheryConfig");
    });
});
