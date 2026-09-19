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
- 🌐 **Universal** – Works in Node.js and browsers (ESM)
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

#### Browser Builds

The SDK ships as modular ESM only and is imported from `znn-typescript-sdk` in any bundler (Vite, Rollup, Webpack). `KeyFile` loads its Argon2 implementation as a dynamic chunk, so set `output.publicPath` (or the Vite equivalent) for wallet unlock to work.

#### Browser PoW Configuration

The Proof of Work (PoW) module requires two external files in browser environments: `pow.js` and `pow.wasm`. These files must be accessible at runtime.

**Setup:**

1. The PoW files are located in `node_modules/znn-typescript-sdk/lib`
2. Set the base path before any operations that require PoW:

```javascript
import { Zenon } from 'znn-typescript-sdk';

// Point to where pow.js and pow.wasm are located
Zenon.setPowBasePath('node_modules/znn-typescript-sdk/lib');

// Now you can send transactions (which use PoW)
const zenon = Zenon.getInstance();
await zenon.initialize('wss://node.zenonhub.io:35998');
const tx = await zenon.send(blockTemplate, keyPair);
```

**Alternative – Copy to Public Folder:**

For production apps, copy the PoW files to your public/static folder:

```bash
cp node_modules/znn-typescript-sdk/lib/pow.* public/
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
Zenon.setPowBasePath('node_modules/znn-typescript-sdk/lib');
Zenon.setPowBasePath('/assets');
Zenon.setPowBasePath('./public');
```

##### `Zenon.getPowBasePath(): string`

Get the current PoW base path.

```javascript
const path = Zenon.getPowBasePath();
```

##### Running PoW off the main thread

By default, PoW runs **synchronously on the main thread**. In the browser this blocks the event loop for the full duration of generation, which freezes the UI and starves the WebSocket heartbeat/reconnect timers — long PoW can cause the node to drop the connection before the transaction is published. Moving PoW to a **Web Worker** fixes both problems. There are two ways to do this:

- `Zenon.usePowWorker()` — the SDK's built-in, managed worker (simplest).
- `Zenon.setPowProvider()` — supply your own provider (full control).

##### `Zenon.usePowWorker(): PowWorker`

Register the SDK's built-in Web Worker as the PoW provider. PoW then runs off the main thread automatically — no worker file or app-side code required. Browser-only.

The worker locates `pow.js` / `pow.wasm` using the current [PoW base path](#zenonsetpowbasepathbasepath-string-void), so call `setPowBasePath` first if needed. The worker is created lazily on the first transaction that requires PoW.

```javascript
import { Zenon } from 'znn-typescript-sdk';

Zenon.setPowBasePath('/');   // where pow.js / pow.wasm are served
Zenon.usePowWorker();        // PoW now runs in a Web Worker

// send() runs PoW off the main thread; the WebSocket stays connected
const tx = await zenon.send(blockTemplate, keyPair);
```

> **CSP note:** the built-in worker is spawned from a `Blob` URL, so a strict Content-Security-Policy must allow `worker-src blob:` (and the dynamic import of `pow.js`). If your CSP forbids this, supply your own provider with `setPowProvider` instead.

Call `Zenon.stopPowWorker()` to terminate the worker and clear the provider. `clearPowProvider()` also stops it.

##### `Zenon.setPowProvider(provider: PowProvider): void`

Register a custom Proof of Work provider. When set, it is used instead of the built-in WASM module during `send` and `prepareBlock`. Use this when `usePowWorker` doesn't fit (e.g. strict CSP, a shared worker, a native module, or a remote PoW service).

The provider receives the PoW data as a 64-character hex string and the required difficulty, and resolves to the 8-byte nonce as a hex string:

```typescript
import { Zenon, type PowProvider } from 'znn-typescript-sdk';

// Example: a provider backed by your own Web Worker
const worker = new Worker(new URL('./pow.worker.js', import.meta.url), { type: 'module' });

const provider: PowProvider = (hashHex, difficulty) =>
  new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const onMessage = (e: MessageEvent) => {
      if (e.data.id !== id) return;
      worker.removeEventListener('message', onMessage);
      e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.nonce);
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ id, hashHex, difficulty });
  });

Zenon.setPowProvider(provider);

// send() now runs PoW in the worker; the WebSocket stays connected
const tx = await zenon.send(blockTemplate, keyPair);
```

##### `Zenon.getPowProvider(): PowProvider | undefined`

Get the currently registered PoW provider, or `undefined` if none is set (the built-in WASM module is used).

##### `Zenon.clearPowProvider(): void`

Remove a previously registered PoW provider, restoring the built-in WASM-based generator.

### Instance Methods

##### `initialize(url: string, timeout?: number, wsOptions?: WsClientOptions): Promise<void>`

Connect to a Zenon node via HTTP or WebSocket.

```javascript
// WebSocket (for subscriptions and transactions)
await zenon.initialize('wss://node.zenonhub.io:35998');

// HTTP (for simple requests)
await zenon.initialize('https://node.zenonhub.io:35997');
```

> **Note:** WebSocket connections automatically reconnect if dropped, and the default settings are suitable for most use cases. However, reconnect (like all timers) cannot run while the main thread is blocked. The built-in PoW generator is synchronous, so long PoW can starve the heartbeat/reconnect machinery and the node may close the connection before the transaction publishes. To avoid this, run PoW off the main thread with [`Zenon.usePowWorker`](#zenonusepowworker-powworker) (or a custom [`setPowProvider`](#zenonsetpowproviderprovider-powprovider-void)).

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

##### `prepareBlock(blockTemplate: AccountBlockTemplate, keyPair: KeyPair): Promise<AccountBlockTemplate>`

Prepare a block for publishing — autofill fields, run PoW (if required), and set the hash and signature — **without** publishing it. This is the publish-free portion of `send`, and lets you control the connection lifecycle around PoW. For example, you can verify or restart the WebSocket connection after PoW completes but before publishing:

```javascript
const prepared = await zenon.prepareBlock(blockTemplate, keyPair);

// Ensure the connection is healthy after PoW, then publish yourself
await zenon.ledger.publishRawTransaction(prepared);
```

> **Tip:** Combine `prepareBlock` with `Zenon.setPowProvider` (a Web Worker provider) to keep the connection alive *during* PoW as well as control publishing afterward.

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

- Node.js 20+ (ESM support)
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
