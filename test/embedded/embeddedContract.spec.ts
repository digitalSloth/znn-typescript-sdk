import { expect } from "chai";
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
