# ZNN TypeScript SDK

[![Version](https://img.shields.io/github/v/tag/digitalSloth/znn-typescript-sdk?label=version)](https://github.com/digitalSloth/znn-typescript-sdk/tags)
[![Tests](https://github.com/digitalSloth/znn-typescript-sdk/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/digitalSloth/znn-typescript-sdk/actions/workflows/tests.yml)
[![Coverage](https://github.com/digitalSloth/znn-typescript-sdk/actions/workflows/coverage.yml/badge.svg?branch=main)](https://github.com/digitalSloth/znn-typescript-sdk/actions/workflows/coverage.yml)

A TypeScript/JavaScript SDK for interacting with the Zenon Network of Momentum (NoM).

## Features

- 🚀 **Modern ESM-first architecture** – Optimized for tree-shaking and modern JavaScript
- 🔌 **Dual protocol support** – HTTP and WebSocket connections
- 💼 **Wallet management** – Create, import, and manage wallets with BIP39 mnemonic support
- 🔐 **Transaction signing** – Sign and send transactions with automatic PoW generation
- ⌨️ **CLI Included** – CLI for wallet management and sending transactions
- 📡 **Real-time subscriptions** – Subscribe to momentums and account blocks via WebSocket
- 🌐 **Universal** – Works in Node.js and browsers (ESM & UMD)
- 📝 **TypeScript native** – Full type definitions included

---

## Installation

```bash
npm install znn-typescript-sdk
```

## Quick Start

### Node.js

```javascript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');
```

### Browser

```bash
npm create vite@latest my-zenon-app -- --template vanilla
cd my-zenon-app
npm install znn-typescript-sdk
npm run dev
```

```javascript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');
```

#### Browser Builds (ESM vs UMD)

The SDK ships two browser bundles:

- **ESM** (`dist/browser/bundle.browser.mjs`): Modern module build for Vite/Rollup/Webpack. Import from `znn-typescript-sdk` or the `.mjs` bundle.
- **UMD** (`dist/browser/bundle.browser.js`): Legacy global build that exposes `window.ZnnSDK` for script-tag usage.

Use ESM when possible. Use UMD only if you must load the SDK via a `<script>` tag without a bundler.

#### Browser PoW Configuration

The Proof of Work (PoW) module requires two external files in browser environments: `pow.js` and `pow.wasm`. These files must be accessible at runtime.

**Setup:**

1. The PoW files are located in `node_modules/znn-typescript-sdk/dist/browser`
2. Set the base path before any operations that require PoW:

```javascript
import { Zenon } from 'znn-typescript-sdk';

// Point to where pow.js and pow.wasm are located
Zenon.setPowBasePath('node_modules/znn-typescript-sdk/dist/browser');

// Now you can send transactions (which use PoW)
const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');
const tx = await zenon.send(blockTemplate, keyPair);
```

**For UMD:**

```javascript
window.ZnnSDK.Zenon.setPowBasePath('node_modules/znn-typescript-sdk/dist/browser');
```

**Alternative – Copy to Public Folder:**

For production apps, copy the PoW files to your public/static folder:

```bash
cp node_modules/znn-typescript-sdk/dist/browser/pow.* public/
```

Then set the path:

```javascript
Zenon.setPowBasePath('/'); // or 'assets' for relative paths
```

> **Note:** Node.js environments don't need this configuration – PoW files are loaded automatically from the installation directory.

### Connection Options

- **HTTP**: `https://node.zenonhub.io:35997` - For simple API calls
- **WebSocket**: `wss://node.zenonhub.io:35998` - For real-time subscriptions and transactions

---

## Core Classes

The main entry point is the `Zenon` singleton.

```javascript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance();
```

### Static Methods

These methods configure SDK-level settings and should be called before initializing the Zenon instance.

##### `Zenon.setNetworkID(networkId: number): void`

Set the network ID for transaction signing. Default is `1`.

```javascript
Zenon.setNetworkID(3); // Set to testnet
```

##### `Zenon.getNetworkID(): number`

Get the current network ID.

```javascript
const networkId = Zenon.getNetworkID();
```

##### `Zenon.setChainID(chainId: number): void`

Set the chain ID for transaction signing. Default is `1`.

```javascript
Zenon.setChainID(100); // Set to custom chain
```

##### `Zenon.getChainIdentifier(): number`

Get the current chain ID.

```javascript
const chainId = Zenon.getChainIdentifier();
```

##### `Zenon.setPowBasePath(basePath: string): void`

Set the base path for loading PoW files in browser environments. Only needed for browser usage. The path is automatically normalized to meet browser module specifier requirements (adding `./` prefix and `/` suffix as needed).

```javascript
// Before initialization in browser
// These are all valid and will be normalized automatically:
Zenon.setPowBasePath('node_modules/znn-typescript-sdk/dist/browser');
Zenon.setPowBasePath('/assets');
Zenon.setPowBasePath('./public');
```

##### `Zenon.getPowBasePath(): string`

Get the current PoW base path.

```javascript
const path = Zenon.getPowBasePath();
```

### Instance Methods

##### `initialize(url: string, timeout?: number, wsOptions?: WsClientOptions): Promise<void>`

Connect to a Zenon node via HTTP or WebSocket.

```javascript
// WebSocket (for subscriptions and transactions)
await zenon.initialize('wss://node.zenonhub.io:35998');

// HTTP (for simple requests)
await zenon.initialize('https://node.zenonhub.io:35997');
```

> **Note:** WebSocket connections automatically reconnect if dropped during long-running operations (e.g., PoW generation). The default settings are suitable for most use cases.

##### `clearConnection(): void`

Disconnect and clean up resources.

```javascript
zenon.clearConnection();
```

##### `send(blockTemplate: AccountBlockTemplate, keyPair: KeyPair): Promise<AccountBlockTemplate>`

Sign and send a transaction. Automatically generates PoW if needed.

```javascript
const tx = await zenon.send(blockTemplate, keyPair);
console.log('Hash:', tx.hash.toString());
```

---

## Documentation

- **[Examples](./docs/examples.md)** – Complete working examples
- **[API Overview](./docs/api-overview.md)** – All API methods and embedded contract calls
- **[Embedded Contracts](./docs/embedded-contracts/index.md)** – Detailed documentation for embedded contracts
- **[Utilities](./docs/utilities.md)** – Utilities and constants for common tasks
- **[CLI Tool](./docs/cli.md)** – Command-line interface
- **[Wallet Management](./docs/wallet.md)** – Creating and managing wallets
- **[Building WASM](./docs/build-wasm.md)** – Rebuilding the PoW module from source

---

## Development

```bash
git clone https://github.com/digitalSloth/znn-typescript-sdk.git
cd znn-typescript-sdk
npm install
npm run build
npm test
```

## Requirements

- Node.js 18+ (ESM support)
- Modern browser with WebAssembly support
- Bundler for browser production apps (Vite, Webpack, etc.)


## License

BSD-3-Clause

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [Zenon Network](https://zenon.network)
- [Zenon GitHub](https://github.com/zenon-network)
- [Zenon Info](https://zenon.info)
- [Development Forum](https://forum.hypercore.one)
- [Zenon Hub Explorer](https://zenonhub.io)
