import { expect } from "chai";
import { balanceKey } from "../../src/state/index.js";
import { Address, TokenStandard } from "../../src/model/primitives/index.js";

describe("balanceKey", () => {
    it("is 0x03 || address || 0x03 || zts", () => {
        const address = Address.parse("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
        const zts = TokenStandard.parse("zts1znnxxxxxxxxxxxxx9z4ulx");

        const key = balanceKey(address, zts);

        expect(key.length).to.equal(1 + address.getBytes().length + 1 + zts.getBytes().length);
        expect(key[0]).to.equal(0x03);
        expect(Buffer.from(key.subarray(1, 1 + address.getBytes().length)).equals(address.getBytes())).to.equal(true);
        expect(key[1 + address.getBytes().length]).to.equal(0x03);
        expect(Buffer.from(key.subarray(key.length - zts.getBytes().length)).equals(zts.getBytes())).to.equal(true);
    });
});
