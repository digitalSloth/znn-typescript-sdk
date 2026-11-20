import { expect } from "chai";
import { WebsocketStatus, WsClient } from "../../src/client/websocket.js";
import { ZnnClientException } from "../../src/client/errors.js";
import { deadNode, liveNode } from "./test-nodes.js";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const FAST_RETRY = { reconnect_interval: 50 };

async function rejection(promise: Promise<unknown>): Promise<Error> {
    try {
        await promise;
    } catch (err) {
        return err as Error;
    }
    throw new Error("expected the promise to reject");
}
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
        (client as any)._wsRpc2Client = { ready: false };
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

    describe("connection lifecycle", () => {
        it("stops retrying an unreachable node once the connect times out", async () => {
            const node = await deadNode();
            const client = new WsClient(node.url);

            const err = await rejection(client.initialize(node.url, 300, FAST_RETRY));
            const attempts = node.connections();
            await wait(300);

            expect(attempts).to.be.greaterThan(1);
            expect(node.connections()).to.equal(attempts);
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal("Timeout after 0.3 seconds");
            expect(client.status()).to.equal(WebsocketStatus.Stopped);
            await node.close();
        });

        it("rejects a pending connect on stop() and stops retrying", async () => {
            const node = await deadNode();
            const client = new WsClient(node.url);

            const pending = rejection(client.initialize(node.url, 5000, FAST_RETRY));
            await wait(200);
            client.stop();
            const err = await pending;
            const attempts = node.connections();
            await wait(300);

            expect(err.message).to.equal("Connection stopped");
            expect(node.connections()).to.equal(attempts);
            await node.close();
        });

        it("stops retrying the old node when initialize() targets a new one", async () => {
            const dead = await deadNode();
            const live = await liveNode();
            const client = new WsClient(dead.url);

            const first = rejection(client.initialize(dead.url, 5000, FAST_RETRY));
            await wait(200);
            await client.initialize(live.url, 1000, FAST_RETRY);
            const attempts = dead.connections();
            await wait(300);

            expect((await first).message).to.equal("Connection replaced by a new initialize()");
            expect(dead.connections()).to.equal(attempts);
            expect(client.status()).to.equal(WebsocketStatus.Running);
            client.stop();
            await dead.close();
            await live.close();
        });

        it("stops reconnecting to a node that went down on stop()", async () => {
            const node = await liveNode(1);
            const client = new WsClient(node.url);
            const closes: number[] = [];
            client.onClose((code) => closes.push(code));

            await client.initialize(node.url, 1000, FAST_RETRY);
            node.dropAll();
            await wait(300);
            client.stop();
            const attempts = node.connections();
            await wait(300);

            expect(attempts).to.be.greaterThan(2);
            expect(closes[0]).to.equal(1006);
            expect(node.connections()).to.equal(attempts);
            await node.close();
        });

        it("reports Running once open and Stopped after stop()", async () => {
            const node = await liveNode();
            const client = new WsClient(node.url);
            expect(client.status()).to.equal(WebsocketStatus.Uninitialized);

            const connecting = client.initialize(node.url, 1000);
            expect(client.status()).to.equal(WebsocketStatus.Connecting);
            await connecting;
            expect(client.status()).to.equal(WebsocketStatus.Running);
            client.stop();
            expect(client.status()).to.equal(WebsocketStatus.Stopped);
            await node.close();
        });

        it("does not report the close that stop() causes", async () => {
            const node = await liveNode();
            const client = new WsClient(node.url);
            let closes = 0;
            client.onClose(() => closes++);

            await client.initialize(node.url, 1000);
            client.stop();
            await wait(100);

            expect(closes).to.equal(0);
            await node.close();
        });

        it("stops calling a removed close listener", async () => {
            const node = await liveNode();
            const client = new WsClient(node.url);
            let closes = 0;
            const remove = client.onClose(() => closes++);

            await client.initialize(node.url, 1000, { reconnect: false });
            remove();
            node.dropAll();
            await wait(100);

            expect(closes).to.equal(0);
            client.stop();
            await node.close();
        });

        it("throws on requests after stop()", async () => {
            const node = await liveNode();
            const client = new WsClient(node.url);
            await client.initialize(node.url, 1000);
            client.stop();

            const err = await rejection(client.sendRequest("ledger.getFrontierMomentum", []));

            expect(err.message).to.equal("No connection to the Zenon node (code=NETWORK_ERROR)");
            await node.close();
        });
    });
});
