import { HTTPTransport, Client as OpenRpcClient, RequestManager } from "@open-rpc/client-js";
import { Client as ClientInterface } from "./interfaces.js";
import { ZnnClientException } from "./errors.js";

export class HttpClient implements ClientInterface {
    private _client: OpenRpcClient;

    constructor(private url: string) {
        this._client = new OpenRpcClient(new RequestManager([new HTTPTransport(url)]));
    }

    async sendRequest(method: string, parameters: any[] = []): Promise<any> {
        try {
            return await this._client.request({ method, params: parameters });
        } catch (error: any) {
            // Extract error details from the JSON-RPC error
            const code = error?.code ?? -1;
            const message = error?.message || error?.toString() || "Unknown error occurred";
            const data = error?.data;

            throw new ZnnClientException(message, code, method, parameters, data);
        }
    }
}
