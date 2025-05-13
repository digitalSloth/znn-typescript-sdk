/**
 * Proof of Work module for generating PoW nonces
 * Uses WebAssembly compiled from znn-pow-links-cpp
 */

import { isNode } from "../utilities/global.js";
import { Logger } from "../utilities/logger.js";
import { Zenon } from "../zenon.js";

let powModule: any = null;
let initPromise: Promise<void> | null = null;

const logger = Logger.globalLogger();

/**
 * Initialize the PoW WASM module.
 * Must be called before using generate() or benchmark().
 * In browser environments, call Zenon.setPowBasePath() first if needed.
 */
export async function init(): Promise<void> {
    if (powModule) {
        return; // Already initialized
    }

    if (initPromise) {
        return initPromise; // Initialization in progress
    }

    initPromise = (async () => {
        try {
            if (isNode()) {
                logger.info("[PoW Init] Node.js environment");

                // Import pow.js module using Node.js path resolution
                // @ts-ignore
                const { readFileSync } = await import(/* webpackIgnore: true */ "fs");
                // @ts-ignore
                const { fileURLToPath } = await import(/* webpackIgnore: true */ "url");
                // @ts-ignore
                const { dirname, join } = await import(/* webpackIgnore: true */ "path");

                const __filename = fileURLToPath(import.meta.url);
                const __dirname = dirname(__filename);
                const wasmPath = join(__dirname, "../../lib/pow.wasm");
                const wasmBinary = readFileSync(wasmPath);

                // Dynamic import to avoid webpack bundling
                // @ts-ignore
                const dynamicImport = new Function("modulePath", "return import(modulePath)");
                const powJsPath = join(__dirname, "../../lib/pow.js");
                const powModule_import = await dynamicImport(powJsPath);
                const createPowModule = powModule_import.default;

                // Pass WASM binary directly to avoid file system access
                powModule = await createPowModule({ wasmBinary });

            } else {
                logger.info("[PoW Init] Browser environment");

                const basePath = Zenon.getPowBasePath() || "./";
                const powJsUrl = `${basePath}pow.js`;
                const powWasmUrl = `${basePath}pow.wasm`;

                logger.info(`[PoW Init] Loading from: ${powJsUrl}`);

                // Create a unique global variable name to avoid conflicts
                const globalVarName = `__powModule_${Date.now()}`;

                // Create wrapper code that exposes the module to global scope
                const wrapperCode = `
                    import createPowModule from '${powJsUrl}';
                    window.${globalVarName} = createPowModule;
                `;

                // Create script tag with type="module" to load ES module
                const script = document.createElement("script");
                script.type = "module";
                script.textContent = wrapperCode;

                // Wait for the script to execute and populate the global
                await new Promise<void>((resolve, reject) => {
                    const checkInterval = setInterval(() => {
                        // @ts-ignore
                        if (window[globalVarName]) {
                            clearInterval(checkInterval);
                            clearTimeout(timeout);
                            resolve();
                        }
                    }, 10);

                    const timeout = setTimeout(() => {
                        clearInterval(checkInterval);
                        document.head.removeChild(script);
                        reject(new Error(`Timeout loading ${powJsUrl}`));
                    }, 10000);

                    script.onerror = () => {
                        clearInterval(checkInterval);
                        clearTimeout(timeout);
                        document.head.removeChild(script);
                        reject(new Error(`Failed to load ${powJsUrl}`));
                    };

                    document.head.appendChild(script);
                });

                // Get the module from global scope
                // @ts-ignore
                const createPowModule = window[globalVarName];
                // @ts-ignore
                delete window[globalVarName];

                // Create module with custom locateFile for WASM
                powModule = await createPowModule({
                    locateFile: (path: string) => {
                        if (path.endsWith(".wasm")) {
                            return powWasmUrl;
                        }
                        return path;
                    }
                });
            }

            logger.info("[PoW Init] Initialization complete");
        } catch (error) {
            initPromise = null; // Reset on error to allow retry
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to initialize PoW module: ${errorMsg}`);
        }
    })();

    return initPromise;
}

/**
 * Generate a PoW nonce for the given hash and difficulty
 *
 * @param hash - 32-byte hash as hex string or Uint8Array
 * @param difficulty - PoW difficulty level (higher = more computation)
 * @returns 8-byte nonce as hex string
 *
 * @example
 * ```typescript
 * await initPoW();
 * const hash = "a1b2c3d4..."; // 64 character hex string (32 bytes)
 * const nonce = await generatePoW(hash, 75000);
 * ```
 */
export async function generate(
    hash: string | Uint8Array,
    difficulty: number
): Promise<string> {
    if (!powModule) {
        await init();
    }

    // Convert Uint8Array to hex string if needed
    let hashHex: string;
    if (hash instanceof Uint8Array) {
        hashHex = Array.from(hash)
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    } else {
        hashHex = hash.replace(/^0x/, ""); // Remove 0x prefix if present
    }

    // Validate input
    if (hashHex.length !== 64) {
        throw new Error(`Invalid hash length: expected 64 hex characters, got ${hashHex.length}`);
    }

    if (difficulty < 0) {
        throw new Error(`Invalid difficulty: must be >= 0, got ${difficulty}`);
    }

    try {
        return powModule.generate(hashHex, difficulty);
    } catch (error) {
        throw new Error(`PoW generation failed: ${error}`);
    }
}

/**
 * Benchmark the PoW implementation with a random hash
 * Useful for testing performance
 *
 * @param difficulty - PoW difficulty level
 * @returns 8-byte nonce as hex string
 *
 * @example
 * ```typescript
 * await initPoW();
 * const start = Date.now();
 * await benchmarkPoW(75000);
 * console.log(`PoW took ${Date.now() - start}ms`);
 * ```
 */
export async function benchmark(difficulty: number): Promise<string> {
    if (!powModule) {
        await init();
    }

    if (difficulty < 0) {
        throw new Error(`Invalid difficulty: must be >= 0, got ${difficulty}`);
    }

    try {
        return powModule.benchmark(difficulty);
    } catch (error) {
        throw new Error(`PoW benchmark failed: ${error}`);
    }
}

/**
 * Check if the PoW module has been initialized
 */
export function isInitialized(): boolean {
    return powModule !== null;
}

// Re-export for convenience
export { init as initPoW };
