import { ZnnSDKException } from "../exception.js";

export class ZnnBlockUtilitiesException extends ZnnSDKException {
    constructor(message: string) {
        super(message);
        this.name = "ZnnBlockUtilitiesException";
    }
}
