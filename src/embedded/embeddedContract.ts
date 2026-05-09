import { Abi } from "../abi/abi.js";
import type { FunctionFragment } from "../abi/fragments.js";

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

    static getFunctions(): Array<{ name: string; signature: string; fingerprint: string }> {
        return this.abi.fragments
            .filter((f): f is FunctionFragment => f.type === "function")
            .map(f => ({
                name: f.name,
                signature: f.format(),
                fingerprint: Abi.getSighash(f).slice(2).toLowerCase(),
            }));
    }

    static encodeCall(name: string, values?: any[]): string {
        return this.abi.encodeFunctionData(name, values);
    }

    static decodeCall(name: string, data: string, named = true): Record<string, any> | any[] {
        return this.abi.decodeFunctionData(name, data, named);
    }

    static decodeCallData(data: string, named = true): { name: string; args: Record<string, any> | any[] } {
        const tx = this.abi.parseTransaction({ data });
        return {
            name: tx.name,
            args: this.abi.decodeFunctionData(tx.name, data, named),
        };
    }
}
