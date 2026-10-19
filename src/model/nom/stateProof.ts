import { Model } from "../base.js";
import { Hash } from "../primitives/index.js";

/** The response of `ledger.getProof`: a value (or its absence) and a proof for the state tree. */
export class StateProof extends Model {
    constructor(
        /** `null` when the key is absent. */
        public value: Buffer | null,
        public proof: Buffer,
        public root: Hash
    ) {
        super();
    }

    static fromJson(json: {[key: string]: any}): StateProof {
        return new StateProof(
            json.value === null || json.value === undefined ? null : Buffer.from(json.value, "base64"),
            Buffer.from(json.proof, "base64"),
            Hash.parse(json.root)
        );
    }

    toJson(): {[key: string]: any} {
        return {
            value: this.value === null ? null : this.value.toString("base64"),
            proof: this.proof.toString("base64"),
            root: this.root.toString()
        };
    }
}
