import { Abi } from "../abi/abi.js";

export abstract class EmbeddedContract {
    protected static readonly definition: string;
    private static _abiCache = new Map<string, Abi>();

    static get abi(): Abi {
        const className = this.name;

        if (!this._abiCache.has(className)) {
            this._abiCache.set(className, Abi.from(this.definition));
        }

        return this._abiCache.get(className)!;
    }
}
