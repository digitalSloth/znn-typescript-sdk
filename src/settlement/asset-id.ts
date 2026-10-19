import { Buffer } from "buffer";
import { Hash } from "../model/primitives/hash.js";
import { TokenStandard } from "../model/primitives/tokenStandard.js";

export class SettlementAssetIdError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SettlementAssetIdError";
    }
}

/** An `AssetID` is 22 zero bytes followed by the 10 ZTS bytes. */
export function assetIdFromZts(zts: TokenStandard): Hash {
    return new Hash(Buffer.concat([Buffer.alloc(22), zts.core]));
}

export function ztsFromAssetId(id: Hash): TokenStandard {
    const bytes = id.getBytes();
    if (!bytes.subarray(0, 22).every((b) => b === 0)) {
        throw new SettlementAssetIdError("non-canonical AssetID");
    }
    return TokenStandard.fromCore(bytes.subarray(22));
}
