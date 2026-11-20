import { createHash } from "node:crypto";
import type { Page } from "@playwright/test";

export const DIFFICULTY = 75000;

/**
 * Zenon PoW check: the first 8 bytes of sha3-256(nonce || hash), read as a
 * little-endian uint64, must reach 2^64 - 2^64 / difficulty.
 */
export function isValidNonce(hash: string, nonce: string, difficulty: number): boolean {
    const digest = createHash("sha3-256")
        .update(Buffer.concat([Buffer.from(nonce, "hex"), Buffer.from(hash, "hex")]))
        .digest();
    const range = 1n << 64n;
    return digest.readBigUInt64LE(0) >= range - range / BigInt(difficulty);
}

export async function openPage(page: Page, path: string): Promise<void> {
    await page.goto(path);
    await page.waitForFunction(() => "sdk" in window);
}

export function cspViolations(page: Page): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return page.evaluate(() => (window as any).cspViolations);
}
