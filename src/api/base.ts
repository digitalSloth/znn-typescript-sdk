import { Client } from "../client/interfaces.js";
import { Logger } from "../utilities/logger.js";

const logger = Logger.globalLogger();

/**
 * Base class for all API classes providing client management
 */
export abstract class Api<T extends Client = Client> {
    client!: T;

    setClient(client: T): void {
        this.client = client;
    }

    /**
     * Validates that a value is greater than or equal to a minimum
     */
    protected validateMin(value: number, min: number, paramName: string): void {
        if (value < min) {
            logger.throwArgumentError(
                `invalid ${paramName}, must be ${min} or greater`,
                paramName,
                value
            );
        }
    }

    /**
     * Validates that a value is less than or equal to a maximum
     */
    protected validateMax(value: number, max: number, paramName: string): void {
        if (value > max) {
            logger.throwArgumentError(
                `invalid ${paramName}, must be ${max} or less`,
                paramName,
                value
            );
        }
    }

    /**
     * Validates that a value is within a range (inclusive)
     */
    protected validateRange(value: number, min: number, max: number, paramName: string): void {
        this.validateMin(value, min, paramName);
        this.validateMax(value, max, paramName);
    }
}
