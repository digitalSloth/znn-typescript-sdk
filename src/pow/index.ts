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
    buildPowWorkerSource,
    servePowRequests
} from "./powWorker.js";
export type { PowWorkerOptions, ServePowRequestsOptions } from "./powWorker.js";
