import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { Hash, TokenStandard, ACCELERATOR_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { Project, Phase, ProjectList, PillarVote, VoteBreakdown } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Accelerator as AcceleratorContract } from "../../embedded/index.js";
import { PROPOSAL_CREATION_COST_IN_ZNN } from "./constants.js";

export class AcceleratorApi extends Api {

    //
    // RPC

    async getAll(
        pageIndex: number = 0,
        pageSize: number = RPC_MAX_PAGE_SIZE
    ): Promise<ProjectList> {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");

        const response = await this.client.sendRequest("embedded.accelerator.getAll", [
            pageIndex,
            pageSize
        ]);

        return ProjectList.fromJson(response!);
    }

    async getProjectById(id: string): Promise<Project> {
        const response = await this.client.sendRequest("embedded.accelerator.getProjectById", [
            id
        ]);
        return Project.fromJson(response!);
    }

    async getPhaseById(id: Hash): Promise<Phase> {
        const response = await this.client.sendRequest("embedded.accelerator.getPhaseById", [
            id.toString()
        ]);
        return Phase.fromJson(response!);
    }

    async getPillarVotes(name: string, hashes: string[]): Promise<(PillarVote | null)[]> {
        const response = await this.client.sendRequest("embedded.accelerator.getPillarVotes", [
            name,
            hashes
        ]) as any[];

        return response.map(entry =>
            entry === null ? null : PillarVote.fromJson(entry)
        );
    }

    async getVoteBreakdown(id: Hash): Promise<VoteBreakdown> {
        const response = await this.client.sendRequest("embedded.accelerator.getVoteBreakdown", [
            id.toString()
        ]);
        return VoteBreakdown.fromJson(response!);
    }

    //
    // Contract methods

    createProject(
        name: string,
        description: string,
        url: string,
        znnFundsNeeded: BigNumber,
        qsrFundsNeeded: BigNumber
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            ACCELERATOR_ADDRESS,
            ZNN_ZTS,
            PROPOSAL_CREATION_COST_IN_ZNN,
            AcceleratorContract.abi.encodeFunctionData("CreateProject", [
                name,
                description,
                url,
                znnFundsNeeded.toString(),
                qsrFundsNeeded.toString()
            ])
        );
    }

    addPhase(
        id: Hash,
        name: string,
        description: string,
        url: string,
        znnFundsNeeded: BigNumber,
        qsrFundsNeeded: BigNumber
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            ACCELERATOR_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            AcceleratorContract.abi.encodeFunctionData("AddPhase", [
                id.getBytes(),
                name,
                description,
                url,
                znnFundsNeeded.toString(),
                qsrFundsNeeded.toString()
            ])
        );
    }

    updatePhase(
        id: Hash,
        name: string,
        description: string,
        url: string,
        znnFundsNeeded: BigNumber,
        qsrFundsNeeded: BigNumber
    ): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            ACCELERATOR_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            AcceleratorContract.abi.encodeFunctionData("UpdatePhase", [
                id.getBytes(),
                name,
                description,
                url,
                znnFundsNeeded.toString(),
                qsrFundsNeeded.toString()
            ])
        );
    }

    donate(amount: BigNumber, zts: TokenStandard): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            ACCELERATOR_ADDRESS,
            zts,
            amount,
            AcceleratorContract.abi.encodeFunctionData("Donate", [])
        );
    }

    voteByName(id: Hash, pillarName: string, vote: number): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            ACCELERATOR_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            AcceleratorContract.abi.encodeFunctionData("VoteByName", [
                id.getBytes(),
                pillarName,
                vote
            ])
        );
    }

    voteByProdAddress(id: Hash, vote: number): AccountBlockTemplate {
        return AccountBlockTemplate.callContract(
            ACCELERATOR_ADDRESS,
            ZNN_ZTS,
            BigNumber.from(0),
            AcceleratorContract.abi.encodeFunctionData("VoteByProdAddress", [
                id.getBytes(),
                vote
            ])
        );
    }
}
