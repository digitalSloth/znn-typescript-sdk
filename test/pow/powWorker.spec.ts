import { expect } from "chai";
import { pathToFileURL } from "url";
import {
    PowWorker,
    isPowWorkerSupported,
    resolvePowUrls,
    buildPowWorkerSource,
    servePowRequests
} from "../../src/pow/powWorker.js";
import { Zenon } from "../../src/zenon.js";

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

    describe("createWorker", () => {
        it("starts the given worker instead of a blob: worker", async () => {
            const saved = URL.createObjectURL;
            URL.createObjectURL = () => {
                throw new Error("blob: worker must not be created");
            };
            try {
                const fake = new ScriptedWorker((data) => ({ id: data.id, nonce: `nonce-${data.difficulty}` }));
                let created = 0;
                const worker = new PowWorker({
                    basePath: "/",
                    createWorker: () => {
                        created++;
                        return fake as unknown as Worker;
                    }
                });

                const nonces = await Promise.all([
                    worker.generate("ab".repeat(32), 7),
                    worker.generate("cd".repeat(32), 8)
                ]);

                expect(nonces).to.deep.equal(["nonce-7", "nonce-8"]);
                expect(created).to.equal(1);
                expect(fake.posted.map((p) => p.hashHex)).to.deep.equal(["ab".repeat(32), "cd".repeat(32)]);
            } finally {
                URL.createObjectURL = saved;
            }
        });

        it("starts a fresh worker after the given one fails", async () => {
            const workers: ScriptedWorker[] = [];
            const worker = new PowWorker({
                basePath: "/",
                createWorker: () => {
                    const fake = new ScriptedWorker((data) => (workers.length > 1 ? { id: data.id, nonce: "ok" } : null));
                    workers.push(fake);
                    return fake as unknown as Worker;
                }
            });

            const first = worker.generate("ab".repeat(32), 1);
            workers[0].onerror?.({ message: "load failed" });
            const error = await first.then(() => null, (err: Error) => err);
            const second = await worker.generate("ab".repeat(32), 1);

            expect(error?.message).to.equal("PoW worker error: load failed");
            expect(workers[0].terminated).to.equal(true);
            expect(workers).to.have.length(2);
            expect(second).to.equal("ok");
        });

        it("is passed through by Zenon.usePowWorker", async () => {
            const g = globalThis as unknown as Record<string, unknown>;
            const saved = { window: g.window, Worker: g.Worker };
            // isBrowser() also checks navigator, which Node only defines from 21.
            const stubNavigator = typeof g.navigator === "undefined";
            g.window = { document: {} };
            g.Worker = class {};
            if (stubNavigator) g.navigator = {};
            try {
                const fake = new ScriptedWorker((data) => ({ id: data.id, nonce: "from-custom-worker" }));
                const worker = Zenon.usePowWorker({ createWorker: () => fake as unknown as Worker });

                expect(await worker.generate("ab".repeat(32), 1)).to.equal("from-custom-worker");
            } finally {
                Zenon.stopPowWorker();
                g.window = saved.window;
                g.Worker = saved.Worker;
                if (stubNavigator) delete g.navigator;
            }
        });
    });

    describe("servePowRequests", () => {
        const libHref = pathToFileURL(new URL("../../lib/", import.meta.url).pathname).href;

        /** Runs servePowRequests against globalThis as the worker scope. */
        function serve(options: Parameters<typeof servePowRequests>[0]) {
            const g = globalThis as unknown as Record<string, unknown>;
            const saved = { onmessage: g.onmessage, postMessage: g.postMessage };
            const replies: PowReply[] = [];
            let notify: () => void = () => undefined;
            g.postMessage = (message: PowReply) => {
                replies.push(message);
                notify();
            };
            servePowRequests(options);
            const handler = g.onmessage as (event: { data: PowRequest }) => void;
            return {
                request: (data: PowRequest) => {
                    const reply = new Promise<PowReply>((resolve) => {
                        notify = () => resolve(replies[replies.length - 1]);
                    });
                    handler({ data });
                    return reply;
                },
                restore: () => {
                    g.onmessage = saved.onmessage;
                    g.postMessage = saved.postMessage;
                }
            };
        }

        it("replies with an error for the request when pow.js cannot be loaded", async () => {
            const worker = serve({ basePath: "missing/", baseHref: libHref });
            try {
                const reply = await worker.request({ id: 9, hashHex: "ab".repeat(32), difficulty: 1 });

                expect(reply.id).to.equal(9);
                expect(reply.nonce).to.equal(undefined);
                expect(reply.error).to.include("missing/pow");
            } finally {
                worker.restore();
            }
        });

        it("retries loading pow.js on the next request after a failure", async () => {
            const worker = serve({ basePath: "missing/", baseHref: libHref });
            try {
                const first = await worker.request({ id: 1, hashHex: "ab".repeat(32), difficulty: 1 });
                const second = await worker.request({ id: 2, hashHex: "ab".repeat(32), difficulty: 1 });

                expect(first.error).to.include("missing/pow");
                expect(second.id).to.equal(2);
                expect(second.error).to.include("missing/pow");
            } finally {
                worker.restore();
            }
        });
    });
});

type PowRequest = { id: number; hashHex: string; difficulty: number };
type PowReply = { id: number; nonce?: string; error?: string };

/** A fake Worker whose replies come from `respond`; it never touches globals. */
class ScriptedWorker {
    onmessage: ((event: { data: PowReply }) => void) | null = null;
    onerror: ((event: { message: string }) => void) | null = null;
    posted: PowRequest[] = [];
    terminated = false;

    constructor(private respond: (data: PowRequest) => PowReply | null) {}

    postMessage(data: PowRequest) {
        this.posted.push(data);
        const result = this.respond(data);
        if (result) Promise.resolve().then(() => this.onmessage?.({ data: result }));
    }

    terminate() {
        this.terminated = true;
    }
}

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
