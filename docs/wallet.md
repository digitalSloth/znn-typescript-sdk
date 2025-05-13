# Wallet Management

Complete guide to creating, importing, and managing wallets with the ZNN TypeScript SDK.

---

## Overview

The SDK provides wallet functionality through three main classes:
- **`KeyStore`** - Manages mnemonic phrases and derives keys
- **`KeyPair`** - Represents a single address with its private key
- **`KeyFile`** - Used to encrypt and decrypt wallet JSON files

---

## Creating Wallets

### Generate New Random Wallet

Create a new wallet with a randomly generated BIP39 mnemonic:

```javascript
import { KeyStore } from 'znn-typescript-sdk';

const wallet = KeyStore.newRandom();

console.log('Mnemonic:', wallet.mnemonic);
// Output: "route become dream access impulse price inform..."

console.log('Address:', wallet.getBaseAddress().toString());
// Output: "z1qr..."
```

**Important:**
- Store the mnemonic securely
- Never share it with anyone
- Losing it means losing access to funds
- Write it down on paper (not digital)

### With Specific Entropy

For advanced use cases, create a wallet from custom entropy:

```javascript
import { KeyStore } from 'znn-typescript-sdk';

// 32 bytes of entropy (64 hex characters)
const entropy = '00e089c2d43064b3462ce24fc09099fe9fd2cf3657b6335462972baa911d31fc';

const wallet = KeyStore.fromEntropy(entropy);
console.log('Mnemonic:', wallet.mnemonic);
```

**Use cases:**
- Deterministic wallet generation
- Testing with known wallets
- Advanced key derivation scenarios

---

## Importing Wallets

### From Mnemonic Phrase

Import an existing wallet using its 12 or 24-word mnemonic:

```javascript
import { KeyStore } from 'znn-typescript-sdk';

const mnemonic = 'abstract affair idle position alien fluid board ordinary exist afraid chapter wood wood guide sun walnut crew perfect place firm poverty model side million';

const wallet = KeyStore.fromMnemonic(mnemonic);
console.log('Restored address:', wallet.getBaseAddress().toString());
```

### From Encrypted KeyFile

Import from an encrypted wallet JSON file:

```javascript
import { KeyFile } from 'znn-typescript-sdk';

const keyFile = KeyFile.setPassword('your-password');
const keyStore = await keyFile.decrypt(walletJson);

const keyPair = keyStore.getKeyPair(0);
console.log('Address:', keyPair.address.toString());
```

---

## Address Derivation

Zenon uses BIP44 hierarchical deterministic (HD) wallets. From a single mnemonic, you can derive multiple addresses.

### Get Base Address (Index 0)

```javascript
const baseAddress = wallet.getBaseAddress();
console.log(baseAddress.toString()); // z1qr...
```

### Get Key Pair by Index

```javascript
const keyPair0 = wallet.getKeyPair(0); // First address
const keyPair1 = wallet.getKeyPair(1); // Second address
const keyPair2 = wallet.getKeyPair(2); // Third address

console.log('Address 0:', keyPair0.address.toString());
console.log('Address 1:', keyPair1.address.toString());
console.log('Address 2:', keyPair2.address.toString());
```

### Derive Multiple Addresses

```javascript
// Generate first 5 addresses
for (let i = 0; i < 5; i++) {
  const keyPair = wallet.getKeyPair(i);
  console.log(`Address ${i}:`, keyPair.address.toString());
}
```

**BIP44 Path:** `m/44'/73404'/0'/0/index`
- `73404` is Zenon's coin type

---

## KeyPair

A `KeyPair` represents a single address with its private key.

### Properties

```javascript
const keyPair = wallet.getKeyPair(0);

// Get address
console.log('Address:', keyPair.address.toString());
console.log('Address core:', keyPair.address.core);

// Get public key
console.log('Public key:', keyPair.publicKey);

// Get private key (⚠️ sensitive!)
console.log('Private key:', keyPair.privateKey);
```

### Sign Data

```javascript
const data = Buffer.from('Hello, Zenon!');
const signature = keyPair.sign(data);

console.log('Signature:', signature.toString('hex'));
```

### Verify Signature

```javascript
const isValid = keyPair.verify(signature, data);
console.log('Valid:', isValid); // true
```

---

## Working with Addresses

### Parse Address String

```javascript
import { Address } from 'znn-typescript-sdk';

const address = Address.parse('z1qr...');
console.log('Parsed:', address.toString());
```

### Validate Address

```javascript
try {
  const address = Address.parse('invalid_address');
} catch (error) {
  console.error('Invalid address:', error.message);
}
```

---

## Exporting Wallets

### Export Encrypted Wallet JSON

The recommended way to store and backup wallets is using encrypted KeyFile JSON:

```javascript
import { KeyStore, KeyFile } from 'znn-typescript-sdk';

// Create or import wallet
const keyStore = KeyStore.fromMnemonic('your mnemonic...');

// Encrypt and export as JSON
const keyFile = KeyFile.setPassword('your-strong-password');
const walletJson = await keyFile.encrypt(keyStore);

console.log(walletJson);
// Returns:
// {
//   baseAddress: "z1qr...",
//   crypto: {
//     argon2Params: { salt: "0x..." },
//     cipherData: "0x...",
//     cipherName: "aes-256-gcm",
//     kdf: "argon2.IDKey",
//     nonce: "0x..."
//   },
//   timestamp: 1234567890,
//   version: 1
// }

// Save to file or storage
const jsonString = JSON.stringify(walletJson);
```

This encrypted format:
- Uses Argon2id for key derivation (resistant to GPU attacks)
- Uses AES-256-GCM for encryption
- Can be safely stored in files, databases, or localStorage
- Requires password to decrypt

---

## Secure Usage

### Storage Best Practices

#### ❌ Never Do This

```javascript
// NEVER store mnemonics in plain text
localStorage.setItem('mnemonic', wallet.mnemonic);

// NEVER commit mnemonics to code
const mnemonic = 'route become dream access...'; // DANGEROUS

// NEVER log mnemonics in production
console.log(wallet.mnemonic);
```

#### ✅ Recommended Approaches

**1. Use Encrypted KeyFile (Best Practice)**
```javascript
import { KeyStore, KeyFile } from 'znn-typescript-sdk';

// Create and encrypt wallet
const keyStore = KeyStore.newRandom();
const keyFile = KeyFile.setPassword('user-password');
const walletJson = await keyFile.encrypt(keyStore);

// Store encrypted wallet JSON
localStorage.setItem('wallet', JSON.stringify(walletJson));

// Load wallet later
const storedWallet = JSON.parse(localStorage.getItem('wallet'));
const password = prompt('Enter password:');
const loadedKeyFile = KeyFile.setPassword(password);
const loadedKeyStore = await loadedKeyFile.decrypt(storedWallet);
```

**2. Prompt User Each Session**
```javascript
function getWalletFromUser() {
  const mnemonic = prompt('Enter your mnemonic:');
  return KeyStore.fromMnemonic(mnemonic);
}
```

**3. Environment Variables (Node.js Development Only)**
```javascript
// .env file (add to .gitignore!)
MNEMONIC="route become dream access..."

// In code
import dotenv from 'dotenv';
dotenv.config();

const wallet = KeyStore.fromMnemonic(process.env.MNEMONIC);
```

**Note:** For production applications, always use encrypted KeyFile format instead of storing mnemonics.

### Mnemonic Backup

1. **Write it down** on paper
2. **Store in a safe place** (fireproof safe, bank deposit box)
3. **Never take photos** of it
4. **Never store in cloud** services
5. **Consider metal backup** for long-term storage

### Testing Wallets

For development and testing, use dedicated test wallets:

```javascript
// Create a test wallet (NEVER use for real funds)
const testWallet = KeyStore.newRandom();
console.log('Test mnemonic:', testWallet.mnemonic);

// Or use a known test mnemonic
const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const testWallet2 = KeyStore.fromMnemonic(TEST_MNEMONIC);
```

---

## Common Patterns

### Check Balance

```javascript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('https://node.zenonhub.io:35997');

const keyPair = wallet.getKeyPair(0);
const accountInfo = await zenon.ledger.getAccountInfoByAddress(keyPair.address);

console.log(accountInfo);

zenon.clearConnection();
```

### Send from Wallet

```javascript
import { Zenon, Address, AccountBlockTemplate, TokenStandard } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');

const keyPair = wallet.getKeyPair(0);
const recipient = Address.parse('z1qr...');
const amount = 100000000; // 1 ZNN
const token = TokenStandard.parse('zts1znnxxxxxxxxxxxxx9z4ulx');

const block = AccountBlockTemplate.send(recipient, token, amount);
const tx = await zenon.send(block, keyPair);

console.log('Sent! Hash:', tx.hash.toString());

zenon.clearConnection();
```

### Multi-Address Wallet

```javascript
// Manage multiple addresses from one wallet
class MultiAddressWallet {
  constructor(mnemonic) {
    this.keyStore = KeyStore.fromMnemonic(mnemonic);
    this.addresses = [];

    // Derive first 5 addresses
    for (let i = 0; i < 5; i++) {
      this.addresses.push(this.keyStore.getKeyPair(i));
    }
  }

  getAddress(index) {
    return this.addresses[index];
  }

  async getBalances(zenon) {
    const balances = [];

    for (const keyPair of this.addresses) {
      const info = await zenon.ledger.getAccountInfoByAddress(keyPair.address);
      balances.push({
        address: keyPair.address.toString(),
        info: info
      });
    }

    return balances;
  }
}

// Usage
const wallet = new MultiAddressWallet(mnemonic);
const balances = await wallet.getBalances(zenon);
console.log(balances);
```

---

## Next Steps

- **[Examples](./examples.md)** – Complete working examples
- **[API Overview](./api-overview.md)** – All API methods & Embedded Contract Calls
- **[Utilities](./utilities.md)** – Utilities and constants for common tasks
- **[CLI Tool](./cli.md)** - Command-line interface
- **[Building WASM](./build-wasm.md)** – Rebuilding the PoW module from source
