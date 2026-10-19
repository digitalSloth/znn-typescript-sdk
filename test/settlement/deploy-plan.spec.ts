import { expect } from "chai";
import { sha3_256 } from "@noble/hashes/sha3";
import { MaxChunkCount, MaxCodeSize, MaxDeployChunkData, MAX_POW_PLASMA, planDeploy, sendPlasma } from "../../src/settlement/index.js";

const prices = { znnPerByteOfBytecode: 3n };

describe("planDeploy", () => {
    it("splits a module into chunks and prices the deploy", () => {
        const module = new Uint8Array(MaxDeployChunkData * 2 + 10).fill(7);
        const plan = planDeploy(module, Uint8Array.of(1, 2), prices, 0);

        expect(plan.chunkCount).to.equal(3);
        expect(plan.sendCount).to.equal(5);
        expect(plan.chunks.map((c) => c.data.length)).to.deep.equal([MaxDeployChunkData, MaxDeployChunkData, 10]);
        expect(plan.totalSize).to.equal(BigInt(module.length));
        expect(plan.fee).to.equal(BigInt(module.length) * 3n);
        expect(plan.codeHash.toString()).to.equal(Buffer.from(sha3_256(module)).toString("hex"));
        expect(plan.metadataHash.toString()).to.equal(Buffer.from(sha3_256(Uint8Array.of(1, 2))).toString("hex"));
        expect(plan.chunks[2].chunkHash.toString())
            .to.equal(Buffer.from(sha3_256(module.slice(MaxDeployChunkData * 2))).toString("hex"));
    });

    it("prices a full chunk near 1.08M plasma and requires fused plasma", () => {
        const plan = planDeploy(new Uint8Array(MaxDeployChunkData), new Uint8Array(), prices, 0);
        expect(plan.maxChunkPlasma).to.be.within(1_070_000, 1_090_000);
        expect(plan.needsFusedPlasma).to.equal(true);
        expect(Number(plan.qsrPerChunkInFlight / 100_000_000n)).to.be.within(500, 520);
    });

    it("needs no fused plasma for a tiny module", () => {
        const plan = planDeploy(Uint8Array.of(1, 2, 3), new Uint8Array(), prices, 0);
        expect(plan.maxChunkPlasma).to.be.lessThan(MAX_POW_PLASMA);
        expect(plan.needsFusedPlasma).to.equal(false);
    });

    it("reports how many chunks the available plasma covers", () => {
        const module = new Uint8Array(MaxDeployChunkData * 2);
        const chunkPlasma = planDeploy(module, new Uint8Array(), prices, 0).maxChunkPlasma;
        expect(planDeploy(module, new Uint8Array(), prices, chunkPlasma * 2 + 5).chunksInFlight).to.equal(2);
        expect(planDeploy(module, new Uint8Array(), prices, chunkPlasma - 1).chunksInFlight).to.equal(0);
    });

    it("takes the higher of the method price and the data price", () => {
        expect(sendPlasma(10)).to.equal(52500);
        expect(sendPlasma(1000)).to.equal(1000 * 68 + 21000);
    });

    it("rejects empty, oversized and over-chunked modules", () => {
        expect(() => planDeploy(new Uint8Array(), new Uint8Array(), prices, 0)).to.throw();
        expect(() => planDeploy(new Uint8Array(MaxCodeSize + 1), new Uint8Array(), prices, 0)).to.throw();
        expect(() => planDeploy(new Uint8Array(1), new Uint8Array(257), prices, 0)).to.throw();
        expect(Math.ceil(MaxCodeSize / MaxDeployChunkData)).to.be.at.most(MaxChunkCount);
    });
});
