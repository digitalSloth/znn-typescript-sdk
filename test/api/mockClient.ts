import { Client } from "../../src/client/interfaces.js";

export class MockClient extends Client {
    private mockResponses: Map<string, any> = new Map();
    private callHistory: Array<{ method: string; parameters: any[] }> = [];

    // Set up mock response for a specific method
    setMockResponse(method: string, response: any): void {
        this.mockResponses.set(method, response);
    }

    // Get call history for assertions
    getCallHistory(): Array<{ method: string; parameters: any[] }> {
        return this.callHistory;
    }

    // Get last call
    getLastCall(): { method: string; parameters: any[] } | undefined {
        return this.callHistory[this.callHistory.length - 1];
    }

    // Clear history
    clearHistory(): void {
        this.callHistory = [];
    }

    async sendRequest(method: string, parameters: any[] = []): Promise<any> {
        this.callHistory.push({ method, parameters });

        if (this.mockResponses.has(method)) {
            return this.mockResponses.get(method);
        }

        throw new Error(`No mock response configured for method: ${method}`);
    }
}
