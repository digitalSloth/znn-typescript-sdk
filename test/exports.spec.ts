import { expect } from "chai";
import * as sdk from "../src/index.js";
import { StatsApi } from "../src/api/stats.js";

describe("Package exports", () => {
    it("does not export ExtraData", () => {
        expect(sdk).to.not.have.property("ExtraData");
    });

    it("does not expose StatsApi.extraData", () => {
        expect(StatsApi.prototype).to.not.have.property("extraData");
    });

    it("exports the stats models that remain", () => {
        expect(sdk).to.have.property("SyncInfo");
        expect(sdk).to.have.property("NetworkInfo");
    });
});
