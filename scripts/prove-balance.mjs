// Standalone light-client example: asks a node for a momentum and a Merkle proof of an
// account's token balance, then verifies the proof against the momentum's StateRoot.
// The node is trusted for nothing beyond the signed momentum header.
//
// Usage (builds dist first):
//   npm run prove-balance -- --address z1q... [--token zts1...] [--height N] [--url http://127.0.0.1:35997]
//
// --height 0 (default) uses the frontier momentum. --token defaults to ZNN.
import { parseArgs } from "node:util";
import * as ed from "@noble/ed25519";
import {
    Address,
    TokenStandard,
    ZNN_ZTS,
    Zenon,
    state,
} from "../dist/index.js";

const fail = (message) => {
    console.error(`error: ${message}`);
    process.exit(1);
};

const { values } = parseArgs({
    options: {
        url: { type: "string", default: "http://127.0.0.1:35997" },
        address: { type: "string" },
        token: { type: "string", default: ZNN_ZTS.toString() },
        height: { type: "string", default: "0" },
    },
});

if (!values.address) fail("missing --address");
const height = Number(values.height);
if (!Number.isInteger(height) || height < 0) fail("bad --height");

const address = Address.parse(values.address);
const token = TokenStandard.parse(values.token);

const zenon = Zenon.getInstance();
await zenon.initialize(values.url);
try {
    // 1. Fetch the momentum whose StateRoot the proof must reconstruct to.
    let momentum;
    if (height === 0) {
        momentum = await zenon.ledger.getFrontierMomentum();
    } else {
        momentum = (await zenon.ledger.getMomentumsByHeight(height, 1)).list[0];
        if (!momentum || momentum.height !== height) fail(`no momentum at height ${height}`);
    }
    const m = momentum;
    console.log(`momentum     height=${m.height} hash=${m.hash}`);
    if (!m.stateRoot || m.stateRoot.getBytes().every((b) => b === 0)) {
        fail(`StateRoot is zero at height ${m.height}: the state-root spork is not active here`);
    }
    const stateRoot = m.stateRoot;
    console.log(`state root   ${stateRoot}`);

    // 2. The momentum is signed by its producing pillar: check the signature binds this hash.
    //    A full light client would also confirm the signer is an eligible pillar for this height
    //    and recompute the momentum hash to bind the StateRoot into it.
    const publicKey = Buffer.from(m.publicKey, "base64");
    const signature = Buffer.from(m.signature, "base64");
    if (!(await ed.verifyAsync(signature, m.hash.getBytes(), publicKey))) {
        fail("momentum signature invalid");
    }
    console.log(`signature    valid (signed by ${Address.fromPublicKey(publicKey)})`);

    // 3. Ask the node for the proof at this height.
    const key = state.balanceKey(address, token);
    const proof = await zenon.ledger.getProof(m.height, key);

    // 4. The proof must reconstruct to the signed StateRoot, not whatever the node claims.
    if (!proof.root.getBytes().equals(stateRoot.getBytes())) {
        fail(`served proof root ${proof.root} != signed StateRoot ${stateRoot}`);
    }

    // 5. Verify against the StateRoot without trusting the node.
    const path = state.pathOfKey(key);
    let balance = 0n;
    if (proof.value === null) {
        if (!state.verifyAbsenceByPath(stateRoot, path, proof.proof)) fail("absence proof failed");
        console.log("proof        VERIFIED (absent, never held)");
    } else {
        if (!state.verifyProofByPath(stateRoot, path, proof.value, proof.proof)) fail("inclusion proof failed");
        balance = BigInt(`0x${proof.value.toString("hex") || "0"}`);
        console.log("proof        VERIFIED (inclusion)");
    }

    console.log(`\n${address} holds ${balance} of ${token} at height ${m.height} (proven against StateRoot ${stateRoot})`);
    console.log("(amount is in the token's smallest unit: ZNN and QSR have 8 decimals)");
} finally {
    zenon.clearConnection();
}
