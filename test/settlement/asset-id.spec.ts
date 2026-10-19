import { expect } from "chai";
import { Hash, TokenStandard, ZNN_ZTS } from "../../src/model/primitives/index.js";
import { SettlementAssetIdError, assetIdFromZts, ztsFromAssetId } from "../../src/settlement/index.js";

describe("settlement asset ids", () => {
    it("maps a ZTS to an AssetID and back", () => {
        const id = assetIdFromZts(ZNN_ZTS);
        expect(id.toString()).to.equal("0000000000000000000000000000000000000000000014e66318c6318c6318c6");
        expect(ztsFromAssetId(id).toString()).to.equal(ZNN_ZTS.toString());
        expect(ztsFromAssetId(id)).to.be.instanceOf(TokenStandard);
    });

    it("rejects a non-canonical AssetID", () => {
        const bad = Hash.parse("0100000000000000000000000000000000000000000014e66318c6318c6318c6");
        expect(() => ztsFromAssetId(bad)).to.throw(SettlementAssetIdError);
    });
});
