import { MEMORY_POOL_PAGE_SIZE, RPC_MAX_PAGE_SIZE } from "../zenon.js";
import {
    AccountBlockTemplate, AccountInfo,
    AccountBlock, AccountBlockList,
    Momentum, MomentumList,
    DetailedMomentumList
} from "../model/nom/index.js";
import { Address, Hash } from "../model/primitives/index.js";
import { Api } from "./base.js";
import { Logger } from "../utilities/logger.js";

const logger = Logger.globalLogger();

export class LedgerApi extends Api {

    async publishRawTransaction(accountBlockTemplate: AccountBlockTemplate): Promise<AccountBlockTemplate> {

        const response = await this.client.sendRequest("ledger.publishRawTransaction", [
            accountBlockTemplate.toJson()
        ]);

        if (response !== null) {
            logger.throwError(`Error publishing transaction: ${response}`, Logger.errors.NETWORK_ERROR);
        }

        logger.info(`Published account-block: hash=${accountBlockTemplate.hash.toString()}`);
        return accountBlockTemplate;
    }

    //
    // Account Blocks

    async getUnconfirmedBlocksByAddress(
        address: Address,
        pageIndex = 0,
        pageSize = MEMORY_POOL_PAGE_SIZE
    ): Promise<AccountBlockList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, MEMORY_POOL_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("ledger.getUnconfirmedBlocksByAddress", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return AccountBlockList.fromJson(response);
    }

    async getUnreceivedBlocksByAddress(
        address: Address,
        pageIndex = 0,
        pageSize = MEMORY_POOL_PAGE_SIZE
    ): Promise<AccountBlockList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, MEMORY_POOL_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("ledger.getUnreceivedBlocksByAddress", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return AccountBlockList.fromJson(response);
    }

    async getFrontierAccountBlock(address: Address): Promise<AccountBlock | null> {
        const response = await this.client.sendRequest("ledger.getFrontierAccountBlock", [
            address.toString()
        ]);
        return response == null ? null : AccountBlock.fromJson(response);
    }

    async getAccountBlockByHash(hash: Hash): Promise<AccountBlock | null> {
        const response = await this.client.sendRequest("ledger.getAccountBlockByHash", [
            hash.toString()
        ]);
        return response == null ? null : AccountBlock.fromJson(response);
    }

    async getAccountBlocksByHeight(
        address: Address,
        height = 1,
        count = RPC_MAX_PAGE_SIZE
    ): Promise<AccountBlockList> {
        this.validateMin(height, 1, "height");
        this.validateMax(count, RPC_MAX_PAGE_SIZE, "count");

        const response = await this.client.sendRequest("ledger.getAccountBlocksByHeight", [
            address.toString(),
            height,
            count,
        ]);
        return AccountBlockList.fromJson(response);
    }

    async getAccountBlocksByPage(
        address: Address,
        pageIndex = 0,
        pageSize = RPC_MAX_PAGE_SIZE
    ): Promise<AccountBlockList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("ledger.getAccountBlocksByPage", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return AccountBlockList.fromJson(response);
    }

    //
    // Account Info

    async getAccountInfoByAddress(address: Address): Promise<AccountInfo|null> {
        const response = await this.client.sendRequest("ledger.getAccountInfoByAddress", [
            address.toString()
        ]);
        return response == null ? null : AccountInfo.fromJson(response);
    }

    //
    // Momentums

    async getFrontierMomentum(): Promise<Momentum> {
        const response = await this.client.sendRequest("ledger.getFrontierMomentum", []);
        return Momentum.fromJson(response);
    }

    async getMomentumBeforeTime(time: number): Promise<Momentum|null> {
        const response = await this.client.sendRequest("ledger.getMomentumBeforeTime", [
            time
        ]);
        return response == null ? null : Momentum.fromJson(response);
    }

    async getMomentumByHash(hash: Hash): Promise<Momentum|null> {
        const response = await this.client.sendRequest("ledger.getMomentumByHash", [
            hash.toString()
        ]);
        return response == null ? null : Momentum.fromJson(response);
    }

    async getMomentumsByHeight(
        height: number,
        count: number = RPC_MAX_PAGE_SIZE
    ): Promise<MomentumList> {
        this.validateMin(height, 1, "height");
        this.validateMax(count, RPC_MAX_PAGE_SIZE, "count");

        const response = await this.client.sendRequest("ledger.getMomentumsByHeight", [
            height,
            count
        ]);
        return MomentumList.fromJson(response);
    }

    async getMomentumsByPage(
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<MomentumList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("ledger.getMomentumsByPage", [
            pageIndex,
            pageSize
        ]);
        return MomentumList.fromJson(response);
    }

    async getDetailedMomentumsByHeight(
        height: number = 1,
        count: number = RPC_MAX_PAGE_SIZE
    ): Promise<DetailedMomentumList|null> {
        this.validateMin(height, 1, "height");
        this.validateMax(count, RPC_MAX_PAGE_SIZE, "count");

        const response = await this.client.sendRequest("ledger.getDetailedMomentumsByHeight", [
            height,
            count
        ]);
        return response == null ? null : DetailedMomentumList.fromJson(response);
    }
}
