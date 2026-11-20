import { createHash } from "node:crypto";
import { verifyAsync } from "@noble/ed25519";
import { expect, test, type Page } from "@playwright/test";
import { AccountBlockTemplate } from "../../dist/index.js";
import { getTxHash } from "../../dist/utilities/block.js";
import { cspViolations, DIFFICULTY, isValidNonce, openPage } from "./helpers.js";
import { BASE_PLASMA, MOMENTUM_HEADER } from "./mockNode.js";

const MNEMONIC = "abstract affair idle position alien fluid board ordinary exist afraid chapter wood wood guide sun walnut crew perfect place firm poverty model side million";
const BASE_ADDRESS = "z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq";
const TO_ADDRESS = "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp";

/** Resolves with the block the page publishes over the WebSocket. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function capturePublishedBlock(page: Page): Promise<Record<string, any>> {
    return new Promise((resolve) => {
        page.on("websocket", (socket) => {
            socket.on("framesent", ({ payload }) => {
                const message = JSON.parse(payload.toString());
                if (message.method === "ledger.publishRawTransaction") {
                    resolve(message.params[0]);
                }
            });
        });
    });
}

/** Connects to the mock node and sends 1 ZNN from the test mnemonic's base address. */
function sendFromPage(page: Page, difficulty: number, useWorker: boolean): Promise<void> {
    return page.evaluate(async ({ difficulty, useWorker, mnemonic, toAddress }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Zenon, KeyStore, AccountBlockTemplate, Address, ZNN_ZTS } = (window as any).sdk;
        Zenon.setPowBasePath("/assets/");
        if (useWorker) {
            Zenon.usePowWorker();
        }

        const zenon = Zenon.getInstance();
        await zenon.initialize(`ws://${location.host}/ws?difficulty=${difficulty}`, 10000);
        try {
            const keyPair = KeyStore.fromMnemonic(mnemonic).getKeyPair(0);
            const block = AccountBlockTemplate.send(Address.parse(toAddress), ZNN_ZTS, 100000000n);
            await zenon.send(block, keyPair);
        } finally {
            zenon.clearConnection();
            Zenon.stopPowWorker();
        }
    }, { difficulty, useWorker, mnemonic: MNEMONIC, toAddress: TO_ADDRESS });
}

/** Checks the published block in Node: PoW, hash and signature. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function expectValidBlock(json: Record<string, any>, difficulty: number): Promise<void> {
    const block = AccountBlockTemplate.fromJson(json);

    expect(block.address.toString()).toBe(BASE_ADDRESS);
    expect(block.momentumAcknowledged.hash.toString()).toBe(MOMENTUM_HEADER.hash);
    expect(block.difficulty).toBe(difficulty);

    if (difficulty > 0) {
        const powData = createHash("sha3-256")
            .update(Buffer.concat([block.address.getBytes(), block.previousHash.getBytes()]))
            .digest("hex");
        expect(isValidNonce(powData, block.nonce, difficulty)).toBe(true);
        expect(block.fusedPlasma).toBe(0);
    } else {
        expect(block.nonce).toBe("0000000000000000");
        expect(block.fusedPlasma).toBe(BASE_PLASMA);
    }

    expect(getTxHash(block).toString()).toBe(block.hash.toString());
    expect(await verifyAsync(block.signature, block.hash.getBytes(), block.publicKey)).toBe(true);
}

for (const csp of [false, true]) {
    const pagePath = csp ? "/index.html?csp=strict" : "/index.html";

    test.describe(csp ? "zenon.send() over WebSocket with a strict CSP" : "zenon.send() over WebSocket", () => {
        test("publishes a valid block with PoW on the main thread", async ({ page }) => {
            const published = capturePublishedBlock(page);
            await openPage(page, pagePath);

            await sendFromPage(page, DIFFICULTY, false);

            await expectValidBlock(await published, DIFFICULTY);
            expect(await cspViolations(page)).toEqual([]);
        });

        test("publishes a valid block with PoW in the web worker", async ({ page }) => {
            const published = capturePublishedBlock(page);
            await openPage(page, pagePath);

            await sendFromPage(page, DIFFICULTY, true);

            await expectValidBlock(await published, DIFFICULTY);
            expect(await cspViolations(page)).toEqual([]);
        });
    });
}

test.describe("zenon.send() over WebSocket without required PoW", () => {
    test("publishes a valid block using base plasma", async ({ page }) => {
        const published = capturePublishedBlock(page);
        await openPage(page, "/index.html");

        await sendFromPage(page, 0, false);

        await expectValidBlock(await published, 0);
    });
});

test.describe("WebSocket subscriptions", () => {
    test("delivers momentum notifications to the subscriber", async ({ page }) => {
        await openPage(page, "/index.html");

        const notification = await page.evaluate(async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { Zenon } = (window as any).sdk;
            const zenon = Zenon.getInstance();
            await zenon.initialize(`ws://${location.host}/ws`, 10000);
            try {
                const stream = await zenon.subscribe.toMomentums();
                return await new Promise((resolve) => stream.onNotification(resolve));
            } finally {
                zenon.clearConnection();
            }
        });

        expect(notification).toEqual([MOMENTUM_HEADER]);
    });
});
