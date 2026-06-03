/**
 * Built-in Web Worker PoW provider.
 *
 * Runs Proof of Work off the main thread so the event loop stays free to
 * service the WebSocket heartbeat/reconnect timers and keep the UI responsive
 * during generation. The worker is created lazily (on first `generate` call)
 * from an inline Blob module that dynamically imports the same `pow.js` /
 * `pow.wasm` assets used by the main-thread loader, resolved from the
 * configured PoW base path. No extra asset needs to be served and no
 * additional consumer configuration is required beyond `setPowBasePath`.
 */

import { isBrowser } from "../utilities/global.js";

export interface PowWorkerOptions {
    /**
     * Base path where `pow.js` and `pow.wasm` are served, e.g. `/` or
     * `/assets/`. Mirrors {@link Zenon.setPowBasePath}.
     */
    basePath: string;
    /**
     * Base URL the `basePath` is resolved against. Defaults to the document's
     * base URI (or `location.href`). Mainly useful for testing.
     */
    baseHref?: string;
}

interface PendingRequest {
    resolve: (nonce: string) => void;
    reject: (error: Error) => void;
}

/**
 * Resolve the absolute `pow.js` / `pow.wasm` URLs from a base path. The worker
 * needs absolute URLs because a Blob worker has no meaningful base of its own
 * to resolve relative specifiers against.
 */
export function resolvePowUrls(
    basePath: string,
    baseHref?: string
): { powJsUrl: string; powWasmUrl: string } {
    const base =
        baseHref ??
        (typeof document !== "undefined" ? document.baseURI : undefined) ??
        (typeof location !== "undefined" ? location.href : undefined);

    return {
        powJsUrl: new URL(`${basePath}pow.js`, base).href,
        powWasmUrl: new URL(`${basePath}pow.wasm`, base).href
    };
}

/**
 * Build the module-worker source. Exported for testing.
 */
export function buildPowWorkerSource(powJsUrl: string, powWasmUrl: string): string {
    // Embedded as a string so the worker can be spawned from a Blob URL without
    // shipping a separate asset. The URLs are interpolated as JSON to safely
    // escape them.
    return `
let modulePromise;
async function getModule() {
    if (!modulePromise) {
        const imported = await import(${JSON.stringify(powJsUrl)});
        const createPowModule = imported.default;
        modulePromise = createPowModule({
            locateFile: (path) => path.endsWith(".wasm") ? ${JSON.stringify(powWasmUrl)} : path
        });
    }
    return modulePromise;
}

self.onmessage = async (event) => {
    const { id, hashHex, difficulty } = event.data || {};
    try {
        const module = await getModule();
        const nonce = module.generate(hashHex, difficulty);
        self.postMessage({ id, nonce });
    } catch (error) {
        self.postMessage({ id, error: (error && error.message) ? error.message : String(error) });
    }
};
`;
}

export class PowWorker {
    private readonly basePath: string;
    private readonly baseHref?: string;
    private worker?: Worker;
    private nextId = 0;
    private readonly pending = new Map<number, PendingRequest>();

    constructor(options: PowWorkerOptions) {
        this.basePath = options.basePath;
        this.baseHref = options.baseHref;
    }

    private ensureWorker(): Worker {
        if (this.worker) {
            return this.worker;
        }

        if (typeof Worker === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined" || !URL.createObjectURL) {
            throw new Error("PowWorker requires a browser environment with Web Worker and Blob support");
        }

        const { powJsUrl, powWasmUrl } = resolvePowUrls(this.basePath, this.baseHref);
        const source = buildPowWorkerSource(powJsUrl, powWasmUrl);
        const blob = new Blob([source], { type: "text/javascript" });
        const blobUrl = URL.createObjectURL(blob);

        try {
            this.worker = new Worker(blobUrl, { type: "module" });
        } finally {
            URL.revokeObjectURL(blobUrl);
        }

        this.worker.onmessage = (event: MessageEvent) => {
            const { id, nonce, error } = event.data || {};
            const request = this.pending.get(id);
            if (!request) {
                return;
            }
            this.pending.delete(id);
            if (error) {
                request.reject(new Error(error));
            } else {
                request.resolve(nonce);
            }
        };

        this.worker.onerror = (event: ErrorEvent) => {
            this.rejectAll(new Error(`PoW worker error: ${event.message || "failed to load"}`));
        };

        return this.worker;
    }

    private rejectAll(error: Error): void {
        for (const request of this.pending.values()) {
            request.reject(error);
        }
        this.pending.clear();

        // Drop the failed worker so a subsequent call can attempt a fresh one.
        if (this.worker) {
            this.worker.terminate();
            this.worker = undefined;
        }
    }

    /**
     * Generate a PoW nonce in the worker. Conforms to the `PowProvider`
     * signature so it can be passed straight to `Zenon.setPowProvider`.
     */
    generate = (hashHex: string, difficulty: number): Promise<string> => {
        const worker = this.ensureWorker();
        const id = this.nextId++;

        return new Promise<string>((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            worker.postMessage({ id, hashHex, difficulty });
        });
    };

    /**
     * Terminate the worker and reject any in-flight requests. A subsequent
     * `generate` call will spawn a fresh worker.
     */
    terminate(): void {
        this.rejectAll(new Error("PoW worker terminated"));
    }
}

/**
 * Whether the current environment can host a {@link PowWorker}.
 */
export function isPowWorkerSupported(): boolean {
    return isBrowser() && typeof Worker !== "undefined";
}
