import { expect } from "chai";
import { SubscribeApi } from "../../src/api/subscribe.js";
import { WSUpdateStream, WsClient } from "../../src/client/websocket.js";
import { EMPTY_ADDRESS } from "../../src/model/primitives/address.js";

function createHarness(response: () => Promise<string> = async () => "subscription-1") {
    // Construction does not open a transport; never initialize this client.
    const client = new WsClient("ws://example.invalid");
    const requests: Array<{ method: string; parameters?: unknown[] }> = [];
    const streams: WSUpdateStream[] = [];

    client.sendRequest = async (method: string, parameters?: unknown[]) => {
        requests.push({ method, parameters });
        return response();
    };
    client.initialize = async () => {
        throw new Error("Unexpected transport initialization in subscription regression");
    };
    const newSubscription = client.newSubscription.bind(client);
    client.newSubscription = id => {
        const stream = newSubscription(id);
        streams.push(stream);
        return stream;
    };

    const api = new SubscribeApi();
    api.setClient(client);
    return { api, requests, streams };
}

describe("SubscribeApi", () => {
    const cases: Array<{
        name: string;
        invoke: (api: SubscribeApi) => Promise<WSUpdateStream>;
        parameters: string[];
    }> = [
        {
            name: "routes momentum subscriptions",
            invoke: api => api.toMomentums(),
            parameters: ["momentums"]
        },
        {
            name: "routes all-account-block subscriptions",
            invoke: api => api.toAllAccountBlocks(),
            parameters: ["allAccountBlocks"]
        },
        {
            name: "routes account-block subscriptions for an address",
            invoke: api => api.toAccountBlocksByAddress(EMPTY_ADDRESS),
            parameters: ["accountBlocksByAddress", EMPTY_ADDRESS.toString()]
        },
        {
            name: "routes unreceived-account-block subscriptions for an address",
            invoke: api => api.toUnreceivedAccountBlocksByAddress(EMPTY_ADDRESS),
            parameters: ["unreceivedAccountBlocksByAddress", EMPTY_ADDRESS.toString()]
        }
    ];

    for (const testCase of cases) {
        it(testCase.name, async () => {
            const { api, requests, streams } = createHarness();
            const stream = await testCase.invoke(api);

            expect(requests).to.deep.equal([{
                method: "ledger.subscribe",
                parameters: testCase.parameters
            }]);
            expect(stream).to.be.instanceOf(WSUpdateStream);
            expect(stream.id).to.equal("subscription-1");
            expect(streams).to.have.length(1);
            expect(stream).to.equal(streams[0]);
        });
    }

    it("creates one stream only after the subscription request resolves", async () => {
        let resolveRequest: (id: string) => void = () => {
            throw new Error("Deferred subscription resolver was not initialized");
        };
        const response = new Promise<string>(resolve => {
            resolveRequest = resolve;
        });
        const { api, requests, streams } = createHarness(() => response);
        const parameters = ["momentums"];
        const pending = api.subscribeTo(parameters);

        expect(requests).to.deep.equal([{ method: "ledger.subscribe", parameters }]);
        expect(streams).to.have.length(0);

        resolveRequest("deferred-subscription");
        const stream = await pending;

        expect(stream).to.be.instanceOf(WSUpdateStream);
        expect(stream.id).to.equal("deferred-subscription");
        expect(streams).to.have.length(1);
        expect(stream).to.equal(streams[0]);
    });

    it("preserves request rejection without creating a stream", async () => {
        const failure = new Error("Synthetic subscription rejection");
        const { api, requests, streams } = createHarness(async () => {
            throw failure;
        });
        const parameters = ["allAccountBlocks"];
        let rejection: unknown;

        try {
            await api.subscribeTo(parameters);
        } catch (error) {
            rejection = error;
        }

        expect(rejection).to.equal(failure);
        expect(requests).to.deep.equal([{ method: "ledger.subscribe", parameters }]);
        expect(streams).to.have.length(0);
    });
});
