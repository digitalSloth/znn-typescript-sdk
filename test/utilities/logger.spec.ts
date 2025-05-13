import { expect } from "chai";
import { ErrorCode, LogLevel, Logger } from "../../src/utilities/logger.js";

describe("utilities/logger", () => {
    it("makeError includes code and params and formats Uint8Array", () => {
        const logger = Logger.from();
        const err = logger.makeError("test message", ErrorCode.INVALID_ARGUMENT, { foo: 123, data: new Uint8Array([0xde, 0xad]) });
        expect(err).to.be.instanceOf(Error);
        expect((err as any).code).to.equal(ErrorCode.INVALID_ARGUMENT);
        expect(err.message).to.contain("foo=123");
        expect(err.message).to.contain("data=Uint8Array(0xdead)");
    });

    it("throwArgumentError sets code and fields", () => {
        const logger = Logger.from();
        try {
            logger.throwArgumentError("bad arg", "paramName", 42);
            expect.fail("should have thrown");
        } catch (e: any) {
            expect(e.code).to.equal(ErrorCode.INVALID_ARGUMENT);
            expect(e.message).to.contain("bad arg");
            expect(e.argument).to.equal("paramName");
            expect(e.value).to.equal(42);
        }
    });

    it("checkSafeUint53 throws on out-of-range and non-integer", () => {
        const logger = Logger.from();
        expect(() => logger.checkSafeUint53(2 ** 53)).to.throw();
        expect(() => logger.checkSafeUint53(-1 * (2 ** 53))).to.throw();
        expect(() => logger.checkSafeUint53(1.1)).to.throw();
        // valid (note: this implementation treats 0x1fffffffffffff as out-of-range)
        expect(() => logger.checkSafeUint53(9007199254740990)).to.not.throw();
    });

    it("checkArgumentCount throws for missing and unexpected", () => {
        const logger = Logger.from();
        expect(() => logger.checkArgumentCount(0, 1)).to.throw();
        expect(() => logger.checkArgumentCount(2, 1)).to.throw();
        expect(() => logger.checkArgumentCount(1, 1)).to.not.throw();
    });

    it("globalLogger returns singleton; setLogLevel accepts valid and ignores invalid", () => {
        const a = Logger.globalLogger();
        const b = Logger.globalLogger();
        expect(a).to.equal(b);

        // valid level
        Logger.setLogLevel(LogLevel.INFO);
        // invalid level should warn, but not throw
        expect(() => Logger.setLogLevel("NOT_A_LEVEL" as any)).to.not.throw();
    });
});
