import { EmbeddedContract } from "./embeddedContract.js";

export class Accelerator extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"Update", "inputs":[]},
		{"type":"function","name":"Donate", "inputs":[]},
		{"type":"function","name":"CreateProject", "inputs":[
			{"name":"name","type":"string"},
			{"name":"description","type":"string"},
			{"name":"url","type":"string"},
			{"name":"znnFundsNeeded","type":"uint256"},
			{"name":"qsrFundsNeeded","type":"uint256"}
		]},
		{"type":"function","name":"AddPhase", "inputs":[
			{"name":"id","type":"hash"},
			{"name":"name","type":"string"},
			{"name":"description","type":"string"},
			{"name":"url","type":"string"},
			{"name":"znnFundsNeeded","type":"uint256"},
			{"name":"qsrFundsNeeded","type":"uint256"}
		]},
		{"type":"function","name":"UpdatePhase", "inputs":[
			{"name":"id","type":"hash"},
			{"name":"name","type":"string"},
			{"name":"description","type":"string"},
			{"name":"url","type":"string"},
			{"name":"znnFundsNeeded","type":"uint256"},
			{"name":"qsrFundsNeeded","type":"uint256"}
		]},
		{"type":"function","name":"VoteByName","inputs":[
			{"name":"id","type":"hash"},
			{"name":"name","type":"string"},
			{"name":"vote","type":"uint8"}
		]},
		{"type":"function","name":"VoteByProdAddress","inputs":[
			{"name":"id","type":"hash"},
			{"name":"vote","type":"uint8"}
		]},

		{"type":"variable","name":"project","inputs":[
			{"name":"id", "type":"hash"},
			{"name":"owner","type":"address"},
			{"name":"name","type":"string"},
			{"name":"description","type":"string"},
			{"name":"url","type":"string"},
			{"name":"znnFundsNeeded","type":"uint256"},
			{"name":"qsrFundsNeeded","type":"uint256"},
			{"name":"creationTimestamp","type":"int64"},
			{"name":"lastUpdateTimestamp","type":"int64"},
			{"name":"status","type":"uint8"},
			{"name":"phaseIds","type":"hash[]"}
		]},
		{"type":"variable","name":"phase","inputs":[
			{"name":"id", "type":"hash"},
			{"name":"projectId", "type":"hash"},
			{"name":"name","type":"string"},
			{"name":"description","type":"string"},
			{"name":"url","type":"string"},
			{"name":"znnFundsNeeded","type":"uint256"},
			{"name":"qsrFundsNeeded","type":"uint256"},
			{"name":"creationTimestamp","type":"int64"},
			{"name":"acceptedTimestamp","type":"int64"},
			{"name":"status","type":"uint8"}
		]}
	]`;
}
