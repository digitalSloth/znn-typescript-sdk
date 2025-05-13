import { EmbeddedContract } from "./embeddedContract.js";

export class Stake extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"Stake","inputs":[
		    {"name":"durationInSec", "type":"int64"}
		]},
		{"type":"function","name":"Cancel","inputs":[
		    {"name":"id","type":"hash"}
		]},
		{"type":"function","name":"CollectReward","inputs":[]},
		{"type":"function","name":"Update", "inputs":[]},

		{"type":"variable", "name":"stakeInfo", "inputs":[
			{"name":"amount", "type":"uint256"},
			{"name":"weightedAmount", "type":"uint256"},
			{"name":"startTime", "type":"int64"},
			{"name":"revokeTime", "type":"int64"},
			{"name":"expirationTime", "type":"int64"}
		]}
	]`;
}
