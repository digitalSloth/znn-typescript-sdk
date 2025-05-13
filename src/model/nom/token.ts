import { BigNumber } from "../../utilities/bignumber.js";
import { Address, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";

export class Token extends Model {
    constructor(
        public name: string,
        public symbol: string,
        public domain: string,
        public totalSupply: BigNumber,
        public decimals: number,
        public owner: Address,
        public tokenStandard: TokenStandard,
        public maxSupply: BigNumber,
        public isBurnable: boolean,
        public isMintable: boolean,
        public isUtility: boolean
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): Token {
        return new Token(
            json.name,
            json.symbol,
            json.domain,
            BigNumber.from(json.totalSupply),
            json.decimals,
            Address.parse(json.owner),
            TokenStandard.parse(json.tokenStandard),
            BigNumber.from(json.maxSupply),
            json.isBurnable,
            json.isMintable,
            json.isUtility
        );
    }

    decimalsExponent() {
        return Math.pow(10, this.decimals);
    }
}

export class TokenList extends Model {

    constructor(
        public count: number,
        public list: Array<Token>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): TokenList {
        return new TokenList(
            json.count,
            json.list.map(Token.fromJson)
        );
    }
}
