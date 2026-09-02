import { createHash } from "crypto";
import { readFileSync } from "fs";
import { expect } from "chai";
import { generate } from "../../src/pow/pow.js";

const powGlue = readFileSync(new URL("../../lib/pow.js", import.meta.url), "utf8");

describe("PoW CSP compatibility", () => {
    it("ships glue without dynamic JavaScript execution", () => {
        expect(powGlue).not.to.match(/\bnew\s+Function\s*\(/);
        expect(powGlue).not.to.match(/(^|[^\w])eval\s*\(/m);
    });

    it("generates a nonce accepted by an independent verifier", async function () {
        this.timeout(15000);

        const hash = "00".repeat(32);
        const difficulty = 1024;
        const nonce = await generate(hash, difficulty);

        expect(nonce).to.match(/^[0-9a-f]{16}$/i);

        const digest = createHash("sha3-256")
            .update(
                Buffer.concat([
                    Buffer.from(nonce, "hex"),
                    Buffer.from(hash, "hex")
                ])
            )
            .digest();

        const value = digest.readBigUInt64LE(0);
        const range = 1n << 64n;
        const threshold = range - range / BigInt(difficulty);

        expect(value >= threshold).to.equal(true);
    });
});
