import { expect } from "chai";
import { benchmark, generate, init, isInitialized } from "../../src/pow/pow.js";

describe("PoW", function () {
    this.timeout(15000);

    before(async () => {
        if (!isInitialized()) {
            await init();
        }
    });

    it("should initialize the module", () => {
        expect(isInitialized()).to.equal(true);
    });

    it("should generate a nonce for a valid hash", async () => {
        const hash = "00".repeat(32);
        const nonce = await generate(hash, 1);

        expect(nonce).to.be.a("string");
        expect(nonce).to.match(/^[0-9a-f]+$/i);
        expect(nonce.length).to.equal(16);
    });

    it("should reject invalid hash length", async () => {
        let error: Error | null = null;
        try {
            await generate("abcd", 1);
        } catch (err) {
            error = err as Error;
        }

        expect(error).to.exist;
        expect(error!.message).to.include("Invalid hash length");
    });

    it("should reject negative difficulty for generate", async () => {
        let error: Error | null = null;
        try {
            await generate("00".repeat(32), -1);
        } catch (err) {
            error = err as Error;
        }

        expect(error).to.exist;
        expect(error!.message).to.include("Invalid difficulty");
    });

    it("should reject negative difficulty for benchmark", async () => {
        let error: Error | null = null;
        try {
            await benchmark(-1);
        } catch (err) {
            error = err as Error;
        }

        expect(error).to.exist;
        expect(error!.message).to.include("Invalid difficulty");
    });
});
