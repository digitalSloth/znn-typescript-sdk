import { expect } from "chai";
import { Abi } from "../../src/abi/abi.js";
import { EmbeddedContract } from "../../src/embedded/embeddedContract.js";

// Test contract with sample ABI data from the old definitions tests
class TestContract extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"TestFunction", "inputs":[
			{"name":"name","type":"string"},
			{"name":"address","type":"address"},
			{"name":"amount","type":"uint256"}
		]},
		{"type":"function","name":"SimpleFunction", "inputs":[
			{"name":"id","type":"hash"}
		]},
		{"type":"variable","name":"testVariable","inputs":[
			{"name":"value","type":"uint256"},
			{"name":"enabled","type":"bool"}
		]}
	]`;
}

describe("EmbeddedContract Base Class", () => {
    it("should return an Abi instance from getAbi()", () => {
        const abi = TestContract.abi;
        expect(abi).to.exist;
        expect(abi).to.have.property("encodeFunctionData");
        expect(abi).to.have.property("decodeFunctionData");
    });

    it("should cache the Abi instance", () => {
        const abi1 = TestContract.abi;
        const abi2 = TestContract.abi;
        expect(abi1).to.equal(abi2);
    });

    it("should encode function data correctly", () => {
        const abi = TestContract.abi;
        const hex = abi.encodeFunctionData("SimpleFunction", [
            "0x1234567812345678123456781234567812345678123456781234567812345678",
        ]);
        expect(hex).to.be.a("string");
        expect(hex).to.match(/^0x[0-9a-f]+$/i);
    });

    it("should decode function data correctly", () => {
        const abi = TestContract.abi;
        const encoded = abi.encodeFunctionData("SimpleFunction", [
            "0x1234567812345678123456781234567812345678123456781234567812345678",
        ]);
        const decoded = abi.decodeFunctionData("SimpleFunction", encoded, true);
        expect(JSON.stringify(decoded)).to.equal(
            '{"id":"0x1234567812345678123456781234567812345678123456781234567812345678"}'
        );
    });

    it("should encode complex function with multiple parameters", () => {
        const abi = TestContract.abi;
        const hex = abi.encodeFunctionData("TestFunction", [
            "Test Name",
            "z1qp5hmcddaxd8ranhu25n4nycf8q9vsg6ksqjlg",
            "1000000000",
        ]);
        expect(hex).to.be.a("string");
        expect(hex).to.match(/^0x[0-9a-f]+$/i);
    });

    it("should decode complex function with multiple parameters", () => {
        const abi = TestContract.abi;
        const encoded = abi.encodeFunctionData("TestFunction", [
            "Test Name",
            "z1qp5hmcddaxd8ranhu25n4nycf8q9vsg6ksqjlg",
            "1000000000",
        ]);
        const decoded = abi.decodeFunctionData("TestFunction", encoded, true);
        expect(decoded).to.have.property("name", "Test Name");
        expect(decoded).to.have.property("address", "z1qp5hmcddaxd8ranhu25n4nycf8q9vsg6ksqjlg");
        expect(Number(decoded.amount)).to.equal(1000000000);
    });

    it("should have access to ABI functions", () => {
        const abi = TestContract.abi;
        const func = abi.getFunction("TestFunction");
        expect(func).to.exist;
        expect(func.name).to.equal("TestFunction");
    });

    it("should throw error for non-existent function", () => {
        const abi = TestContract.abi;
        expect(() => abi.getFunction("NonExistentFunction")).to.throw();
    });
});

describe("EmbeddedContract.getFunctions()", () => {
    it("should return only function fragments, excluding variables", () => {
        const functions = TestContract.getFunctions();
        expect(functions).to.have.length(2);
        expect(functions.map(f => f.name)).to.deep.equal(["TestFunction", "SimpleFunction"]);
    });

    it("should return objects with name, signature, and fingerprint", () => {
        for (const f of TestContract.getFunctions()) {
            expect(f).to.have.keys(["name", "signature", "fingerprint"]);
            expect(f.name).to.be.a("string").and.not.be.empty;
            expect(f.signature).to.be.a("string").and.not.be.empty;
            expect(f.fingerprint).to.be.a("string").and.not.be.empty;
        }
    });

    it("should produce signatures matching function name and input types", () => {
        const functions = TestContract.getFunctions();
        const testFn = functions.find(f => f.name === "TestFunction")!;
        const simpleFn = functions.find(f => f.name === "SimpleFunction")!;
        expect(testFn.signature).to.equal("TestFunction(string,address,uint256)");
        expect(simpleFn.signature).to.match(/^SimpleFunction\(.+\)$/);
    });

    it("should produce fingerprints as 8-char lowercase hex without 0x prefix", () => {
        for (const f of TestContract.getFunctions()) {
            expect(f.fingerprint).to.match(/^[0-9a-f]{8}$/);
        }
    });

    it("should produce fingerprints consistent with Abi.getSighash", () => {
        for (const f of TestContract.getFunctions()) {
            const fragment = TestContract.abi.getFunction(f.name);
            const expected = Abi.getSighash(fragment).slice(2).toLowerCase();
            expect(f.fingerprint).to.equal(expected);
        }
    });

    it("should return consistent results on repeated calls", () => {
        const first = TestContract.getFunctions();
        const second = TestContract.getFunctions();
        expect(first).to.deep.equal(second);
    });
});

describe("EmbeddedContract.encodeCall()", () => {
    it("should return a hex string starting with 0x", () => {
        const encoded = TestContract.encodeCall("SimpleFunction", [
            "0x1234567812345678123456781234567812345678123456781234567812345678",
        ]);
        expect(encoded).to.be.a("string").and.match(/^0x[0-9a-f]+$/i);
    });

    it("should produce calldata whose first 4 bytes match the function fingerprint", () => {
        const encoded = TestContract.encodeCall("SimpleFunction", [
            "0x1234567812345678123456781234567812345678123456781234567812345678",
        ]);
        const fingerprint = TestContract.getFunctions().find(f => f.name === "SimpleFunction")!.fingerprint;
        expect(encoded.slice(2, 10)).to.equal(fingerprint);
    });

    it("should round-trip with decodeCall", () => {
        const encoded = TestContract.encodeCall("TestFunction", [
            "Test Name",
            "z1qp5hmcddaxd8ranhu25n4nycf8q9vsg6ksqjlg",
            "1000000000",
        ]);
        const decoded = TestContract.decodeCall("TestFunction", encoded) as Record<string, any>;
        expect(decoded).to.have.property("name", "Test Name");
        expect(decoded).to.have.property("address", "z1qp5hmcddaxd8ranhu25n4nycf8q9vsg6ksqjlg");
        expect(Number(decoded.amount)).to.equal(1000000000);
    });
});

describe("EmbeddedContract.decodeCall()", () => {
    let encoded: string;

    before(() => {
        encoded = TestContract.encodeCall("TestFunction", [
            "Test Name",
            "z1qp5hmcddaxd8ranhu25n4nycf8q9vsg6ksqjlg",
            "1000000000",
        ]);
    });

    it("should return named args by default (named=true)", () => {
        const result = TestContract.decodeCall("TestFunction", encoded) as Record<string, any>;
        expect(result).to.have.property("name", "Test Name");
        expect(result).to.have.property("address", "z1qp5hmcddaxd8ranhu25n4nycf8q9vsg6ksqjlg");
        expect(Number(result.amount)).to.equal(1000000000);
    });

    it("should return positional array when named=false", () => {
        const result = TestContract.decodeCall("TestFunction", encoded, false) as any[];
        expect(result).to.be.an("array").with.length(3);
        expect(result[0]).to.equal("Test Name");
        expect(result[1]).to.equal("z1qp5hmcddaxd8ranhu25n4nycf8q9vsg6ksqjlg");
        expect(Number(result[2])).to.equal(1000000000);
    });
});

describe("EmbeddedContract.decodeCallData()", () => {
    let encoded: string;

    before(() => {
        encoded = TestContract.encodeCall("TestFunction", [
            "Test Name",
            "z1qp5hmcddaxd8ranhu25n4nycf8q9vsg6ksqjlg",
            "1000000000",
        ]);
    });

    it("should return { name, args } shape", () => {
        const result = TestContract.decodeCallData(encoded);
        expect(result).to.have.keys(["name", "args"]);
    });

    it("should auto-identify the function name from calldata", () => {
        const result = TestContract.decodeCallData(encoded);
        expect(result.name).to.equal("TestFunction");
    });

    it("should return named args by default (named=true)", () => {
        const result = TestContract.decodeCallData(encoded);
        const args = result.args as Record<string, any>;
        expect(args).to.have.property("name", "Test Name");
        expect(args).to.have.property("address", "z1qp5hmcddaxd8ranhu25n4nycf8q9vsg6ksqjlg");
        expect(Number(args.amount)).to.equal(1000000000);
    });

    it("should return positional args when named=false", () => {
        const result = TestContract.decodeCallData(encoded, false);
        const args = result.args as any[];
        expect(args).to.be.an("array").with.length(3);
        expect(args[0]).to.equal("Test Name");
    });

    it("should throw on data that matches no known function", () => {
        expect(() => TestContract.decodeCallData("0xdeadbeef")).to.throw();
    });
});
