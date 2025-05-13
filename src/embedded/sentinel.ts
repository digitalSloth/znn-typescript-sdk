import { EmbeddedContract } from "./embeddedContract.js";

export class Sentinel extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"DepositQsr","inputs":[]},
		{"type":"function","name":"WithdrawQsr","inputs":[]},
		{"type":"function","name":"Register","inputs":[]},
		{"type":"function","name":"Revoke","inputs":[]},
		{"type":"function","name":"Update", "inputs":[]},
		{"type":"function","name":"CollectReward","inputs":[]},

		{"type":"variable","name":"sentinelInfo","inputs":[
			{"name":"owner","type":"address"},
			{"name":"registrationTimestamp","type":"int64"},
			{"name":"revokeTimestamp","type":"int64"},
			{"name":"znnAmount","type":"uint256"},
			{"name":"qsrAmount","type":"uint256"}]}
	]`;
}
