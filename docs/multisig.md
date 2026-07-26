# Multisig Accounts

Complete guide to creating and managing mutable, protocol-level X-of-N multisig accounts with the ZNN TypeScript SDK.

---

## Overview

A multisig account has its own address, but unlike a normal user address its `{signers, threshold}` policy is **mutable consensus state** — it can be rotated later (subject to a maturity delay) without changing the address.

Because a multisig block must be signed by multiple independent parties — often on different machines — this SDK does not sign multisig blocks the same way it signs a normal single-keypair transaction. Instead it exposes three composable primitives:

1. **`freezeBlock`** – autofills, proof-of-works, and hashes the block, leaving it unsigned.
2. **`signBlock`** – has one signer produce a single raw signature over the frozen hash.
3. **`assembleMultisigAuth`** – attaches the collected signatures once enough have been gathered.

The frozen block is a plain `AccountBlockTemplate`, so it round-trips through the SDK's existing `toJson()`/`fromJson()` — the same mechanism used everywhere else in the SDK — which is what makes it possible to hand a pre-signed-but-not-yet-complete block to another signer on a different machine.

> **Note:** This feature depends on a protocol-level spork that ships **dormant**. Sending to the multisig contract before the spork is activated on-chain fails synchronously with a node error — see [Error Handling](#error-handling) below.

---

## Creating a Multisig Account

Multisig addresses are **derived, not chosen** — anyone who knows the creator's public key and a nonce can compute the address offline, before the account exists on-chain.

```javascript
import { Address, KeyPair } from 'znn-typescript-sdk';

const creator = wallet.getKeyPair(0); // a normal KeyPair
const nonce = 1n;

// Deterministically derive the multisig account's address
const multisigAddress = Address.fromMultisigCreation(creator.publicKey, nonce);
console.log('Multisig address:', multisigAddress.toString());

// Detect whether any address is a multisig account
console.log(Address.isMultisigAddress(multisigAddress)); // true
```

Send `CreateMultisig` from the creator's own (normal, single-keypair) account — this is a regular send, so the existing `zenon.send(...)` path is used directly:

```javascript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

// N (the total number of signers) is NOT a separate parameter — it's just
// signers.length. There is no "totalSigners" argument to set.
const signerPubKeys = [creator.publicKey, otherSigner.publicKey, thirdSigner.publicKey];

const block = zenon.embedded.multisig.createMultisig(
  creator.getAddress(), // the creator's own address; must not itself be a multisig address
  nonce,
  2,               // threshold (X): how many of the signers below must sign
  signerPubKeys,   // the N signers: raw 32-byte ed25519 public keys, creator's key must be included
);
// The line above creates a 2-of-3 policy purely because signerPubKeys has 3 entries.

await zenon.send(block, creator);

zenon.clearConnection();
```

The creator's account must hold at least 1 ZNN, which is burned irreversibly on creation, plus enough plasma or fused QSR to cover the send.

The node enforces `2 <= signers.length <= 16` and `threshold <= signers.length` — the SDK does not validate this client-side, so an out-of-range value surfaces as a `MultisigInvalidPolicyException` (see [Error Handling](#error-handling)) once you send the block. `createMultisig` throws `MultisigCreatorMustBeSingleSigException` if `creator` is itself a multisig address — nested multisig creation is not supported.

---

## Reading the Active Policy

```javascript
const record = await zenon.embedded.multisig.getPolicy(multisigAddress);

if (record) {
  console.log('Active threshold:', record.active.threshold);
  console.log('Active signers:', record.active.signers.map(s => s.toString('hex')));
  console.log('Locked:', record.active.locked);

  if (record.pending) {
    console.log('Pending policy change:', record.pending);
    console.log('Matures at height:', record.pendingHeight);
  }
}
```

`active` already reflects any matured `pending` change; `pending`/`pendingHeight` describe a still-staged change that hasn't taken effect yet.

---

## Signing a Block From the Multisig Account

Every block sent **by** the multisig account itself (e.g. `ChangePolicy`, or sending funds out of the account) needs `threshold`-many signatures instead of one. This is where `freezeBlock` / `signBlock` / `assembleMultisigAuth` come in.

### Single Process (All Keys Available)

```javascript
import { Zenon, freezeBlock, signBlock, assembleMultisigAuth } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

// 1. Build the contract call template (address is NOT derived from a keypair)
const template = zenon.embedded.multisig.changePolicy(newThreshold, newSigners, false);

// 2. Freeze it: autofill height/previousHash, run PoW, compute the hash.
//    publicKey/signature are left empty — this is what every signer signs over.
const frozen = await freezeBlock(zenon, template, multisigAddress);

// 3. Collect signatures — order doesn't matter, the node trial-matches them
//    against the active policy's signer set.
const sig1 = signBlock(frozen, signerKeyPair1);
const sig2 = signBlock(frozen, signerKeyPair2);

// 4. Assemble and publish once >= threshold signatures are collected.
assembleMultisigAuth(frozen, [sig1, sig2]);
await zenon.ledger.publishRawTransaction(frozen);

zenon.clearConnection();
```

The same three-step flow works for **receiving** funds into a multisig account — just start from `AccountBlockTemplate.receive(sendBlockHash)` instead of a contract-call template:

```javascript
import { AccountBlockTemplate } from 'znn-typescript-sdk';

const receiveTemplate = AccountBlockTemplate.receive(unreceivedSendHash);
const frozenReceive = await freezeBlock(zenon, receiveTemplate, multisigAddress);

const sig1 = signBlock(frozenReceive, signerKeyPair1);
const sig2 = signBlock(frozenReceive, signerKeyPair2);

assembleMultisigAuth(frozenReceive, [sig1, sig2]);
await zenon.ledger.publishRawTransaction(frozenReceive);
```

### Cross-Machine / Multi-Device Signing

The most realistic deployment has each signer on a separate machine. Because a frozen block is a normal `AccountBlockTemplate`, it serializes through the SDK's existing JSON round-trip — no separate wire format is needed.

**Machine A — freeze and hand off:**

```javascript
const frozen = await freezeBlock(zenon, template, multisigAddress);

// Ship this JSON to the next signer (file, QR code, HTTP request, etc.)
const payload = JSON.stringify(frozen.toJson());
```

**Machine B — sign and hand back:**

```javascript
import { AccountBlockTemplate, signBlock } from 'znn-typescript-sdk';

const frozen = AccountBlockTemplate.fromJson(JSON.parse(payload));
const signature = signBlock(frozen, myKeyPair);

// Send just the signature back to whoever is assembling the final block
const signaturePayload = signature.toString('base64');
```

**Coordinator — assemble once enough signatures are back:**

```javascript
import { AccountBlockTemplate, assembleMultisigAuth } from 'znn-typescript-sdk';

const frozen = AccountBlockTemplate.fromJson(JSON.parse(payload));
const signatures = collectedBase64Signatures.map(s => Buffer.from(s, 'base64'));

assembleMultisigAuth(frozen, signatures);
await zenon.ledger.publishRawTransaction(frozen);
```

Because the hash is computed once during `freezeBlock` and carried through the JSON round-trip unchanged, every signer signs the exact same bytes regardless of which machine they're on.

**Important:**
- `freezeBlock` does not sign anything — call it once, then distribute the frozen block.
- `signBlock` will throw if called on a block that hasn't been frozen yet (its hash is still the empty default).
- `assembleMultisigAuth` doesn't enforce the threshold itself — the node validates signature count and validity against the account's active policy when the block is published.

### Signature Collection Timing

Freezing and signing are separable: a frozen block can be circulated for signing over an extended period — realistically anywhere from hours up to about a week. Authorization is checked live, at momentum-inclusion time, against whichever policy is active then — not against a snapshot pinned at freeze or submit time.

If collection runs past the mempool's hygiene window, or a policy rotation invalidates the collected signatures before the block is included, the block is silently excluded from momentum production (and blocks any later blocks queued on the same account), with no node notification. A wallet must poll for confirmation (e.g. via `zenon.ledger.getAccountBlockByHash` or the account's height) and re-freeze and re-collect signatures if the block never lands.

---

## Error Handling

Embedded-contract and account-block validation errors raised by the node are mapped to typed exceptions so downstream apps can distinguish failure modes instead of parsing raw error strings:

```javascript
import {
  MultisigPolicyLockedException,
  MultisigThresholdMismatchException,
  MultisigSporkNotActivatedException,
  ZnnEmbeddedContractException,
} from 'znn-typescript-sdk';

try {
  await zenon.ledger.publishRawTransaction(frozen);
} catch (error) {
  if (error instanceof MultisigPolicyLockedException) {
    console.error('This account\'s policy is locked and cannot be changed.');
  } else if (error instanceof MultisigThresholdMismatchException) {
    console.error('Not enough valid signatures were collected.');
  } else if (error instanceof MultisigSporkNotActivatedException) {
    console.error('Multisig support is not yet active on this network.');
  } else if (error instanceof ZnnEmbeddedContractException) {
    // Catch-all for any other typed embedded-contract error
    console.error(`${error.contract} error:`, error.message);
  } else {
    throw error;
  }
}
```

All typed exceptions extend `ZnnClientException`, so existing code that catches `ZnnClientException` continues to work unchanged.

---

## Next Steps

- **[Examples](./examples.md)** – Complete working examples
- **[API Overview](./api-overview.md)** – All API methods & Embedded Contract Calls
- **[Utilities](./utilities.md)** – Utilities and constants for common tasks
- **[Wallet Management](./wallet.md)** – Creating and managing wallets
- **[CLI Tool](./cli.md)** – Command-line interface
