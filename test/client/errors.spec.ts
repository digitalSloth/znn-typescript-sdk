import { expect } from "chai";
import { ZnnClientException } from "../../src/client/errors.js";

describe("ZnnClientException", () => {
    it("should format error details in toString", () => {
        const err = new ZnnClientException(
            "RPC failure",
            123,
            "ledger.getAccountBlockByHash",
            ["0xabc"],
            { detail: "bad request" }
        );

        const message = err.toString();

        expect(message).to.include("ZnnClientException [123]: RPC failure");
        expect(message).to.include("Method: ledger.getAccountBlockByHash");
        expect(message).to.include("Params: [\"0xabc\"]");
        expect(message).to.include("Data: {\"detail\":\"bad request\"}");
    });

    it("should omit optional fields when not provided", () => {
        const err = new ZnnClientException("Simple error", -1);
        const message = err.toString();

        expect(message).to.equal("ZnnClientException [-1]: Simple error");
    });
});
