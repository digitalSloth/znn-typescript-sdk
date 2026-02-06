# Examples

Each snippet is ready to drop into a script and expand.

---

## Setup

```javascript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');
```

Connection options:
- **HTTP**: `https://node.zenonhub.io:35997` - For simple API calls
- **WebSocket**: `wss://node.zenonhub.io:35998` - For real-time subscriptions and transactions

### WebSocket Configuration

For long-running operations (like PoW generation), you can configure WebSocket reconnection behavior:

```javascript
import { Zenon } from 'znn-typescript-sdk';
import { WsClientOptions } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();

// Use defaults (auto-reconnect enabled)
await zenon.initialize('wss://node.zenonhub.io:35998');

// Custom timeout (in milliseconds)
await zenon.initialize('wss://node.zenonhub.io:35998', 60000);

// Custom reconnection settings
const wsOptions: WsClientOptions = {
  reconnect: true,           // Enable auto-reconnect
  reconnect_interval: 1000,  // 1 second between attempts
  max_reconnects: 0          // 0 = unlimited attempts
};

await zenon.initialize('wss://node.zenonhub.io:35998', 30000, wsOptions);
```

**Note:** WebSocket connections automatically reconnect if dropped during operations. The default settings work well for most cases, including PoW generation.

---

## SDK Configuration

Configure network, chain, and browser PoW settings before initializing the SDK.

### Set Network ID and Chain ID

```javascript
import { Zenon } from 'znn-typescript-sdk';

// Configure for testnet
Zenon.setNetworkID(3);
Zenon.setChainID(3);

// Now initialize
const zenon = Zenon.getInstance();
await zenon.initialize('wss://testnet.zenonhub.io:35998');

// Verify settings
console.log('Network ID:', Zenon.getNetworkID());
console.log('Chain ID:', Zenon.getChainIdentifier());
```

### Configure PoW Base Path (Browser Only)

When using the SDK in a browser, you must configure the PoW module path before sending transactions.

```javascript
import { Zenon } from 'znn-typescript-sdk';

// Set the path where pow.js and pow.wasm are located
Zenon.setPowBasePath('node_modules/znn-typescript-sdk/dist/browser');

// Or if you copied the files to your public folder
Zenon.setPowBasePath('/');

// Now initialize and send transactions
const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

// Transactions will work correctly now
const tx = await zenon.send(blockTemplate, keyPair);
```

**Note**: Node.js environments don't need `setPowBasePath()` - PoW files are loaded automatically.

---

## Basic RPC Reads

```javascript
import { Zenon, Address } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

const syncInfo = await zenon.stats.syncInfo();
console.log('Sync:', syncInfo.toJson());

const frontierMomentum = await zenon.ledger.getFrontierMomentum();
console.log('Frontier momentum:', frontierMomentum.toJson());

const address = Address.parse('z1qr...');
const accountInfo = await zenon.ledger.getAccountInfoByAddress(address);
console.log('Account info:', accountInfo.toJson());

zenon.clearConnection();
```

---

## Wallets

### Create a Wallet

```javascript
import { KeyStore } from 'znn-typescript-sdk';

const wallet = KeyStore.newRandom();
console.log('Mnemonic:', wallet.mnemonic);
console.log('Base address:', wallet.getBaseAddress().toString());
```

### Import a Wallet from Mnemonic

```javascript
import { KeyStore } from 'znn-typescript-sdk';

const wallet = KeyStore.fromMnemonic('your mnemonic here...');
console.log('Base address:', wallet.getBaseAddress().toString());
```

### Import a Wallet from Keyfile

```javascript
import { KeyFile } from 'znn-typescript-sdk';

const keyFileJson = {} // JSON String from exiting keyfile;
const walletPassword = 'your wallet password';
const wallet = await KeyFile.setPassword(walletPassword).decrypt(keyFileJson);
console.log('Base address:', wallet.getBaseAddress().toString());
```

### Import from Entropy

```javascript
import { KeyStore } from 'znn-typescript-sdk';

const wallet = KeyStore.fromEntropy('hex-entropy-here');
console.log('Mnemonic:', wallet.mnemonic);
```

### Derive Addresses

```javascript
import { KeyStore } from 'znn-typescript-sdk';

const wallet = KeyStore.fromMnemonic('your mnemonic here...');

for (let i = 0; i < 5; i += 1) {
  const keyPair = wallet.getKeyPair(i);
  console.log(`Index ${i}:`, keyPair.getAddress().toString());
}
```

## Send a Transaction

```javascript
import {
  Zenon,
  Address,
  AccountBlockTemplate,
  KeyStore,
  ZNN_ZTS,
  extractNumberDecimals
} from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

const wallet = KeyStore.fromMnemonic('your mnemonic here...');
const keyPair = wallet.getKeyPair(0);

const recipient = Address.parse('z1qr...');
const amount = extractNumberDecimals(1, 8); // 1 ZNN

const block = AccountBlockTemplate.send(recipient, ZNN_ZTS, amount);
const tx = await zenon.send(block, keyPair);

console.log('Transaction hash:', tx.hash.toString());
zenon.clearConnection();
```

Notes:
- If the account does not have enough fused plasma, the SDK generates PoW automatically.

## Receive Transactions

```javascript
import { Zenon, KeyStore, AccountBlockTemplate } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

const wallet = KeyStore.fromMnemonic('your mnemonic here...');
const keyPair = wallet.getKeyPair(0);

const unreceived = await zenon.ledger.getUnreceivedBlocksByAddress(
  keyPair.getAddress(),
  0,
  10
);

for (const block of unreceived.list) {
  const receiveBlock = AccountBlockTemplate.receive(block.hash);
  const tx = await zenon.send(receiveBlock, keyPair);
  console.log('Received:', tx.hash.toString());
}

zenon.clearConnection();
```

---

## Embedded Contracts

### Fuse Plasma

```javascript
import { Zenon, KeyStore, extractNumberDecimals } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

const wallet = KeyStore.fromMnemonic('your mnemonic here...');
const keyPair = wallet.getKeyPair(0);

const block = zenon.embedded.plasma.fuse(
  keyPair.getAddress(),
  extractNumberDecimals(100, 8) // 100 QSR
);

const tx = await zenon.send(block, keyPair);
console.log('Transaction hash:', tx.hash.toString());

zenon.clearConnection();
```

### Cancel Plasma

```javascript
import { Zenon, KeyStore, extractNumberDecimals } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

const wallet = KeyStore.fromMnemonic('your mnemonic here...');
const keyPair = wallet.getKeyPair(0);

const entries = await zenon.embedded.plasma.getEntriesByAddress(keyPair.getAddress())

for (const entry of entries.list) {
  const block = zenon.embedded.plasma.cancel(entry.id);
  const tx = await zenon.send(block, keyPair);
}

zenon.clearConnection();
```

---

## Subscriptions

### Momentums

```javascript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

const stream = await zenon.subscribe.toMomentums();

stream.onNotification((data) => {
  console.log('New momentum:', data[0]?.height);
});
```

### Account Blocks by Address

```javascript
import { Zenon, Address } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

const address = Address.parse('z1qr...');
const stream = await zenon.subscribe.toAccountBlocksByAddress(address);

stream.onNotification((data) => {
  console.log('New account block:', data[0]?.hash);
});
```

---

## Best Practices

### Always Clean Up Connections

```javascript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();

try {
  await zenon.initialize('wss://node.zenonhub.io:35998');
  // ... do work
} finally {
  zenon.clearConnection();
}
```

---

## Next Steps

- **[API Overview](./api-overview.md)** – All API methods & Embedded Contract Calls
- **[Utilities](./utilities.md)** – Utilities and constants for common tasks
- **[CLI Tool](./cli.md)** - Command-line interface
- **[Wallet Management](./wallet.md)** – Creating and managing wallets
- **[Building WASM](./build-wasm.md)** – Rebuilding the PoW module from source
