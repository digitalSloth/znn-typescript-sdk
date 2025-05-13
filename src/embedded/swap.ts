import { EmbeddedContract } from "./embeddedContract.js";

export class Swap extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"RetrieveAssets", "inputs":[
		    {"name":"publicKey","type":"string"},
		    {"name":"signature","type":"string"}
		]},

		{"type":"variable","name":"swapEntry", "inputs":[
			{"name":"znn","type":"uint256"},
			{"name":"qsr","type":"uint256"}
		]}
	]`;
}
