import { Buffer } from "buffer";
/**
 * Base class for all model objects providing automatic JSON serialization
 */
export abstract class Model {
    /**
     * Converts the model instance to a plain JSON object.
     * This default implementation handles primitive types, nested Models, arrays, and Buffers.
     * Override this method in subclasses for custom serialization logic.
     */
    toJson(): { [key: string]: any } {
        const result: { [key: string]: any } = {};

        // Get all property names from the instance
        for (const key of Object.keys(this)) {
            const value = (this as any)[key];

            if (value === undefined || value === null) {
                result[key] = value;
            } else if (value instanceof Model) {
                // Nested Model instance
                result[key] = value.toJson();
            } else if (Buffer.isBuffer(value)) {
                // TODO - check this is still needed, if all buffers
                // are converted to base64 strings before being sent
                // we can use the logic below
                result[key] = value.toString("base64");
            } else if (Array.isArray(value)) {
                // Handle arrays
                result[key] = value.map((item) => {
                    if (item instanceof Model) {
                        return item.toJson();
                    } else if (Buffer.isBuffer(item)) {
                        // TODO - check this is still needed, if all buffers
                        // are converted to base64 strings before being sent
                        // we can use the logic below
                        return item.toString("base64");
                    } else if (typeof item === "object" && typeof item.toString === "function") {
                        return item.toString();
                    } else {
                        return item;
                    }
                });
            } else if (typeof value === "object" && typeof value.toString === "function") {
                // Objects with toString method (like Address, Hash, BigNumber)
                result[key] = value.toString();
            } else {
                // Primitive types
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Converts the model instance to a JSON string
     */
    toString(): string {
        return JSON.stringify(this.toJson());
    }
}

