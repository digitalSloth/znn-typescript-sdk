/**
 * Bundles the built SDK (dist/) for the browser the way a consumer's bundler
 * would, then serves it with the PoW assets from lib/ and a mock node.
 *
 * Routes:
 * - any path ending in /index.html: the test page, which loads /sdk.js
 * - /sdk.js: the bundled SDK, exposed as window.sdk
 * - /keyfile-worker.js: a module worker that decrypts a key file posted to it
 * - /assets/pow.{js,wasm} and /app/assets/pow.{js,wasm}: files from lib/
 * - /ws: the mock node from mockNode.ts
 *
 * Adding ?csp=strict to a page URL serves it with the strict policy that
 * docs/build-wasm.md documents for same-origin PoW assets.
 */

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { PORT } from "../../playwright.config.js";
import { attachMockNode } from "./mockNode.js";

export const STRICT_CSP = "script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self'";

const root = fileURLToPath(new URL("../../", import.meta.url));

const PAGE = "<!doctype html><html><head><meta charset=\"utf-8\"><script type=\"module\" src=\"/sdk.js\"></script></head><body></body></html>";

// Records CSP violations on the page so tests can assert there are none.
const ENTRY = `
import * as sdk from "./dist/index.js";
window.cspViolations = [];
document.addEventListener("securitypolicyviolation", (e) => {
    window.cspViolations.push(e.violatedDirective + " " + e.blockedURI);
});
window.sdk = sdk;
`;

const KEYFILE_WORKER_ENTRY = `
import { KeyFile } from "./dist/index.js";
self.onmessage = async ({ data }) => {
    try {
        const keyStore = await KeyFile.setPassword(data.password).decrypt(data.keyFile);
        self.postMessage({ baseAddress: keyStore.getBaseAddress().toString() });
    } catch (error) {
        self.postMessage({ error: error instanceof Error ? error.message : String(error) });
    }
};
`;

async function bundle(entry: string): Promise<Uint8Array> {
    const result = await build({
        stdin: { contents: entry, resolveDir: root, loader: "js" },
        bundle: true,
        format: "esm",
        platform: "browser",
        target: "es2020",
        // Node-only imports sit behind the isNode() branch and never run here.
        external: ["node:*"],
        write: false,
        logLevel: "warning"
    });
    return result.outputFiles[0].contents;
}

export default async function globalSetup(): Promise<() => Promise<void>> {
    const sdkJs = await bundle(ENTRY);
    const keyFileWorkerJs = await bundle(KEYFILE_WORKER_ENTRY);

    const server = createServer((req, res) => {
        const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
        const asset = url.pathname.match(/^\/(?:app\/)?assets\/(pow\.(?:js|wasm))$/);

        if (url.pathname.endsWith("/index.html")) {
            const headers: Record<string, string> = { "Content-Type": "text/html" };
            if (url.searchParams.get("csp") === "strict") {
                headers["Content-Security-Policy"] = STRICT_CSP;
            }
            res.writeHead(200, headers).end(PAGE);
        } else if (url.pathname === "/sdk.js") {
            res.writeHead(200, { "Content-Type": "text/javascript" }).end(sdkJs);
        } else if (url.pathname === "/keyfile-worker.js") {
            res.writeHead(200, { "Content-Type": "text/javascript" }).end(keyFileWorkerJs);
        } else if (asset) {
            const type = asset[1].endsWith(".wasm") ? "application/wasm" : "text/javascript";
            res.writeHead(200, { "Content-Type": type }).end(readFileSync(`${root}lib/${asset[1]}`));
        } else {
            res.writeHead(404).end();
        }
    });

    const mockNode = attachMockNode(server);
    await new Promise<void>((resolve) => server.listen(PORT, "127.0.0.1", resolve));

    return () => new Promise<void>((resolve) => {
        mockNode.clients.forEach((client) => client.terminate());
        mockNode.close();
        server.close(() => resolve());
    });
}
