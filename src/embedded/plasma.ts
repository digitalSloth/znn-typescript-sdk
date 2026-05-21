import { EmbeddedContract } from "./embeddedContract.js";

export class Plasma extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"Fuse", "inputs":[
			{"name":"address","type":"address"}
		]},
		{"type":"function","name":"CancelFuse","inputs":[
			{"name":"id","type":"hash"}
		]},
		{"type":"function","name":"SetVariables", "inputs":[
			{"name":"maxBasePlasmaInMomentum","type":"uint64"},
			{"name":"fusedPlasmaTarget","type":"uint64"},
			{"name":"powPlasmaTarget","type":"uint64"},
			{"name":"maxPriceChangePercent","type":"uint8"},
			{"name":"priceChangeDenominator","type":"uint8"}
		]},

		{"type":"variable","name":"fusionInfo","inputs":[
			{"name":"amount","type":"uint256"},
			{"name":"expirationHeight","type":"uint64"},
			{"name":"beneficiary","type":"address"}
		]},
		{"type":"variable","name":"fusedAmount","inputs":[
			{"name":"amount","type":"uint256"}
		]},
		{"type":"variable","name":"plasmaVariables","inputs":[
			{"name":"maxBasePlasmaInMomentum","type":"uint64"},
			{"name":"fusedPlasmaTarget","type":"uint64"},
			{"name":"powPlasmaTarget","type":"uint64"},
			{"name":"maxPriceChangePercent","type":"uint8"},
			{"name":"priceChangeDenominator","type":"uint8"}
		]}
	]`;
}
