import { expect } from "chai";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Hash } from "../../src/model/primitives/index.js";
import {
    SmtProofError,
    decodeSmtProof,
    pathOfKey,
    verifyAbsenceByPath,
    verifyProofByPath,
} from "../../src/state/index.js";

const SOURCE_SHA256 = "d57aa52a683b2b768de16e6212058af9079125aca54feb2fdf007e9ba8c5568f";
const source = readFileSync(new URL("../fixtures/smt-v1-test-vectors.json", import.meta.url), "utf8");
const suite = JSON.parse(source);

const bytes = (hex: string) => Uint8Array.from(Buffer.from(hex, "hex"));

interface ProofVector {
    key: string;
    present: boolean;
    value: string | null;
    serialized: string;
}

describe("smt-v1-test-vectors", () => {
    it("is the vendored copy of the specification artifact", () => {
        expect(createHash("sha256").update(source).digest("hex")).to.equal(SOURCE_SHA256);
    });

    it("pins SHA3-256 of the empty input", () => {
        expect(suite.sentinel_constants.sha3_256_empty_input_hex).to.equal(
            "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
        );
    });

    for (const vector of suite.vectors) {
        const proofs: ProofVector[] = [vector.expected_inclusion_proof, vector.expected_non_inclusion_proof].filter(Boolean);
        for (const proof of proofs) {
            it(`${vector.id} ${proof.present ? "inclusion" : "non-inclusion"} proof verifies`, () => {
                const root = Hash.parse(vector.expected_root);
                const path = Hash.parse(proof.key);
                const serialized = bytes(proof.serialized);

                if (proof.present) {
                    expect(verifyProofByPath(root, path, bytes(proof.value ?? ""), serialized)).to.equal(true);
                    // A different value must not verify under the same proof.
                    expect(verifyProofByPath(root, path, Uint8Array.of(0xde, 0xad), serialized)).to.equal(false);
                } else {
                    expect(verifyAbsenceByPath(root, path, serialized)).to.equal(true);
                }

                // A different root must not verify.
                const wrongRoot = Hash.parse("ff".repeat(32));
                expect(
                    proof.present
                        ? verifyProofByPath(wrongRoot, path, bytes(proof.value ?? ""), serialized)
                        : verifyAbsenceByPath(wrongRoot, path, serialized)
                ).to.equal(false);
            });
        }
    }

    describe("malformed proofs", () => {
        const base = bytes(suite.vectors[1].expected_inclusion_proof.serialized);

        it("rejects reserved flag bits", () => {
            const bad = Uint8Array.from(base);
            bad[0] |= 0x02;
            expect(() => decodeSmtProof(bad)).to.throw(SmtProofError);
        });

        it("rejects trailing bytes and truncation", () => {
            expect(() => decodeSmtProof(Uint8Array.from([...base, 0]))).to.throw(SmtProofError);
            expect(() => decodeSmtProof(base.slice(0, base.length - 1))).to.throw(SmtProofError);
        });

        it("rejects a sibling count that disagrees with the bitmap", () => {
            const bad = Uint8Array.from(base);
            bad[1 + 32 + 32 + 32 + 1] += 1;
            expect(() => decodeSmtProof(bad)).to.throw(SmtProofError);
        });

        it("rejects a leaf hash that does not match the value", () => {
            const bad = Uint8Array.from(base);
            bad[base.length - 1] ^= 0x01;
            expect(() => decodeSmtProof(bad)).to.throw(SmtProofError);
        });

        it("rejects a proof for a different path", () => {
            const root = Hash.parse(suite.vectors[1].expected_root);
            expect(() => verifyProofByPath(root, Hash.parse("11".repeat(32)), Uint8Array.of(1), base))
                .to.throw(SmtProofError);
        });

        it("rejects the wrong proof kind", () => {
            const root = Hash.parse(suite.vectors[1].expected_root);
            const path = Hash.parse(suite.vectors[1].expected_inclusion_proof.key);
            expect(() => verifyAbsenceByPath(root, path, base)).to.throw(SmtProofError);
        });
    });

    it("derives a tree position as SHA3-256 of the raw key", () => {
        expect(pathOfKey(new Uint8Array()).toString())
            .to.equal("a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a");
    });
});
