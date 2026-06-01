# AGENTS.md — ZNN TypeScript SDK

This file provides guidance for AI agents and automated tools working on this codebase.

---

## Project Overview

**znn-typescript-sdk** is a TypeScript/JavaScript SDK for interacting with the Zenon Network of Momentum (NoM). It supports Node.js (ESM) and browsers (ESM + UMD), includes a CLI, and ships a pre-built WebAssembly PoW module.

- **Package name:** `znn-typescript-sdk`
- **License:** MIT
- **Node.js requirement:** 18+
- **Module system:** ESM-first (`"type": "module"`)

---

## Repository Structure

```
src/
  api/            # Ledger, Stats, Subscribe APIs + embedded contract API wrappers
  abi/            # ABI encoding/decoding
  client/         # HTTP and WebSocket client implementations
  crypto/         # Cryptographic utilities
  embedded/       # Embedded contract transaction builders
  model/          # Data models (primitives, NoM types, embedded types)
  pow/            # PoW module (WASM loader)
  utilities/      # Amount helpers, byte utilities, logging
  wallet/         # KeyStore, KeyPair, KeyFile (BIP39/BIP44)
cli/              # CLI source (compiled to dist/cli/cli.cjs via webpack)
lib/              # Pre-built pow.js and pow.wasm
docs/             # Documentation
test/             # Mocha test suite (*.spec.ts)
dist/             # Build output (gitignored)
```

---

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run build        # Full build: lint + ESM + CLI + browser bundles
npm run build:esm    # TypeScript → dist/ (ESM)
npm run build:cli    # Webpack CLI bundle → dist/cli/cli.cjs
npm run build:browser # Webpack browser bundle → dist/browser/
npm run build:wasm   # Rebuild PoW WASM (requires Emscripten)
npm run lint         # ESLint (src, cli, test)
npm run lint:fix     # ESLint with auto-fix
npm test             # Run Mocha test suite (tsx runner)
npm run cover        # Test with coverage (c8)
npm run cli:dev      # Build CLI and run it locally
npm run clean        # Remove dist/, coverage/, .nyc_output/
```

The full `npm run build` pipeline runs: `clean → lint → build:esm → build:cli → build:browser`.

---

## Testing

Tests live in `test/**/*.spec.ts` and use **Mocha** with **Chai** assertions, run via `tsx`.

```bash
npm test
```

- Always run tests after making code changes.
- Coverage is tracked with **c8**: `npm run cover`.
- The test command uses `mocha -r tsx 'test/**/*.spec.ts'`.

---

## Code Style & Conventions

- **Language:** TypeScript (strict mode)
- **Module format:** ESM (`import`/`export`), no CommonJS in `src/`
- **Linting:** ESLint with `@typescript-eslint` rules; run `npm run lint` before committing
- **No default exports:** the codebase uses named exports throughout
- **Error handling:** all async API methods throw on failure — callers must use `try/catch`
- **BigInt amounts:** token amounts are represented as `bigint` internally; use `extractNumberDecimals` / `addNumberDecimals` helpers for human-readable conversion

---

## Key Architecture

### Entry Point

```typescript
import { Zenon } from 'znn-typescript-sdk';

const zenon = Zenon.getInstance(); // singleton
await zenon.initialize('wss://node.zenonhub.io:35998');
```

### API Namespaces on `zenon`

| Namespace | Description |
|---|---|
| `zenon.ledger` | Account blocks, momentums, raw transactions |
| `zenon.subscribe` | WebSocket real-time subscriptions |
| `zenon.stats` | Node stats (network, OS, process, sync) |
| `zenon.embedded.*` | Embedded contract read methods |

### Embedded Contract Builders

Transaction block templates are built via `zenon.embedded.<contract>.<method>(...)`. These return an `AccountBlockTemplate`, not a sent transaction. To actually send, pass the template to `zenon.send(block, keyPair)`.

Available embedded contracts: `accelerator`, `bridge`, `htlc`, `liquidity`, `pillar`, `plasma`, `sentinel`, `spork`, `stake`, `swap`, `token`, `wasm`.

### Static Configuration (call before `initialize`)

```typescript
Zenon.setNetworkID(1);          // default: 1
Zenon.setChainID(1);            // default: 1
Zenon.setPowBasePath('...');    // browser only — path to pow.js / pow.wasm
```

### Wallet Classes

| Class | Purpose |
|---|---|
| `KeyStore` | Manages BIP39 mnemonic and derives keys (`newRandom`, `fromMnemonic`, `fromEntropy`) |
| `KeyPair` | Single address with private key; used to sign transactions |
| `KeyFile` | Encrypt/decrypt wallet JSON (Argon2id + AES-256-GCM) |

BIP44 derivation path: `m/44'/73404'/0'/0/<index>`

### Primitive Types

| Type | Import |
|---|---|
| `Address` | `Address.parse('z1q...')` |
| `Hash` | `Hash.parse('abc123...')` |
| `TokenStandard` | `TokenStandard.parse('zts1...')` |
| `AccountBlockTemplate` | `.send(to, zts, amount)` / `.receive(hash)` |

### Constants

```typescript
import { ZNN_ZTS, QSR_ZTS, EMPTY_ZTS, EMPTY_HASH, EMPTY_ADDRESS } from 'znn-typescript-sdk';
import { PLASMA_ADDRESS, PILLAR_ADDRESS, WASM_ADDRESS, /* etc. */ } from 'znn-typescript-sdk';
```

### Amount Helpers

```typescript
import { extractNumberDecimals, addNumberDecimals } from 'znn-typescript-sdk';

extractNumberDecimals(1, 8)        // human → raw bigint (1 ZNN → 100000000n)
addNumberDecimals(100000000n, 8)   // raw → human readable
```

---

## PoW Module

The SDK includes a WebAssembly PoW module (`lib/pow.js` + `lib/pow.wasm`).

- **Node.js:** loaded automatically — no configuration needed
- **Browser:** must call `Zenon.setPowBasePath(path)` before sending transactions, pointing to where `pow.js` and `pow.wasm` are served
- The pre-built WASM is from [znn-pow-links-cpp](https://github.com/zenon-network/znn-pow-links-cpp); rebuild with `npm run build:wasm` (requires Emscripten)

---

## Browser Bundles

| Bundle | Path | Usage |
|---|---|---|
| ESM | `dist/browser/bundle.browser.mjs` | Vite / Rollup / Webpack |
| UMD | `dist/browser/bundle.browser.js` | `<script>` tag → `window.ZnnSDK` |

Prefer ESM. UMD is only for script-tag usage without a bundler.

---

## CLI

The CLI is compiled to `dist/cli/cli.cjs` and exposed as the `znn-cli` binary.

**Wallet commands:** `wallet list`, `wallet create`, `wallet import`, `wallet export`, `wallet derive`, `wallet copy`, `wallet delete`

**Transaction commands:** `tx send`, `tx receive`, `tx receiveAll`, `tx autoReceive`

Default node: `wss://node.zenonhub.io:35998`. Override with `-n <url>`.

Development: `npm run cli:dev -- <command>`.

---

## Common Pitfalls

- **WebSocket required for subscriptions and `zenon.send()`** — HTTP connections only support read-only ledger/stats calls.
- **Always call `zenon.clearConnection()`** when done — especially in scripts (use `try/finally`).
- **Embedded contract methods return `AccountBlockTemplate`, not a sent transaction** — you must call `zenon.send(block, keyPair)` to broadcast.
- **PoW is generated automatically** by `zenon.send()` if the account lacks sufficient fused plasma.
- **WebSocket auto-reconnects** during long PoW generation — default settings handle this.
- **Never store mnemonics in plain text** — use `KeyFile` (encrypted JSON) for storage.

---

## Links

- [GitHub](https://github.com/digitalSloth/znn-typescript-sdk)
- [Zenon Network](https://zenon.network)
- [Zenon Hub Explorer](https://zenonhub.io)
- [Forum](https://forum.hypercore.one)
