import { expect } from "chai";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import type { Transactions as TransactionsType } from "../../cli/transactions/transactions.js";
import { AccountBlockTemplate } from "../../src/model/nom/accountBlock.js";
import { Address, TokenStandard, Hash, EMPTY_ADDRESS, ZNN_ZTS, QSR_ZTS } from "../../src/model/primitives/index.js";
import { extractNumberDecimals } from "../../src/utilities/amounts.js";

describe("CLI transaction amounts", () => {
    // Exercise the actual CLI source without its webpack-style imports reaching
    // real wallet or connection implementations under the existing Mocha loader.
    const source = readFileSync(new URL("../../cli/transactions/transactions.ts", import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    let Transactions: typeof TransactionsType;
    let submitted: AccountBlockTemplate | undefined;
    let calls: {
        walletExists: number;
        initialize: number;
        loadWallet: number;
        createKeyStore: number;
        getKeyPair: number;
        send: number;
        clearConnection: number;
    };

    beforeEach(() => {
        submitted = undefined;
        calls = {
            walletExists: 0,
            initialize: 0,
            loadWallet: 0,
            createKeyStore: 0,
            getKeyPair: 0,
            send: 0,
            clearConnection: 0
        };
        // Inert objects only: no wallet, mnemonic, key derivation, or node calls.
        const keyPair = {};
        const zenon = {
            initialize: async () => { calls.initialize++; },
            send: async (block: AccountBlockTemplate, signer: unknown) => {
                expect(signer).to.equal(keyPair);
                calls.send++;
                submitted = block;
                return block;
            },
            clearConnection: () => { calls.clearConnection++; }
        };
        const imports: Record<string, unknown> = {
            "../../src/zenon": { Zenon: { getInstance: () => zenon } },
            "../../src/model/primitives": { Address, TokenStandard, Hash, ZNN_ZTS, QSR_ZTS },
            "../../src/model/nom/accountBlock": { AccountBlockTemplate },
            "../../src/utilities/amounts": { extractNumberDecimals },
            "../wallet/manager": {
                Manager: {
                    walletExists: () => {
                        calls.walletExists++;
                        return true;
                    },
                    dumpMnemonic: async () => {
                        calls.loadWallet++;
                        return "";
                    }
                }
            },
            "../../src/wallet": {
                KeyStore: {
                    fromMnemonic: () => {
                        calls.createKeyStore++;
                        return {
                            getKeyPair: () => {
                                calls.getKeyPair++;
                                return keyPair;
                            }
                        };
                    }
                }
            },
            "../../src/utilities/logger": { Logger: { globalLogger: () => ({ info: () => {} }) } }
        };
        const exported: { Transactions?: typeof TransactionsType } = {};
        runInNewContext(compiled, {
            exports: exported,
            Error,
            require: (specifier: string) => {
                if (!Object.prototype.hasOwnProperty.call(imports, specifier)) {
                    throw new Error(`Unexpected CLI import: ${specifier}`);
                }
                return imports[specifier];
            }
        }, { filename: "cli/transactions/transactions.ts" });
        Transactions = exported.Transactions!;
    });

    // Each test gets a fresh context and stub map; no live module is patched.
    const send = (amount: string, decimals: number = 8) => Transactions.send(
        EMPTY_ADDRESS.toString(), amount, "znn", decimals, "stub-wallet", "", "", 0
    );

    for (const [amount, decimals, expected] of [
        ["9007199254740993", 0, 9007199254740993n],
        ["90071992.54740993", 8, 9007199254740993n],
        [" 1e-8 ", 8, 1n],
        ["0.000000001", 8, 0n]
    ] as const) {
        it(`preserves the exact base-unit amount for ${JSON.stringify(amount)}`, async () => {
            const result = await send(amount, decimals);

            expect(result).to.equal(submitted);
            expect(submitted!.amount).to.equal(expected);
            expect(calls).to.deep.equal({
                walletExists: 1,
                initialize: 1,
                loadWallet: 1,
                createKeyStore: 1,
                getKeyPair: 1,
                send: 1,
                clearConnection: 1
            });
        });
    }

    for (const amount of ["1junk", "1e2junk", "NaN", "Infinity", "0", "-1"]) {
        it(`rejects ${JSON.stringify(amount)} before wallet or node access`, async () => {
            let error: unknown;
            try {
                await send(amount);
            } catch (caught) {
                error = caught;
            }

            expect(error).to.be.instanceOf(Error);
            expect((error as Error).message).to.match(/^Transaction failed: /);
            expect(submitted).to.equal(undefined);
            expect(calls).to.deep.equal({
                walletExists: 0,
                initialize: 0,
                loadWallet: 0,
                createKeyStore: 0,
                getKeyPair: 0,
                send: 0,
                clearConnection: 1
            });
        });
    }
});
