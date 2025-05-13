import { EmbeddedContract } from "./embeddedContract.js";

export class Liquidity extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"Update", "inputs":[]},
		{"type":"function","name":"Donate", "inputs":[]},
		{"type":"function","name":"Fund", "inputs":[
			{"name":"znnReward","type":"uint256"},
			{"name":"qsrReward","type":"uint256"}
		]},
		{"type":"function","name":"BurnZnn", "inputs":[
			{"name":"burnAmount","type":"uint256"}
		]},
		{"type":"function","name":"SetTokenTuple", "inputs":[
			{"name":"tokenStandards","type":"string[]"},
			{"name":"znnPercentages","type":"uint32[]"},
			{"name":"qsrPercentages","type":"uint32[]"},
			{"name":"minAmounts","type":"uint256[]"}
		]},
		{"type":"function","name":"NominateGuardians","inputs":[
			{"name":"guardians","type":"address[]"}
		]},
		{"type":"function","name":"ProposeAdministrator","inputs":[
			{"name":"address","type":"address"}
		]},
		{"type":"function","name":"Emergency","inputs":[]},
		{"type":"function","name":"SetIsHalted","inputs":[
			{"name":"isHalted","type":"bool"}
		]},
		{"type":"function","name":"LiquidityStake","inputs":[
			{"name":"durationInSec", "type":"int64"}
		]},
		{"type":"function","name":"CancelLiquidityStake","inputs":[
			{"name":"id","type":"hash"}
		]},
		{"type":"function","name":"UnlockLiquidityStakeEntries","inputs":[]},
		{"type":"function","name":"SetAdditionalReward","inputs":[
			{"name":"znnReward", "type":"uint256"},
			{"name":"qsrReward", "type":"uint256"}
		]},
		{"type":"function","name":"CollectReward","inputs":[]},
		{"type":"function","name":"ChangeAdministrator","inputs":[
			{"name":"administrator","type":"address"}
		]},

		{"type":"variable","name":"liquidityInfo","inputs":[
			{"name":"administrator","type":"address"},
			{"name":"isHalted","type":"bool"},
			{"name":"znnReward","type":"uint256"},
			{"name":"qsrReward","type":"uint256"},
			{"name":"tokenTuples","type":"bytes[]"}
		]},
		{"type":"variable","name":"tokenTuple","inputs":[
			{"name":"tokenStandard","type":"string"},
			{"name":"znnPercentage","type":"uint32"},
			{"name":"qsrPercentage","type":"uint32"},
			{"name":"minAmount","type":"uint256"}
		]},
		{"type":"variable", "name":"liquidityStakeEntry", "inputs":[
			{"name":"amount", "type":"uint256"},
			{"name":"tokenStandard", "type":"tokenStandard"},
			{"name":"weightedAmount", "type":"uint256"},
			{"name":"startTime", "type":"int64"},
			{"name":"revokeTime", "type":"int64"},
			{"name":"expirationTime", "type":"int64"}
		]},

		{"type":"variable","name":"securityInfo","inputs":[
			{"name":"guardians","type":"address[]"},
			{"name":"guardiansVotes","type":"address[]"},
			{"name":"administratorDelay","type":"uint64"},
			{"name":"softDelay","type":"uint64"}
		]}
	]`;
}
