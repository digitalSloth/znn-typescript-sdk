import { Model } from "../base.js";
import { Address } from "../primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { Token } from "./token.js";

export class AccountInfo extends Model {
    constructor(
        public address: Address,
        public blockCount: number = 0,
        public balanceInfoMap: {[key: string]: BalanceInfoListItem} = {}
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): AccountInfo {
        const balanceInfoMap: {[key: string]: BalanceInfoListItem} = {};

        if (json.accountHeight > 0 && json.balanceInfoMap) {
            for (const [key, value] of Object.entries(json.balanceInfoMap)) {
                balanceInfoMap[key] = BalanceInfoListItem.fromJson(value as {[key: string]: any});
            }
        }

        return new AccountInfo(
            Address.parse(json.address),
            json.accountHeight,
            balanceInfoMap
        );
    }

    toJson(): {[key: string]: any} {
        const balanceInfoMapJson: {[key: string]: any} = {};
        for (const [key, value] of Object.entries(this.balanceInfoMap)) {
            balanceInfoMapJson[key] = value.toJson();
        }

        return {
            address: this.address.toString(),
            blockCount: this.blockCount,
            balanceInfoMap: balanceInfoMapJson,
        };
    }
}

export class BalanceInfoListItem extends Model {
    constructor(
        public token: Token,
        public balance: BigNumber
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): BalanceInfoListItem {
        return new BalanceInfoListItem(
            Token.fromJson(json.token),
            BigNumber.from(json.balance)
        );
    }
}
