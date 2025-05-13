import { ZnnSDKException } from "../exception.js";

export class ZnnClientException extends ZnnSDKException {
    public readonly code: number;
    public readonly method?: string;
    public readonly params?: any[];
    public readonly data?: any;

    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super(message);
        this.name = "ZnnClientException";
        this.code = code;
        this.method = method;
        this.params = params;
        this.data = data;
    }

    toString(): string {
        let errorMsg = `${this.name} [${this.code}]: ${this.message}`;
        if (this.method) {
            errorMsg += `\n  Method: ${this.method}`;
        }
        if (this.params) {
            errorMsg += `\n  Params: ${JSON.stringify(this.params)}`;
        }
        if (this.data) {
            errorMsg += `\n  Data: ${JSON.stringify(this.data)}`;
        }
        return errorMsg;
    }
}
