//ts-nocheck

import { Interface, Result } from "./interface.js";
import { FunctionFragment } from "./fragments.js";
import { BytesLike } from "../utilities/bytes.js";

// Lightweight extension of Interface that normalizes embedded JSON before constructing
export class Abi extends Interface {
    constructor(definition: string | any[]) {
        super(Abi.normalizeDefinition(definition));
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

