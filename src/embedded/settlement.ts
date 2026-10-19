import { EmbeddedContract } from "./embeddedContract.js";

export class Settlement extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"Update","inputs":[]},
		{"type":"function","name":"ReleaseWithdrawals","inputs":[
			{"name":"domainId","type":"uint32"}]},
		{"type":"function","name":"CollectReward","inputs":[]},
		{"type":"function","name":"RegisterExecutor","inputs":[
			{"name":"pillarName","type":"string"},
			{"name":"executorAddress","type":"address"}]},
		{"type":"function","name":"SetPeripheryConfig","inputs":[
			{"name":"znnPerByteOfBytecode","type":"uint256"},
			{"name":"znnPerByteOfState","type":"uint256"}]},

		{"type":"function","name":"RegisterDomain","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"domainClass","type":"uint8"},
			{"name":"runtimeKind","type":"uint8"},
			{"name":"stfSpecHash","type":"hash"},
			{"name":"inputSource","type":"uint8"},
			{"name":"execProfile","type":"uint8"},
			{"name":"foreignProfile","type":"uint8"},
			{"name":"profileConfig","type":"bytes"},
			{"name":"chainBinding","type":"bytes"},
			{"name":"minExecutors","type":"uint8"},
			{"name":"proposerPolicy","type":"uint8"},
			{"name":"finalityModel","type":"uint8"},
			{"name":"status","type":"uint8"},
			{"name":"withdrawalDelay","type":"uint64"},
			{"name":"runtimeUpgradeDelay","type":"uint64"}]},
		{"type":"function","name":"SetDomainConfig","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"withdrawalDelay","type":"uint64"},
			{"name":"runtimeUpgradeDelay","type":"uint64"}]},
		{"type":"function","name":"SetAssetConfig","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"assetId","type":"hash"},
			{"name":"maxBatchWithdrawal","type":"uint256"}]},
		{"type":"function","name":"SetApprovedDAModes","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"modes","type":"bytes"}]},
		{"type":"function","name":"Pause","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"isGlobal","type":"bool"},
			{"name":"scope","type":"uint8"},
			{"name":"active","type":"bool"}]},
		{"type":"function","name":"InitiateEscapeHatch","inputs":[
			{"name":"domainId","type":"uint32"}]},
		{"type":"function","name":"Deposit","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"targetContract","type":"hash"},
			{"name":"plasmaLimit","type":"uint64"}]},
		{"type":"function","name":"SubmitBatch","inputs":[
			{"name":"commitment","type":"bytes"}]},
		{"type":"function","name":"RelayMessage","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"batchId","type":"uint64"},
			{"name":"message","type":"bytes"},
			{"name":"inclusionProof","type":"bytes"}]},
		{"type":"function","name":"DeployContractStart","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"codeHash","type":"hash"},
			{"name":"metadataHash","type":"hash"},
			{"name":"totalSize","type":"uint64"},
			{"name":"chunkCount","type":"uint32"},
			{"name":"metadata","type":"bytes"}]},
		{"type":"function","name":"DeployContractChunk","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"codeHash","type":"hash"},
			{"name":"chunkIndex","type":"uint32"},
			{"name":"chunkHash","type":"hash"},
			{"name":"chunkData","type":"bytes"}]},
		{"type":"function","name":"DeployContractFinalize","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"codeHash","type":"hash"}]},
		{"type":"function","name":"CallL2","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"targetContract","type":"hash"},
			{"name":"plasmaLimit","type":"uint64"},
			{"name":"payload","type":"bytes"}]},
		{"type":"function","name":"UpgradeContract","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"contractId","type":"hash"},
			{"name":"newCodeHash","type":"hash"}]},
		{"type":"function","name":"TransferContractOwnership","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"contractId","type":"hash"},
			{"name":"newOwner","type":"address"}]},
		{"type":"function","name":"BuyStorage","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"contractId","type":"hash"},
			{"name":"bytes","type":"uint64"}]},

		{"type":"variable","name":"domainRecord","inputs":[
			{"name":"domainClass","type":"uint8"},
			{"name":"runtimeKind","type":"uint8"},
			{"name":"stfSpecHash","type":"hash"},
			{"name":"inputSource","type":"uint8"},
			{"name":"execProfile","type":"uint8"},
			{"name":"foreignProfile","type":"uint8"},
			{"name":"profileConfig","type":"bytes"},
			{"name":"chainBinding","type":"bytes"},
			{"name":"minExecutors","type":"uint8"},
			{"name":"proposerPolicy","type":"uint8"},
			{"name":"finalityModel","type":"uint8"},
			{"name":"status","type":"uint8"}
		]},

		{"type":"variable","name":"batchEntry","inputs":[
			{"name":"protocolVersion","type":"uint16"},
			{"name":"firstInputSeq","type":"uint64"},
			{"name":"lastInputSeq","type":"uint64"},
			{"name":"preStateRoot","type":"hash"},
			{"name":"postStateRoot","type":"hash"},
			{"name":"inputRoot","type":"hash"},
			{"name":"receiptRoot","type":"hash"},
			{"name":"eventRoot","type":"hash"},
			{"name":"outboxRoot","type":"hash"},
			{"name":"daHash","type":"hash"},
			{"name":"daMode","type":"uint8"},
			{"name":"executorPillar","type":"string"},
			{"name":"submittedAtHeight","type":"uint64"},
			{"name":"finalizeAtHeight","type":"uint64"},
			{"name":"assetFlowSummary","type":"bytes"},
			{"name":"proofData","type":"bytes"},
			{"name":"state","type":"uint8"}
		]},

		{"type":"variable","name":"inputSequenceCursor","inputs":[
			{"name":"consumedInputCount","type":"uint64"},
			{"name":"nextBatchId","type":"uint64"},
			{"name":"recordsSweptThrough","type":"uint64"},
			{"name":"sweptInputCount","type":"uint64"}
		]},

		{"type":"variable","name":"domainInputCounter","inputs":[
			{"name":"count","type":"uint64"}
		]},

		{"type":"variable","name":"domainInputOrdinal","inputs":[
			{"name":"globalInputIndex","type":"uint64"},
			{"name":"sourceAccountBlockHash","type":"hash"}
		]},

		{"type":"variable","name":"receivedInputCounter","inputs":[
			{"name":"count","type":"uint64"}
		]},

		{"type":"variable","name":"assignedIndexRecord","inputs":[
			{"name":"assetId","type":"hash"},
			{"name":"amount","type":"uint256"},
			{"name":"fee","type":"uint256"}
		]},

		{"type":"variable","name":"cumulativeDepositTotal","inputs":[
			{"name":"cumulativeDeposited","type":"uint256"}
		]},

		{"type":"variable","name":"conservationCounters","inputs":[
			{"name":"totalDeposited","type":"uint256"},
			{"name":"pendingWithdrawalReserve","type":"uint256"},
			{"name":"totalReleased","type":"uint256"}
		]},

		{"type":"variable","name":"releaseQueueEntry","inputs":[
			{"name":"recipient","type":"address"},
			{"name":"assetId","type":"hash"},
			{"name":"amount","type":"uint256"},
			{"name":"outboxId","type":"hash"}
		]},

		{"type":"variable","name":"releaseQueueMeta","inputs":[
			{"name":"head","type":"uint64"},
			{"name":"tail","type":"uint64"}
		]},

		{"type":"variable","name":"releaseRateLimit","inputs":[
			{"name":"height","type":"uint64"}
		]},

		{"type":"variable","name":"batchWithdrawalTotal","inputs":[
			{"name":"contractAmount","type":"uint256"},
			{"name":"refundAmount","type":"uint256"}
		]},

		{"type":"variable","name":"deployRecord","inputs":[
			{"name":"metadataHash","type":"hash"},
			{"name":"totalSize","type":"uint64"},
			{"name":"chunkCount","type":"uint32"},
			{"name":"startHeight","type":"uint64"},
			{"name":"receivedCount","type":"uint32"}
		]},

		{"type":"variable","name":"deployChunk","inputs":[
			{"name":"chunkHash","type":"hash"}
		]},

		{"type":"variable","name":"deployStartQueueEntry","inputs":[
			{"name":"domainId","type":"uint32"},
			{"name":"deployer","type":"address"},
			{"name":"codeHash","type":"hash"},
			{"name":"startHeight","type":"uint64"}
		]},

		{"type":"variable","name":"deployStartQueueMeta","inputs":[
			{"name":"head","type":"uint64"},
			{"name":"tail","type":"uint64"}
		]},

		{"type":"variable","name":"executorSetMember","inputs":[
			{"name":"pillarName","type":"string"},
			{"name":"executorAddress","type":"address"},
			{"name":"registrationHeight","type":"uint64"},
			{"name":"status","type":"uint8"}
		]},

		{"type":"variable","name":"peripheryConfig","inputs":[
			{"name":"znnPerByteOfBytecode","type":"uint256"},
			{"name":"znnPerByteOfState","type":"uint256"}
		]},

		{"type":"variable","name":"pendingFee","inputs":[
			{"name":"pillarName","type":"string"},
			{"name":"amount","type":"uint256"}
		]},

		{"type":"variable","name":"feeEpoch","inputs":[
			{"name":"finalityHeight","type":"uint64"}
		]},

		{"type":"variable","name":"feeCounters","inputs":[
			{"name":"totalFeesCollected","type":"uint256"},
			{"name":"totalFeesBurned","type":"uint256"},
			{"name":"totalFeesCredited","type":"uint256"},
			{"name":"totalRewardsCollected","type":"uint256"}
		]},

		{"type":"variable","name":"domainConfig","inputs":[
			{"name":"withdrawalDelay","type":"uint64"},
			{"name":"runtimeUpgradeDelay","type":"uint64"}
		]},

		{"type":"variable","name":"assetConfig","inputs":[
			{"name":"maxBatchWithdrawal","type":"uint256"}
		]},

		{"type":"variable","name":"approvedDAModeSet","inputs":[
			{"name":"modes","type":"bytes"}
		]},

		{"type":"variable","name":"domainCounter","inputs":[
			{"name":"lastDomainId","type":"uint32"}
		]},

		{"type":"variable","name":"pauseState","inputs":[
			{"name":"submitPaused","type":"bool"},
			{"name":"relayPaused","type":"bool"}
		]},

		{"type":"variable","name":"escapeHatchRecord","inputs":[
			{"name":"triggeredAtHeight","type":"uint64"}
		]},

		{"type":"variable","name":"assetRegistryEntry","inputs":[
			{"name":"custodyMode","type":"uint8"},
			{"name":"foreignChainId","type":"bytes"},
			{"name":"foreignAssetRef","type":"bytes"},
			{"name":"decimalsPolicy","type":"bytes"},
			{"name":"provenForeignLocks","type":"uint256"},
			{"name":"mintedSupply","type":"uint256"},
			{"name":"burnedSupply","type":"uint256"},
			{"name":"authorizedForeignRelease","type":"uint256"}
		]},

		{"type":"variable","name":"messageState","inputs":[
			{"name":"timeout","type":"uint64"},
			{"name":"ackPolicy","type":"uint8"},
			{"name":"state","type":"uint8"}
		]},

		{"type":"variable","name":"validityKeyRegistryEntry","inputs":[
			{"name":"reserved","type":"bytes"}
		]}
	]`;
}
