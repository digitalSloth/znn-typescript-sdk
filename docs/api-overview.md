# API Overview

High-level API reference for the ZNN TypeScript SDK.

---

## Available APIs

All APIs are available on the `zenon` object.

### Ledger API
- `zenon.ledger.getAccountInfoByAddress(address)` - Get account balance and info
- `zenon.ledger.getFrontierAccountBlock(address)` - Get latest account block
- `zenon.ledger.getAccountBlockByHash(hash)` - Get specific account block
- `zenon.ledger.getAccountBlocksByHeight(address, height, count)` - Get blocks by height
- `zenon.ledger.getAccountBlocksByPage(address, pageIndex, pageSize)` - Get blocks by page
- `zenon.ledger.getUnconfirmedBlocksByAddress(address, pageIndex, pageSize)` - Get unconfirmed blocks
- `zenon.ledger.getUnreceivedBlocksByAddress(address, pageIndex, pageSize)` - Get unreceived blocks
- `zenon.ledger.getFrontierMomentum()` - Get latest momentum
- `zenon.ledger.getMomentumBeforeTime(time)` - Get momentum before timestamp
- `zenon.ledger.getMomentumByHash(hash)` - Get momentum by hash
- `zenon.ledger.getMomentumsByHeight(height, count)` - Get momentums by height
- `zenon.ledger.getMomentumsByPage(pageIndex, pageSize)` - Get momentums by page
- `zenon.ledger.getDetailedMomentumsByHeight(height, count)` - Get detailed momentums
- `zenon.ledger.publishRawTransaction(block)` - Publish signed transaction

### Subscriptions
- `zenon.subscribe.toMomentums()` - Subscribe to new momentums
- `zenon.subscribe.toAllAccountBlocks()` - Subscribe to all account blocks
- `zenon.subscribe.toAccountBlocksByAddress(address)` - Subscribe to account blocks for address
- `zenon.subscribe.toUnreceivedAccountBlocksByAddress(address)` - Subscribe to unreceived account blocks for address

### Stats API
- `zenon.stats.networkInfo()` - Get network information
- `zenon.stats.osInfo()` - Get node OS information
- `zenon.stats.processInfo()` - Get node process information
- `zenon.stats.syncInfo()` - Get sync status

## Embedded Contracts

### Accelerator
- `zenon.embedded.accelerator.getAll(pageIndex, pageSize)` - Get accelerator projects with pagination
- `zenon.embedded.accelerator.getProjectById(id)` - Get project details by id
- `zenon.embedded.accelerator.getPhaseById(id)` - Get phase details by id
- `zenon.embedded.accelerator.getPillarVotes(name, hashes)` - Get pillar votes for a list of phase ids
- `zenon.embedded.accelerator.getVoteBreakdown(id)` - Get vote breakdown for a phase
- `zenon.embedded.accelerator.createProject(name, description, url, znnFundsNeeded, qsrFundsNeeded)` - Create a new accelerator project
- `zenon.embedded.accelerator.addPhase(id, name, description, url, znnFundsNeeded, qsrFundsNeeded)` - Add a phase to an existing project
- `zenon.embedded.accelerator.updatePhase(id, name, description, url, znnFundsNeeded, qsrFundsNeeded)` - Update an existing project phase
- `zenon.embedded.accelerator.donate(amount, zts)` - Donate to the accelerator contract
- `zenon.embedded.accelerator.voteByName(id, pillarName, vote)` - Vote on a phase by pillar name
- `zenon.embedded.accelerator.voteByProdAddress(id, vote)` - Vote on a phase by producer address

### Bridge
- `zenon.embedded.bridge.getBridgeInfo()` - Get bridge configuration info
- `zenon.embedded.bridge.getOrchestratorInfo()` - Get orchestrator configuration
- `zenon.embedded.bridge.getNetworkInfo(networkClass, chainId)` - Get bridge network info
- `zenon.embedded.bridge.getAllNetworks(pageIndex, pageSize)` - Get all bridge networks with pagination
- `zenon.embedded.bridge.getWrapTokenRequestById(id)` - Get a wrap token request by id
- `zenon.embedded.bridge.getAllWrapTokenRequests(pageIndex, pageSize)` - Get all wrap token requests with pagination
- `zenon.embedded.bridge.getAllWrapTokenRequestsByToAddress(toAddress, pageIndex, pageSize)` - Get wrap requests by destination address
- `zenon.embedded.bridge.getAllWrapTokenRequestsByToAddressNetworkClassAndChainId(toAddress, networkClass, chainId, pageIndex, pageSize)` - Get wrap requests by destination address and network
- `zenon.embedded.bridge.getAllUnsignedWrapTokenRequests(pageIndex, pageSize)` - Get unsigned wrap token requests with pagination
- `zenon.embedded.bridge.getUnwrapTokenRequestByHashAndLog(txHash, logIndex)` - Get an unwrap token request by tx hash and log index
- `zenon.embedded.bridge.getAllUnwrapTokenRequests(pageIndex, pageSize)` - Get all unwrap token requests with pagination
- `zenon.embedded.bridge.getAllUnwrapTokenRequestsByToAddress(toAddress, pageIndex, pageSize)` - Get unwrap requests by destination address
- `zenon.embedded.bridge.getFeeTokenPair(zts)` - Get fee information for a token pair
- `zenon.embedded.bridge.getSecurityInfo()` - Get bridge security info
- `zenon.embedded.bridge.getTimeChallengesInfo()` - Get bridge time challenge info
- `zenon.embedded.bridge.wrapToken(networkClass, chainId, toAddress, amount, tokenStandard)` - Wrap tokens to another network
- `zenon.embedded.bridge.updateWrapRequest(id, signature)` - Update a wrap request with signature
- `zenon.embedded.bridge.halt(signature)` - Halt bridge operations
- `zenon.embedded.bridge.changeTssECDSAPubKey(pubKey, oldPubKeySignature, newPubKeySignature)` - Change TSS ECDSA public key
- `zenon.embedded.bridge.redeem(transactionHash, logIndex)` - Redeem wrapped tokens
- `zenon.embedded.bridge.unwrapToken(networkClass, chainId, transactionHash, logIndex, toAddress, tokenAddress, amount, signature)` - Submit unwrap token request
- `zenon.embedded.bridge.proposeAdministrator(address)` - Propose a new administrator
- `zenon.embedded.bridge.setNetwork(networkClass, chainId, name, contractAddress, metadata)` - Set a bridge network
- `zenon.embedded.bridge.removeNetwork(networkClass, chainId)` - Remove a bridge network
- `zenon.embedded.bridge.setTokenPair(networkClass, chainId, tokenStandard, tokenAddress, bridgeable, redeemable, owned, minAmount, feePercentage, redeemDelay, metadata)` - Set a token pair configuration
- `zenon.embedded.bridge.setNetworkMetadata(networkClass, chainId, metadata)` - Update bridge network metadata
- `zenon.embedded.bridge.removeTokenPair(networkClass, chainId, tokenStandard, tokenAddress)` - Remove a token pair
- `zenon.embedded.bridge.unhalt()` - Resume bridge operations
- `zenon.embedded.bridge.emergency()` - Trigger bridge emergency mode
- `zenon.embedded.bridge.changeAdministrator(administrator)` - Change bridge administrator
- `zenon.embedded.bridge.setAllowKeyGen(allowKeyGen)` - Allow or disallow key generation
- `zenon.embedded.bridge.setBridgeMetadata(metadata)` - Update bridge metadata
- `zenon.embedded.bridge.revokeUnwrapRequest(transactionHash, logIndex)` - Revoke an unwrap request
- `zenon.embedded.bridge.nominateGuardians(guardians)` - Nominate bridge guardians
- `zenon.embedded.bridge.setOrchestratorInfo(windowSize, keyGenThreshold, confirmationsToFinality, estimatedMomentumTime)` - Update orchestrator configuration

### HTLC
- `zenon.embedded.htlc.getById(id)` - Get HTLC details by id
- `zenon.embedded.htlc.getProxyUnlockStatus(address)` - Get proxy unlock status for address
- `zenon.embedded.htlc.create(token, amount, hashLocked, expirationTime, hashType, keyMaxSize, hashLock)` - Create an HTLC
- `zenon.embedded.htlc.reclaim(id)` - Reclaim an expired HTLC
- `zenon.embedded.htlc.unlock(id, preimage)` - Unlock an HTLC with preimage
- `zenon.embedded.htlc.denyProxyUnlock()` - Deny proxy unlock
- `zenon.embedded.htlc.allowProxyUnlock()` - Allow proxy unlock

### Liquidity
- `zenon.embedded.liquidity.getLiquidityInfo()` - Get liquidity contract info
- `zenon.embedded.liquidity.getLiquidityStakeEntriesByAddress(address, pageIndex, pageSize)` - Get liquidity stake entries for address
- `zenon.embedded.liquidity.getUncollectedReward(address)` - Get uncollected liquidity rewards
- `zenon.embedded.liquidity.getFrontierRewardByPage(address, pageIndex, pageSize)` - Get liquidity reward history by page
- `zenon.embedded.liquidity.getSecurityInfo()` - Get liquidity security info
- `zenon.embedded.liquidity.getTimeChallengesInfo()` - Get liquidity time challenge info
- `zenon.embedded.liquidity.liquidityStake(durationInSec, amount, zts)` - Stake liquidity for a duration
- `zenon.embedded.liquidity.cancelLiquidityStake(id)` - Cancel a liquidity stake
- `zenon.embedded.liquidity.unlockLiquidityStakeEntries(zts)` - Unlock liquidity stake entries for token
- `zenon.embedded.liquidity.setTokenTuple(tokenStandards, znnPercentages, qsrPercentages, minAmounts)` - Set liquidity token tuple
- `zenon.embedded.liquidity.nominateGuardians(guardians)` - Nominate liquidity guardians
- `zenon.embedded.liquidity.proposeAdministrator(address)` - Propose a new administrator
- `zenon.embedded.liquidity.setIsHalted(isHalted)` - Halt or resume the liquidity contract
- `zenon.embedded.liquidity.setAdditionalReward(znnReward, qsrReward)` - Set additional liquidity rewards
- `zenon.embedded.liquidity.changeAdministrator(administrator)` - Change liquidity administrator
- `zenon.embedded.liquidity.collectReward()` - Collect liquidity rewards
- `zenon.embedded.liquidity.emergency()` - Trigger liquidity emergency mode

### Pillar
- `zenon.embedded.pillar.getQsrRegistrationCost()` - Get QSR registration cost
- `zenon.embedded.pillar.getAll(pageIndex, pageSize)` - Get all pillars with pagination
- `zenon.embedded.pillar.getByOwner(address)` - Get pillars by owner address
- `zenon.embedded.pillar.getByName(name)` - Get pillar details by name
- `zenon.embedded.pillar.checkNameAvailability(name)` - Check if a pillar name is available
- `zenon.embedded.pillar.getDelegatedPillar(address)` - Get delegated pillar for address
- `zenon.embedded.pillar.getPillarEpochHistory(name, pageIndex, pageSize)` - Get pillar epoch history
- `zenon.embedded.pillar.getPillarsHistoryByEpoch(epoch, pageIndex, pageSize)` - Get pillars history by epoch
- `zenon.embedded.pillar.getDepositedQsr(address)` - Get deposited QSR
- `zenon.embedded.pillar.getUncollectedReward(address)` - Get uncollected pillar rewards
- `zenon.embedded.pillar.getFrontierRewardByPage(address, pageIndex, pageSize)` - Get pillar reward history by page
- `zenon.embedded.pillar.register(name, producerAddress, rewardAddress, giveBlockRewardPercentage, giveDelegateRewardPercentage)` - Register a pillar
- `zenon.embedded.pillar.registerLegacy(name, producerAddress, rewardAddress, publicKey, signature, giveBlockRewardPercentage, giveDelegateRewardPercentage)` - Register a legacy pillar
- `zenon.embedded.pillar.updatePillar(name, producerAddress, rewardAddress, giveBlockRewardPercentage, giveDelegateRewardPercentage)` - Update pillar settings
- `zenon.embedded.pillar.revoke(name)` - Revoke a pillar
- `zenon.embedded.pillar.delegate(name)` - Delegate to a pillar
- `zenon.embedded.pillar.undelegate()` - Undelegate from a pillar
- `zenon.embedded.pillar.collectRewards()` - Collect pillar rewards
- `zenon.embedded.pillar.depositQsr(amount)` - Deposit QSR for pillar
- `zenon.embedded.pillar.withdrawQsr()` - Withdraw deposited QSR

### Plasma
- `zenon.embedded.plasma.get(address)` - Get plasma info for address
- `zenon.embedded.plasma.getEntriesByAddress(address, pageIndex, pageSize)` - Get plasma entries for address
- `zenon.embedded.plasma.getRequiredPoWForAccountBlock(powParam)` - Calculate PoW requirements
- `zenon.embedded.plasma.fuse(address, amount)` - Fuse QSR to the given address
- `zenon.embedded.plasma.cancel(hash)` - Cancel the given fusion hash

### Sentinel
- `zenon.embedded.sentinel.getAllActive(pageIndex, pageSize)` - Get active sentinels with pagination
- `zenon.embedded.sentinel.getByOwner(owner)` - Get sentinel info by owner
- `zenon.embedded.sentinel.getDepositedQsr(address)` - Get deposited QSR
- `zenon.embedded.sentinel.getUncollectedReward(address)` - Get uncollected sentinel rewards
- `zenon.embedded.sentinel.getFrontierRewardByPage(address, pageIndex, pageSize)` - Get sentinel reward history by page
- `zenon.embedded.sentinel.register()` - Register a sentinel
- `zenon.embedded.sentinel.revoke()` - Revoke a sentinel
- `zenon.embedded.sentinel.collectRewards()` - Collect sentinel rewards
- `zenon.embedded.sentinel.depositQsr(amount)` - Deposit QSR for sentinel
- `zenon.embedded.sentinel.withdrawQsr()` - Withdraw deposited QSR

### Spork
- `zenon.embedded.spork.getAll(pageIndex, pageSize)` - Get sporks with pagination
- `zenon.embedded.spork.createSpork(name, description)` - Create a new spork
- `zenon.embedded.spork.activateSpork(id)` - Activate a spork

### Stake
- `zenon.embedded.stake.getEntriesByAddress(address, pageIndex, pageSize)` - Get stake entries for address
- `zenon.embedded.stake.getUncollectedReward(address)` - Get uncollected stake rewards
- `zenon.embedded.stake.getFrontierRewardByPage(address, pageIndex, pageSize)` - Get stake reward history by page
- `zenon.embedded.stake.stake(durationInSec, amount)` - Stake ZNN for a duration
- `zenon.embedded.stake.cancel(id)` - Cancel a stake entry
- `zenon.embedded.stake.collectReward()` - Collect stake rewards

### Swap
- `zenon.embedded.swap.getAssetsByKeyIdHash(keyIdHash)` - Get swap assets by key id hash
- `zenon.embedded.swap.getAssets()` - Get all swap assets
- `zenon.embedded.swap.getLegacyPillars()` - Get legacy pillar swap list
- `zenon.embedded.swap.retrieveAssets(pubKey, signature)` - Retrieve swap assets

### Token
- `zenon.embedded.token.getAll(pageIndex, pageSize)` - Get all tokens with pagination
- `zenon.embedded.token.getByOwner(address, pageIndex, pageSize)` - Get tokens by owner with pagination
- `zenon.embedded.token.getByZts(tokenStandard)` - Get token by standard
- `zenon.embedded.token.issueToken(tokenName, tokenSymbol, tokenDomain, totalSupply, maxSupply, decimals, mintable, burnable, utility)` - Issue a new token
- `zenon.embedded.token.mint(tokenStandard, amount, receiveAddress)` - Mint tokens to address
- `zenon.embedded.token.burnToken(tokenStandard, amount)` - Burn tokens
- `zenon.embedded.token.updateToken(tokenStandard, owner, isMintable, isBurnable)` - Update token settings

---

## Error Handling

All async methods may throw errors. Always use try/catch:

```javascript
try {
  const info = await zenon.ledger.getAccountInfoByAddress(address);
  console.log(info);
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## Ledger API

Access blockchain data via `zenon.ledger`.

### Account Block Methods

#### `getUnconfirmedBlocksByAddress(address: Address, pageIndex: number, pageSize: number): Promise<AccountBlockList>`

Get unconfirmed blocks (memory pool) for an address.

```javascript
const unconfirmed = await zenon.ledger.getUnconfirmedBlocksByAddress(address, 0, 10);

for (const block of unconfirmed.list) {
  console.log('Unconfirmed:', block.hash.toString());
}
```

#### `getUnreceivedBlocksByAddress(address: Address, pageIndex: number, pageSize: number): Promise<AccountBlockList>`

Get unreceived blocks (pending incoming transactions) for an address.

```javascript
const unreceived = await zenon.ledger.getUnreceivedBlocksByAddress(address, 0, 10);

for (const block of unreceived.list) {
  console.log('Unreceived:', block.hash.toString());
}
```

#### `getFrontierAccountBlock(address: Address): Promise<AccountBlock | null>`

Get the most recent account block for an address.

```javascript
const address = Address.parse('z1qr...');
const block = await zenon.ledger.getFrontierAccountBlock(address);
console.log('Height:', block.height);
console.log('Hash:', block.hash.toString());
```

#### `getAccountBlockByHash(hash: Hash): Promise<AccountBlock | null>`

Get a specific account block by its hash.

```javascript
const hash = Hash.parse('abc123...');
const block = await zenon.ledger.getAccountBlockByHash(hash);
```

#### `getAccountBlocksByHeight(address: Address, height: number, count: number): Promise<AccountBlockList>`

Get account blocks for an address starting at a specific height.

```javascript
const blocks = await zenon.ledger.getAccountBlocksByHeight(address, 1, 10);
console.log('Retrieved', blocks.list.length, 'blocks');
```

#### `getAccountBlocksByPage(address: Address, pageIndex: number, pageSize: number): Promise<AccountBlockList>`

Get account blocks for an address using pagination.

```javascript
const blocks = await zenon.ledger.getAccountBlocksByPage(address, 0, 10);
console.log('Retrieved', blocks.list.length, 'blocks');
```

### Account Methods

#### `getAccountInfoByAddress(address: Address): Promise<AccountInfo | null>`

Get account balance and information.

```javascript
const address = Address.parse('z1qr...');
const info = await zenon.ledger.getAccountInfoByAddress(address);

console.log('Address:', info.address.toString());
console.log('Tokens:', info.balanceInfoMap);
```

### Momentum Methods

#### `getFrontierMomentum(): Promise<Momentum>`

Get the latest momentum (block of blocks).

```javascript
const momentum = await zenon.ledger.getFrontierMomentum();
console.log('Height:', momentum.height);
console.log('Hash:', momentum.hash.toString());
console.log('Timestamp:', momentum.timestamp);
```

#### `getMomentumBeforeTime(time: number): Promise<Momentum | null>`

Get the most recent momentum before a Unix timestamp.

```javascript
const momentum = await zenon.ledger.getMomentumBeforeTime(1710000000);
console.log(momentum?.height);
```

#### `getMomentumByHash(hash: Hash): Promise<Momentum | null>`

Get a momentum by its hash.

```javascript
const hash = Hash.parse('abc123...');
const momentum = await zenon.ledger.getMomentumByHash(hash);
console.log(momentum?.height);
```

#### `getMomentumsByHeight(height: number, count: number): Promise<MomentumList>`

Get momentums starting at a specific height.

```javascript
const momentums = await zenon.ledger.getMomentumsByHeight(100000, 10);

for (const m of momentums.list) {
  console.log('Momentum:', m.height, m.hash.toString());
}
```

#### `getMomentumsByPage(pageIndex: number, pageSize: number): Promise<MomentumList>`

Get momentums using pagination.

```javascript
const momentums = await zenon.ledger.getMomentumsByPage(0, 10);
console.log('Retrieved', momentums.list.length, 'momentums');
```

#### `getDetailedMomentumsByHeight(height: number, count: number): Promise<DetailedMomentumList | null>`

Get detailed momentums (includes account blocks).

```javascript
const detailed = await zenon.ledger.getDetailedMomentumsByHeight(100000, 2);
console.log('Retrieved', detailed?.list.length);
```

### Transaction Methods

#### `publishRawTransaction(block: AccountBlockTemplate): Promise<AccountBlockTemplate>`

Publish a signed transaction to the network.

```javascript
// Usually you use zenon.send() instead
const published = await zenon.ledger.publishRawTransaction(signedBlock);
console.log('Published:', published.hash.toString());
```

---

## Subscriptions API

Real-time subscriptions via WebSocket. Available on `zenon.subscribe`.

**Note:** Requires WebSocket connection (`wss://` or `ws://`).

#### `toMomentums(): Promise<SubscriptionStream>`

Subscribe to new momentums.

```javascript
const stream = await zenon.subscribe.toMomentums();

stream.onNotification((data) => {
  const momentum = data[0];
  console.log('New momentum:', momentum);
});
```

#### `toAllAccountBlocks(): Promise<SubscriptionStream>`

Subscribe to all account blocks on the network.

```javascript
const stream = await zenon.subscribe.toAllAccountBlocks();

stream.onNotification((data) => {
  const block = data[0];
  console.log('New block:', block);
});
```

#### `toAccountBlocksByAddress(address: Address): Promise<SubscriptionStream>`

Subscribe to account blocks for a specific address.

```javascript
const address = Address.parse('z1qr...');
const stream = await zenon.subscribe.toAccountBlocksByAddress(address);

stream.onNotification((data) => {
  const block = data[0];
  console.log('Block for address:', block);
});
```

#### `toUnreceivedAccountBlocksByAddress(address: Address): Promise<SubscriptionStream>`

Subscribe to unreceived blocks for a specific address.

```javascript
const stream = await zenon.subscribe.toUnreceivedAccountBlocksByAddress(address);

stream.onNotification((data) => {
  const block = data[0];
  console.log('Incoming transaction:', block);

  // Auto-receive
  const receiveBlock = AccountBlockTemplate.receive(block.hash);
  zenon.send(receiveBlock, keyPair);
});
```

---

## Stats API

Get node statistics via `zenon.stats`.

### `networkInfo(): Promise<NetworkInfo>`

Get network information.

```javascript
const info = await zenon.stats.networkInfo();
console.log('Network ID:', info.networkId);
console.log('Chain ID:', info.chainId);
```

### `osInfo(): Promise<OsInfo>`

Get node operating system information.

```javascript
const osInfo = await zenon.stats.osInfo();
console.log('OS:', osInfo.os);
console.log('Platform:', osInfo.platform);
```

### `processInfo(): Promise<ProcessInfo>`

Get node process information.

```javascript
const processInfo = await zenon.stats.processInfo();
console.log('Version:', processInfo.version);
console.log('Commit:', processInfo.commit);
```

### `syncInfo(): Promise<SyncInfo>`

Get sync status.

```javascript
const syncInfo = await zenon.stats.syncInfo();
console.log('State:', syncInfo.state);
console.log('Current height:', syncInfo.currentHeight);
console.log('Target height:', syncInfo.targetHeight);
```

---

## Next Steps

- **[Examples](./examples.md)** – Complete working examples
- **[Utilities](./utilities.md)** – Utilities and constants for common tasks
- **[CLI Tool](./cli.md)** - Command-line interface
- **[Wallet Management](./wallet.md)** – Creating and managing wallets
- **[Building WASM](./build-wasm.md)** – Rebuilding the PoW module from source
