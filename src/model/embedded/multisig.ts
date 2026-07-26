import { Buffer } from "buffer";
import { Model } from "../base.js";

export class MultisigPolicyInfo extends Model {
    constructor(
        public threshold: number,
        public signers: Buffer[],
        public locked: boolean,
    ) { super(); }

    static fromJson(json: any): MultisigPolicyInfo | null {
        if (json === null) return null;
        return new MultisigPolicyInfo(
            json.threshold,
            json.signers.map((s: string) => Buffer.from(s, "base64")),
            json.locked,
        );
    }
}

export class MultisigRecordInfo extends Model {
    constructor(
        public active: MultisigPolicyInfo | null,
        public pending: MultisigPolicyInfo | null,
        public pendingHeight: number,
    ) { super(); }

    static fromJson(json: any): MultisigRecordInfo {
        return new MultisigRecordInfo(
            MultisigPolicyInfo.fromJson(json.active),
            MultisigPolicyInfo.fromJson(json.pending),
            json.pendingHeight,
        );
    }
}
