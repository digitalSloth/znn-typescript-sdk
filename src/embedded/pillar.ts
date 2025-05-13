import { EmbeddedContract } from "./embeddedContract.js";

export class Pillar extends EmbeddedContract {
    protected static readonly definition: string = `
	[
        {"type":"function","name":"Update", "inputs":[]},
		{"type":"function","name":"Register", "inputs":[
			{"name":"name","type":"string"},
			{"name":"producerAddress","type":"address"},
			{"name":"rewardAddress","type":"address"},
			{"name":"giveBlockRewardPercentage","type":"uint8"},
			{"name":"giveDelegateRewardPercentage","type":"uint8"}
		]},
		{"type":"function","name":"RegisterLegacy", "inputs":[
			{"name":"name","type":"string"},
			{"name":"producerAddress","type":"address"},
			{"name":"rewardAddress","type":"address"},
			{"name":"giveBlockRewardPercentage","type":"uint8"},
			{"name":"giveDelegateRewardPercentage","type":"uint8"},
			{"name":"publicKey", "type":"string"},
			{"name":"signature","type":"string"}
		]},
		{"type":"function","name":"UpdatePillar", "inputs":[
			{"name":"name","type":"string"},
			{"name":"producerAddress","type":"address"},
			{"name":"rewardAddress","type":"address"},
			{"name":"giveBlockRewardPercentage","type":"uint8"},
			{"name":"giveDelegateRewardPercentage","type":"uint8"}
		]},
		{"type":"function","name":"DepositQsr", "inputs":[]},
		{"type":"function","name":"WithdrawQsr", "inputs":[]},
		{"type":"function","name":"Revoke","inputs":[
		    {"name":"name","type":"string"}
		]},
		{"type":"function","name":"Delegate", "inputs":[
		    {"name":"name","type":"string"}
		]},
		{"type":"function","name":"Undelegate","inputs":[]},
		{"type":"function","name":"CollectReward","inputs":[]},

		{"type":"variable","name":"pillarInfo","inputs":[
			{"name":"name","type":"string"},
			{"name":"blockProducingAddress","type":"address"},
			{"name":"rewardWithdrawAddress","type":"address"},
			{"name":"stakeAddress","type":"address"},
			{"name":"amount","type":"uint256"},
			{"name":"registrationTime","type":"int64"},
			{"name":"revokeTime","type":"int64"},
			{"name":"giveBlockRewardPercentage","type":"uint8"},
			{"name":"giveDelegateRewardPercentage","type":"uint8"},
			{"name":"pillarType","type":"uint8"}
		]},
		{"type":"variable","name":"producingPillarName","inputs":[
			{"name":"name","type":"string"}
		]},
		{"type":"variable","name":"LegacyPillarEntry","inputs":[
			{"name":"pillarCount", "type":"uint8"}
		]},
		{"type":"variable","name":"delegationInfo","inputs":[
			{"name":"name","type":"string"}
		]},
		{"type":"variable","name":"pillarEpochHistory","inputs":[
			{"name":"giveBlockRewardPercentage","type":"uint8"},
			{"name":"giveDelegateRewardPercentage","type":"uint8"},
			{"name":"producedBlockNum","type":"int32"},
			{"name":"expectedBlockNum","type":"int32"},
			{"name":"weight","type":"uint256"}
		]}
	]`;
}
