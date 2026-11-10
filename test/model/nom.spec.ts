import { expect } from "chai";
import {
    AccountBlock,
    AccountBlockTemplate,
    AccountInfo,
    Momentum
} from "../../src/model/nom/index.js";

const ADDRESS = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const OTHER_ADDRESS = "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp";
const TOKEN_STANDARD = "zts1znnxxxxxxxxxxxxx9z4ulx";

const PUBLIC_KEY_B64 = "AQEB".repeat(10) + "AQE=";
const SIGNATURE_B64 = "AgIC".repeat(21) + "Ag==";

const makeMomentumJson = (overrides: Record<string, any> = {}) => ({
    version: 1,
    chainIdentifier: 1,
    hash: "2".repeat(64),
    previousHash: "3".repeat(64),
    height: 100,
    timestamp: 1700000000,
    data: "3q2+7w==",
    content: [{ address: ADDRESS, hash: "1".repeat(64), height: 1 }],
    changesHash: "a".repeat(64),
    publicKey: PUBLIC_KEY_B64,
    signature: SIGNATURE_B64,
    producer: OTHER_ADDRESS,
    ...overrides
});

const makeBlockJson = (overrides: Record<string, any> = {}) => ({
    version: 1,
    chainIdentifier: 1,
    blockType: 2,
    hash: "a".repeat(64),
    previousHash: "b".repeat(64),
    height: 10,
    momentumAcknowledged: { hash: "c".repeat(64), height: 9 },
    address: ADDRESS,
    toAddress: OTHER_ADDRESS,
    amount: "1000",
    tokenStandard: TOKEN_STANDARD,
    fromBlockHash: "d".repeat(64),
    data: "",
    fusedPlasma: 0,
    difficulty: 0,
    nonce: "nonce",
    publicKey: PUBLIC_KEY_B64,
    signature: SIGNATURE_B64,
    ...overrides
});

describe("Nom wire models", () => {

    describe("Momentum", () => {
        it("should decode data as base64 and round-trip the wire fixture", () => {
            const json = makeMomentumJson();
            const momentum = Momentum.fromJson(json);

            expect(momentum.data.toString("hex")).to.equal("deadbeef");
            expect(momentum.toJson()).to.deep.equal(json);
        });

        it("should write content as plain objects", () => {
            const json = makeMomentumJson({ content: [] });

            expect(Momentum.fromJson(json).toJson().content).to.deep.equal([]);
            expect(Momentum.fromJson(makeMomentumJson()).toJson().content).to.deep.equal(
                [{ address: ADDRESS, hash: "1".repeat(64), height: 1 }]
            );
        });

        it("should decode empty data to an empty buffer", () => {
            const momentum = Momentum.fromJson(makeMomentumJson({ data: "" }));

            expect(momentum.data.length).to.equal(0);
            expect(momentum.toJson().data).to.equal("");
        });

        it("should decode null data to an empty buffer", () => {
            const momentum = Momentum.fromJson(makeMomentumJson({ data: null }));

            expect(momentum.data.length).to.equal(0);
            expect(momentum.toJson().data).to.equal("");
        });
    });

    describe("AccountBlock", () => {
        it("should decode publicKey and signature as base64", () => {
            const json = makeBlockJson();
            const block = AccountBlock.fromJson(json);

            expect(block.publicKey.equals(Buffer.alloc(32, 1))).to.equal(true);
            expect(block.signature.equals(Buffer.alloc(64, 2))).to.equal(true);
            expect(block.toJson().publicKey).to.equal(PUBLIC_KEY_B64);
            expect(block.toJson().signature).to.equal(SIGNATURE_B64);
        });

        it("should decode missing keys to empty buffers", () => {
            const block = AccountBlock.fromJson(makeBlockJson({ publicKey: null, signature: "" }));

            expect(block.publicKey.length).to.equal(0);
            expect(block.signature.length).to.equal(0);
        });
    });

    describe("AccountBlockTemplate", () => {
        it("should decode publicKey and signature as base64", () => {
            const template = AccountBlockTemplate.fromJson(makeBlockJson());

            expect(template.publicKey.equals(Buffer.alloc(32, 1))).to.equal(true);
            expect(template.signature.equals(Buffer.alloc(64, 2))).to.equal(true);
            expect(template.toJson().publicKey).to.equal(PUBLIC_KEY_B64);
            expect(template.toJson().signature).to.equal(SIGNATURE_B64);
        });
    });

    describe("AccountInfo", () => {
        it("should write accountHeight and no blockCount key", () => {
            const json = AccountInfo.fromJson({
                address: ADDRESS,
                accountHeight: 5,
                balanceInfoMap: {}
            }).toJson();

            expect(json.accountHeight).to.equal(5);
            expect(json).to.not.have.property("blockCount");
        });
    });
});
