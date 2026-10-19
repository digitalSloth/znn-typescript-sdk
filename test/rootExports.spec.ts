import { expect } from "chai";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as sdk from "../src/index.js";

describe("package root exports", () => {
    it("exports the settlement and state namespaces", () => {
        expect(sdk.settlement).to.not.equal(undefined);
        expect(sdk.settlement.outboxId).to.be.a("function");
        expect(sdk.state).to.not.equal(undefined);
        expect(sdk.state.verifyProofByPath).to.be.a("function");
    });

    it("exports the transports an application builds a client with", () => {
        expect(sdk.HttpClient).to.be.a("function");
        expect(sdk.WsClient).to.be.a("function");
        expect(sdk.newClient).to.be.a("function");
    });

    // Mocha's loader tolerates a type re-exported as a value. Native ESM
    // does not, so the root module is imported in a fresh process.
    it("loads the root module under native ESM", function () {
        this.timeout(30_000);
        const root = fileURLToPath(new URL("../src/index.ts", import.meta.url));
        const result = spawnSync(
            process.execPath,
            ["--import", "tsx", "-e", `import(${JSON.stringify(root)}).then(() => process.exit(0), (e) => { console.error(e.message); process.exit(1); })`],
            { encoding: "utf8" }
        );
        expect(result.stderr, result.stderr).to.not.match(/does not provide an export named/);
        expect(result.status, result.stderr).to.equal(0);
    });
});
