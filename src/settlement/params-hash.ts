import { sha3_256 } from "@noble/hashes/sha3";
import { arrayify, BytesLike, concat } from "../utilities/bytes.js";
import { Address } from "../model/primitives/address.js";
import { Hash } from "../model/primitives/hash.js";

export interface SettlementChallengeParams {
    RegisterDomain: {
        domainId: number;
        stfSpecHash: Hash;
        minExecutors: number;
        withdrawalDelay: bigint;
        runtimeUpgradeDelay: bigint;
    };
    SetDomainConfig: {
        domainId: number;
        withdrawalDelay: bigint;
        runtimeUpgradeDelay: bigint;
    };
    SetAssetConfig: {
        domainId: number;
        assetId: Hash;
        maxBatchWithdrawal: bigint;
    };
    SetApprovedDAModes: {
        domainId: number;
        modes: BytesLike;
    };
    InitiateEscapeHatch: {
        domainId: number;
    };
    RegisterExecutor: {
        pillarName: string;
        executorAddress: Address;
    };
    SetPeripheryConfig: {
        znnPerByteOfBytecode: bigint;
        znnPerByteOfState: bigint;
    };
}

export type SettlementChallengeMethod = keyof SettlementChallengeParams;

function u8(value: number): Uint8Array {
    return Uint8Array.of(value);
}

function u32(value: number): Uint8Array {
    const out = new Uint8Array(4);
    new DataView(out.buffer).setUint32(0, value, false);
    return out;
}

function u64(value: bigint): Uint8Array {
    const out = new Uint8Array(8);
    new DataView(out.buffer).setBigUint64(0, value, false);
    return out;
}

// 32-byte big-endian, matching go-zenon `common.BigIntToBytes`.
function u256(value: bigint): Uint8Array {
    const out = new Uint8Array(32);
    const view = new DataView(out.buffer);
    for (let i = 0; i < 4; i++) {
        view.setBigUint64(24 - i * 8, (value >> BigInt(64 * i)) & 0xffffffffffffffffn, false);
    }
    return out;
}

/**
 * The `paramsHash` Settlement records for a time-challenged administrator
 * call, mirroring the per-method hash in go-zenon
 * `vm/embedded/implementation/settlement.go`.
 */
export function settlementParamsHash<M extends SettlementChallengeMethod>(
    method: M,
    params: SettlementChallengeParams[M]
): Hash {
    const parts = paramsPreimage(method, params as SettlementChallengeParams[SettlementChallengeMethod]);
    return new Hash(Buffer.from(sha3_256(concat(parts))));
}

function paramsPreimage(
    method: SettlementChallengeMethod,
    params: SettlementChallengeParams[SettlementChallengeMethod]
): Uint8Array[] {
    switch (method) {
        case "RegisterDomain": {
            const p = params as SettlementChallengeParams["RegisterDomain"];
            return [
                u32(p.domainId),
                p.stfSpecHash.getBytes(),
                u8(p.minExecutors),
                u64(p.withdrawalDelay),
                u64(p.runtimeUpgradeDelay),
            ];
        }
        case "SetDomainConfig": {
            const p = params as SettlementChallengeParams["SetDomainConfig"];
            return [u32(p.domainId), u64(p.withdrawalDelay), u64(p.runtimeUpgradeDelay)];
        }
        case "SetAssetConfig": {
            const p = params as SettlementChallengeParams["SetAssetConfig"];
            return [u32(p.domainId), p.assetId.getBytes(), u256(p.maxBatchWithdrawal)];
        }
        case "SetApprovedDAModes": {
            const p = params as SettlementChallengeParams["SetApprovedDAModes"];
            return [u32(p.domainId), arrayify(p.modes)];
        }
        case "InitiateEscapeHatch": {
            const p = params as SettlementChallengeParams["InitiateEscapeHatch"];
            return [u32(p.domainId)];
        }
        case "RegisterExecutor": {
            const p = params as SettlementChallengeParams["RegisterExecutor"];
            return [new TextEncoder().encode(p.pillarName), p.executorAddress.getBytes()];
        }
        case "SetPeripheryConfig": {
            const p = params as SettlementChallengeParams["SetPeripheryConfig"];
            return [u256(p.znnPerByteOfBytecode), u256(p.znnPerByteOfState)];
        }
    }
}

/**
 * The time-challenge storage key Settlement scopes a pending call under,
 * for example `SetDomainConfig/3`.
 */
export function settlementChallengeKey<M extends SettlementChallengeMethod>(
    method: M,
    params: SettlementChallengeParams[M]
): string {
    switch (method) {
        case "RegisterDomain":
        case "SetDomainConfig":
        case "SetApprovedDAModes": {
            const p = params as { domainId: number };
            return `${method}/${p.domainId}`;
        }
        case "SetAssetConfig": {
            const p = params as SettlementChallengeParams["SetAssetConfig"];
            return `${method}/${p.domainId}/${p.assetId.toString()}`;
        }
        case "InitiateEscapeHatch":
        case "RegisterExecutor":
        case "SetPeripheryConfig":
            return method;
    }
}
