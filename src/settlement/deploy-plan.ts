import { sha3_256 } from "@noble/hashes/sha3";
import { arrayify, BytesLike } from "../utilities/bytes.js";
import { Hash } from "../model/primitives/hash.js";
import { Settlement as SettlementContract } from "../embedded/index.js";
import {
    MaxChunkCount,
    MaxCodeSize,
    MaxContractMetadataSize,
    MaxDeployChunkData,
} from "./constants.js";

// Plasma pricing from go-zenon vm/constants/plasma.go and vm/plasma.go.
const ACCOUNT_BLOCK_BASE_PLASMA = 21000;
const BYTE_DATA_PLASMA = 68;
const EMBEDDED_SIMPLE_PLASMA = 52500;
const PLASMA_PER_FUSION_UNIT = 2100;
const QSR_PER_FUSION_UNIT = 100_000_000n;

/** The most plasma proof of work can supply for one send. */
export const MAX_POW_PLASMA = 94500;

export interface PeripheryPrices {
    znnPerByteOfBytecode: bigint;
}

export interface DeployChunk {
    index: number;
    data: Uint8Array;
    chunkHash: Hash;
    /** Plasma the `DeployContractChunk` send needs. */
    plasma: number;
}

export interface DeployPlan {
    codeHash: Hash;
    metadataHash: Hash;
    totalSize: bigint;
    chunkCount: number;
    chunks: DeployChunk[];
    /** ZNN attached to `DeployContractFinalize`: `totalSize * znnPerByteOfBytecode`. */
    fee: bigint;
    /** `chunkCount + 2`: start, every chunk, finalize. */
    sendCount: number;
    startPlasma: number;
    finalizePlasma: number;
    /** Plasma of the largest chunk send. */
    maxChunkPlasma: number;
    /** QSR (base units) to fuse for one largest-chunk send to be covered by fused plasma. */
    qsrPerChunkInFlight: bigint;
    /** How many of the largest chunk sends the sender's available plasma covers at once. */
    chunksInFlight: number;
    /** `true` when any send exceeds what proof of work can supply. */
    needsFusedPlasma: boolean;
}

/** Plasma a send to Settlement needs: the higher of the method price and the data price. */
export function sendPlasma(dataLength: number): number {
    return Math.max(EMBEDDED_SIMPLE_PLASMA, dataLength * BYTE_DATA_PLASMA + ACCOUNT_BLOCK_BASE_PLASMA);
}

const dataLength = (hex: string) => arrayify(hex).length;

/**
 * Splits a module into `DeployContractChunk` payloads and prices the
 * deploy: the bytecode fee, the send count and each send's plasma.
 */
export function planDeploy(
    module: BytesLike,
    metadata: BytesLike,
    prices: PeripheryPrices,
    availablePlasma: number
): DeployPlan {
    const code = arrayify(module);
    const metadataBytes = arrayify(metadata);

    if (code.length === 0) {
        throw new Error("module must not be empty");
    }
    if (code.length > MaxCodeSize) {
        throw new Error(`module must be at most ${MaxCodeSize} bytes`);
    }
    if (metadataBytes.length > MaxContractMetadataSize) {
        throw new Error(`metadata must be at most ${MaxContractMetadataSize} bytes`);
    }

    const codeHash = new Hash(Buffer.from(sha3_256(code)));
    const metadataHash = new Hash(Buffer.from(sha3_256(metadataBytes)));
    const chunkCount = Math.ceil(code.length / MaxDeployChunkData);
    if (chunkCount > MaxChunkCount) {
        throw new Error(`module needs ${chunkCount} chunks, at most ${MaxChunkCount} allowed`);
    }

    const chunks: DeployChunk[] = [];
    for (let index = 0; index < chunkCount; index++) {
        const data = code.slice(index * MaxDeployChunkData, (index + 1) * MaxDeployChunkData);
        const chunkHash = new Hash(Buffer.from(sha3_256(data)));
        const encoded = SettlementContract.abi.encodeFunctionData("DeployContractChunk", [
            0, codeHash.getBytes(), index, chunkHash.getBytes(), data,
        ]);
        chunks.push({ index, data, chunkHash, plasma: sendPlasma(dataLength(encoded)) });
    }

    const startPlasma = sendPlasma(dataLength(SettlementContract.abi.encodeFunctionData("DeployContractStart", [
        0, codeHash.getBytes(), metadataHash.getBytes(), BigInt(code.length), chunkCount, metadataBytes,
    ])));
    const finalizePlasma = sendPlasma(dataLength(SettlementContract.abi.encodeFunctionData("DeployContractFinalize", [
        0, codeHash.getBytes(),
    ])));

    const maxChunkPlasma = Math.max(...chunks.map((c) => c.plasma));
    const fusionUnits = BigInt(Math.ceil(maxChunkPlasma / PLASMA_PER_FUSION_UNIT));

    return {
        codeHash,
        metadataHash,
        totalSize: BigInt(code.length),
        chunkCount,
        chunks,
        fee: BigInt(code.length) * prices.znnPerByteOfBytecode,
        sendCount: chunkCount + 2,
        startPlasma,
        finalizePlasma,
        maxChunkPlasma,
        qsrPerChunkInFlight: fusionUnits * QSR_PER_FUSION_UNIT,
        chunksInFlight: Math.floor(availablePlasma / maxChunkPlasma),
        needsFusedPlasma: Math.max(startPlasma, finalizePlasma, maxChunkPlasma) > MAX_POW_PLASMA,
    };
}
