# Building the PoW WASM Module

This SDK includes a pre-built WebAssembly module for Proof of Work (PoW) computation. Use this guide to rebuild it from source if you need transparency or customization.

---

## Prerequisites

You need the [Emscripten SDK](https://emscripten.org/) installed:

```bash
# Clone the emsdk repository
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install and activate the latest SDK
./emsdk install latest
./emsdk activate latest

# Activate PATH and environment variables (you'll need to do this each time in a new terminal)
source ./emsdk_env.sh
```

## Building the WASM Module

Once Emscripten is installed and activated:

```bash
# From the SDK root directory
npm run build:wasm
```

This script will:
1. Clone the [znn-pow-links-cpp](https://github.com/zenon-network/znn-pow-links-cpp) repository
2. Create an Emscripten wrapper for the C++ PoW functions
3. Compile to WebAssembly using `emcc`
4. Output `lib/pow.js` and `lib/pow.wasm`

## What Gets Built

The build process creates two files in the `lib/` directory:

- **`lib/pow.js`** - JavaScript loader and bindings for the WASM module
- **`lib/pow.wasm`** - The compiled WebAssembly binary

These files are included in the npm package and committed to the repository.

## Build Options

The script uses the following Emscripten flags:

- `-O3` - Maximum optimization for performance
- `--bind` - Use Embind for C++ to JS bindings
- `-s WASM=1` - Output WebAssembly (not asm.js)
- `-s MODULARIZE=1` - Export as a module factory
- `-s EXPORT_NAME='createPowModule'` - Custom export name
- `-s ALLOW_MEMORY_GROWTH=1` - Allow memory to grow as needed

## Source Code

The C++ source code comes from the official Zenon Network repository:
- **Repository**: https://github.com/zenon-network/znn-pow-links-cpp
- **License**: See the repository for license details

The build script creates a wrapper (`pow_wasm_wrapper.cpp`) that exposes two main functions:

### `generate(hash: string, difficulty: number): string`
Generates a PoW nonce for the given 32-byte hash (as hex string) and difficulty level.

### `benchmark(difficulty: number): string`
Generates a PoW nonce for a random hash at the given difficulty level. Useful for performance testing.

## Troubleshooting

### "emcc: command not found"

Make sure you've activated the Emscripten environment:
```bash
source /path/to/emsdk/emsdk_env.sh
```

### Build fails with git errors

Ensure you have git installed and can access GitHub:
```bash
git --version
```

### WASM module fails to load

After rebuilding, make sure to rebuild the TypeScript as well:
```bash
npm run build
```

## Verification

To verify the WASM module works correctly:

```typescript
import { initPoW, generate } from 'znn-typescript-sdk';

await initPoW();

// Generate a PoW for a test hash
const hash = 'a'.repeat(64); // 32-byte hash as hex
const nonce = await generate(hash, 75000);

console.log('Generated nonce:', nonce);
```

## CI/CD Integration

If you want to automate WASM builds in CI/CD, install Emscripten in your pipeline:

```yaml
# Example GitHub Actions
- name: Setup Emscripten
  uses: mymindstorm/setup-emsdk@v12
  with:
    version: 'latest'

- name: Build WASM
  run: npm run build:wasm
```

## Security Note

The pre-built WASM module in this repository is built using the official C++ source from the Zenon Network. You can verify this by:

1. Checking the source repository: https://github.com/zenon-network/znn-pow-links-cpp
2. Rebuilding from source using this guide
3. Comparing the output with the committed version (behavior should be identical)

For maximum security in production environments, we recommend building from source yourself.

---

## Next Steps

- **[Examples](./examples.md)** – Complete working examples
- **[API Overview](./api-overview.md)** – All API methods & Embedded Contract Calls
- **[Utilities](./utilities.md)** – Utilities and constants for common tasks
- **[CLI Tool](./cli.md)** - Command-line interface
- **[Wallet Management](./wallet.md)** – Creating and managing wallets
