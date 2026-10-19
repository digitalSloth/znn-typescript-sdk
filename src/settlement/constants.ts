// Fixed Settlement protocol constants, mirroring go-zenon vm/constants/settlement.go.
// Sizes are in bytes unless noted.
export const MaxCallPayload = 1024 * 8;
export const MaxDeployChunkData = 1024 * 15;
export const MaxCodeSize = 1024 * 256;
export const MaxChunkCount = 18;
export const MaxContractMetadataSize = 256;
// Momentum heights.
export const DeploymentExpiryWindow = 2880;
export const MaxInputGas = 1_000_000_000n;
// Steps in one MerkleProof, for any batch root.
export const MaxMerkleProofDepth = 32;
// Percent of each settled fee burned.
export const FeeBurnShare = 30;

// Enumerations of SPEC §27.11. Each value is a `u8` on the wire.
export const DomainClass = { EXECUTION: 0, BRIDGE: 1, MESSAGING: 2 } as const;
export const RuntimeKind = { WASM: 0 } as const;
export const InputSource = { L1_NATIVE: 0, L1_RELAYED: 1 } as const;
export const ExecProfile = { ATTESTATION: 0, ZK_VALIDITY: 2 } as const;
export const ForeignProfile = { NONE: 0, COMMITTEE: 1, LIGHT_CLIENT: 2, ZK_CONSENSUS: 3 } as const;
export const ProposerPolicy = { SINGLE: 0 } as const;
export const FinalityModel = { DELAY: 0, PROOF_VERIFIED: 2 } as const;
export const DomainStatus = { ACTIVE: 0, PAUSED: 1 } as const;
export const BatchState = { SUBMITTED: 0 } as const;
export const ExecutorStatus = { ACTIVE: 0 } as const;
export const PauseScope = { PAUSE_SUBMIT: 0, PAUSE_RELAY: 1 } as const;
export const UpgradePolicy = { IMMUTABLE: 0, OWNER_UPGRADEABLE: 1 } as const;
// Best-effort Sentinel/libp2p publication is the only Phase 1 value.
export const DAMode = { BEST_EFFORT: 0 } as const;
