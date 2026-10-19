import { sha3_256 } from "@noble/hashes/sha3";
import { concat } from "../utilities/bytes.js";
import { Hash } from "../model/primitives/hash.js";

const TREE_DEPTH = 256;
const BITMAP_BYTES = 32;
const ZERO32 = new Uint8Array(32);

/** Thrown for a structurally invalid proof or a proof for a different path. */
export class SmtProofError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SmtProofError";
    }
}

export interface SmtProof {
    present: boolean;
    /** The 32-byte tree position the proof is for. */
    path: Uint8Array;
    leafHash: Uint8Array;
    value: Uint8Array | null;
    /** Non-zero siblings keyed by depth (0..255). */
    siblings: Map<number, Uint8Array>;
}

/** Big-endian cursor over a serialized proof; every overrun throws {@link SmtProofError}. */
class ProofReader {
    private offset = 0;
    private readonly view: DataView;

    constructor(private readonly data: Uint8Array) {
        this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    }

    private take(length: number): Uint8Array {
        if (length > this.data.length - this.offset) {
            throw new SmtProofError(`truncated: need ${length} bytes, have ${this.data.length - this.offset}`);
        }
        const out = this.data.slice(this.offset, this.offset + length);
        this.offset += length;
        return out;
    }

    u8(): number {
        return this.take(1)[0];
    }

    u16(): number {
        this.take(2);
        return this.view.getUint16(this.offset - 2, false);
    }

    fixed(length: number): Uint8Array {
        return this.take(length);
    }

    bytes32(): Uint8Array {
        return this.take(32);
    }

    /** A `u32` length followed by that many bytes. */
    bytes(): Uint8Array {
        this.take(4);
        return this.take(this.view.getUint32(this.offset - 4, false));
    }

    end(): void {
        if (this.offset !== this.data.length) {
            throw new SmtProofError(`${this.data.length - this.offset} trailing bytes`);
        }
    }
}

const isZero = (bytes: Uint8Array) => bytes.every((b) => b === 0);
const equal = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);

/** `leaf = SHA3-256(path || value)`. */
export function leafHash(path: Uint8Array, value: Uint8Array): Uint8Array {
    return sha3_256(concat([path, value]));
}

/** The tree position of a raw application key: `SHA3-256(key)`. */
export function pathOfKey(rawKey: Uint8Array): Hash {
    return new Hash(Buffer.from(sha3_256(rawKey)));
}

function node(left: Uint8Array, right: Uint8Array): Uint8Array {
    if (isZero(left) && isZero(right)) {
        return ZERO32;
    }
    return sha3_256(concat([left, right]));
}

const pathBit = (path: Uint8Array, depth: number) => (path[depth >> 3] >> (7 - (depth & 7))) & 1;

/** Parses a proof per `proof-format.md` §4, rejecting every structural violation. */
export function decodeSmtProof(data: Uint8Array): SmtProof {
    try {
        const r = new ProofReader(data);
        const flags = r.u8();
        if ((flags & ~1) !== 0) {
            throw new SmtProofError("reserved flag bits set");
        }
        const present = (flags & 1) === 1;
        const path = r.bytes32();
        const proofLeafHash = r.bytes32();
        const bitmap = r.fixed(BITMAP_BYTES);
        const sibCount = r.u16();

        let popcount = 0;
        for (const byte of bitmap) {
            for (let b = byte; b; b &= b - 1) popcount++;
        }
        if (popcount !== sibCount) {
            throw new SmtProofError("sibling count does not match the bitmap");
        }
        if (!present && !isZero(proofLeafHash)) {
            throw new SmtProofError("an absence proof must carry a zero leaf hash");
        }

        const siblings = new Map<number, Uint8Array>();
        for (let i = 0; i < TREE_DEPTH; i++) {
            if ((bitmap[i >> 3] >> (7 - (i & 7))) & 1) {
                siblings.set(TREE_DEPTH - 1 - i, r.bytes32());
            }
        }

        let value: Uint8Array | null = null;
        if (present) {
            value = r.bytes();
            if (!equal(leafHash(path, value), proofLeafHash)) {
                throw new SmtProofError("leaf hash does not match the value");
            }
        }
        r.end();
        return { present, path, leafHash: proofLeafHash, value, siblings };
    } catch (e) {
        if (e instanceof SmtProofError) throw e;
        throw new SmtProofError(e instanceof Error ? e.message : String(e));
    }
}

function reconstructRoot(proof: SmtProof, start: Uint8Array): Uint8Array {
    let current = start;
    for (let depth = TREE_DEPTH - 1; depth >= 0; depth--) {
        const sibling = proof.siblings.get(depth) ?? ZERO32;
        current = pathBit(proof.path, depth) === 0 ? node(current, sibling) : node(sibling, current);
    }
    return current;
}

/**
 * Verifies that `value` sits at `path` under `root`. `path` is the 32-byte
 * tree position itself: callers derive it (for example with
 * {@link pathOfKey}) and the proof must name the same position.
 */
export function verifyProofByPath(root: Hash, path: Hash, value: Uint8Array, proof: Uint8Array): boolean {
    const decoded = decodeSmtProof(proof);
    if (!decoded.present) {
        throw new SmtProofError("expected an inclusion proof");
    }
    if (!equal(decoded.path, path.getBytes())) {
        throw new SmtProofError("proof is for a different path");
    }
    if (!equal(leafHash(decoded.path, value), decoded.leafHash)) {
        return false;
    }
    return equal(reconstructRoot(decoded, decoded.leafHash), root.getBytes());
}

/** Verifies that nothing sits at `path` under `root`. */
export function verifyAbsenceByPath(root: Hash, path: Hash, proof: Uint8Array): boolean {
    const decoded = decodeSmtProof(proof);
    if (decoded.present) {
        throw new SmtProofError("expected an absence proof");
    }
    if (!equal(decoded.path, path.getBytes())) {
        throw new SmtProofError("proof is for a different path");
    }
    return equal(reconstructRoot(decoded, ZERO32), root.getBytes());
}
