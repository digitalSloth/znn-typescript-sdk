import { expect } from "chai";
import { HttpClient } from "../../src/client/http.js";
import { ZnnClientException } from "../../src/client/errors.js";

describe("HttpClient", () => {
    it("should forward requests to the RPC client", async () => {
        const client = new HttpClient("http://localhost");
        const calls: Array<{ method: string; params: any[] }> = [];

        (client as any)._client = {
            request: async ({ method, params }: { method: string; params: any[] }) => {
                calls.push({ method, params });
                return "ok";
            }
        };

        const result = await client.sendRequest("ledger.getFrontierMomentum", [1, 2]);

        expect(result).to.equal("ok");
        expect(calls).to.deep.equal([{ method: "ledger.getFrontierMomentum", params: [1, 2] }]);
    });

    it("should wrap RPC errors in ZnnClientException", async () => {
        const client = new HttpClient("http://localhost");
        (client as any)._client = {
            request: async () => {
                throw { code: 400, message: "Bad request", data: { reason: "invalid" } };
            }
        };

        let error: ZnnClientException | null = null;
        try {
            await client.sendRequest("ledger.getFrontierMomentum", []);
        } catch (err) {
            error = err as ZnnClientException;
        }

        expect(error).to.be.instanceOf(ZnnClientException);
        expect(error!.code).to.equal(400);
        expect(error!.method).to.equal("ledger.getFrontierMomentum");
        expect(error!.data).to.deep.equal({ reason: "invalid" });
    });
});
