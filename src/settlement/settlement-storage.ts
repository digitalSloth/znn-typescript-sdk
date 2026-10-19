import { sha3_256 } from "@noble/hashes/sha3";
import { concat } from "../utilities/bytes.js";
import { Address, Hash, SETTLEMENT_ADDRESS } from "../model/primitives/index.js";
import type { LedgerApi } from "../api/ledger.js";
import { Common as CommonContract, Settlement as SettlementContract } from "../embedded/index.js";
import { pathOfKey, SmtProofError, verifyAbsenceByPath, verifyProofByPath } from "../state/smt.js";

const u32 = (v: number) => {
    if (!Number.isInteger(v) || v < 0 || v > 0xffffffff) {
        throw new RangeError(`${v} does not fit in a u32`);
    }
    const out = new Uint8Array(4);
    new DataView(out.buffer).setUint32(0, v);
    return out;
};
const u64 = (v: bigint | number) => {
    if (BigInt(v) < 0n || BigInt(v) > 0xffffffffffffffffn) {
        throw new RangeError(`${v} does not fit in a u64`);
    }
    const out = new Uint8Array(8);
    new DataView(out.buffer).setBigUint64(0, BigInt(v));
    return out;
};
const nameHash = (name: string) => sha3_256(new TextEncoder().encode(name));
const key = (prefix: number, ...parts: Uint8Array[]) => concat([Uint8Array.of(prefix), ...parts]);

/** Time-challenge entries live under this prefix in every embedded contract. */
const TIME_CHALLENGE_PREFIX = 135;

/**
 * Settlement storage keys, one builder per entry of the go-zenon prefix
 * table (`0x01` domain record to `0x22` batch withdrawal total), plus the
 * time-challenge key. These are contract-local keys; {@link stateTreeKey}
 * turns one into the key of the L1 state tree.
 */
export const SettlementKeys = {
    domainRecord: (domainId: number) => key(0x01, u32(domainId)),
    batchEntry: (domainId: number, batchId: bigint) => key(0x02, u32(domainId), u64(batchId)),
    inputSequenceCursor: (domainId: number) => key(0x03, u32(domainId)),
    receivedInputCounter: () => key(0x04),
    assignedIndexRecord: (domainId: number, globalInputIndex: bigint) =>
        key(0x05, u32(domainId), u64(globalInputIndex)),
    cumulativeDepositTotal: (domainId: number, assetId: Hash) => key(0x06, u32(domainId), assetId.getBytes()),
    conservationCounters: (domainId: number, assetId: Hash) => key(0x07, u32(domainId), assetId.getBytes()),
    releaseQueueEntry: (domainId: number, registrationIndex: bigint) =>
        key(0x08, u32(domainId), u64(registrationIndex)),
    releaseQueueMeta: (domainId: number) => key(0x09, u32(domainId)),
    deployRecord: (domainId: number, deployer: Address, codeHash: Hash) =>
        key(0x0a, u32(domainId), deployer.getBytes(), codeHash.getBytes()),
    processedOutbox: (outboxId: Hash) => key(0x0b, outboxId.getBytes()),
    executorSetMember: (pillarName: string) => key(0x0c, nameHash(pillarName)),
    peripheryConfig: () => key(0x0d),
    assetRegistry: (domainId: number, assetId: Hash) => key(0x0e, u32(domainId), assetId.getBytes()),
    messageState: (outboxId: Hash) => key(0x0f, outboxId.getBytes()),
    validityKeyRegistry: (verifyingKeyId: Hash) => key(0x11, verifyingKeyId.getBytes()),
    globalPauseState: () => key(0x12),
    domainPauseState: (domainId: number) => key(0x13, u32(domainId)),
    escapeHatch: (domainId: number) => key(0x14, u32(domainId)),
    domainConfig: (domainId: number) => key(0x15, u32(domainId)),
    assetConfig: (domainId: number, assetId: Hash) => key(0x16, u32(domainId), assetId.getBytes()),
    approvedDAModeSet: (domainId: number) => key(0x17, u32(domainId)),
    domainCounter: () => key(0x18),
    pendingFee: (epoch: bigint, pillarName: string) => key(0x19, u64(epoch), nameHash(pillarName)),
    feeEpoch: (epoch: bigint) => key(0x1a, u64(epoch)),
    feeCounters: () => key(0x1b),
    deployChunk: (
        domainId: number,
        deployer: Address,
        codeHash: Hash,
        startHeight: bigint,
        chunkIndex: number
    ) => key(0x1c, u32(domainId), deployer.getBytes(), codeHash.getBytes(), u64(startHeight), u32(chunkIndex)),
    deployStartQueueEntry: (queueIndex: bigint) => key(0x1d, u64(queueIndex)),
    deployStartQueueMeta: () => key(0x1e),
    domainInputCounter: (domainId: number) => key(0x1f, u32(domainId)),
    domainInputOrdinal: (domainId: number, ordinal: bigint) => key(0x20, u32(domainId), u64(ordinal)),
    releaseRateLimit: (domainId: number) => key(0x21, u32(domainId)),
    batchWithdrawalTotal: (domainId: number, batchId: bigint, assetId: Hash) =>
        key(0x22, u32(domainId), u64(batchId), assetId.getBytes()),
    timeChallenge: (methodName: string) => key(TIME_CHALLENGE_PREFIX, nameHash(methodName)),
} as const;

/** The state-tree key of a Settlement storage key: `0x03 || SettlementContract || 0x04 || key`. */
export function stateTreeKey(storageKey: Uint8Array): Uint8Array {
    return concat([Uint8Array.of(0x03), SETTLEMENT_ADDRESS.getBytes(), Uint8Array.of(0x04), storageKey]);
}

/** Thrown when a state proof fails a check; the message names the check. */
export class SettlementProofError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SettlementProofError";
    }
}

/** A verified read of one Settlement storage entry. */
export interface SettlementRead {
    height: number;
    root: Hash;
    present: boolean;
    /** `null` when `present` is false. */
    value: Uint8Array | null;
}

const PROCESSED_OUTBOX_MARKER = 0x01;

/**
 * Reads Settlement storage through `ledger.getProof`, verifying every proof
 * against the momentum header's `StateRoot`. Point lookups only: a proof
 * cannot enumerate a prefix.
 */
export class SettlementStorage {
    constructor(private readonly ledger: LedgerApi) {}

    /**
     * Reads `storageKey` at momentum `height`. The height must hold a
     * version-3 momentum (`StateRootSpork` active) the node still retains.
     */
    async read(height: number, storageKey: Uint8Array): Promise<SettlementRead> {
        const momentum = (await this.ledger.getMomentumsByHeight(height, 1)).list[0];
        if (!momentum || momentum.height !== height) {
            throw new SettlementProofError(`no momentum at height ${height}`);
        }
        const headerRoot = momentum.stateRoot;
        if (!headerRoot || headerRoot.getBytes().every((b) => b === 0)) {
            throw new SettlementProofError(`momentum ${height} carries no StateRoot`);
        }

        const treeKey = stateTreeKey(storageKey);
        const response = await this.ledger.getProof(height, treeKey);
        if (!response.root.getBytes().equals(headerRoot.getBytes())) {
            throw new SettlementProofError("proof root does not match the momentum StateRoot");
        }

        const path = pathOfKey(treeKey);
        const root = headerRoot;
        try {
            if (response.value === null) {
                if (!verifyAbsenceByPath(root, path, response.proof)) {
                    throw new SettlementProofError("absence proof does not verify");
                }
                return { height, root, present: false, value: null };
            }
            if (!verifyProofByPath(root, path, response.value, response.proof)) {
                throw new SettlementProofError("inclusion proof does not verify");
            }
            return { height, root, present: true, value: new Uint8Array(response.value) };
        } catch (e) {
            if (e instanceof SmtProofError) {
                throw new SettlementProofError(e.message);
            }
            throw e;
        }
    }

    /**
     * Reads `storageKey` and decodes it as the named Settlement variable.
     * Returns `null` when the entry is absent.
     */
    async readVariable(
        height: number,
        storageKey: Uint8Array,
        variable: string
    ): Promise<Record<string, any> | null> {
        const result = await this.read(height, storageKey);
        return result.value === null ? null : SettlementContract.decodeVariable(variable, result.value);
    }

    /** Processed-outbox membership is the literal byte `0x01`, not an ABI blob. */
    async isOutboxProcessed(height: number, outboxId: Hash): Promise<boolean> {
        const result = await this.read(height, SettlementKeys.processedOutbox(outboxId));
        return result.value !== null && result.value.length === 1 && result.value[0] === PROCESSED_OUTBOX_MARKER;
    }

    /** A pending Settlement time challenge, or `null` when none is stored. */
    async readTimeChallenge(
        height: number,
        methodName: string
    ): Promise<{ methodName: string; paramsHash: string; challengeStartHeight: bigint } | null> {
        const result = await this.read(height, SettlementKeys.timeChallenge(methodName));
        if (result.value === null || result.value.length === 0) {
            return null;
        }
        const decoded = CommonContract.decodeVariable("timeChallengeInfo", result.value);
        return {
            methodName: decoded.methodName,
            paramsHash: decoded.paramsHash,
            challengeStartHeight: BigInt(decoded.challengeStartHeight.toString()),
        };
    }
}
