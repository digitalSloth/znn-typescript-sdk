import net from "node:net";
import { WebSocketServer } from "ws";

/** A TCP server that drops every connection: an unreachable node to the client. */
export async function deadNode() {
    let connections = 0;
    const server = net.createServer((socket) => {
        connections++;
        socket.destroy();
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as net.AddressInfo;
    return {
        url: `ws://127.0.0.1:${port}`,
        connections: () => connections,
        close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    };
}

/**
 * A websocket server that keeps the first `keep` connections open and drops
 * every later one right after the handshake.
 */
export async function liveNode(keep = Infinity) {
    const server = new WebSocketServer({ port: 0, host: "127.0.0.1" });
    await new Promise((resolve) => server.once("listening", resolve));
    let connections = 0;
    server.on("connection", (socket) => {
        connections++;
        if (connections > keep) socket.terminate();
    });
    const { port } = server.address() as net.AddressInfo;
    return {
        url: `ws://127.0.0.1:${port}`,
        connections: () => connections,
        dropAll: () => server.clients.forEach((socket) => socket.terminate()),
        close: () => {
            server.clients.forEach((socket) => socket.terminate());
            return new Promise<void>((resolve) => server.close(() => resolve()));
        },
    };
}
