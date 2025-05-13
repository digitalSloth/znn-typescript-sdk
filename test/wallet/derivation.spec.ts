import { expect } from "chai";
import { Derivation } from "../../src/wallet/derivation.js";

describe("Derivation", () => {
    describe("getDerivationAccount", () => {
        it("should return the correct derivation", () => {
            const accountNumber = 5;
            expect(Derivation.getDerivationAccount(accountNumber)).to.equal(`m/44'/73404'/${accountNumber}'`);
        });
    });
});
