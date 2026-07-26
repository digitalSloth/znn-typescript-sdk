import { expect } from "chai";
import * as ed from "@noble/ed25519";
import {
    isSendBlock, isReceiveBlock, getTxHash, send, prepareBlock,
    freezeBlock, signBlock, assembleMultisigAuth
} from "../../src/utilities/block.js";
import { Zenon } from "../../src/zenon.js";
import { BlockTypeEnum, AccountBlockTemplate } from "../../src/model/nom/accountBlock.js";
import {
    Address,
    Hash, EMPTY_HASH,
    HashHeight,
    ZNN_ZTS,
    MULTISIG_ADDRESS
} from "../../src/model/primitives/index.js";
import { KeyPair } from "../../src/wallet/keyPair.js";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const ADDRESS_A = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const ADDRESS_B = "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp";

const makeZenon = (overrides: any = {}) => ({
    ledger: {
        getFrontierAccountBlock: async () => null,
        getFrontierMomentum: async () => ({ hash: Hash.parse(HASH_B), height: 10 }),
        getAccountBlockByHash: async () => null,
        publishRawTransaction: async (tx: AccountBlockTemplate) => tx,
        ...(overrides.ledger ?? {})
    },
    embedded: {
        plasma: {
            getRequiredPoWForAccountBlock: async () => ({
                requiredDifficulty: 0,
                basePlasma: 7,
                availablePlasma: 3
            }),
            ...(overrides.embedded?.plasma ?? {})
        },
        ...(overrides.embedded ?? {})
    }
});

describe("Block Utilities", () => {
    describe("isSendBlock", () => {
        it("should return true for UserSend block type", () => {
            expect(isSendBlock(BlockTypeEnum.UserSend)).to.be.true;
        });

        it("should return true for ContractSend block type", () => {
            expect(isSendBlock(BlockTypeEnum.ContractSend)).to.be.true;
        });

        it("should return false for UserReceive block type", () => {
            expect(isSendBlock(BlockTypeEnum.UserReceive)).to.be.false;
        });

        it("should return false for GenesisReceive block type", () => {
            expect(isSendBlock(BlockTypeEnum.GenesisReceive)).to.be.false;
        });

        it("should return false for ContractReceive block type", () => {
            expect(isSendBlock(BlockTypeEnum.ContractReceive)).to.be.false;
        });

        it("should handle undefined block type", () => {
            expect(isSendBlock(undefined)).to.be.false;
        });
    });

    describe("isReceiveBlock", () => {
        it("should return true for UserReceive block type", () => {
            expect(isReceiveBlock(BlockTypeEnum.UserReceive)).to.be.true;
        });

        it("should return true for GenesisReceive block type", () => {
            expect(isReceiveBlock(BlockTypeEnum.GenesisReceive)).to.be.true;
        });

        it("should return true for ContractReceive block type", () => {
            expect(isReceiveBlock(BlockTypeEnum.ContractReceive)).to.be.true;
        });

        it("should return false for UserSend block type", () => {
            expect(isReceiveBlock(BlockTypeEnum.UserSend)).to.be.false;
        });

        it("should return false for ContractSend block type", () => {
            expect(isReceiveBlock(BlockTypeEnum.ContractSend)).to.be.false;
        });
    });

    describe("getTxHash", () => {
        it("should generate a valid hash for a transaction", () => {
            const address = Address.parse("z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7");
            const toAddress = Address.parse("z1qzal6c5s9rjnnxd2z7dvdhjxpmmj4fmw56a0mz");

            const transaction = new AccountBlockTemplate({
                version: 1,
                chainIdentifier: 1,
                blockType: BlockTypeEnum.UserSend,
                previousHash: EMPTY_HASH,
                height: 1,
                momentumAcknowledged: new HashHeight(EMPTY_HASH, 0),
                address: address,
                toAddress: toAddress,
                amount: BigInt(100000000),
                tokenStandard: ZNN_ZTS,
                fromBlockHash: EMPTY_HASH,
                data: Buffer.from([]),
                fusedPlasma: 0,
                difficulty: 0,
                nonce: "0000000000000000"
            });

            const hash = getTxHash(transaction);

            expect(hash).to.be.instanceOf(Hash);
            expect(hash.toString()).to.have.length(64);
        });

        it("should generate different hashes for different transactions", () => {
            const address = Address.parse("z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7");
            const toAddress1 = Address.parse("z1qzal6c5s9rjnnxd2z7dvdhjxpmmj4fmw56a0mz");
            const toAddress2 = Address.parse("z1qrvt3t4wvk5nr4n5r8jreecqgkax888yrhx5kd");

            const transaction1 = new AccountBlockTemplate({
                version: 1,
                chainIdentifier: 1,
                blockType: BlockTypeEnum.UserSend,
                previousHash: EMPTY_HASH,
                height: 1,
                momentumAcknowledged: new HashHeight(EMPTY_HASH, 0),
                address: address,
                toAddress: toAddress1,
                amount: BigInt(100000000),
                tokenStandard: ZNN_ZTS,
                fromBlockHash: EMPTY_HASH,
                data: Buffer.from([]),
                fusedPlasma: 0,
                difficulty: 0,
                nonce: "0000000000000000"
            });

            const transaction2 = new AccountBlockTemplate({
                version: 1,
                chainIdentifier: 1,
                blockType: BlockTypeEnum.UserSend,
                previousHash: EMPTY_HASH,
                height: 1,
                momentumAcknowledged: new HashHeight(EMPTY_HASH, 0),
                address: address,
                toAddress: toAddress2, // Different recipient
                amount: BigInt(100000000),
                tokenStandard: ZNN_ZTS,
                fromBlockHash: EMPTY_HASH,
                data: Buffer.from([]),
                fusedPlasma: 0,
                difficulty: 0,
                nonce: "0000000000000000"
            });

            const hash1 = getTxHash(transaction1);
            const hash2 = getTxHash(transaction2);

            expect(hash1.toString()).to.not.equal(hash2.toString());
        });

        it("should generate same hash for identical transactions", () => {
            const address = Address.parse("z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7");
            const toAddress = Address.parse("z1qzal6c5s9rjnnxd2z7dvdhjxpmmj4fmw56a0mz");

            const createTransaction = () => new AccountBlockTemplate({
                version: 1,
                chainIdentifier: 1,
                blockType: BlockTypeEnum.UserSend,
                previousHash: EMPTY_HASH,
                height: 1,
                momentumAcknowledged: new HashHeight(EMPTY_HASH, 0),
                address: address,
                toAddress: toAddress,
                amount: BigInt(100000000),
                tokenStandard: ZNN_ZTS,
                fromBlockHash: EMPTY_HASH,
                data: Buffer.from([]),
                fusedPlasma: 0,
                difficulty: 0,
                nonce: "0000000000000000"
            });

            const hash1 = getTxHash(createTransaction());
            const hash2 = getTxHash(createTransaction());

            expect(hash1.toString()).to.equal(hash2.toString());
        });

        it("should handle transactions with data", () => {
            const address = Address.parse("z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7");
            const toAddress = Address.parse("z1qzal6c5s9rjnnxd2z7dvdhjxpmmj4fmw56a0mz");
            const data = Buffer.from("Hello Zenon", "utf-8");

            const transaction = new AccountBlockTemplate({
                version: 1,
                chainIdentifier: 1,
                blockType: BlockTypeEnum.UserSend,
                previousHash: EMPTY_HASH,
                height: 1,
                momentumAcknowledged: new HashHeight(EMPTY_HASH, 0),
                address: address,
                toAddress: toAddress,
                amount: BigInt(100000000),
                tokenStandard: ZNN_ZTS,
                fromBlockHash: EMPTY_HASH,
                data: data,
                fusedPlasma: 0,
                difficulty: 0,
                nonce: "0000000000000000"
            });

            const hash = getTxHash(transaction);

            expect(hash).to.be.instanceOf(Hash);
            expect(hash.toString()).to.have.length(64);
        });

        it("should handle different amounts", () => {
            const address = Address.parse("z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7");
            const toAddress = Address.parse("z1qzal6c5s9rjnnxd2z7dvdhjxpmmj4fmw56a0mz");

            const transaction1 = new AccountBlockTemplate({
                version: 1,
                chainIdentifier: 1,
                blockType: BlockTypeEnum.UserSend,
                previousHash: EMPTY_HASH,
                height: 1,
                momentumAcknowledged: new HashHeight(EMPTY_HASH, 0),
                address: address,
                toAddress: toAddress,
                amount: BigInt(100000000),
                tokenStandard: ZNN_ZTS,
                fromBlockHash: EMPTY_HASH,
                data: Buffer.from([]),
                fusedPlasma: 0,
                difficulty: 0,
                nonce: "0000000000000000"
            });

            const transaction2 = new AccountBlockTemplate({
                version: 1,
                chainIdentifier: 1,
                blockType: BlockTypeEnum.UserSend,
                previousHash: EMPTY_HASH,
                height: 1,
                momentumAcknowledged: new HashHeight(EMPTY_HASH, 0),
                address: address,
                toAddress: toAddress,
                amount: BigInt(200000000), // Different amount
                tokenStandard: ZNN_ZTS,
                fromBlockHash: EMPTY_HASH,
                data: Buffer.from([]),
                fusedPlasma: 0,
                difficulty: 0,
                nonce: "0000000000000000"
            });

            const hash1 = getTxHash(transaction1);
            const hash2 = getTxHash(transaction2);

            expect(hash1.toString()).to.not.equal(hash2.toString());
        });
    });

    describe("getTxHash / multisigAuth invariance", () => {
        const address = Address.parse("z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7");
        const toAddress = Address.parse("z1qzal6c5s9rjnnxd2z7dvdhjxpmmj4fmw56a0mz");

        const createTransaction = () => new AccountBlockTemplate({
            version: 1,
            chainIdentifier: 1,
            blockType: BlockTypeEnum.UserSend,
            previousHash: EMPTY_HASH,
            height: 1,
            momentumAcknowledged: new HashHeight(EMPTY_HASH, 0),
            address: address,
            toAddress: toAddress,
            amount: BigInt(100000000),
            tokenStandard: ZNN_ZTS,
            fromBlockHash: EMPTY_HASH,
            data: Buffer.from([]),
            fusedPlasma: 0,
            difficulty: 0,
            nonce: "0000000000000000"
        });

        it("produces the same hash whether multisigAuth is unset, set, or mutated after hashing", () => {
            const tx = createTransaction();
            const hashUnset = getTxHash(tx);

            tx.multisigAuth = { signatures: [Buffer.from("sig1"), Buffer.from("sig2")] };
            const hashSet = getTxHash(tx);

            tx.multisigAuth.signatures.push(Buffer.from("sig3"));
            const hashMutated = getTxHash(tx);

            expect(hashSet.toString()).to.equal(hashUnset.toString());
            expect(hashMutated.toString()).to.equal(hashUnset.toString());
        });

        it("produces the same hash after a toJson/fromJson round-trip with multisigAuth present", () => {
            const tx = createTransaction();
            tx.multisigAuth = { signatures: [Buffer.from("sig1")] };

            const roundTripped = AccountBlockTemplate.fromJson(tx.toJson());

            expect(getTxHash(roundTripped).toString()).to.equal(getTxHash(tx).toString());
        });

        it("omits multisigAuth entirely from toJson when unset", () => {
            const tx = createTransaction();
            const json = tx.toJson();

            expect(json).to.not.have.property("multisigAuth");
        });
    });

    describe("send", () => {
        it("should fill fields, set PoW defaults, and publish a send block", async () => {
            const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 1));
            const frontierHash = Hash.parse(HASH_A);
            const publishCalls: AccountBlockTemplate[] = [];

            const zenon = makeZenon({
                ledger: {
                    getFrontierAccountBlock: async () => ({ height: 5, hash: frontierHash }),
                    publishRawTransaction: async (tx: AccountBlockTemplate) => {
                        publishCalls.push(tx);
                        return tx;
                    }
                }
            });

            const transaction = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserSend,
                toAddress: Address.parse(ADDRESS_B),
                amount: BigInt(100),
                tokenStandard: ZNN_ZTS,
                data: Buffer.from([])
            });

            const result = await send(zenon as any, transaction, keyPair);

            expect(publishCalls).to.have.length(1);
            expect(result.height).to.equal(6);
            expect(result.previousHash.toString()).to.equal(HASH_A);
            expect(result.momentumAcknowledged.height).to.equal(10);
            expect(result.fusedPlasma).to.equal(7);
            expect(result.difficulty).to.equal(0);
            expect(result.nonce).to.equal("0000000000000000");
            expect(result.address.toString()).to.equal(keyPair.getAddress().toString());
            expect(result.publicKey.length).to.be.greaterThan(0);
            expect(result.signature.length).to.be.greaterThan(0);
        });

        it("should reject receive blocks with empty fromBlockHash", async () => {
            const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 2));
            const zenon = makeZenon();

            const transaction = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserReceive,
                fromBlockHash: EMPTY_HASH,
                data: Buffer.from([])
            });

            let error: Error | null = null;
            try {
                await send(zenon as any, transaction, keyPair);
            } catch (err) {
                error = err as Error;
            }

            expect(error).to.exist;
            expect(error!.message).to.equal("fromBlockHash cannot be empty for receive blocks");
        });

        it("should reject receive blocks when the send block is missing", async () => {
            const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 3));
            const zenon = makeZenon({
                ledger: {
                    getAccountBlockByHash: async () => null
                }
            });

            const transaction = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserReceive,
                fromBlockHash: Hash.parse(HASH_A),
                data: Buffer.from([])
            });

            let error: Error | null = null;
            try {
                await send(zenon as any, transaction, keyPair);
            } catch (err) {
                error = err as Error;
            }

            expect(error).to.exist;
            expect(error!.message).to.include("Send block not found");
        });

        it("should reject receive blocks with mismatched toAddress", async () => {
            const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 4));
            const zenon = makeZenon({
                ledger: {
                    getAccountBlockByHash: async () => ({
                        toAddress: Address.parse(ADDRESS_B)
                    })
                }
            });

            const transaction = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserReceive,
                fromBlockHash: Hash.parse(HASH_A),
                data: Buffer.from([])
            });

            let error: Error | null = null;
            try {
                await send(zenon as any, transaction, keyPair);
            } catch (err) {
                error = err as Error;
            }

            expect(error).to.exist;
            expect(error!.message).to.include("does not match transaction address");
        });

        it("should reject receive blocks with data payloads", async () => {
            const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 5));
            const zenon = makeZenon({
                ledger: {
                    getAccountBlockByHash: async () => ({
                        toAddress: keyPair.getAddress()
                    })
                }
            });

            const transaction = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserReceive,
                fromBlockHash: Hash.parse(HASH_A),
                data: Buffer.from("data")
            });

            let error: Error | null = null;
            try {
                await send(zenon as any, transaction, keyPair);
            } catch (err) {
                error = err as Error;
            }

            expect(error).to.exist;
            expect(error!.message).to.equal("Receive blocks cannot have data");
        });

        it("should require a nonce when difficulty is set", async () => {
            const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 6));
            const zenon = makeZenon();

            const transaction = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserSend,
                toAddress: Address.parse(ADDRESS_A),
                amount: BigInt(1),
                tokenStandard: ZNN_ZTS,
                data: Buffer.from([]),
                difficulty: 1,
                nonce: ""
            });

            let error: Error | null = null;
            try {
                await send(zenon as any, transaction, keyPair);
            } catch (err) {
                error = err as Error;
            }

            expect(error).to.exist;
            expect(error!.message).to.equal("Nonce is required when difficulty is set");
        });
    });

    describe("PoW provider hook", () => {
        afterEach(() => {
            Zenon.clearPowProvider();
        });

        it("should use a registered provider when PoW is required", async () => {
            const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 7));
            const calls: Array<{ hashHex: string; difficulty: number }> = [];

            Zenon.setPowProvider(async (hashHex, difficulty) => {
                calls.push({ hashHex, difficulty });
                return "feedfacefeedface";
            });

            const zenon = makeZenon({
                ledger: {
                    getFrontierAccountBlock: async () => ({ height: 5, hash: Hash.parse(HASH_A) })
                },
                embedded: {
                    plasma: {
                        getRequiredPoWForAccountBlock: async () => ({
                            requiredDifficulty: 12345,
                            basePlasma: 7,
                            availablePlasma: 3
                        })
                    }
                }
            });

            const transaction = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserSend,
                toAddress: Address.parse(ADDRESS_B),
                amount: BigInt(100),
                tokenStandard: ZNN_ZTS,
                data: Buffer.from([])
            });

            const result = await send(zenon as any, transaction, keyPair);

            expect(calls).to.have.length(1);
            expect(calls[0].hashHex).to.have.length(64);
            expect(calls[0].difficulty).to.equal(12345);
            expect(result.difficulty).to.equal(12345);
            expect(result.fusedPlasma).to.equal(3);
            expect(result.nonce).to.equal("feedfacefeedface");
            expect(result.signature.length).to.be.greaterThan(0);
        });

        it("should not invoke the provider when no PoW is required", async () => {
            const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 8));
            let invoked = false;

            Zenon.setPowProvider(async () => {
                invoked = true;
                return "0000000000000000";
            });

            const zenon = makeZenon({
                ledger: {
                    getFrontierAccountBlock: async () => ({ height: 5, hash: Hash.parse(HASH_A) })
                }
            });

            const transaction = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserSend,
                toAddress: Address.parse(ADDRESS_B),
                amount: BigInt(100),
                tokenStandard: ZNN_ZTS,
                data: Buffer.from([])
            });

            const result = await send(zenon as any, transaction, keyPair);

            expect(invoked).to.be.false;
            expect(result.difficulty).to.equal(0);
            expect(result.nonce).to.equal("0000000000000000");
        });

        it("should restore built-in behaviour after clearPowProvider", () => {
            const provider = async () => "0000000000000000";
            Zenon.setPowProvider(provider);
            expect(Zenon.getPowProvider()).to.equal(provider);

            Zenon.clearPowProvider();
            expect(Zenon.getPowProvider()).to.be.undefined;
        });
    });

    describe("wire-format / serialization (bigint amount)", () => {
        it("AccountBlockTemplate.toJson() serializes bigint amount to decimal string", () => {
            const tx = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserSend,
                toAddress: Address.parse(ADDRESS_B),
                amount: BigInt("5000000000"),
                tokenStandard: ZNN_ZTS,
                data: Buffer.from([])
            });
            const json = tx.toJson();
            expect(json.amount).to.equal("5000000000");
            expect(typeof json.amount).to.equal("string");
        });

        it("AccountBlockTemplate.toString() does not throw with bigint amount", () => {
            const tx = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserSend,
                toAddress: Address.parse(ADDRESS_B),
                amount: 15000n * 100000000n,
                tokenStandard: ZNN_ZTS,
                data: Buffer.from([])
            });
            expect(() => tx.toString()).to.not.throw();
            const str = tx.toString();
            expect(str).to.include('"amount":"1500000000000"');
        });

        it("getTxHash produces identical hash before and after bigint amount round-trip", () => {
            const address = Address.parse("z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7");
            const toAddress = Address.parse("z1qzal6c5s9rjnnxd2z7dvdhjxpmmj4fmw56a0mz");
            const amount = BigInt("100000000");

            const tx1 = new AccountBlockTemplate({
                version: 1,
                chainIdentifier: 1,
                blockType: BlockTypeEnum.UserSend,
                previousHash: EMPTY_HASH,
                height: 1,
                momentumAcknowledged: new HashHeight(EMPTY_HASH, 0),
                address,
                toAddress,
                amount,
                tokenStandard: ZNN_ZTS,
                fromBlockHash: EMPTY_HASH,
                data: Buffer.from([]),
                fusedPlasma: 0,
                difficulty: 0,
                nonce: "0000000000000000"
            });

            // Round-trip through JSON — simulates what a node would do on receive
            const json = tx1.toJson();
            const tx2 = AccountBlockTemplate.fromJson(json);

            expect(getTxHash(tx2).toString()).to.equal(getTxHash(tx1).toString());
        });
    });

    describe("prepareBlock", () => {
        it("should prepare a block without publishing it", async () => {
            const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 9));
            let published = false;

            const zenon = makeZenon({
                ledger: {
                    getFrontierAccountBlock: async () => ({ height: 5, hash: Hash.parse(HASH_A) }),
                    publishRawTransaction: async (tx: AccountBlockTemplate) => {
                        published = true;
                        return tx;
                    }
                }
            });

            const transaction = new AccountBlockTemplate({
                blockType: BlockTypeEnum.UserSend,
                toAddress: Address.parse(ADDRESS_B),
                amount: BigInt(100),
                tokenStandard: ZNN_ZTS,
                data: Buffer.from([])
            });

            const result = await prepareBlock(zenon as any, transaction, keyPair);

            expect(published).to.be.false;
            expect(result.height).to.equal(6);
            expect(result.previousHash.toString()).to.equal(HASH_A);
            expect(result.hash.toString()).to.have.length(64);
            expect(result.signature.length).to.be.greaterThan(0);
            expect(result.address.toString()).to.equal(keyPair.getAddress().toString());
        });
    });

    describe("multisig signing pipeline (freeze / sign / assemble)", () => {
        describe("freezeBlock (send block)", () => {
            it("freezes a send-style block: sets address, leaves publicKey/signature empty, sets a non-empty hash", async () => {
                const zenon = makeZenon({
                    ledger: {
                        getFrontierAccountBlock: async () => ({ height: 5, hash: Hash.parse(HASH_A) })
                    }
                });

                const transaction = new AccountBlockTemplate({
                    blockType: BlockTypeEnum.UserSend,
                    toAddress: Address.parse(ADDRESS_B),
                    amount: BigInt(100),
                    tokenStandard: ZNN_ZTS,
                    data: Buffer.from([])
                });

                const frozen = await freezeBlock(zenon as any, transaction, MULTISIG_ADDRESS);

                expect(frozen.address.toString()).to.equal(MULTISIG_ADDRESS.toString());
                expect(frozen.publicKey.length).to.equal(0);
                expect(frozen.signature.length).to.equal(0);
                expect(frozen.hash.getBytes().equals(EMPTY_HASH.getBytes())).to.be.false;
            });

            it("signBlock returns a 64-byte signature verifying against the signer pubkey over hash bytes", async () => {
                const zenon = makeZenon({
                    ledger: {
                        getFrontierAccountBlock: async () => ({ height: 5, hash: Hash.parse(HASH_A) })
                    }
                });

                const transaction = new AccountBlockTemplate({
                    blockType: BlockTypeEnum.UserSend,
                    toAddress: Address.parse(ADDRESS_B),
                    amount: BigInt(100),
                    tokenStandard: ZNN_ZTS,
                    data: Buffer.from([])
                });

                const frozen = await freezeBlock(zenon as any, transaction, MULTISIG_ADDRESS);
                const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 11));
                const signature = signBlock(frozen, keyPair);

                expect(signature).to.have.length(64);
                const valid = await ed.verify(signature, frozen.hash.getBytes(), keyPair.getPublicKey());
                expect(valid).to.be.true;
            });

            it("signBlock throws when the block has not been frozen", () => {
                const transaction = new AccountBlockTemplate({
                    blockType: BlockTypeEnum.UserSend,
                    toAddress: Address.parse(ADDRESS_B),
                    amount: BigInt(100),
                    tokenStandard: ZNN_ZTS,
                    data: Buffer.from([])
                });
                const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 12));

                expect(() => signBlock(transaction, keyPair)).to.throw("Block must be frozen before signing");
            });

            it("assembleMultisigAuth populates multisigAuth.signatures order-independently", async () => {
                const zenon = makeZenon({
                    ledger: {
                        getFrontierAccountBlock: async () => ({ height: 5, hash: Hash.parse(HASH_A) })
                    }
                });

                const transaction = new AccountBlockTemplate({
                    blockType: BlockTypeEnum.UserSend,
                    toAddress: Address.parse(ADDRESS_B),
                    amount: BigInt(100),
                    tokenStandard: ZNN_ZTS,
                    data: Buffer.from([])
                });

                const frozen = await freezeBlock(zenon as any, transaction, MULTISIG_ADDRESS);
                const kp1 = KeyPair.fromPrivateKey(Buffer.alloc(32, 13));
                const kp2 = KeyPair.fromPrivateKey(Buffer.alloc(32, 14));
                const sig1 = signBlock(frozen, kp1);
                const sig2 = signBlock(frozen, kp2);

                assembleMultisigAuth(frozen, [sig2, sig1]);

                expect(frozen.multisigAuth).to.exist;
                expect(frozen.multisigAuth!.signatures).to.have.length(2);
                expect(frozen.multisigAuth!.signatures[0].equals(sig2)).to.be.true;
                expect(frozen.multisigAuth!.signatures[1].equals(sig1)).to.be.true;
            });
        });

        describe("freezeBlock (receive block)", () => {
            it("succeeds for a receive block whose send toAddress matches the multisig account", async () => {
                const sendHash = Hash.parse(HASH_A);
                const zenon = makeZenon({
                    ledger: {
                        getFrontierAccountBlock: async () => ({ height: 5, hash: Hash.parse(HASH_B) }),
                        getAccountBlockByHash: async () => ({
                            toAddress: MULTISIG_ADDRESS
                        })
                    }
                });

                const transaction = AccountBlockTemplate.receive(sendHash);
                const frozen = await freezeBlock(zenon as any, transaction, MULTISIG_ADDRESS);

                expect(frozen.hash.getBytes().equals(EMPTY_HASH.getBytes())).to.be.false;
                expect(frozen.publicKey.length).to.equal(0);
                expect(frozen.signature.length).to.equal(0);
            });

            it("throws ZnnBlockUtilitiesException before hashing when the send toAddress does not match", async () => {
                const sendHash = Hash.parse(HASH_A);
                const zenon = makeZenon({
                    ledger: {
                        getFrontierAccountBlock: async () => ({ height: 5, hash: Hash.parse(HASH_B) }),
                        getAccountBlockByHash: async () => ({
                            toAddress: Address.parse(ADDRESS_A)
                        })
                    }
                });

                const transaction = AccountBlockTemplate.receive(sendHash);

                let error: Error | null = null;
                try {
                    await freezeBlock(zenon as any, transaction, MULTISIG_ADDRESS);
                } catch (err) {
                    error = err as Error;
                }

                expect(error).to.exist;
                expect(error!.message).to.include("does not match transaction address");
                expect(transaction.hash.getBytes().equals(EMPTY_HASH.getBytes())).to.be.true;
            });
        });

        describe("send cross-machine hand-off", () => {
            it("hash and signature are stable across a toJson/fromJson round-trip", async () => {
                const zenon = makeZenon({
                    ledger: {
                        getFrontierAccountBlock: async () => ({ height: 5, hash: Hash.parse(HASH_A) })
                    }
                });

                const transaction = new AccountBlockTemplate({
                    blockType: BlockTypeEnum.UserSend,
                    toAddress: Address.parse(ADDRESS_B),
                    amount: BigInt(100),
                    tokenStandard: ZNN_ZTS,
                    data: Buffer.from([])
                });

                const frozen = await freezeBlock(zenon as any, transaction, MULTISIG_ADDRESS);
                const reparsed = AccountBlockTemplate.fromJson(frozen.toJson());

                expect(reparsed.hash.toString()).to.equal(frozen.hash.toString());

                const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 15));
                expect(signBlock(reparsed, keyPair).equals(signBlock(frozen, keyPair))).to.be.true;

                const sig = signBlock(frozen, keyPair);
                assembleMultisigAuth(frozen, [sig]);

                const withAuth = AccountBlockTemplate.fromJson(frozen.toJson());
                expect(withAuth.multisigAuth).to.exist;
                expect(withAuth.multisigAuth!.signatures).to.have.length(1);
                expect(withAuth.multisigAuth!.signatures[0].equals(sig)).to.be.true;

                // A block without multisigAuth omits the key entirely.
                const withoutAuth = new AccountBlockTemplate({
                    blockType: BlockTypeEnum.UserSend,
                    toAddress: Address.parse(ADDRESS_B),
                    amount: BigInt(100),
                    tokenStandard: ZNN_ZTS,
                    data: Buffer.from([])
                });
                expect(withoutAuth.toJson()).to.not.have.property("multisigAuth");
            });
        });

        describe("receive cross-machine hand-off", () => {
            it("hash and signature are stable across a toJson/fromJson round-trip for a receive block", async () => {
                const sendHash = Hash.parse(HASH_A);
                const zenon = makeZenon({
                    ledger: {
                        getFrontierAccountBlock: async () => ({ height: 5, hash: Hash.parse(HASH_B) }),
                        getAccountBlockByHash: async () => ({
                            toAddress: MULTISIG_ADDRESS
                        })
                    }
                });

                const transaction = AccountBlockTemplate.receive(sendHash);
                const frozen = await freezeBlock(zenon as any, transaction, MULTISIG_ADDRESS);
                const reparsed = AccountBlockTemplate.fromJson(frozen.toJson());

                expect(reparsed.hash.toString()).to.equal(frozen.hash.toString());

                const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 16));
                expect(signBlock(reparsed, keyPair).equals(signBlock(frozen, keyPair))).to.be.true;

                const sig = signBlock(frozen, keyPair);
                assembleMultisigAuth(frozen, [sig]);

                const withAuth = AccountBlockTemplate.fromJson(frozen.toJson());
                expect(withAuth.multisigAuth!.signatures[0].equals(sig)).to.be.true;
            });
        });
    });
});
