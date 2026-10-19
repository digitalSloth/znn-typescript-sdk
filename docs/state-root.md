# Merkle State Root

Momentums can commit to the chain's key-value state with a Merkle root. The SDK fetches state proofs from a node and verifies them against that root, so a client trusts the signed momentum header and nothing else the node says.

---

## How it works

From the activation of `StateRootSpork`, every momentum has version 3 and carries a `stateRoot`. The root is the root of a sparse Merkle tree (SMT) over the chain's state. Before the spork, the field is empty and no proofs exist.

- **Tree:** 256 levels deep. A key sits at the position `SHA3-256(key)`.
- **Leaf:** `SHA3-256(path || value)`, where `path` is the 32-byte position.
- **Node:** `SHA3-256(left || right)`. A node whose two children are both empty is the zero hash, so an empty tree has the zero root.
- **Proof:** the non-zero siblings on the path from the leaf to the root. The SDK verifies inclusion (a value sits at the position) and absence (nothing sits there).

---

## Reading the root and a proof

```typescript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

try {
    const momentum = (await zenon.ledger.getMomentumsByHeight(height, 1)).list[0];
    console.log(momentum.stateRoot?.toString()); // null before the spork

    const root = await zenon.ledger.getStateRoot(height);
    const proof = await zenon.ledger.getProof(height, key); // key: Uint8Array
} finally {
    zenon.clearConnection();
}
```

| Method | Returns | Notes |
|---|---|---|
| `zenon.ledger.getStateRoot(height)` | `Hash` | The height must hold a version 3 momentum the node still retains. |
| `zenon.ledger.getProof(height, key)` | `StateProof` | `key` is the raw state-tree key. The SDK sends it base64-encoded. |
| `Momentum.stateRoot` | `Hash \| null` | `null` for momentums without a root. |

`StateProof` has three fields:

- `value`: the stored bytes, or `null` when the key is absent.
- `proof`: the serialized SMT proof.
- `root`: the root the node says the proof reconstructs to.

---

## Verifying a proof

Import the verifier from the `state` namespace.

```typescript
import { state } from 'znn-typescript-sdk';

const path = state.pathOfKey(key); // SHA3-256(key)

const ok = proof.value === null
    ? state.verifyAbsenceByPath(root, path, proof.proof)
    : state.verifyProofByPath(root, path, proof.value, proof.proof);
```

Always check against the `stateRoot` from the momentum header, never against `proof.root` alone. A node can serve a proof that is valid for a root it made up. Compare `proof.root` to the header's `stateRoot` first.

| Export | Purpose |
|---|---|
| `pathOfKey(key)` | The tree position of a raw key, as a `Hash`. |
| `verifyProofByPath(root, path, value, proof)` | `true` when `value` sits at `path` under `root`. |
| `verifyAbsenceByPath(root, path, proof)` | `true` when nothing sits at `path` under `root`. |
| `decodeSmtProof(bytes)` | Parses a proof and rejects every structural violation. |
| `leafHash(path, value)` | `SHA3-256(path || value)`. |
| `balanceKey(address, tokenStandard)` | The state-tree key of an account's token balance: `0x03 \|\| address \|\| 0x03 \|\| zts`. |
| `SmtProofError` | Thrown for a malformed proof, a proof for a different path, or the wrong kind of proof. |

The verifiers return `false` for a wrong value or a wrong root. They throw `SmtProofError` when the proof itself is malformed, is for another path, or is an inclusion proof where an absence proof was expected (or the reverse).

### Proof format

All integers are big-endian.

| Field | Size |
|---|---|
| flags (bit 0 = value present, other bits must be 0) | 1 byte |
| path | 32 bytes |
| leaf hash (zero for an absence proof) | 32 bytes |
| sibling bitmap | 32 bytes |
| sibling count (must equal the bitmap's set bits) | 2 bytes |
| siblings | 32 bytes each |
| value (inclusion proofs only): length, then bytes | 4 bytes + length |

Trailing bytes are rejected.

---

## Example: prove a balance

`scripts/prove-balance.mjs` is a standalone light-client example. It fetches a momentum, checks the pillar signature on its hash, requests the balance proof, and verifies it against the signed `StateRoot`.

```bash
npm run prove-balance -- --address z1q... [--token zts1...] [--height N] [--url http://127.0.0.1:35997]
```

- `--height 0` (the default) uses the frontier momentum.
- `--token` defaults to ZNN.
- The script builds `dist` first, because it imports from there.
- The amount is in the token's smallest unit. ZNN and QSR have 8 decimals.

The script exits with an error when the spork is not active, the signature is invalid, the served proof root differs from the signed root, or the proof fails. It checks the signature but does not confirm that the signer is an eligible pillar for that height, and it does not recompute the momentum hash. A production light client needs both.

---

## Test vectors

`test/fixtures/smt-v1-test-vectors.json` is the SMT conformance suite copied from go-zenon (`common/trie/testdata`). `test/state/smt.spec.ts` checks the file's SHA-256 and verifies every inclusion and absence proof in it, with a wrong value and a wrong root as negative cases.
