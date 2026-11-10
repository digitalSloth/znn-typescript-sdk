/**
 * Minimal Zenon node for browser tests: a JSON-RPC 2.0 WebSocket server that
 * answers the calls zenon.send() and the subscribe API make.
 *
 * The connection URL's `difficulty` query parameter sets the PoW difficulty
 * that embedded.plasma.getRequiredPoWForAccountBlock returns (default 0).
 */

import type { Server } from "node:http";
import { WebSocketServer } from "ws";

export const SUBSCRIPTION_ID = "0x7a656e6f6e737562";

export const MOMENTUM_HEADER = {
    hash: "b".repeat(64),
    height: 100,
    timestamp: 1700000000
};

const FRONTIER_MOMENTUM = {
    version: 1,
    chainIdentifier: 1,
    hash: MOMENTUM_HEADER.hash,
    previousHash: "c".repeat(64),
    height: MOMENTUM_HEADER.height,
    timestamp: MOMENTUM_HEADER.timestamp,
    data: "",
    content: [],
    changesHash: "d".repeat(64),
    publicKey: "",
    signature: "",
    producer: "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f"
};

export const BASE_PLASMA = 21000;

export function attachMockNode(server: Server): WebSocketServer {
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (socket, req) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const difficulty = Number(url.searchParams.get("difficulty") ?? 0);

        const results: Record<string, () => unknown> = {
            "ledger.getFrontierAccountBlock": () => null,
            "ledger.getFrontierMomentum": () => FRONTIER_MOMENTUM,
            "embedded.plasma.getRequiredPoWForAccountBlock": () => ({
                availablePlasma: 0,
                basePlasma: BASE_PLASMA,
                requiredDifficulty: difficulty
            }),
            "ledger.publishRawTransaction": () => null,
            "ledger.subscribe": () => SUBSCRIPTION_ID
        };

        socket.on("message", (raw) => {
            const { id, method } = JSON.parse(raw.toString());
            const result = results[method];

            socket.send(JSON.stringify(result
                ? { jsonrpc: "2.0", id, result: result() }
                : { jsonrpc: "2.0", id, error: { code: -32601, message: `method ${method} not found` } }));

            if (method === "ledger.subscribe") {
                socket.send(JSON.stringify({
                    jsonrpc: "2.0",
                    method: "ledger.subscription",
                    params: { subscription: SUBSCRIPTION_ID, result: [MOMENTUM_HEADER] }
                }));
            }
        });
    });

    return wss;
}
