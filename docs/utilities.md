# Utility Classes & Constants

The SDK provides utility classes for common operations. This page summarizes the available classes and constants.

---

## Utility Classes

### Address

Represents a Zenon address.

```javascript
import { Address } from 'znn-typescript-sdk';

// Parse from string
const address = Address.parse('z1qr...');

// Get string representation
console.log(address.toString());

// Get bytes
console.log(address.getBytes());
```

### Hash

Represents a hash (block hash, transaction hash, etc.).

```javascript
import { Hash } from 'znn-typescript-sdk';

// Parse from hex string
const hash = Hash.parse('abc123...');

// Get string representation
console.log(hash.toString());

// Get bytes
console.log(hash.getBytes());
```

### Token Standard

Represents a Zenon token standard (ZTS).

```javascript
import { TokenStandard } from 'znn-typescript-sdk';

// Parse from string
const zts = TokenStandard.parse('zts1...');

// Get string representation
console.log(zts.toString());

// Get bytes
console.log(zts.getBytes());
```

### AccountBlockTemplate

Create transaction block templates.

#### `send(to: Address, tokenStandard: Hash, amount: bigint): AccountBlockTemplate`

Create a send block.

```javascript
import { AccountBlockTemplate, ZNN_ZTS, extractNumberDecimals } from 'znn-typescript-sdk';

const block = AccountBlockTemplate.send(
  recipientAddress,
  ZNN_ZTS,
  extractNumberDecimals(1, 8)
);
```

#### `receive(blockHash: Hash): AccountBlockTemplate`

Create a receive block.

```javascript
const receiveBlock = AccountBlockTemplate.receive(sendBlockHash);
```

---

## Constants

### Addresses

```javascript
import {
    EMPTY_ADDRESS,
    ACCELERATOR_ADDRESS,
    BRIDGE_ADDRESS,
    HTLC_ADDRESS,
    LIQUIDITY_ADDRESS,
    PILLAR_ADDRESS,
    PLASMA_ADDRESS,
    SENTINEL_ADDRESS,
    SPORK_ADDRESS,
    STAKE_ADDRESS,
    SWAP_ADDRESS,
    TOKEN_ADDRESS,
} from 'znn-typescript-sdk';

console.log('Burn address:', EMPTY_ADDRESS.toString());
console.log('Plasma address:', PLASMA_ADDRESS.toString());
// etc.
```

### Token Standards

```javascript
import { EMPTY_ZTS, ZNN_ZTS, QSR_ZTS } from 'znn-typescript-sdk';

console.log('Empty token:', EMPTY_ZTS.toString());
console.log('ZNN token:', ZNN_ZTS.toString());
console.log('QSR token:', QSR_ZTS.toString());
```

### Hash

```javascript
import { EMPTY_HASH } from 'znn-typescript-sdk';

console.log('Empty hash:', EMPTY_HASH.toString());

```

### Decimals

- ZNN: 8 decimals
- QSR: 8 decimals

```javascript
import { extractNumberDecimals, addNumberDecimals } from 'znn-typescript-sdk';

// Converts humand readable number to non-fractional number
const znnAmount = extractNumberDecimals(1, 8);

// Converts non-fractional number to humand readable number
const dispplayValue = addNumberDecimals(100000000, 8);
```
---

## Next Steps

- **[Examples](./examples.md)** – Complete working examples
- **[API Overview](./api-overview.md)** – All API methods & Embedded Contract Calls
- **[CLI Tool](./cli.md)** - Command-line interface
- **[Wallet Management](./wallet.md)** – Creating and managing wallets
- **[Building WASM](./build-wasm.md)** – Rebuilding the PoW module from source
