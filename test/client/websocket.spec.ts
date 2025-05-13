import { expect } from "chai";
import { WsClient } from "../../src/client/websocket.js";
import { ZnnClientException } from "../../src/client/errors.js";
describe("WsClient", () => {
    it("should create subscription streams and dispatch notifications", () => {
        const client = new WsClient("ws://localhost");
        const stream = client.newSubscription("sub-1");
        let payload: any[] | null = null;

        stream.onNotification((data) => {
            payload = data;
        });

        client.subscriptions.handleGlobalNotification({
            subscription: "sub-1",
            result: ["update", 1]
        });

        expect(payload).to.deep.equal(["update", 1]);
    });

    it("should throw when sending without a connection", async () => {
        const client = new WsClient("ws://localhost");
        let error: Error | null = null;

        try {
            await client.sendRequest("ledger.getFrontierMomentum", []);
        } catch (err) {
            error = err as Error;
        }

        expect(error).to.exist;
        expect(error!.message).to.equal("No connection to the Zenon node (code=NETWORK_ERROR)");
    });

    it("should forward calls to the websocket client", async () => {
        const client = new WsClient("ws://localhost");
        const calls: Array<{ method: string; params?: any[] }> = [];

        (client as any)._wsRpc2Client = {
            call: async (method: string, params?: any[]) => {
                calls.push({ method, params });
                return "ok";
            }
        };

        const result = await client.sendRequest("ledger.getFrontierMomentum", [1]);

        expect(result).to.equal("ok");
        expect(calls).to.deep.equal([{ method: "ledger.getFrontierMomentum", params: [1] }]);
    });

    it("should wrap websocket errors in ZnnClientException", async () => {
        const client = new WsClient("ws://localhost");
        (client as any)._wsRpc2Client = {
            call: async () => {
                throw { code: 500, message: "Server error", data: { info: "boom" } };
            }
        };

        let error: ZnnClientException | null = null;
        try {
            await client.sendRequest("ledger.getFrontierMomentum", []);
        } catch (err) {
            error = err as ZnnClientException;
        }

        expect(error).to.be.instanceOf(ZnnClientException);
        expect(error!.code).to.equal(500);
        expect(error!.method).to.equal("ledger.getFrontierMomentum");
        expect(error!.data).to.deep.equal({ info: "boom" });
    });

    it("should clear subscriptions and stop without a websocket client", () => {
        const client = new WsClient("ws://localhost");
        const stream = client.newSubscription("sub-1");
        stream.onNotification(() => undefined);

        client.stop();

        expect(client.subscriptions.callbacks.size).to.equal(0);
    });

    it("should restart when running and closed", async () => {
        const client = new WsClient("ws://localhost");
        let restarted = false;

        (client as any)._websocketIntendedState = 2;
        (client as any)._wsRpc2Client = { isClosed: true };
        (client as any).initialize = async () => {
            restarted = true;
        };

        await client.restart();

        expect(restarted).to.equal(true);
    });

    it("should not restart when not running", async () => {
        const client = new WsClient("ws://localhost");
        let restarted = false;

        (client as any)._websocketIntendedState = 0;
        (client as any).initialize = async () => {
            restarted = true;
        };

        await client.restart();

        expect(restarted).to.equal(false);
    });
});
