import type { Client } from "./interfaces.js";
import { HttpClient } from "./http.js";
import { WsClient } from "./websocket.js";

const newHTTPClient = (url: string): Client => {
    return new HttpClient(url);
};

const newWSClient = (url: string): WsClient => {
    // Note: consumer must call initialize on the returned WsClient before using sendRequest
    return new WsClient(url);
};

export const newClient = (url: string): Client => {
    const scheme = url.split(":")[0];
    switch (scheme) {
        case "ws":
        case "wss":
            return newWSClient(url);
        case "http":
        case "https":
            return newHTTPClient(url);
        default:
            throw new Error("Unknown URL scheme: " + scheme);
    }
};
