import { expect, test, type Page } from "@playwright/test";
import { KeyFile, KeyStore, type KeyFileEncryptedData } from "../../dist/index.js";
import { cspViolations, openPage } from "./helpers.js";

const MNEMONIC = "abstract affair idle position alien fluid board ordinary exist afraid chapter wood wood guide sun walnut crew perfect place firm poverty model side million";
const BASE_ADDRESS = "z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq";
const PASSWORD = "correct horse battery staple";

/** Encrypted in Node with native argon2 and the default KDF config, as the CLI does. */
let nodeKeyFile: KeyFileEncryptedData;

test.beforeAll(async () => {
    nodeKeyFile = await KeyFile.setPassword(PASSWORD).encrypt(KeyStore.fromMnemonic(MNEMONIC));
});

function decryptOnMainThread(page: Page, keyFile: KeyFileEncryptedData): Promise<string> {
    return page.evaluate(async ({ keyFile, password }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { KeyFile } = (window as any).sdk;
        const keyStore = await KeyFile.setPassword(password).decrypt(keyFile);
        return keyStore.getBaseAddress().toString();
    }, { keyFile, password: PASSWORD });
}

function decryptInWorker(page: Page, keyFile: KeyFileEncryptedData): Promise<string> {
    return page.evaluate(({ keyFile, password }) => new Promise<string>((resolve, reject) => {
        const worker = new Worker("/keyfile-worker.js", { type: "module" });
        worker.onmessage = ({ data }) => {
            worker.terminate();
            if (data.error) {
                reject(new Error(data.error));
            } else {
                resolve(data.baseAddress);
            }
        };
        worker.onerror = (event) => {
            worker.terminate();
            reject(new Error(event.message || "worker failed to load"));
        };
        worker.postMessage({ keyFile, password });
    }), { keyFile, password: PASSWORD });
}

for (const csp of [false, true]) {
    const pagePath = csp ? "/index.html?csp=strict" : "/index.html";

    test.describe(csp ? "KeyFile in the browser with a strict CSP" : "KeyFile in the browser", () => {
        test("decrypts a key file encrypted in Node", async ({ page }) => {
            await openPage(page, pagePath);

            const baseAddress = await decryptOnMainThread(page, nodeKeyFile);

            expect(baseAddress).toBe(BASE_ADDRESS);
            expect(await cspViolations(page)).toEqual([]);
        });
    });
}

test.describe("KeyFile in the browser", () => {
    test("encrypts a key file that Node decrypts", async ({ page }) => {
        await openPage(page, "/index.html");

        const browserKeyFile: KeyFileEncryptedData = await page.evaluate(async ({ mnemonic, password }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { KeyFile, KeyStore } = (window as any).sdk;
            return KeyFile.setPassword(password).encrypt(KeyStore.fromMnemonic(mnemonic));
        }, { mnemonic: MNEMONIC, password: PASSWORD });

        const keyStore = await KeyFile.setPassword(PASSWORD).decrypt(browserKeyFile);

        expect(keyStore.getBaseAddress().toString()).toBe(BASE_ADDRESS);
    });

    test("rejects the wrong password", async ({ page }) => {
        await openPage(page, "/index.html");

        const result = page.evaluate(async (keyFile) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { KeyFile } = (window as any).sdk;
            await KeyFile.setPassword("wrong password").decrypt(keyFile);
        }, nodeKeyFile);

        await expect(result).rejects.toThrow();
    });

    test("decrypts a key file encrypted in Node inside a Web Worker", async ({ page }) => {
        await openPage(page, "/index.html");

        const baseAddress = await decryptInWorker(page, nodeKeyFile);

        expect(baseAddress).toBe(BASE_ADDRESS);
    });
});
