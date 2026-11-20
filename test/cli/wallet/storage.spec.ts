import { expect } from "chai";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Storage } from "../../../cli/wallet/storage.js";

describe("CLI wallet storage preservation", () => {
    let directory: string;
    let previousDirectory: PropertyDescriptor | undefined;

    beforeEach(() => {
        previousDirectory = Object.getOwnPropertyDescriptor(Storage, "walletDirectory");
        directory = mkdtempSync(join(tmpdir(), "znn-storage-test-"));
        Storage.setWalletPath(directory);
    });

    afterEach(() => {
        if (previousDirectory) {
            Object.defineProperty(Storage, "walletDirectory", previousDirectory);
        } else {
            Reflect.deleteProperty(Storage, "walletDirectory");
        }
        rmSync(directory, { recursive: true, force: true });
    });

    it("saves a new wallet without changing its JSON representation", () => {
        const data = { marker: "synthetic-wallet", version: 1 };

        Storage.saveWallet("new-wallet", data);

        expect(readFileSync(join(directory, "new-wallet"), "utf8"))
            .to.equal(JSON.stringify(data, null, 2));
        expect(Storage.loadWallet("new-wallet")).to.deep.equal(data);
    });

    it("rejects a duplicate name and preserves the original bytes", () => {
        const target = join(directory, "existing-wallet");
        const original = Buffer.from("opaque original wallet bytes\n");
        writeFileSync(target, original);

        expect(() => Storage.saveWallet("existing-wallet", { marker: "replacement" }))
            .to.throw("Wallet already exists: existing-wallet");
        expect(readFileSync(target).equals(original)).to.equal(true);
    });

    it("rejects a name already present with a .json extension", () => {
        const target = join(directory, "existing-wallet.json");
        const original = Buffer.from("opaque original JSON wallet bytes\n");
        writeFileSync(target, original);

        expect(() => Storage.saveWallet("existing-wallet", { marker: "replacement" }))
            .to.throw("Wallet already exists: existing-wallet");
        expect(readFileSync(target).equals(original)).to.equal(true);
        expect(existsSync(join(directory, "existing-wallet"))).to.equal(false);
    });

    it("preserves a wallet created after the initial existence check", () => {
        const target = join(directory, "racing-wallet");
        const original = Buffer.from("opaque concurrently created wallet bytes\n");
        const data = {
            toJSON() {
                writeFileSync(target, original);
                return { marker: "replacement" };
            }
        };

        expect(() => Storage.saveWallet("racing-wallet", data))
            .to.throw("Wallet already exists: racing-wallet");
        expect(readFileSync(target).equals(original)).to.equal(true);
    });

    it("does not create a file when JSON serialization fails", () => {
        const data = {
            toJSON() {
                throw new Error("Synthetic serialization failure");
            }
        };

        expect(() => Storage.saveWallet("invalid-wallet", data))
            .to.throw("Synthetic serialization failure");
        expect(existsSync(join(directory, "invalid-wallet"))).to.equal(false);
    });
});
