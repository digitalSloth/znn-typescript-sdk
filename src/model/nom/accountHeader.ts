import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";

export class AccountHeader extends Model {
    constructor(
        public address: Address,
        public hash: Hash,
        public height: number
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): AccountHeader {
        return new AccountHeader(
            Address.parse(json.address),
            Hash.parse(json.hash),
            json.height
        );
    }
}
