import { expect } from "chai";
import { isBrowser, isNode } from "../../src/utilities/global.js";

describe("Environment detection", () => {
    it("detects Node.js", () => {
        expect(isNode()).to.be.true;
        expect(isBrowser()).to.be.false;
    });

    it("treats an Electron renderer as non-Node", () => {
        const proc = process as { type?: string };
        proc.type = "renderer";
        try {
            expect(isNode()).to.be.false;
        } finally {
            delete proc.type;
        }
    });
});
