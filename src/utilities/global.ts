export function isBrowser(): boolean {
    return typeof window !== "undefined"
        && typeof window.document !== "undefined"
        && typeof navigator !== "undefined";
}

/**
 * True in Node.js. An Electron renderer exposes `process.versions.node` but
 * runs web code, so it counts as non-Node. This matches how the PoW glue
 * (`lib/pow.js`) detects Node.
 */
export function isNode(): boolean {
    return typeof process !== "undefined"
        && typeof process.versions !== "undefined"
        && typeof process.versions.node !== "undefined"
        && (process as { type?: string }).type !== "renderer";
}
