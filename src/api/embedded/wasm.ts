import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { Address, Hash, WASM_ADDRESS, QSR_ZTS, EMPTY_ZTS } from "../../model/primitives/index.js";
import { WasmContractResponse, WasmHaltStatusResponse, WasmEventList, WasmStatsResponse } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Wasm as WasmContract } from "../../embedded/index.js";
import { BigNumber, BigNumberish } from "../../utilities/bignumber.js";
import { Buffer } from "buffer";
import { arrayify } from "../../utilities/bytes.js";

export interface WasmVariablesParams {
    executionGasLimit: number;
    onReceiveGasLimit: number;
    maxDescendantBlocks: number;
    maxEventsPerExecute: number;
    maxEventDataPerEvent: number;
    maxEventBytesPerExecute: number;
    maxViewReturnSize: number;
    qsrPerByteOfBytecode: number;
    minBytecodeCost: number;
    qsrPerByteOfState: number;
    maxWasmBytecodeSize: number;
    maxChunkCount: number;
    chunkTTLMomentums: number;
}

export class WasmApi extends Api {

    //
    // RPC

    async getContract(contractAddress: Address): Promise<WasmContractResponse> {
        const response = await this.client.sendRequest("embedded.wasm.getContract", [
            contractAddress.toString()
        ]);
        return WasmContractResponse.fromJson(response!);
    }

    async getHaltStatus(contractAddress: Address): Promise<WasmHaltStatusResponse> {
        const response = await this.client.sendRequest("embedded.wasm.getHaltStatus", [
            contractAddress.toString()
        ]);
        return WasmHaltStatusResponse.fromJson(response!);
    }

    async getEvents(
        contractAddress: Address,
        topic: Hash,
        fromHeight: number,
        toHeight: number,
        pageIndex = 0,
        pageSize = RPC_MAX_PAGE_SIZE
    ): Promise<WasmEventList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.wasm.getEvents", [
            contractAddress.toString(),
            topic.toString(),
            fromHeight,
            toHeight,
            pageIndex,
            pageSize,
        ]);
        return WasmEventList.fromJson(response!);
    }

    async getStats(): Promise<WasmStatsResponse> {
        const response = await this.client.sendRequest("embedded.wasm.getStats", []);
        return WasmStatsResponse.fromJson(response!);
    }

    async callView(
        contractAddress: Address,
        fn: string,
        args: Buffer = Buffer.from([])
    ): Promise<Buffer> {
        const response = await this.client.sendRequest("embedded.wasm.callView", [
            contractAddress.toString(),
            fn,
            args.toString("base64")
        ]);
        return Buffer.from(response as string, "base64");
    }

    //
    // Contract methods

    /**
     * Single-shot deploy (bytecode <= 14 KiB).
     * Wraps the bytecode as chunk 0 of 1.
     */
    deploy(
        wasmAddr: Address,
        salt: Buffer,
        bytecode: Buffer,
        upgradeable: boolean,
        amount: BigNumberish = BigNumber.from(0)
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            WASM_ADDRESS,
            QSR_ZTS,
            amount,
            WasmContract.abi.encodeFunctionData("Deploy", [
                wasmAddr.toString(),
                salt,
                0,
                1,
                bytecode
            ])
        );
    }

    /**
     * Finalize a deploy (single-shot or chunked).
     * Carries 1 ZNN fee.
     */
    activate(
        wasmAddr: Address,
        salt: Buffer,
        upgradeable: boolean
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            WASM_ADDRESS,
            EMPTY_ZTS,
            BigNumber.from(0),
            WasmContract.abi.encodeFunctionData("Activate", [
                wasmAddr.toString(),
                salt,
                upgradeable
            ])
        );
    }

    /**
     * Discard in-progress chunks. Refunds QSR if within TTL.
     */
    discardChunks(
        wasmAddr: Address,
        salt: Buffer
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            WASM_ADDRESS,
            EMPTY_ZTS,
            BigNumber.from(0),
            WasmContract.abi.encodeFunctionData("DiscardChunks", [
                wasmAddr.toString(),
                salt
            ])
        );
    }

    halt(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            WASM_ADDRESS,
            EMPTY_ZTS,
            BigNumber.from(0),
            WasmContract.abi.encodeFunctionData("Halt", [])
        );
    }

    unhalt(): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            WASM_ADDRESS,
            EMPTY_ZTS,
            BigNumber.from(0),
            WasmContract.abi.encodeFunctionData("Unhalt", [])
        );
    }

    changeAdministrator(newAdmin: Address): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            WASM_ADDRESS,
            EMPTY_ZTS,
            BigNumber.from(0),
            WasmContract.abi.encodeFunctionData("ChangeAdministrator", [
                newAdmin.toString()
            ])
        );
    }

    /**
     * Revoke a contract (deployer only). Permanently disables it.
     */
    revoke(wasmAddr: Address): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            WASM_ADDRESS,
            EMPTY_ZTS,
            BigNumber.from(0),
            WasmContract.abi.encodeFunctionData("Revoke", [
                wasmAddr.toString()
            ])
        );
    }

    /**
     * Pause a contract (deployer only).
     */
    pause(wasmAddr: Address): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            WASM_ADDRESS,
            EMPTY_ZTS,
            BigNumber.from(0),
            WasmContract.abi.encodeFunctionData("Pause", [
                wasmAddr.toString()
            ])
        );
    }

    /**
     * Unpause a contract (deployer only).
     */
    unpause(wasmAddr: Address): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            WASM_ADDRESS,
            EMPTY_ZTS,
            BigNumber.from(0),
            WasmContract.abi.encodeFunctionData("Unpause", [
                wasmAddr.toString()
            ])
        );
    }

    /**
     * Update governance-tunable WASM runtime parameters (admin only).
     * Full replacement — all 13 fields must be supplied.
     */
    setWasmVariables(params: WasmVariablesParams): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            WASM_ADDRESS,
            EMPTY_ZTS,
            BigNumber.from(0),
            WasmContract.abi.encodeFunctionData("SetWasmVariables", [
                params.executionGasLimit,
                params.onReceiveGasLimit,
                params.maxDescendantBlocks,
                params.maxEventsPerExecute,
                params.maxEventDataPerEvent,
                params.maxEventBytesPerExecute,
                params.maxViewReturnSize,
                params.qsrPerByteOfBytecode,
                params.minBytecodeCost,
                params.qsrPerByteOfState,
                params.maxWasmBytecodeSize,
                params.maxChunkCount,
                params.chunkTTLMomentums
            ])
        );
    }

    execute(
        contractAddress: Address,
        fn: string,
        args: Buffer = Buffer.from([])
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            contractAddress,
            EMPTY_ZTS,
            BigNumber.from(0),
            WasmContract.abi.encodeFunctionData("Execute", [
                fn,
                args
            ])
        );
    }
}
