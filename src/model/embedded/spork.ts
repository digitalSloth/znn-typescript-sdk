import { Hash } from "../primitives/index.js";
import { Model } from "../base.js";

export class Spork extends Model {

    constructor(
        public id: Hash,
        public name: string,
        public description: string,
        public activated: boolean,
        public enforcementHeight: number,
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): Spork {
        return new Spork(
            Hash.parse(json.id),
            json.name,
            json.description,
            json.activated,
            json.enforcementHeight,
        );
    }
}

export class SporkList extends Model {

    constructor(
        public count: number,
        public list: Array<Spork>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): SporkList {
        return new SporkList(
            json.count,
            json.list.map(Spork.fromJson)
        );
    }
}
