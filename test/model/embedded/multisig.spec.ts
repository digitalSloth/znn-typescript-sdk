import { expect } from "chai";
import { MultisigPolicyInfo, MultisigRecordInfo } from "../../../src/model/embedded/multisig.js";

describe("MultisigPolicyInfo", () => {
    it("should parse a policy JSON, base64-decoding signers", () => {
        const pk1 = Buffer.alloc(32, 1);
        const pk2 = Buffer.alloc(32, 2);

        const json = {
            threshold: 2,
            signers: [pk1.toString("base64"), pk2.toString("base64")],
            locked: false,
        };

        const policy = MultisigPolicyInfo.fromJson(json)!;

        expect(policy.threshold).to.equal(2);
        expect(policy.signers).to.have.length(2);
        expect(policy.signers[0].equals(pk1)).to.be.true;
        expect(policy.signers[1].equals(pk2)).to.be.true;
        expect(policy.locked).to.equal(false);
    });

    it("should return null when json is null", () => {
        expect(MultisigPolicyInfo.fromJson(null)).to.equal(null);
    });
});

describe("MultisigRecordInfo", () => {
    it("should parse active/pending/pendingHeight", () => {
        const pk1 = Buffer.alloc(32, 1);

        const json = {
            active: { threshold: 1, signers: [pk1.toString("base64")], locked: false },
            pending: null,
            pendingHeight: 0,
        };

        const record = MultisigRecordInfo.fromJson(json);

        expect(record.active).to.be.instanceOf(MultisigPolicyInfo);
        expect(record.active!.threshold).to.equal(1);
        expect(record.pending).to.equal(null);
        expect(record.pendingHeight).to.equal(0);
    });

    it("should handle a pending policy being present", () => {
        const pk1 = Buffer.alloc(32, 1);
        const pk2 = Buffer.alloc(32, 2);

        const json = {
            active: { threshold: 1, signers: [pk1.toString("base64")], locked: false },
            pending: { threshold: 2, signers: [pk1.toString("base64"), pk2.toString("base64")], locked: true },
            pendingHeight: 42,
        };

        const record = MultisigRecordInfo.fromJson(json);

        expect(record.pending).to.be.instanceOf(MultisigPolicyInfo);
        expect(record.pending!.threshold).to.equal(2);
        expect(record.pending!.locked).to.equal(true);
        expect(record.pendingHeight).to.equal(42);
    });
});
