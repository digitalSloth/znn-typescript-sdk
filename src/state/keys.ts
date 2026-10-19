import { concat } from "../utilities/bytes.js";
import { Address } from "../model/primitives/address.js";
import { TokenStandard } from "../model/primitives/tokenStandard.js";

/** The state-tree key of an account's balance of one token: `0x03 || address || 0x03 || zts`. */
export function balanceKey(address: Address, tokenStandard: TokenStandard): Uint8Array {
    return concat([Uint8Array.of(0x03), address.getBytes(), Uint8Array.of(0x03), tokenStandard.getBytes()]);
}
