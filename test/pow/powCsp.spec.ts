import { readFileSync } from "fs";
import { expect } from "chai";

const powGlue = readFileSync(new URL("../../lib/pow.js", import.meta.url), "utf8");
const powLoader = readFileSync(new URL("../../src/pow/pow.ts", import.meta.url), "utf8");
const buildScript = readFileSync(new URL("../../scripts/build-wasm.sh", import.meta.url), "utf8");

describe("PoW CSP compatibility", () => {
    it("ships glue without dynamic JavaScript execution", () => {
        expect(powGlue).not.to.match(/\bnew\s+Function\s*\(/);
        expect(powGlue).not.to.match(/(^|[^\w])eval\s*\(/m);
    });

    it("loads browser PoW without an inline module script", () => {
        expect(powLoader).not.to.include("script.textContent");
        expect(powLoader).not.to.include("new Function");
        expect(powLoader).to.include("@vite-ignore");
        expect(powLoader).to.include("webpackIgnore: true");
    });

    it("pins the PoW source and CSP-safe Emscripten settings", () => {
        expect(buildScript).to.include("9c63abdcd4e6bd642a81476cbff2f5190efabe95");
        expect(buildScript).to.include('EXPECTED_EMSCRIPTEN_VERSION="6.0.8"');
        expect(buildScript).to.include("-s DYNAMIC_EXECUTION=0");
        expect(buildScript).to.include("-s EMBIND_AOT=1");
        expect(buildScript).not.to.include("git pull");
    });
});
