import { EmbeddedContract } from "./embeddedContract.js";

export class Multisig extends EmbeddedContract {
    protected static readonly definition: string = `
    [
        {"type":"function","name":"CreateMultisig","inputs":[
            {"name":"nonce","type":"uint64"},
            {"name":"threshold","type":"uint8"},
            {"name":"signers","type":"bytes[]"}
        ]},
        {"type":"function","name":"ChangePolicy","inputs":[
            {"name":"threshold","type":"uint8"},
            {"name":"signers","type":"bytes[]"},
            {"name":"lock","type":"bool"}
        ]}
    ]`;
}
