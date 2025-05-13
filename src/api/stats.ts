import { ExtraData, NetworkInfo, OsInfo, ProcessInfo, SyncInfo } from "../model/stats.js";
import { Api } from "./base.js";

export class StatsApi extends Api {

    async osInfo(): Promise<OsInfo> {
        const response = await this.client.sendRequest("stats.osInfo", []);
        return OsInfo.fromJson(response);
    }

    async processInfo(): Promise<ProcessInfo> {
        const response = await this.client.sendRequest("stats.processInfo", []);
        return ProcessInfo.fromJson(response);
    }

    async networkInfo(): Promise<NetworkInfo> {
        const response = await this.client.sendRequest("stats.networkInfo", []);
        return NetworkInfo.fromJson(response);
    }

    async syncInfo(): Promise<SyncInfo> {
        const response = await this.client.sendRequest("stats.syncInfo", []);
        return SyncInfo.fromJson(response);
    }

    async extraData(): Promise<ExtraData> {
        const response = await this.client.sendRequest("stats.extraData", []);
        const parsed = JSON.parse(response.toString());
        return ExtraData.fromJson(parsed);
    }
}
