import { expect } from "chai";
import { Api } from "../../src/api/base.js";
import { MockClient } from "./mockClient.js";

// Create a concrete test class that extends Api
class TestApi extends Api {
    // Expose protected methods for testing
    public testValidateMin(value: number, min: number, paramName: string): void {
        this.validateMin(value, min, paramName);
    }

    public testValidateMax(value: number, max: number, paramName: string): void {
        this.validateMax(value, max, paramName);
    }

    public testValidateRange(value: number, min: number, max: number, paramName: string): void {
        this.validateRange(value, min, max, paramName);
    }
}

describe("Api", () => {
    let testApi: TestApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        testApi = new TestApi();
        testApi.setClient(mockClient);
    });

    describe("setClient", () => {
        it("should set the client correctly", () => {
            expect(testApi.client).to.equal(mockClient);
        });
    });

    describe("validateMin", () => {
        it("should not throw when value equals minimum", () => {
            expect(() => testApi.testValidateMin(0, 0, "pageIndex")).to.not.throw();
            expect(() => testApi.testValidateMin(1, 1, "height")).to.not.throw();
            expect(() => testApi.testValidateMin(100, 100, "count")).to.not.throw();
        });

        it("should not throw when value is greater than minimum", () => {
            expect(() => testApi.testValidateMin(5, 0, "pageIndex")).to.not.throw();
            expect(() => testApi.testValidateMin(100, 1, "height")).to.not.throw();
            expect(() => testApi.testValidateMin(1000, 500, "count")).to.not.throw();
        });

        it("should throw when value is less than minimum", () => {
            expect(() => testApi.testValidateMin(-1, 0, "pageIndex"))
                .to.throw("invalid pageIndex, must be 0 or greater");

            expect(() => testApi.testValidateMin(0, 1, "height"))
                .to.throw("invalid height, must be 1 or greater");

            expect(() => testApi.testValidateMin(99, 100, "count"))
                .to.throw("invalid count, must be 100 or greater");
        });

        it("should include parameter name in error message", () => {
            expect(() => testApi.testValidateMin(-5, 0, "customParam"))
                .to.throw("invalid customParam");
        });
    });

    describe("validateMax", () => {
        it("should not throw when value equals maximum", () => {
            expect(() => testApi.testValidateMax(100, 100, "pageSize")).to.not.throw();
            expect(() => testApi.testValidateMax(1024, 1024, "count")).to.not.throw();
            expect(() => testApi.testValidateMax(0, 0, "limit")).to.not.throw();
        });

        it("should not throw when value is less than maximum", () => {
            expect(() => testApi.testValidateMax(50, 100, "pageSize")).to.not.throw();
            expect(() => testApi.testValidateMax(500, 1024, "count")).to.not.throw();
            expect(() => testApi.testValidateMax(0, 1000, "limit")).to.not.throw();
        });

        it("should throw when value is greater than maximum", () => {
            expect(() => testApi.testValidateMax(101, 100, "pageSize"))
                .to.throw("invalid pageSize, must be 100 or less");

            expect(() => testApi.testValidateMax(2000, 1024, "count"))
                .to.throw("invalid count, must be 1024 or less");

            expect(() => testApi.testValidateMax(1001, 1000, "limit"))
                .to.throw("invalid limit, must be 1000 or less");
        });

        it("should include parameter name in error message", () => {
            expect(() => testApi.testValidateMax(999, 100, "anotherParam"))
                .to.throw("invalid anotherParam");
        });
    });

    describe("validateRange", () => {
        it("should not throw when value is within range", () => {
            expect(() => testApi.testValidateRange(5, 0, 10, "value")).to.not.throw();
            expect(() => testApi.testValidateRange(50, 1, 100, "count")).to.not.throw();
            expect(() => testApi.testValidateRange(512, 0, 1024, "pageSize")).to.not.throw();
        });

        it("should not throw when value equals minimum bound", () => {
            expect(() => testApi.testValidateRange(0, 0, 10, "value")).to.not.throw();
            expect(() => testApi.testValidateRange(1, 1, 100, "height")).to.not.throw();
        });

        it("should not throw when value equals maximum bound", () => {
            expect(() => testApi.testValidateRange(10, 0, 10, "value")).to.not.throw();
            expect(() => testApi.testValidateRange(1024, 0, 1024, "pageSize")).to.not.throw();
        });

        it("should throw when value is below minimum", () => {
            expect(() => testApi.testValidateRange(-1, 0, 10, "pageIndex"))
                .to.throw("invalid pageIndex, must be 0 or greater");

            expect(() => testApi.testValidateRange(0, 1, 100, "height"))
                .to.throw("invalid height, must be 1 or greater");
        });

        it("should throw when value is above maximum", () => {
            expect(() => testApi.testValidateRange(101, 0, 100, "pageSize"))
                .to.throw("invalid pageSize, must be 100 or less");

            expect(() => testApi.testValidateRange(2000, 1, 1024, "count"))
                .to.throw("invalid count, must be 1024 or less");
        });

        it("should work with single value range (min equals max)", () => {
            expect(() => testApi.testValidateRange(5, 5, 5, "exact")).to.not.throw();

            expect(() => testApi.testValidateRange(4, 5, 5, "exact"))
                .to.throw("invalid exact, must be 5 or greater");

            expect(() => testApi.testValidateRange(6, 5, 5, "exact"))
                .to.throw("invalid exact, must be 5 or less");
        });
    });

    describe("edge cases", () => {
        it("should handle very large numbers", () => {
            const largeNum = Number.MAX_SAFE_INTEGER;
            expect(() => testApi.testValidateMin(largeNum, 0, "big")).to.not.throw();
            expect(() => testApi.testValidateMax(0, largeNum, "big")).to.not.throw();
        });

        it("should handle negative ranges", () => {
            expect(() => testApi.testValidateRange(-5, -10, 0, "negative")).to.not.throw();
            expect(() => testApi.testValidateRange(-15, -10, 0, "negative"))
                .to.throw("invalid negative, must be -10 or greater");
        });

        it("should handle floating point numbers", () => {
            expect(() => testApi.testValidateMin(1.5, 1.0, "float")).to.not.throw();
            expect(() => testApi.testValidateMax(0.5, 1.0, "float")).to.not.throw();
            expect(() => testApi.testValidateRange(2.5, 2.0, 3.0, "float")).to.not.throw();
        });
    });
});
