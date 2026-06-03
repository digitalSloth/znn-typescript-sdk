import { expect } from "chai";
import {
    PowWorker,
    isPowWorkerSupported,
    resolvePowUrls,
    buildPowWorkerSource
} from "../../src/pow/powWorker.js";

describe("PowWorker", () => {
    describe("resolvePowUrls", () => {
        it("resolves an absolute base path against the base href", () => {
            const { powJsUrl, powWasmUrl } = resolvePowUrls("/", "https://app.example.com/wallet/");
            expect(powJsUrl).to.equal("https://app.example.com/pow.js");
            expect(powWasmUrl).to.equal("https://app.example.com/pow.wasm");
        });

        it("resolves a relative base path against the base href", () => {
            const { powJsUrl, powWasmUrl } = resolvePowUrls("./assets/", "https://app.example.com/wallet/");
            expect(powJsUrl).to.equal("https://app.example.com/wallet/assets/pow.js");
            expect(powWasmUrl).to.equal("https://app.example.com/wallet/assets/pow.wasm");
        });

        it("passes through a full URL base path", () => {
            const { powJsUrl } = resolvePowUrls("https://cdn.example.com/pow/", "https://app.example.com/");
            expect(powJsUrl).to.equal("https://cdn.example.com/pow/pow.js");
        });
    });

    describe("buildPowWorkerSource", () => {
        it("embeds the resolved URLs and a message handler", () => {
            const source = buildPowWorkerSource("https://x/pow.js", "https://x/pow.wasm");
            expect(source).to.include('import("https://x/pow.js")');
            expect(source).to.include('"https://x/pow.wasm"');
            expect(source).to.include("self.onmessage");
            expect(source).to.include("module.generate(hashHex, difficulty)");
        });

        it("safely escapes URLs containing quotes", () => {
            const source = buildPowWorkerSource('https://x/"; evil()//pow.js', "https://x/pow.wasm");
            // The malicious URL must be JSON-escaped, not break out of the string literal.
            expect(source).to.include(JSON.stringify('https://x/"; evil()//pow.js'));
        });
    });

    describe("isPowWorkerSupported", () => {
        it("returns false in the Node test environment", () => {
            expect(isPowWorkerSupported()).to.be.false;
        });
    });

    describe("generate", () => {
        it("throws when Web Worker support is unavailable", async () => {
            const worker = new PowWorker({ basePath: "/", baseHref: "https://app.example.com/" });
            let error: Error | null = null;
            try {
                await worker.generate("ab".repeat(32), 1);
            } catch (err) {
                error = err as Error;
            }
            expect(error).to.exist;
            expect(error!.message).to.include("requires a browser environment");
        });

        it("posts requests and resolves with the worker's nonce (mocked Worker)", async () => {
            const { restore, posted } = installFakeWorkerEnv((data: any) => {
                // Echo back a deterministic nonce keyed off the difficulty.
                return { id: data.id, nonce: `nonce-${data.difficulty}` };
            });

            try {
                const worker = new PowWorker({ basePath: "/", baseHref: "https://app.example.com/" });
                const nonce = await worker.generate("ab".repeat(32), 42);

                expect(nonce).to.equal("nonce-42");
                expect(posted).to.have.length(1);
                expect(posted[0].hashHex).to.equal("ab".repeat(32));
                expect(posted[0].difficulty).to.equal(42);
            } finally {
                restore();
            }
        });

        it("rejects in-flight requests on worker error (mocked Worker)", async () => {
            const { restore, fail } = installFakeWorkerEnv(() => null);

            try {
                const worker = new PowWorker({ basePath: "/", baseHref: "https://app.example.com/" });
                const promise = worker.generate("ab".repeat(32), 1);
                fail("boom");

                let error: Error | null = null;
                try {
                    await promise;
                } catch (err) {
                    error = err as Error;
                }
                expect(error).to.exist;
                expect(error!.message).to.include("boom");
            } finally {
                restore();
            }
        });
    });
});

/**
 * Install minimal globals (`Worker`, `Blob`, `URL.createObjectURL`) so PowWorker
 * can run under Node. The fake worker invokes `respond` for each posted message
 * and delivers the result asynchronously via `onmessage`.
 */
function installFakeWorkerEnv(respond: (data: any) => any | null) {
    const g = globalThis as any;
    const saved = {
        Worker: g.Worker,
        Blob: g.Blob,
        createObjectURL: g.URL?.createObjectURL,
        revokeObjectURL: g.URL?.revokeObjectURL
    };

    const posted: any[] = [];
    let instance: FakeWorker | null = null;

    class FakeWorker {
        onmessage: ((event: { data: any }) => void) | null = null;
        onerror: ((event: { message: string }) => void) | null = null;

        constructor(_url: string, _opts?: any) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            instance = this;
        }

        postMessage(data: any) {
            posted.push(data);
            const result = respond(data);
            if (result && this.onmessage) {
                Promise.resolve().then(() => this.onmessage!({ data: result }));
            }
        }

        terminate() {}
    }

    g.Worker = FakeWorker;
    if (typeof g.Blob === "undefined") {
        g.Blob = class {
            constructor(public parts: any[], public opts?: any) {}
        };
    }
    g.URL = g.URL || {};
    g.URL.createObjectURL = () => "blob:fake";
    g.URL.revokeObjectURL = () => {};

    return {
        posted,
        fail: (message: string) => instance?.onerror?.({ message }),
        restore: () => {
            g.Worker = saved.Worker;
            g.Blob = saved.Blob;
            if (g.URL) {
                g.URL.createObjectURL = saved.createObjectURL;
                g.URL.revokeObjectURL = saved.revokeObjectURL;
            }
        }
    };
}
