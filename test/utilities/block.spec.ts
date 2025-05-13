import { expect } from "chai";
import { isSendBlock, isReceiveBlock, getTxHash, send } from "../../src/utilities/block.js";
import { BlockTypeEnum, AccountBlockTemplate } from "../../src/model/nom/accountBlock.js";
import {
    Address,
    Hash, EMPTY_HASH,
    HashHeight,
    ZNN_ZTS
} from "../../src/model/primitives/index.js";
import { BigNumber } from "../../src/utilities/bignumber.js";
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
                amount: BigNumber.from(100000000),
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
                amount: BigNumber.from(100000000),
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
                amount: BigNumber.from(100000000),
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
                amount: BigNumber.from(100000000),
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
                amount: BigNumber.from(100000000),
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
                amount: BigNumber.from(100000000),
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
                amount: BigNumber.from(200000000), // Different amount
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
                amount: BigNumber.from(100),
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
                amount: BigNumber.from(1),
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
});
