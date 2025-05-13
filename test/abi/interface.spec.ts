import { expect } from "chai";
import { Interface } from "../../src/abi/interface.js";
import { defaultAbiCoder } from "../../src/abi/abi-coder.js";
import { ErrorFragment } from "../../src/abi/fragments.js";
import { Hash } from "../../src/model/primitives/index.js";
import { Logger } from "../../src/utilities/logger.js";

const ADDRESS_A = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const ADDRESS_B = "z1qzal6c5s9rjnnxd2z7dvdhjxpmmj4fmw56a0mz";

const abi = [
    {
        type: "function",
        name: "transfer",
        stateMutability: "nonpayable",
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" }
        ],
        outputs: [{ name: "ok", type: "bool" }]
    },
    {
        type: "function",
        name: "transfer",
        stateMutability: "nonpayable",
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "memo", type: "string" }
        ],
        outputs: []
    },
    {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }]
    },
    {
        type: "event",
        name: "Transfer",
        inputs: [
            { name: "from", type: "address", indexed: true },
            { name: "to", type: "address", indexed: true },
            { name: "value", type: "uint256", indexed: false }
        ]
    },
    {
        type: "event",
        name: "Note",
        inputs: [
            { name: "message", type: "string", indexed: true },
            { name: "to", type: "address", indexed: false }
        ]
    },
    {
        type: "error",
        name: "Custom",
        inputs: [{ name: "code", type: "uint256" }]
    }
];

describe("Interface", () => {
    const iface = new Interface(abi);

    it("should format the ABI as JSON", () => {
        const formatted = iface.format("json") as string;
        expect(formatted).to.be.a("string");
        expect(formatted).to.include("\"name\":\"transfer\"");
    });

    it("should throw when formatting sighash", () => {
        expect(() => iface.format("sighash")).to.throw("interface does not support formatting sighash");
    });

    it("should resolve functions by name, signature, and sighash", () => {
        const fragment = iface.getFunction("transfer(address,uint256)");
        const sighash = iface.getSighash(fragment);

        expect(fragment.name).to.equal("transfer");
        expect(iface.getFunction("transfer(address,uint256)").format()).to.equal(fragment.format());
        expect(iface.getFunction(sighash).format()).to.equal(fragment.format());
    });

    it("should throw on ambiguous function name", () => {
        expect(() => iface.getFunction("transfer")).to.throw("multiple matching functions");
    });

    it("should resolve events by name, signature, and topic", () => {
        const fragment = iface.getEvent("Transfer(address,address,uint256)");
        const topic = iface.getEventTopic(fragment);

        expect(iface.getEvent("Transfer").format()).to.equal(fragment.format());
        expect(iface.getEvent(topic).format()).to.equal(fragment.format());
    });

    it("should resolve errors by signature and sighash", () => {
        const errorFrag = iface.getError("Custom(uint256)");
        const selector = Interface.getSighash(errorFrag);

        expect(iface.getError(selector).format()).to.equal(errorFrag.format());
    });

    it("should encode and decode function data", () => {
        const data = iface.encodeFunctionData("transfer(address,uint256)", [ADDRESS_B, 100]);
        const decoded = iface.decodeFunctionData("transfer(address,uint256)", data);

        expect(decoded[0]).to.equal(ADDRESS_B);
        expect(decoded[1].toString()).to.equal("100");
    });

    it("should reject mismatched function data signatures", () => {
        const data = "0xdeadbeef";
        expect(() => iface.decodeFunctionData("transfer(address,uint256)", data))
            .to.throw("data signature does not match function transfer.");
    });

    it("should encode and decode function results", () => {
        const data = iface.encodeFunctionResult("balanceOf(address)", [123]);
        const decoded = iface.decodeFunctionResult("balanceOf(address)", data);

        expect(decoded[0].toString()).to.equal("123");
    });

    it("should decode builtin Error(string) reverts", () => {
        const selector = "0x08c379a0";
        const encoded = defaultAbiCoder.encode(["string"], ["boom"]);
        const data = selector + encoded.substring(2);

        let error: any = null;
        try {
            iface.decodeFunctionResult("transfer(address,uint256)", data);
        } catch (err) {
            error = err;
        }

        expect(error).to.exist;
        expect(error.code).to.equal(Logger.errors.CALL_EXCEPTION);
        expect(error.reason).to.equal("boom");
    });

    it("should encode filter topics for indexed values", () => {
        const event = iface.getEvent("Note(string,address)");
        const topics = iface.encodeFilterTopics(event, ["hello", null]);

        expect(topics[0]).to.equal(iface.getEventTopic(event));
        expect(topics[1]).to.equal(Hash.id("hello"));
    });

    it("should reject non-null filter values for non-indexed params", () => {
        const event = iface.getEvent("Transfer(address,address,uint256)");
        expect(() => iface.encodeFilterTopics(event, [null, null, 1]))
            .to.throw("cannot filter non-indexed parameters; must be null");
    });

    it("should encode and decode event logs", () => {
        const event = iface.getEvent("Transfer(address,address,uint256)");
        const encoded = iface.encodeEventLog(event, [ADDRESS_A, ADDRESS_B, 42]);
        const decoded = iface.decodeEventLog(event, encoded.data, encoded.topics);

        expect(decoded[0]).to.equal(ADDRESS_A);
        expect(decoded[1]).to.equal(ADDRESS_B);
        expect(decoded[2].toString()).to.equal("42");
    });

    it("should parse transactions and logs", () => {
        const data = iface.encodeFunctionData("transfer(address,uint256)", [ADDRESS_B, 5]);
        const tx = iface.parseTransaction({ data });

        expect(tx.name).to.equal("transfer");
        expect(tx.args[0]).to.equal(ADDRESS_B);
        expect(tx.args[1].toString()).to.equal("5");

        const event = iface.getEvent("Transfer(address,address,uint256)");
        const logData = iface.encodeEventLog(event, [ADDRESS_A, ADDRESS_B, 7]);
        const parsedLog = iface.parseLog({ data: logData.data, topics: logData.topics });

        expect(parsedLog.name).to.equal("Transfer");
        expect(parsedLog.args[2].toString()).to.equal("7");
    });
});
