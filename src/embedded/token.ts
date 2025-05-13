import { EmbeddedContract } from "./embeddedContract.js";

export class Token extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"IssueToken","inputs":[
		    {"name":"tokenName","type":"string"},
		    {"name":"tokenSymbol","type":"string"},
		    {"name":"tokenDomain","type":"string"},
		    {"name":"totalSupply","type":"uint256"},
		    {"name":"maxSupply","type":"uint256"},
		    {"name":"decimals","type":"uint8"},
		    {"name":"isMintable","type":"bool"},
		    {"name":"isBurnable","type":"bool"},
		    {"name":"isUtility","type":"bool"}
		]},
		{"type":"function","name":"Mint","inputs":[
		    {"name":"tokenStandard","type":"tokenStandard"},
		    {"name":"amount","type":"uint256"},
		    {"name":"receiveAddress","type":"address"}
		]},
		{"type":"function","name":"Burn","inputs":[]},
		{"type":"function","name":"UpdateToken","inputs":[
		    {"name":"tokenStandard","type":"tokenStandard"},
		    {"name":"owner","type":"address"},
		    {"name":"isMintable","type":"bool"},
		    {"name":"isBurnable","type":"bool"}
		]},

		{"type":"variable","name":"tokenInfo","inputs":[
			{"name":"owner","type":"address"},
			{"name":"tokenName","type":"string"},
			{"name":"tokenSymbol","type":"string"},
			{"name":"tokenDomain","type":"string"},
			{"name":"totalSupply","type":"uint256"},
			{"name":"maxSupply","type":"uint256"},
			{"name":"decimals","type":"uint8"},
			{"name":"isMintable","type":"bool"},
			{"name":"isBurnable","type":"bool"},
			{"name":"isUtility","type":"bool"}
		]}
	]`;
}
