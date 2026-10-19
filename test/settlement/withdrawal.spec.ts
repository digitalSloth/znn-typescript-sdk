import { expect } from "chai";
import { readFileSync } from "node:fs";
import { Address } from "../../src/model/primitives/index.js";
import {
    MaxMerkleProofDepth,
    OutboxWithdrawalSize,
    SettlementWithdrawalError,
    decodeOutboxWithdrawal,
    outboxId,
    outboxProofRoot,
} from "../../src/settlement/index.js";

// Vectors dumped by go-zenon's TestDumpSettlementSdkWithdrawalFixture.
const fixture = JSON.parse(
    readFileSync(new URL("../fixtures/settlement-withdrawal-go.json", import.meta.url), "utf8")
);

const fromHex = (value: string) => Uint8Array.from(Buffer.from(value, "hex"));
const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");

describe("settlement withdrawal helpers", () => {
    it("pins the proof depth and message size", () => {
        expect(MaxMerkleProofDepth).to.equal(fixture.maxMerkleProofDepth);
        expect(OutboxWithdrawalSize).to.equal(133);
    });

    describe("outboxId", () => {
        for (const c of fixture.outboxIds) {
            it(`matches Go for ${c.domainId}/${c.batchId}/${c.inputIndex}/${c.outboxIndex}`, () => {
                const id = outboxId(c.domainId, BigInt(c.batchId), BigInt(c.inputIndex), c.outboxIndex);
                expect(hex(id.getBytes())).to.equal(c.outboxId);
            });
        }
    });

    describe("decodeOutboxWithdrawal", () => {
        for (const c of fixture.withdrawals) {
            it(`${c.valid ? "accepts" : "rejects"} ${c.name}`, () => {
                const message = fromHex(c.message);
                if (!c.valid) {
                    expect(() => decodeOutboxWithdrawal(message)).to.throw(SettlementWithdrawalError);
                    return;
                }
                const w = decodeOutboxWithdrawal(message);
                expect(hex(w.sourceContract.getBytes())).to.equal(c.sourceContract);
                expect(w.inputIndex).to.equal(BigInt(c.inputIndex));
                expect(w.outboxIndex).to.equal(c.outboxIndex);
                expect(w.recipient.toString()).to.equal(c.recipient);
                expect(Address.isAddress(w.recipient)).to.equal(true);
                expect(hex(w.assetId.getBytes())).to.equal(c.assetId);
                expect(w.amount.toString()).to.equal(c.amount);
            });
        }
    });

    describe("outboxProofRoot", () => {
        for (const c of fixture.proofs) {
            it(`${c.valid ? "rebuilds" : "rejects"} ${c.name}`, () => {
                const message = fromHex(c.message);
                const proof = fromHex(c.proof);
                if (!c.valid) {
                    expect(() => outboxProofRoot(message, proof)).to.throw(SettlementWithdrawalError);
                    return;
                }
                expect(hex(outboxProofRoot(message, proof).getBytes())).to.equal(c.root);
            });
        }

        it("rebuilds one root for every leaf of the seven message tree", () => {
            const leaves = fixture.proofs.filter((c: { name: string }) => c.name.startsWith("leaf "));
            expect(leaves).to.have.length(7);
            const roots = new Set(leaves.map((c: { root: string }) => c.root));
            expect(roots.size).to.equal(1);
        });
    });
});
