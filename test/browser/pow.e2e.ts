import { createHash, randomBytes } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const DIFFICULTY = 75000;

/**
 * Zenon PoW check: the first 8 bytes of sha3-256(nonce || hash), read as a
 * little-endian uint64, must reach 2^64 - 2^64 / difficulty.
 */
function isValidNonce(hash: string, nonce: string, difficulty: number): boolean {
    const digest = createHash("sha3-256")
        .update(Buffer.concat([Buffer.from(nonce, "hex"), Buffer.from(hash, "hex")]))
        .digest();
    const range = 1n << 64n;
    return digest.readBigUInt64LE(0) >= range - range / BigInt(difficulty);
}

async function openPage(page: Page, path: string): Promise<void> {
    await page.goto(path);
    await page.waitForFunction(() => "sdk" in window);
}

function generateOnMainThread(page: Page, basePath: string, hash: string): Promise<string> {
    return page.evaluate(async ({ basePath, hash, difficulty }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Zenon, generate } = (window as any).sdk;
        Zenon.setPowBasePath(basePath);
        return generate(hash, difficulty);
    }, { basePath, hash, difficulty: DIFFICULTY });
}

function generateInWorker(page: Page, basePath: string, hash: string): Promise<string> {
    return page.evaluate(async ({ basePath, hash, difficulty }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Zenon } = (window as any).sdk;
        Zenon.setPowBasePath(basePath);
        const worker = Zenon.usePowWorker();
        try {
            return await worker.generate(hash, difficulty);
        } finally {
            Zenon.stopPowWorker();
        }
    }, { basePath, hash, difficulty: DIFFICULTY });
}

function cspViolations(page: Page): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return page.evaluate(() => (window as any).cspViolations);
}

for (const csp of [false, true]) {
    const pagePath = csp ? "/index.html?csp=strict" : "/index.html";

    test.describe(csp ? "PoW in the browser with a strict CSP" : "PoW in the browser", () => {
        test("main thread generates a valid nonce", async ({ page }) => {
            await openPage(page, pagePath);
            const hash = randomBytes(32).toString("hex");

            const nonce = await generateOnMainThread(page, "/assets/", hash);

            expect(nonce).toMatch(/^[0-9a-f]{16}$/);
            expect(isValidNonce(hash, nonce, DIFFICULTY)).toBe(true);
            expect(await cspViolations(page)).toEqual([]);
        });

        test("web worker generates a valid nonce", async ({ page }) => {
            await openPage(page, pagePath);
            const hash = randomBytes(32).toString("hex");

            const nonce = await generateInWorker(page, "/assets/", hash);

            expect(nonce).toMatch(/^[0-9a-f]{16}$/);
            expect(isValidNonce(hash, nonce, DIFFICULTY)).toBe(true);
            expect(await cspViolations(page)).toEqual([]);
        });
    });
}

test.describe("PoW asset resolution in the browser", () => {
    test("main thread resolves a relative base path against the page URL", async ({ page }) => {
        await openPage(page, "/app/index.html");
        const wasmRequest = page.waitForRequest((req) => req.url().endsWith("/pow.wasm"));
        const hash = randomBytes(32).toString("hex");

        const nonce = await generateOnMainThread(page, "./assets/", hash);

        expect(isValidNonce(hash, nonce, DIFFICULTY)).toBe(true);
        expect(new URL((await wasmRequest).url()).pathname).toBe("/app/assets/pow.wasm");
    });

    test("web worker resolves a relative base path against the page URL", async ({ page }) => {
        await openPage(page, "/app/index.html");
        const hash = randomBytes(32).toString("hex");

        const nonce = await generateInWorker(page, "./assets/", hash);

        expect(isValidNonce(hash, nonce, DIFFICULTY)).toBe(true);
    });

    test("main thread rejects when pow.js is not served", async ({ page }) => {
        await openPage(page, "/index.html");

        const result = generateOnMainThread(page, "/missing/", "00".repeat(32));

        await expect(result).rejects.toThrow(/Failed to initialize PoW module/);
    });

    test("web worker rejects when pow.js is not served", async ({ page }) => {
        await openPage(page, "/index.html");

        const result = generateInWorker(page, "/missing/", "00".repeat(32));

        // The worker forwards the browser's own module load error.
        await expect(result).rejects.toThrow(
            /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/
        );
    });
});
