import { expect } from "chai";
import { newClient } from "../../src/client/factory.js";
import { HttpClient } from "../../src/client/http.js";
import { WsClient } from "../../src/client/websocket.js";

describe("client factory", () => {
    it("should create an HTTP client for http/https URLs", () => {
        const httpClient = newClient("http://localhost:35997");
        const httpsClient = newClient("https://node.example.com");

        expect(httpClient).to.be.instanceOf(HttpClient);
        expect(httpsClient).to.be.instanceOf(HttpClient);
    });

    it("should create a WebSocket client for ws/wss URLs", () => {
        const wsClient = newClient("ws://localhost:35998");
        const wssClient = newClient("wss://node.example.com");

        expect(wsClient).to.be.instanceOf(WsClient);
        expect(wssClient).to.be.instanceOf(WsClient);
    });

    it("should throw for unknown schemes", () => {
        expect(() => newClient("ftp://example.com")).to.throw("Unknown URL scheme: ftp");
    });
});
