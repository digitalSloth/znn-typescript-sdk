import { sha3_256 } from "@noble/hashes/sha3";
import { concat } from "../utilities/bytes.js";
import { Address } from "../model/primitives/address.js";
import { Hash } from "../model/primitives/hash.js";
import { MaxMerkleProofDepth } from "./constants.js";

/** Length in bytes of a kind 1 outbox withdrawal message. */
export const OutboxWithdrawalSize = 133;

const WITHDRAWAL_KIND = 1;
const PROOF_STEP_SIZE = 33;
const CONTRACT_ADDRESS_BYTE = 1;

export class SettlementWithdrawalError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SettlementWithdrawalError";
    }
}

export interface OutboxWithdrawal {
    sourceContract: Hash;
    inputIndex: bigint;
    outboxIndex: number;
    recipient: Address;
    assetId: Hash;
    amount: bigint;
}

/**
 * `outboxId = SHA3-256(domainId(4B) || batchId(8B) || inputIndex(8B) ||
 * outboxIndex(4B))`, big-endian.
 */
export function outboxId(
    domainId: number,
    batchId: bigint,
    inputIndex: bigint,
    outboxIndex: number
): Hash {
    const out = new Uint8Array(24);
    const view = new DataView(out.buffer);
    view.setUint32(0, domainId);
    view.setBigUint64(4, batchId);
    view.setBigUint64(12, inputIndex);
    view.setUint32(20, outboxIndex);
    return new Hash(Buffer.from(sha3_256(out)));
}

/**
 * Decodes a registrable outbox message: kind 1, empty payload, canonical
 * asset id, non-zero amount and a recipient that is not an embedded
 * contract. Layout, big-endian: source_contract(32) || input_index(8) ||
 * outbox_index(4) || kind(1) || recipient(20) || asset_id(32) ||
 * amount(32) || payload_len(4).
 */
export function decodeOutboxWithdrawal(bytes: Uint8Array): OutboxWithdrawal {
    if (bytes.length !== OutboxWithdrawalSize) {
        throw new SettlementWithdrawalError(
            `outbox withdrawal must be ${OutboxWithdrawalSize} bytes, got ${bytes.length}`
        );
    }
    if (bytes[44] !== WITHDRAWAL_KIND) {
        throw new SettlementWithdrawalError(`outbox message kind ${bytes[44]} is not a withdrawal`);
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(129) !== 0) {
        throw new SettlementWithdrawalError("outbox withdrawal must have an empty payload");
    }
    const assetId = bytes.slice(65, 97);
    if (!assetId.subarray(0, 22).every((b) => b === 0)) {
        throw new SettlementWithdrawalError("non-canonical AssetID");
    }
    let amount = 0n;
    for (const b of bytes.subarray(97, 129)) {
        amount = (amount << 8n) | BigInt(b);
    }
    if (amount === 0n) {
        throw new SettlementWithdrawalError("outbox withdrawal amount must be non-zero");
    }
    const recipient = bytes.slice(45, 65);
    if (recipient[0] === CONTRACT_ADDRESS_BYTE) {
        throw new SettlementWithdrawalError("outbox withdrawal recipient is an embedded contract");
    }
    return {
        sourceContract: new Hash(Buffer.from(bytes.subarray(0, 32))),
        inputIndex: view.getBigUint64(32),
        outboxIndex: view.getUint32(40),
        recipient: Address.fromCore(recipient),
        assetId: new Hash(Buffer.from(assetId)),
        amount,
    };
}

/**
 * Rebuilds the batch outbox root from an encoded message and its proof
 * (SPEC §27.3 MerkleProof): step_count:u32 BE, then step_count steps of
 * side:u8 || sibling:bytes32. Side 0 means the sibling is the left node,
 * side 1 the right node. The leaf is `SHA3-256(0x00 || message)` and a
 * node is `SHA3-256(0x01 || left || right)`.
 */
export function outboxProofRoot(message: Uint8Array, proof: Uint8Array): Hash {
    if (proof.length < 4) {
        throw new SettlementWithdrawalError("outbox proof is shorter than its step count");
    }
    const view = new DataView(proof.buffer, proof.byteOffset, proof.byteLength);
    const count = view.getUint32(0);
    if (count > MaxMerkleProofDepth) {
        throw new SettlementWithdrawalError(
            `outbox proof has ${count} steps, above ${MaxMerkleProofDepth}`
        );
    }
    if (proof.length !== 4 + count * PROOF_STEP_SIZE) {
        throw new SettlementWithdrawalError("outbox proof length does not match its step count");
    }

    let node = sha3_256(concat([Uint8Array.of(0x00), message]));
    for (let i = 0; i < count; i++) {
        const step = proof.subarray(4 + i * PROOF_STEP_SIZE, 4 + (i + 1) * PROOF_STEP_SIZE);
        const sibling = step.subarray(1);
        if (step[0] === 0) {
            node = sha3_256(concat([Uint8Array.of(0x01), sibling, node]));
        } else if (step[0] === 1) {
            node = sha3_256(concat([Uint8Array.of(0x01), node, sibling]));
        } else {
            throw new SettlementWithdrawalError(`outbox proof step ${i} has side ${step[0]}`);
        }
    }
    return new Hash(Buffer.from(node));
}
