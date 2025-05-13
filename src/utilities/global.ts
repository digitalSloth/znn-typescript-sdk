export function isBrowser(): boolean {
    return typeof window !== "undefined"
        && typeof window.document !== "undefined"
        && typeof navigator !== "undefined";
}

export function isNode(): boolean {
    return typeof process !== "undefined"
        && typeof process.versions !== "undefined"
        && typeof process.versions.node !== "undefined";
}
