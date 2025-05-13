import { expect } from "chai";
import {
    UnicodeNormalizationForm,
    Utf8ErrorFuncs,
    _toEscapedUtf8String,
    toUtf8Bytes,
    toUtf8CodePoints,
    toUtf8String
} from "../../src/utilities/utf8.js";

describe("utilities/utf8", () => {
    it("roundtrips simple ASCII", () => {
        const input = "Hello, world!";
        const bytes = toUtf8Bytes(input);
        expect(Buffer.from(bytes).toString("hex")).to.equal(Buffer.from(input, "utf8").toString("hex"));
        const str = toUtf8String(bytes);
        expect(str).to.equal(input);
    });

    it("roundtrips emoji (surrogate pair)", () => {
        const input = "😀"; // U+1F600
        const bytes = toUtf8Bytes(input);
        const str = toUtf8String(bytes);
        expect(str).to.equal(input);
    });

    it("normalizes when requested", () => {
    // e.g., "é" can be represented as single code point or as e + combining accent
        const composed = "\u00E9";
        const decomposed = "\u0065\u0301";

        const bytesComposed = toUtf8Bytes(composed, UnicodeNormalizationForm.NFC);
        const bytesDecomposed = toUtf8Bytes(decomposed, UnicodeNormalizationForm.NFC);

        expect(Buffer.from(bytesComposed).toString("hex")).to.equal(Buffer.from(bytesDecomposed).toString("hex"));
    });

    it("replaces invalid sequences when using replace strategy", () => {
    // Construct invalid UTF-8: stray continuation byte 0x80
        const bad = new Uint8Array([0x80, 0x61]); // invalid then 'a'
        const escaped = _toEscapedUtf8String(bad, Utf8ErrorFuncs.replace);
        // Expect first char becomes replacement (\uFFFD), then 'a'
        expect(escaped).to.equal('"\\ufffda"');

        const str = toUtf8String(bad, Utf8ErrorFuncs.replace);
        expect(str).to.equal("\uFFFDa");
    });

    it("throws on invalid sequences when using error strategy", () => {
        const bad = new Uint8Array([0xc2]); // overrun for 2-byte sequence
        expect(() => toUtf8String(bad, Utf8ErrorFuncs.error)).to.throw();
    });

    it("toUtf8CodePoints returns code points of string", () => {
        const cps = toUtf8CodePoints("Az");
        expect(cps).to.deep.equal([0x41, 0x7a]);
    });
});
