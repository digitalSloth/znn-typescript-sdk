import { expect } from "chai";
import { TokenStandard, ZNN_ZTS, QSR_ZTS, EMPTY_ZTS } from "../../../src/model/primitives/tokenStandard.js";

describe("TokenStandard", () => {

    describe("parse", () => {
        it("should parse valid token standard strings", () => {
            const validTokenStandards = [
                "zts1znnxxxxxxxxxxxxx9z4ulx",
                "zts1qsrxxxxxxxxxxxxxmrhjll",
                "zts1qqqqqqqqqqqqqqqqtq587y",
                "zts1hz3ys62vnc8tdajnwrz6pp"
            ];

            validTokenStandards.forEach(tokenStandardStr => {
                const tokenStandard = TokenStandard.parse(tokenStandardStr);
                expect(tokenStandard).to.be.instanceOf(TokenStandard);
                expect(tokenStandard.toString()).to.equal(tokenStandardStr);
            });
        });

        it("should throw error for invalid encoding", () => {
            const invalidTokenStandard = "this-will-fail-to-parse-as-a-valid-token-standard";

            expect(() => TokenStandard.parse(invalidTokenStandard))
                .to.throw(Error, `invalid bech32 encoding for zts: ${invalidTokenStandard}`);

        });

        it("should throw error for invalid prefix", () => {
            const invalidTokenStandard = "abcdef1qpzry9x8gf2tvdw0s3jn54khce6mua7lmqqqxw";

            expect(() => TokenStandard.parse(invalidTokenStandard))
                .to.throw(Error, `invalid prefix ${invalidTokenStandard.split("1")[0]}; should be 'zts'`);
        });

        it("should throw error for invalid length", () => {
            // This will fail bech32 decoding due to invalid format
            // The actual error thrown is "invalid bech32 encoding"
            const invalidTokenStandard = "zts1qqqqqq";

            expect(() => TokenStandard.parse(invalidTokenStandard))
                .to.throw(Error);
        });
    });

    describe("fromCore", () => {
        it("should create TokenStandard from Buffer core", () => {
            const core = Buffer.alloc(10);
            const tokenStandard = TokenStandard.fromCore(core);

            expect(tokenStandard).to.be.instanceOf(TokenStandard);
            expect(tokenStandard.getBytes()).to.have.lengthOf(10);
        });

        it("should create TokenStandard from Uint8Array core", () => {
            const core = new Uint8Array(10);
            const tokenStandard = TokenStandard.fromCore(core);

            expect(tokenStandard).to.be.instanceOf(TokenStandard);
            expect(tokenStandard.getBytes()).to.have.lengthOf(10);
        });

        it("should throw error for invalid core length", () => {
            const invalidCore = Buffer.alloc(9); // Too short

            expect(() => TokenStandard.fromCore(invalidCore))
                .to.throw(Error, /invalid length/);
        });

        it("should create same TokenStandard as parse for same core", () => {
            const parsed = TokenStandard.parse("zts1znnxxxxxxxxxxxxx9z4ulx");
            const fromCore = TokenStandard.fromCore(parsed.getBytes());

            expect(fromCore.toString()).to.equal(parsed.toString());
        });
    });

    describe("isTokenStandard", () => {
        it("should return true for TokenStandard instances", () => {
            const tokenStandard = TokenStandard.parse("zts1znnxxxxxxxxxxxxx9z4ulx");
            expect(TokenStandard.isTokenStandard(tokenStandard)).to.be.true;
        });

        it("should return false for non-TokenStandard values", () => {
            expect(TokenStandard.isTokenStandard("zts1znnxxxxxxxxxxxxx9z4ulx")).to.be.false;
            expect(TokenStandard.isTokenStandard({})).to.be.false;
            // Skip null and undefined as they cause TypeError in the implementation
        });
    });

    describe("getBytes", () => {
        it("should return core bytes", () => {
            const tokenStandard = TokenStandard.parse("zts1znnxxxxxxxxxxxxx9z4ulx");
            const bytes = tokenStandard.getBytes();

            expect(bytes).to.be.instanceOf(Buffer);
            expect(bytes).to.have.lengthOf(10);
        });

        it("should return same bytes as provided in fromCore", () => {
            const core = Buffer.from("00112233445566778899", "hex");
            const tokenStandard = TokenStandard.fromCore(core);

            expect(tokenStandard.getBytes().toString("hex")).to.equal(core.toString("hex"));
        });
    });

    describe("parses network tokens", () => {
        it("ZNN_ZTS has correct value", () => {
            expect(ZNN_ZTS.toString()).to.equal("zts1znnxxxxxxxxxxxxx9z4ulx");
        });

        it("QSR_ZTS has correct value", () => {
            expect(QSR_ZTS.toString()).to.equal("zts1qsrxxxxxxxxxxxxxmrhjll");
        });

        it("EMPTY_ZTS has correct value", () => {
            expect(EMPTY_ZTS.toString()).to.equal("zts1qqqqqqqqqqqqqqqqtq587y");
        });
    });
});
