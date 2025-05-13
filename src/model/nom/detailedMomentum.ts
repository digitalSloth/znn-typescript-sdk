import { Model } from "../base.js";
import { AccountBlock } from "./accountBlock.js";
import { Momentum } from "./momentum.js";

export class DetailedMomentum extends Model {
    constructor(
        public blocks: Array<AccountBlock> = [],
        public momentum: Momentum
    ){
        super()
    }

    static fromJson(json: {[key: string]: any}): DetailedMomentum {
        return new DetailedMomentum(
            json.blocks.map((item: any) => AccountBlock.fromJson(item)),
            Momentum.fromJson(json.momentum)
        );
    }
}

export class DetailedMomentumList extends Model {

    constructor(
        public count: number = 0,
        public list: Array<DetailedMomentum> = []
    ){
        super()
    }

    static fromJson(json: {[key: string]: any}): DetailedMomentumList {
        return new DetailedMomentumList(
            json.count,
            json.list.map(DetailedMomentum.fromJson)
        );
    }
}
