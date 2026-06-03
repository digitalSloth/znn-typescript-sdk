/**
 * Proof of Work utilities for Zenon Network
 */

export {
    init,
    initPoW,
    generate,
    benchmark,
    isInitialized
} from "./pow.js";

export {
    PowWorker,
    isPowWorkerSupported,
    resolvePowUrls,
    buildPowWorkerSource
} from "./powWorker.js";
export type { PowWorkerOptions } from "./powWorker.js";
