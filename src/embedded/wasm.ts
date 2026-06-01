import { EmbeddedContract } from "./embeddedContract.js";

export class Wasm extends EmbeddedContract {
    protected static readonly definition: string = `
	[
		{"type":"function","name":"Deploy","inputs":[
			{"name":"wasmAddr","type":"address"},
			{"name":"salt","type":"bytes32"},
			{"name":"chunkIndex","type":"uint32"},
			{"name":"totalChunks","type":"uint32"},
			{"name":"chunkData","type":"bytes"}
		]},

		{"type":"function","name":"Activate","inputs":[
			{"name":"wasmAddr","type":"address"},
			{"name":"salt","type":"bytes32"},
			{"name":"upgradeable","type":"bool"}
		]},

		{"type":"function","name":"DiscardChunks","inputs":[
			{"name":"wasmAddr","type":"address"},
			{"name":"salt","type":"bytes32"}
		]},

		{"type":"function","name":"Halt","inputs":[]},

		{"type":"function","name":"Unhalt","inputs":[]},

		{"type":"function","name":"ChangeAdministrator","inputs":[
			{"name":"newAdmin","type":"address"}
		]},

		{"type":"function","name":"Execute","inputs":[
			{"name":"function","type":"string"},
			{"name":"args","type":"bytes"}
		]},

		{"type":"function","name":"Revoke","inputs":[
			{"name":"wasmAddr","type":"address"}
		]},

		{"type":"function","name":"Pause","inputs":[
			{"name":"wasmAddr","type":"address"}
		]},

		{"type":"function","name":"Unpause","inputs":[
			{"name":"wasmAddr","type":"address"}
		]},

		{"type":"function","name":"SetWasmVariables","inputs":[
			{"name":"executionGasLimit","type":"uint64"},
			{"name":"onReceiveGasLimit","type":"uint64"},
			{"name":"maxDescendantBlocks","type":"uint64"},
			{"name":"maxEventsPerExecute","type":"uint64"},
			{"name":"maxEventDataPerEvent","type":"uint64"},
			{"name":"maxEventBytesPerExecute","type":"uint64"},
			{"name":"maxViewReturnSize","type":"uint64"},
			{"name":"qsrPerByteOfBytecode","type":"uint64"},
			{"name":"minBytecodeCost","type":"uint64"},
			{"name":"qsrPerByteOfState","type":"uint64"},
			{"name":"maxWasmBytecodeSize","type":"uint64"},
			{"name":"maxChunkCount","type":"uint64"},
			{"name":"chunkTTLMomentums","type":"uint64"}
		]},

		{"type":"variable","name":"wasmContractInfo","inputs":[
			{"name":"halted","type":"bool"},
			{"name":"administrator","type":"address"}
		]},

		{"type":"variable","name":"wasmContractMetadata","inputs":[
			{"name":"deployer","type":"address"},
			{"name":"version","type":"uint32"},
			{"name":"upgradeable","type":"bool"},
			{"name":"activated","type":"bool"},
			{"name":"bytecodeHash","type":"hash"},
			{"name":"bytecodeCost","type":"uint256"}
		]},

		{"type":"variable","name":"wasmChunkMetadata","inputs":[
			{"name":"totalChunks","type":"uint32"},
			{"name":"firstChunkHeight","type":"uint64"},
			{"name":"collectedQsr","type":"uint256"},
			{"name":"uploader","type":"address"},
			{"name":"isUpgrade","type":"bool"}
		]},

		{"type":"variable","name":"wasmVariables","inputs":[
			{"name":"executionGasLimit","type":"uint64"},
			{"name":"onReceiveGasLimit","type":"uint64"},
			{"name":"maxDescendantBlocks","type":"uint64"},
			{"name":"maxEventsPerExecute","type":"uint64"},
			{"name":"maxEventDataPerEvent","type":"uint64"},
			{"name":"maxEventBytesPerExecute","type":"uint64"},
			{"name":"maxViewReturnSize","type":"uint64"},
			{"name":"qsrPerByteOfBytecode","type":"uint64"},
			{"name":"minBytecodeCost","type":"uint64"},
			{"name":"qsrPerByteOfState","type":"uint64"},
			{"name":"maxWasmBytecodeSize","type":"uint64"},
			{"name":"maxChunkCount","type":"uint64"},
			{"name":"chunkTTLMomentums","type":"uint64"}
		]}
	]`;
}
