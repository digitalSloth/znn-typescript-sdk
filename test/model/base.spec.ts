import { expect } from "chai";
import { Model } from "../../src/model/base.js";
import { Address } from "../../src/model/primitives/address.js";
import { BigNumber } from "../../src/utilities/bignumber.js";

// Test model classes for testing base Model functionality
class SimpleModel extends Model {
    constructor(
        public name: string,
        public value: number
    ) {
        super()
    }
}

class NestedModel extends Model {
    constructor(
        public title: string,
        public simple: SimpleModel
    ) {
        super()
    }
}

class ComplexModel extends Model {
    constructor(
        public id: number,
        public address: Address,
        public amount: BigNumber,
        public items: SimpleModel[],
        public tags: string[],
        public nullValue: null,
        public undefinedValue: undefined,
        public buffer: Buffer
    ) {
        super()
    }
}

describe("Model Base Class", () => {

    describe("toJson", () => {
        it("should serialize primitive types", () => {
            const model = new SimpleModel("test", 42);
            const json = model.toJson();

            expect(json).to.deep.equal({
                name: "test",
                value: 42
            });
        });

        it("should serialize nested Model instances", () => {
            const simple = new SimpleModel("nested", 100);
            const nested = new NestedModel("parent", simple);
            const json = nested.toJson();

            expect(json).to.deep.equal({
                title: "parent",
                simple: {
                    name: "nested",
                    value: 100
                }
            });
        });

        it("should call toString on objects with toString method", () => {
            const address = Address.parse("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
            const bigNum = BigNumber.from("1000000000");

            class ModelWithToString extends Model {
                constructor(
                    public address: Address,
                    public amount: BigNumber
                ) {
                    super()
                }
            }

            const model = new ModelWithToString(address, bigNum);
            const json = model.toJson();

            expect(json.address).to.equal("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
            expect(json.amount).to.equal("1000000000");
        });

        it("should serialize arrays of primitives", () => {
            class ModelWithArray extends Model {
                constructor(public tags: string[]) {
                    super()
                }
            }

            const model = new ModelWithArray(["tag1", "tag2", "tag3"]);
            const json = model.toJson();

            expect(json.tags).to.deep.equal(["tag1", "tag2", "tag3"]);
        });

        it("should serialize arrays of Model instances", () => {
            class ModelWithModelArray extends Model {
                constructor(public items: SimpleModel[]) {
                    super()
                }
            }

            const items = [
                new SimpleModel("first", 1),
                new SimpleModel("second", 2)
            ];
            const model = new ModelWithModelArray(items);
            const json = model.toJson();

            expect(json.items).to.deep.equal([
                { name: "first", value: 1 },
                { name: "second", value: 2 }
            ]);
        });

        it("should serialize arrays with objects that have toString", () => {
            class ModelWithAddressArray extends Model {
                constructor(public addresses: Address[]) {
                    super()
                }
            }

            const addresses = [
                Address.parse("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f"),
                Address.parse("z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq")
            ];
            const model = new ModelWithAddressArray(addresses);
            const json = model.toJson();

            expect(json.addresses).to.deep.equal([
                "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f",
                "z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq"
            ]);
        });

        it("should serialize Buffer to base64 string", () => {
            class ModelWithBuffer extends Model {
                constructor(public data: Buffer) {
                    super()
                }
            }

            const buffer = Buffer.from("hello", "utf8");
            const model = new ModelWithBuffer(buffer);
            const json = model.toJson();

            expect(json.data).to.equal(buffer.toString("base64"));
        });

        it("should serialize arrays with Buffers", () => {
            class ModelWithBufferArray extends Model {
                constructor(public buffers: Buffer[]) {
                    super()
                }
            }

            const buffers = [
                Buffer.from("test1", "utf8"),
                Buffer.from("test2", "utf8")
            ];
            const model = new ModelWithBufferArray(buffers);
            const json = model.toJson();

            expect(json.buffers).to.deep.equal([
                buffers[0].toString("base64"),
                buffers[1].toString("base64")
            ]);
        });

        it("should handle null and undefined values", () => {
            class ModelWithNullable extends Model {
                constructor(
                    public nullValue: null,
                    public undefinedValue: undefined
                ) {
                    super()
                }
            }

            const model = new ModelWithNullable(null, undefined);
            const json = model.toJson();

            expect(json.nullValue).to.equal(null);
            expect(json.undefinedValue).to.equal(undefined);
        });

        it("should serialize complex nested structures", () => {
            const address = Address.parse("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
            const amount = BigNumber.from("5000000000");
            const items = [
                new SimpleModel("item1", 10),
                new SimpleModel("item2", 20)
            ];
            const buffer = Buffer.from("data", "utf8");

            const complex = new ComplexModel(
                123,
                address,
                amount,
                items,
                ["tag1", "tag2"],
                null,
                undefined,
                buffer
            );

            const json = complex.toJson();

            expect(json).to.deep.equal({
                id: 123,
                address: "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f",
                amount: "5000000000",
                items: [
                    { name: "item1", value: 10 },
                    { name: "item2", value: 20 }
                ],
                tags: ["tag1", "tag2"],
                nullValue: null,
                undefinedValue: undefined,
                buffer: buffer.toString("base64")
            });
        });
    });

    describe("toString", () => {
        it("should convert model to JSON string", () => {
            const model = new SimpleModel("test", 42);
            const jsonString = model.toString();

            expect(jsonString).to.equal('{"name":"test","value":42}');
        });

        it("should convert complex model to JSON string", () => {
            const simple = new SimpleModel("nested", 100);
            const nested = new NestedModel("parent", simple);
            const jsonString = nested.toString();

            expect(jsonString).to.equal('{"title":"parent","simple":{"name":"nested","value":100}}');
        });
    });
});
