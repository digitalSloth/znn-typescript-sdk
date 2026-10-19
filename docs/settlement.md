# Settlement

Settlement is an embedded contract on the Zenon Network of Momentum that anchors off-chain execution domains to the L1 ledger. The SDK covers the contract's read RPC, its transaction builders, the withdrawal helpers, and proof-verified reads of its storage.

---

## Concepts

- **Domain:** a registered execution domain with its own configuration, executors, batches and assets.
- **Executor:** a pillar-backed account registered to run a domain.
- **Batch:** a commitment an executor submits for a domain. Reads expose each batch's state. The SDK has no builder for batch submission, because executors submit batches.
- **Input:** something a user sends to a domain through Settlement: a deposit, an L2 call, or a contract deployment, upgrade, ownership transfer or storage purchase.
- **Outbox and withdrawals:** a domain's withdrawals are registered from its outbox and released from a queue in order.
- **Periphery:** the prices Settlement charges for contract bytecode and state storage.
- **Time challenge:** an administrator call that Settlement records first and applies after a delay.

Settlement is gated by a spork. Before it activates, every read RPC returns an empty result instead of an error, and a record that does not exist is `null`.

All APIs below are on `zenon.embedded.settlement`. The builder methods return an `AccountBlockTemplate`. Pass it to `zenon.send(block, keyPair)` to broadcast it.

---

## Reading state

```typescript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

try {
    const domain = await zenon.embedded.settlement.getDomainInfo(3); // null when absent
    const batches = await zenon.embedded.settlement.getBatches(3, 0, 10); // newest first
} finally {
    zenon.clearConnection();
}
```

| Method | Returns |
|---|---|
| `getDomainInfo(domainId)` | `SettlementDomainInfo \| null` |
| `getAllDomains(pageIndex, pageSize)` | `SettlementDomainInfoList` |
| `getBatch(domainId, batchId)` | `SettlementBatch \| null` |
| `getBatches(domainId, pageIndex, pageSize)` | `SettlementBatchList`, newest first |
| `getDeployRecord(domainId, deployer, codeHash)` | `SettlementDeployRecord \| null` |
| `getDeployRecordsByDeployer(domainId, deployer, pageIndex, pageSize)` | `SettlementDeployRecordList` |
| `getAssetInfo(domainId, assetId)` | `SettlementAssetInfo \| null` |
| `getReleaseQueue(domainId, pageIndex, pageSize)` | `SettlementReleaseQueue` |
| `isOutboxProcessed(outboxId)` | `boolean` |
| `getExecutorSet()` | `SettlementExecutorList` |
| `getFeeInfo()` | `SettlementFeeInfo` |
| `getPauseState()` | `SettlementPauseInfo` |
| `getPeripheryConfig()` | `SettlementPeripheryConfig \| null`, `null` before the first `setPeripheryConfig` |
| `getTimeChallengesInfo()` | `SettlementTimeChallengeList` |

Paged methods default to the RPC maximum page size.

---

## Sending transactions

### User methods

```typescript
import { ZNN_ZTS } from 'znn-typescript-sdk';

// Deposit tokens to a contract in a domain.
const deposit = zenon.embedded.settlement.deposit(domainId, targetContract, plasmaLimit, ZNN_ZTS, amount);

// Call a contract in a domain, optionally attaching tokens.
const call = zenon.embedded.settlement.callL2(domainId, targetContract, plasmaLimit, payload);

await zenon.send(deposit, keyPair);
```

| Method | Purpose |
|---|---|
| `deposit(domainId, targetContract, plasmaLimit, token, amount)` | Deposit tokens into a domain. |
| `callL2(domainId, targetContract, plasmaLimit, payload, token?, amount?)` | Call a contract in a domain. |
| `deployContractStart`, `deployContractChunk`, `deployContractFinalize` | Deploy a contract in chunks (see below). |
| `upgradeContract(domainId, contractId, newCodeHash, fee)` | Point a contract at new code. |
| `transferContractOwnership(domainId, contractId, newOwner)` | The zero address as `newOwner` renounces ownership. |
| `buyStorage(domainId, contractId, bytes, fee)` | Buy contract state storage. `fee` is `bytes * znnPerByteOfState`. |

The builders validate their inputs against the protocol limits (`MaxCallPayload`, `MaxInputGas`, `MaxCodeSize` and the rest in the constants) before building the block.

### Permissionless methods

| Method | Purpose |
|---|---|
| `releaseWithdrawals(domainId)` | Release queued withdrawals for a domain. |
| `relayMessage(domainId, batchId, message, inclusionProof)` | Relay an outbox message with its inclusion proof. |
| `update()` | Pillar producer addresses call this to trigger Settlement's internal processing. Users do not need to call it, and calling it does no harm. |
| `collectReward()` | A pillar collects its accrued rewards from the storage fees. |

### Administrator methods

The contract restricts these calls. Several are time-challenged.

`registerDomain`, `setDomainConfig`, `setAssetConfig`, `setApprovedDAModes`, `pause`, `initiateEscapeHatch`, `registerExecutor` and `setPeripheryConfig`.

```typescript
import { settlement } from 'znn-typescript-sdk';

const block = zenon.embedded.settlement.registerDomain({
    domainId: 3,
    domainClass: settlement.DomainClass.EXECUTION,
    runtimeKind: settlement.RuntimeKind.WASM,
    stfSpecHash,
    inputSource: settlement.InputSource.L1_NATIVE,
    execProfile: settlement.ExecProfile.ZK_VALIDITY,
    foreignProfile: settlement.ForeignProfile.NONE,
    profileConfig,
    chainBinding,
    minExecutors: 2,
    proposerPolicy: settlement.ProposerPolicy.SINGLE,
    finalityModel: settlement.FinalityModel.PROOF_VERIFIED,
    status: settlement.DomainStatus.ACTIVE,
    withdrawalDelay: 100800n,
    runtimeUpgradeDelay: 201600n,
});
```

#### Time challenges

A time-challenged call is recorded with a hash of its parameters under a key such as `SetDomainConfig/3`. Reproduce both client-side to find or verify a pending call:

```typescript
const params = { domainId: 3, withdrawalDelay: 100800n, runtimeUpgradeDelay: 201600n };

settlement.settlementChallengeKey('SetDomainConfig', params); // "SetDomainConfig/3"
settlement.settlementParamsHash('SetDomainConfig', params);
```

The supported methods are `RegisterDomain`, `SetDomainConfig`, `SetAssetConfig`, `SetApprovedDAModes`, `InitiateEscapeHatch`, `RegisterExecutor` and `SetPeripheryConfig`.

---

## Deploying a contract

A module is deployed in three steps: one start, one send per chunk, and one finalize that carries the bytecode fee. `settlement.planDeploy` does the chunking and pricing.

```typescript
const prices = await zenon.embedded.settlement.getPeripheryConfig(); // znnPerByteOfBytecode
const plan = settlement.planDeploy(wasmModule, metadata, prices!, availablePlasma);

const api = zenon.embedded.settlement;
await zenon.send(
    api.deployContractStart(domainId, plan.codeHash, plan.metadataHash, plan.totalSize, plan.chunkCount, metadata),
    keyPair
);
for (const chunk of plan.chunks) {
    await zenon.send(
        api.deployContractChunk(domainId, plan.codeHash, chunk.index, chunk.chunkHash, chunk.data),
        keyPair
    );
}
await zenon.send(api.deployContractFinalize(domainId, plan.codeHash, plan.fee), keyPair);
```

`DeployPlan` also reports:

- `sendCount`: `chunkCount + 2`.
- `needsFusedPlasma`: `true` when any send needs more plasma than proof of work can supply (`settlement.MAX_POW_PLASMA`).
- `qsrPerChunkInFlight` and `chunksInFlight`: how much QSR to fuse, and how many of the largest chunk sends the available plasma covers at once.

Limits: `MaxCodeSize` is 256 KiB, `MaxDeployChunkData` is 15 KiB, `MaxChunkCount` is 18 and `MaxContractMetadataSize` is 256 bytes. A deployment expires after `DeploymentExpiryWindow` (2880) momentums.

---

## Proof-verified storage reads

`SettlementStorage` reads Settlement's contract storage through `ledger.getProof` and verifies each proof against the momentum's `StateRoot` (see [State Root](./state-root.md)). The height must hold a version 3 momentum the node still retains.

```typescript
const storage = new settlement.SettlementStorage(zenon.ledger);

const read = await storage.read(height, settlement.SettlementKeys.domainInputCounter(3));
// { height, root, present, value }

const domain = await storage.readVariable(height, settlement.SettlementKeys.domainRecord(3), 'domainRecord');
const processed = await storage.isOutboxProcessed(height, outboxId);
const challenge = await storage.readTimeChallenge(height, 'SetDomainConfig/3');
```

- `SettlementKeys` builds the storage key of every Settlement entry. `stateTreeKey(key)` turns a storage key into the state-tree key: `0x03 || SettlementContract || 0x04 || key`.
- Reads are point lookups. A proof cannot enumerate a prefix.
- A failed check throws `SettlementProofError` with the name of the check: no momentum at the height, no `StateRoot` on the momentum, a proof root that differs from the header, or a proof that does not verify.

---

## Helpers and constants

The `settlement` namespace also exports the helpers go-zenon defines for the contract.

| Group | Exports |
|---|---|
| Asset ids | `assetIdFromZts`, `ztsFromAssetId`, `SettlementAssetIdError` |
| Withdrawals | `outboxId`, `decodeOutboxWithdrawal`, `outboxProofRoot`, `SettlementWithdrawalError`, `OutboxWithdrawalSize` |
| Constants | the protocol limits (including `MaxMerkleProofDepth`) and the enumerations: `DomainClass`, `RuntimeKind`, `InputSource`, `ExecProfile`, `ForeignProfile`, `ProposerPolicy`, `FinalityModel`, `DomainStatus`, `BatchState`, `ExecutorStatus`, `PauseScope`, `UpgradePolicy`, `DAMode` |

Enumeration values are the numbers that go on the wire. Only the values the contract accepts are listed, and it refuses any other number.

The canonical L2 codec, the L2 derivations (`chain_id`, caller, `ContractID`, storage keys), receipt and event decoders and input encoding are defined by the executor, not by go-zenon. They live in the `zeno-sdk` package.

### Withdrawals

`relayMessage` takes an encoded outbox message and a Merkle proof. A client checks both before it spends a send.

```typescript
const id = settlement.outboxId(domainId, batchId, inputIndex, outboxIndex);
const withdrawal = settlement.decodeOutboxWithdrawal(message); // throws SettlementWithdrawalError
const root = settlement.outboxProofRoot(message, proof);       // compare with the batch outboxRoot
```

`decodeOutboxWithdrawal` accepts only the 133-byte kind 1 message Settlement registers: an empty payload, a canonical asset id, a non-zero amount and a recipient that is not an embedded contract. `outboxProofRoot` rejects a proof deeper than `MaxMerkleProofDepth`, a wrong length or a side other than 0 or 1.

---

## Testing against go-zenon

The specs run against fixtures generated by go-zenon tests, not hand-written ones:

- `test/fixtures/settlement-go.json`: ABI-encoded calldata and challenge hashes.
- `test/fixtures/settlement-state-go.json`: stored variables with state proofs and the state root.
- `test/fixtures/settlement-rpc-go.json`: RPC results.
- `test/fixtures/settlement-withdrawal-go.json`: outbox ids, withdrawal messages and proofs.
