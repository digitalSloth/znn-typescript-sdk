//ts-nocheck

import { Interface, Result } from "./interface.js";
import { FunctionFragment, ParamType } from "./fragments.js";
import { BytesLike } from "../utilities/bytes.js";

// Lightweight extension of Interface that normalizes embedded JSON before constructing
export class Abi extends Interface {
    private readonly _variables = new Map<string, ParamType[]>();

    constructor(definition: string | any[]) {
        super(Abi.normalizeDefinition(definition));

        const items = typeof definition === "string" ? JSON.parse(definition) : definition;
        for (const item of items) {
            if (item && item.type === "variable") {
                this._variables.set(
                    item.name,
                    (item.inputs ?? []).map((input: any) => ParamType.from(input))
                );
            }
        }
    }

    static from(definition: string | any[]): Abi {
        return new Abi(definition);
    }

    static normalizeDefinition(definition: string | any[]): any[] {
        const arr = typeof definition === "string" ? JSON.parse(definition) : definition;
        return arr
            .filter((item: any) => item && item.type !== "variable")
            .map((item: any) => {
                if (
                    item.type === "function"
                    && item.stateMutability == null
                    && item.payable == null
                    && item.constant == null
                ) {
                    return { ...item, stateMutability: "nonpayable" };
                }
                return item;
            });
    }

    //Override to optionally return a named object
    decodeFunctionData(functionFragment: FunctionFragment | string, data: BytesLike, named?: boolean): Result | any {
        const decoded = super.decodeFunctionData(functionFragment, data);
        if (named) {
            return this._toNamedObject(functionFragment, decoded);
        }
        return decoded;
    }

    // Decodes a stored variable (an ABI-packed tuple with no selector) into an object keyed by input name
    decodeVariable(name: string, data: BytesLike): Record<string, any> {
        const params = this._variables.get(name);
        if (!params) {
            throw new Error(`unknown variable: ${name}`);
        }
        const decoded = this._decodeParams(params, data);
        const obj: Record<string, any> = {};
        params.forEach((param, idx) => {
            obj[param.name ?? String(idx)] = decoded[idx];
        });
        return obj;
    }

    // Helper to map a decoded Result to a plain object keyed by input names
    _toNamedObject(functionFragment: FunctionFragment | string, decoded: Result): any {
        const f = typeof functionFragment === "string" ? this.getFunction(functionFragment) : functionFragment;
        const obj: any = {};
        f.inputs.forEach((input, idx) => {
            const key = input.name ?? String(idx);
            obj[key] = decoded[idx];
        });
        return obj;
    }
}

