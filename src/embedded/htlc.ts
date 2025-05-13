import { EmbeddedContract } from "./embeddedContract.js";

export class Htlc extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"Create", "inputs":[
			{"name":"hashLocked","type":"address"},
			{"name":"expirationTime","type":"int64"},
			{"name":"hashType","type":"uint8"},
			{"name":"keyMaxSize","type":"uint8"},
			{"name":"hashLock","type":"bytes"}
		]},
		{"type":"function","name":"Reclaim","inputs":[
			{"name":"id","type":"hash"}
		]},
		{"type":"function","name":"Unlock","inputs":[
			{"name":"id","type":"hash"},
			{"name":"preimage","type":"bytes"}
		]},
		{"type":"function","name":"DenyProxyUnlock","inputs":[]},
		{"type":"function","name":"AllowProxyUnlock","inputs":[]},

		{"type":"variable","name":"htlcInfo","inputs":[
			{"name":"timeLocked","type":"address"},
			{"name":"hashLocked","type":"address"},
			{"name":"tokenStandard","type":"tokenStandard"},
			{"name":"amount","type":"uint256"},
			{"name":"expirationTime", "type":"int64"},
			{"name":"hashType","type":"uint8"},
			{"name":"keyMaxSize","type":"uint8"},
			{"name":"hashLock","type":"bytes"}
		]},
		{"type":"variable","name":"htlcProxyUnlockInfo","inputs":[
			{"name":"allowed","type":"bool"}
		]}
	]`;
}
