import { expect } from "chai";
import { readFileSync } from "node:fs";
import { LedgerApi } from "../../src/api/ledger.js";
import { Settlement as SettlementContract } from "../../src/embedded/index.js";
import { Address, Hash, SETTLEMENT_ADDRESS } from "../../src/model/primitives/index.js";
import {
    SettlementKeys,
    SettlementProofError,
    SettlementStorage,
    stateTreeKey,
} from "../../src/settlement/index.js";
import { MockClient } from "../api/mockClient.js";

interface Fixture {
    variables: { name: string; args: unknown[]; types: string[]; data: string }[];
    root: string;
    proofs: { label: string; key: string; value?: string; proof: string; absent: boolean }[];
}

const fixture: Fixture = JSON.parse(
    readFileSync(new URL("../fixtures/settlement-state-go.json", import.meta.url), "utf8")
);

const hex = (b: Uint8Array) => Buffer.from(b).toString("hex");
const proofFor = (label: string) => {
    const p = fixture.proofs.find((x) => x.label === label);
    if (!p) throw new Error(`no proof ${label}`);
    return p;
};

// Renders a decoded ABI value the way the Go fixture records it.
const normalize = (value: any, type: string): unknown => {
    switch (type) {
        case "hash":
            return String(value).replace(/^0x/, "");
        case "bytes":
            return String(value).replace(/^0x/, "");
        case "uint256":
        case "uint64":
        case "uint32":
        case "uint16":
        case "uint8":
            return value.toString();
        default:
            return value;
    }
};

describe("Settlement variable decoding", () => {
    for (const variable of fixture.variables) {
        it(`decodes ${variable.name} exactly as go-zenon packed it`, () => {
            const decoded = SettlementContract.decodeVariable(variable.name, "0x" + variable.data);
            variable.types.forEach((entry, idx) => {
                const [name, type] = entry.split(":");
                const expected = type.startsWith("uint") ? String(variable.args[idx]) : variable.args[idx];
                const actual = normalize(decoded[name], type);
                if (type === "address") {
                    expect(String(actual)).to.equal(String(expected));
                } else {
                    expect(actual, `${variable.name}.${name}`).to.equal(expected);
                }
            });
        });
    }
});

describe("SettlementKeys", () => {
    const hashA = Hash.parse("aa".repeat(32));

    it("builds the keys the fixture state tree was keyed with", () => {
        const keyOf = (label: string) => proofFor(label).key;
        expect(hex(stateTreeKey(SettlementKeys.domainRecord(3)))).to.equal(keyOf("domainRecord/3"));
        expect(hex(stateTreeKey(SettlementKeys.domainConfig(3)))).to.equal(keyOf("domainConfig/3"));
        expect(hex(stateTreeKey(SettlementKeys.batchEntry(3, 0n)))).to.equal(keyOf("batchEntry/3/0"));
        expect(hex(stateTreeKey(SettlementKeys.domainRecord(99)))).to.equal(keyOf("domainRecord/99"));
        expect(hex(stateTreeKey(SettlementKeys.timeChallenge("SetDomainConfig/3"))))
            .to.equal(keyOf("timeChallenge/SetDomainConfig/3"));
    });

    it("prefixes the state-tree key with 0x03 || contract || 0x04", () => {
        const treeKey = stateTreeKey(Uint8Array.of(0x99));
        expect(hex(treeKey.slice(0, 1))).to.equal("03");
        expect(hex(treeKey.slice(1, 21))).to.equal(hex(SETTLEMENT_ADDRESS.getBytes()));
        expect(hex(treeKey.slice(21))).to.equal("0499");
    });

    it("uses the prefix of each entry in the table", () => {
        const deployer = Address.parse("z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp");
        const prefix = (k: Uint8Array) => k[0];
        expect(prefix(SettlementKeys.domainRecord(1))).to.equal(0x01);
        expect(prefix(SettlementKeys.receivedInputCounter())).to.equal(0x04);
        expect(prefix(SettlementKeys.deployRecord(1, deployer, hashA))).to.equal(0x0a);
        expect(prefix(SettlementKeys.processedOutbox(hashA))).to.equal(0x0b);
        expect(prefix(SettlementKeys.peripheryConfig())).to.equal(0x0d);
        expect(prefix(SettlementKeys.globalPauseState())).to.equal(0x12);
        expect(prefix(SettlementKeys.domainCounter())).to.equal(0x18);
        expect(prefix(SettlementKeys.feeCounters())).to.equal(0x1b);
        expect(prefix(SettlementKeys.batchWithdrawalTotal(1, 2n, hashA))).to.equal(0x22);
        expect(prefix(SettlementKeys.timeChallenge("x"))).to.equal(135);
        expect(SettlementKeys.deployChunk(1, deployer, hashA, 5n, 2)).to.have.length(1 + 4 + 20 + 32 + 8 + 4);
    });
});

describe("SettlementStorage", () => {
    const HEIGHT = 10;

    const momentumJson = (stateRoot: string) => ({
        count: 1,
        list: [{
            version: 3, chainIdentifier: 1, hash: "11".repeat(32), previousHash: "22".repeat(32),
            height: HEIGHT, timestamp: 1, data: "", content: [], changesHash: "33".repeat(32),
            publicKey: "", signature: "", producer: "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f",
            stateRoot,
        }],
    });

    const setup = (opts: { headerRoot?: string; tamper?: (p: Record<string, any>) => void } = {}) => {
        const client = new MockClient();
        const ledger = new LedgerApi();
        ledger.setClient(client);
        const storage = new SettlementStorage(ledger);
        client.setMockResponse("ledger.getMomentumsByHeight", momentumJson(opts.headerRoot ?? fixture.root));
        const serve = (label: string) => {
            const p = proofFor(label);
            const response: Record<string, any> = {
                value: p.absent ? null : Buffer.from(p.value!, "hex").toString("base64"),
                proof: Buffer.from(p.proof, "hex").toString("base64"),
                root: fixture.root,
            };
            opts.tamper?.(response);
            client.setMockResponse("ledger.getProof", response);
        };
        return { client, storage, serve };
    };

    it("reads and decodes a verified domain record", async () => {
        const { storage, serve, client } = setup();
        serve("domainRecord/3");
        const decoded = await storage.readVariable(HEIGHT, SettlementKeys.domainRecord(3), "domainRecord");
        expect(decoded).to.not.equal(null);
        expect(Number(decoded!.domainClass)).to.equal(3);

        const call = client.getCallHistory().find((c) => c.method === "ledger.getProof")!;
        expect(call.parameters[0]).to.equal(HEIGHT);
        expect(Buffer.from(call.parameters[1], "base64").toString("hex"))
            .to.equal(hex(stateTreeKey(SettlementKeys.domainRecord(3))));
    });

    it("reports a verified absence as null", async () => {
        const { storage, serve } = setup();
        serve("domainRecord/99");
        expect(await storage.readVariable(HEIGHT, SettlementKeys.domainRecord(99), "domainRecord")).to.equal(null);
        expect((await storage.read(HEIGHT, SettlementKeys.domainRecord(99))).present).to.equal(false);
    });

    it("reads processed-outbox membership as the literal byte 0x01", async () => {
        const { storage, serve } = setup();
        serve("processedOutbox");
        const outboxId = Hash.digest(Buffer.from("o"));
        // The fixture keyed the entry under NewHash("o"), the same SHA3-256 derivation.
        const read = await storage.read(HEIGHT, SettlementKeys.processedOutbox(outboxId));
        expect(Array.from(read.value!)).to.deep.equal([1]);
        expect(await storage.isOutboxProcessed(HEIGHT, outboxId)).to.equal(true);
    });

    it("reads a time challenge through the Common ABI", async () => {
        const { storage, serve } = setup();
        serve("timeChallenge/SetDomainConfig/3");
        const challenge = await storage.readTimeChallenge(HEIGHT, "SetDomainConfig/3");
        expect(challenge!.methodName).to.equal("SetDomainConfig/3");
        expect(challenge!.challengeStartHeight).to.equal(77n);
    });

    it("rejects a proof root that differs from the momentum StateRoot", async () => {
        const { storage, serve } = setup({ tamper: (p) => { p.root = "ab".repeat(32); } });
        serve("domainRecord/3");
        await expectProofError(storage.read(HEIGHT, SettlementKeys.domainRecord(3)));
    });

    it("rejects a tampered value", async () => {
        const { storage, serve } = setup({
            tamper: (p) => {
                const value = Buffer.from(p.value, "base64");
                value[value.length - 1] ^= 0x01;
                p.value = value.toString("base64");
            },
        });
        serve("domainRecord/3");
        await expectProofError(storage.read(HEIGHT, SettlementKeys.domainRecord(3)));
    });

    it("rejects a proof for a different key", async () => {
        const { storage, serve } = setup();
        serve("domainConfig/3");
        await expectProofError(storage.read(HEIGHT, SettlementKeys.domainRecord(3)));
    });

    it("rejects an absence claim for a present key", async () => {
        const { storage, serve } = setup({ tamper: (p) => { p.value = null; } });
        serve("domainRecord/3");
        await expectProofError(storage.read(HEIGHT, SettlementKeys.domainRecord(3)));
    });

    it("rejects a momentum without a StateRoot", async () => {
        const { storage, serve } = setup({ headerRoot: "00".repeat(32) });
        serve("domainRecord/3");
        await expectProofError(storage.read(HEIGHT, SettlementKeys.domainRecord(3)));
    });
});

async function expectProofError(promise: Promise<unknown>): Promise<void> {
    try {
        await promise;
    } catch (e) {
        expect(e).to.be.instanceOf(SettlementProofError);
        return;
    }
    expect.fail("expected SettlementProofError");
}
