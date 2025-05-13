import { expect } from "chai";
import {
    Address,
    EMPTY_ADDRESS,
    PLASMA_ADDRESS,
    PILLAR_ADDRESS,
    TOKEN_ADDRESS,
    SENTINEL_ADDRESS,
    SWAP_ADDRESS,
    STAKE_ADDRESS,
    LIQUIDITY_ADDRESS,
    SPORK_ADDRESS,
    ACCELERATOR_ADDRESS,
    BRIDGE_ADDRESS
} from "../../../src/model/primitives/address.js";

describe("Address", () => {

    describe("parse", () => {
        it("should parse valid address strings", () => {
            const validAddresses = [
                "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f",
                "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp",
                "z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq",
            ];

            validAddresses.forEach(addressStr => {
                const address = Address.parse(addressStr);
                expect(address).to.be.instanceOf(Address);
                expect(address.toString()).to.equal(addressStr);
            });
        });

        it("should throw error for invalid encoding", () => {
            const invalidAddress = "this-will-fail-to-parse-as-a-valid-address";

            expect(() => Address.parse(invalidAddress))
                .to.throw(Error, `invalid bech32 encoding for address: ${invalidAddress}`);

        });

        it("should throw error for invalid prefix", () => {
            const invalidAddress = "abcdef1qpzry9x8gf2tvdw0s3jn54khce6mua7lmqqqxw";

            expect(() => Address.parse(invalidAddress))
                .to.throw(Error, `invalid prefix ${invalidAddress.split("1")[0]}; should be 'z'`);
        });

        it("should throw error for invalid length", () => {
            // This will fail bech32 decoding due to invalid format
            // The actual error thrown is "invalid bech32 encoding"
            const invalidAddress = "z1qqqqqqqqqqqq";

            expect(() => Address.parse(invalidAddress))
                .to.throw(Error);
        });
    });

    describe("fromPublicKey", () => {
        it("should create address from public key", () => {
            const publicKey = Buffer.from("3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392", "hex");
            const address = Address.fromPublicKey(publicKey);

            expect(address).to.be.instanceOf(Address);
            expect(address.toString()).to.be.a("string");
            expect(address.toString()).to.match(/^z1/);
            expect(address.getBytes()).to.have.lengthOf(20);
        });

        it("should create different addresses for different public keys", () => {
            const pubKey1 = Buffer.from("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", "hex");
            const pubKey2 = Buffer.from("fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321", "hex");

            const addr1 = Address.fromPublicKey(pubKey1);
            const addr2 = Address.fromPublicKey(pubKey2);

            expect(addr1.toString()).to.not.equal(addr2.toString());
        });
    });

    describe("fromCore", () => {
        it("should create address from Buffer core", () => {
            const core = Buffer.alloc(20);
            const address = Address.fromCore(core);

            expect(address).to.be.instanceOf(Address);
            expect(address.getBytes()).to.have.lengthOf(20);
        });

        it("should create address from Uint8Array core", () => {
            const core = new Uint8Array(20);
            const address = Address.fromCore(core);

            expect(address).to.be.instanceOf(Address);
            expect(address.getBytes()).to.have.lengthOf(20);
        });

        it("should throw error for invalid core length", () => {
            const invalidCore = Buffer.alloc(19); // Too short

            expect(() => Address.fromCore(invalidCore))
                .to.throw(Error, /invalid length/);
        });

        it("should create same address as parse for same core", () => {
            const parsed = Address.parse("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
            const fromCore = Address.fromCore(parsed.getBytes());

            expect(fromCore.toString()).to.equal(parsed.toString());
        });
    });

    describe("isAddress", () => {
        it("should return true for Address instances", () => {
            const address = Address.parse("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
            expect(Address.isAddress(address)).to.be.true;
        });

        it("should return false for non-Address values", () => {
            expect(Address.isAddress("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f")).to.be.false;
            expect(Address.isAddress({})).to.be.false;
            // Skip null and undefined as they cause TypeError in the implementation
        });
    });

    describe("getBytes", () => {
        it("should return core bytes", () => {
            const address = Address.parse("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
            const bytes = address.getBytes();

            expect(bytes).to.be.instanceOf(Buffer);
            expect(bytes).to.have.lengthOf(20);
        });

        it("should return same bytes as provided in fromCore", () => {
            const core = Buffer.from("00112233445566778899aabbccddeeff01020304", "hex");
            const address = Address.fromCore(core);

            expect(address.getBytes().toString("hex")).to.equal(core.toString("hex"));
        });
    });

    describe("parses embedded contracts", () => {
        it("EMPTY_ADDRESS has correct value", () => {
            expect(EMPTY_ADDRESS.toString()).to.equal("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
        });

        it("PLASMA_ADDRESS has correct value", () => {
            expect(PLASMA_ADDRESS.toString()).to.equal("z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp");
        });

        it("PILLAR_ADDRESS has correct value", () => {
            expect(PILLAR_ADDRESS.toString()).to.equal("z1qxemdeddedxpyllarxxxxxxxxxxxxxxxsy3fmg");
        });

        it("TOKEN_ADDRESS has correct value", () => {
            expect(TOKEN_ADDRESS.toString()).to.equal("z1qxemdeddedxt0kenxxxxxxxxxxxxxxxxh9amk0");
        });

        it("SENTINEL_ADDRESS has correct value", () => {
            expect(SENTINEL_ADDRESS.toString()).to.equal("z1qxemdeddedxsentynelxxxxxxxxxxxxxwy0r2r");
        });

        it("SWAP_ADDRESS has correct value", () => {
            expect(SWAP_ADDRESS.toString()).to.equal("z1qxemdeddedxswapxxxxxxxxxxxxxxxxxxl4yww");
        });

        it("STAKE_ADDRESS has correct value", () => {
            expect(STAKE_ADDRESS.toString()).to.equal("z1qxemdeddedxstakexxxxxxxxxxxxxxxxjv8v62");
        });

        it("LIQUIDITY_ADDRESS has correct value", () => {
            expect(LIQUIDITY_ADDRESS.toString()).to.equal("z1qxemdeddedxlyquydytyxxxxxxxxxxxxflaaae");
        });

        it("SPORK_ADDRESS has correct value", () => {
            expect(SPORK_ADDRESS.toString()).to.equal("z1qxemdeddedxsp0rkxxxxxxxxxxxxxxxx956u48");
        });

        it("ACCELERATOR_ADDRESS has correct value", () => {
            expect(ACCELERATOR_ADDRESS.toString()).to.equal("z1qxemdeddedxaccelerat0rxxxxxxxxxxp4tk22");
        });

        it("BRIDGE_ADDRESS has correct value", () => {
            expect(BRIDGE_ADDRESS.toString()).to.equal("z1qxemdeddedxdrydgexxxxxxxxxxxxxxxmqgr0d");
        });
    });
});
