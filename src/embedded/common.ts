import { EmbeddedContract } from "./embeddedContract.js";

export class Common extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"variable","name":"lastUpdate","inputs":[
		    {"name":"height","type":"uint64"}
		]},
		{"type":"variable","name":"lastEpochUpdate","inputs":[
		    {"name":"lastEpoch", "type": "int64"}
		]},
		{"type":"variable","name":"rewardDeposit","inputs":[
			{"name":"znn","type":"uint256"},
			{"name":"qsr","type":"uint256"}
		]},
		{"type":"variable","name":"rewardDepositHistory","inputs":[
			{"name":"znn","type":"uint256"},
			{"name":"qsr","type":"uint256"}
		]},
		{"type":"variable","name":"qsrDeposit","inputs":[
			{"name":"qsr","type":"uint256"}
		]},
		{"type":"variable","name":"pillarVote","inputs":[
			{"name":"id","type":"hash"},
			{"name":"name","type":"string"},
			{"name":"vote","type":"uint8"}
		]},
		{"type":"variable","name":"votableHash","inputs":[
			{"name":"exists","type":"bool"}
		]},

		{"type":"function","name":"Update", "inputs":[]},
		{"type":"function","name":"CollectReward","inputs":[]},
		{"type":"function","name":"DepositQsr", "inputs":[]},
		{"type":"function","name":"WithdrawQsr", "inputs":[]},
		{"type":"function","name":"Donate", "inputs":[]},
		{"type":"function","name":"VoteByName","inputs":[
			{"name":"id","type":"hash"},
			{"name":"name","type":"string"},
			{"name":"vote","type":"uint8"}
		]},
		{"type":"function","name":"VoteByProdAddress","inputs":[
			{"name":"id","type":"hash"},
			{"name":"vote","type":"uint8"}
		]},
		{"type":"variable","name":"timeChallengeInfo","inputs":[
			{"name":"methodName","type":"string"},
			{"name":"paramsHash","type":"hash"},
			{"name":"challengeStartHeight","type":"uint64"}
		]},
		{"type":"variable","name":"securityInfo","inputs":[
			{"name":"guardians","type":"address[]"},
			{"name":"guardiansVotes","type":"address[]"},
			{"name":"administratorDelay","type":"uint64"},
			{"name":"softDelay","type":"uint64"}
		]}
	]`;
}
