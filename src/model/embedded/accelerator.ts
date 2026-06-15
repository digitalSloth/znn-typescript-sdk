import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
import { VoteBreakdown } from "./common.js";

export enum AcceleratorProjectStatus {
    voting = 0,
    active = 1,
    paid = 2,
    closed = 3,
    completed = 4,
}

export enum AcceleratorProjectVote {
    yes = 0,
    no = 1,
    abstain = 2,
}

export abstract class AcceleratorProject extends Model {
    protected constructor(
        public id: Hash,
        public name: string,
        public description: string,
        public url: string,
        public znnFundsNeeded: bigint,
        public qsrFundsNeeded: bigint,
        public creationTimestamp: number,
        public statusInt: number,
        public voteBreakdown: VoteBreakdown
    ) {
        super()
    }

    get status(): AcceleratorProjectStatus {
        return this.statusInt as AcceleratorProjectStatus;
    }
}

export class Phase extends AcceleratorProject {
    constructor(
        id: Hash,
        public projectId: Hash,
        name: string,
        description: string,
        url: string,
        znnFundsNeeded: bigint,
        qsrFundsNeeded: bigint,
        creationTimestamp: number,
        public acceptedTimestamp: number,
        statusInt: number,
        voteBreakdown: VoteBreakdown
    ) {
        super(id, name, description, url, znnFundsNeeded, qsrFundsNeeded, creationTimestamp, statusInt, voteBreakdown)
    }

    static fromJson(json: {[key: string]: any}): Phase {
        return new Phase(
            Hash.parse(json.phase.id),
            Hash.parse(json.phase.projectID),
            json.phase.name,
            json.phase.description,
            json.phase.url,
            BigInt(json.phase.znnFundsNeeded.toString()),
            BigInt(json.phase.qsrFundsNeeded.toString()),
            json.phase.creationTimestamp,
            json.phase.acceptedTimestamp,
            json.phase.status,
            VoteBreakdown.fromJson(json.votes)
        );
    }
}

export class Project extends AcceleratorProject {
    constructor(
        id: Hash,
        name: string,
        public owner: Address,
        description: string,
        url: string,
        znnFundsNeeded: bigint,
        qsrFundsNeeded: bigint,
        creationTimestamp: number,
        public lastUpdateTimestamp: number,
        statusInt: number,
        public phaseIds: Array<Hash>,
        voteBreakdown: VoteBreakdown,
        public phases: Array<Phase>
    ) {
        super(id, name, description, url, znnFundsNeeded, qsrFundsNeeded, creationTimestamp, statusInt, voteBreakdown)
    }

    static fromJson(json: {[key: string]: any}): Project {
        return new Project(
            Hash.parse(json.id),
            json.name,
            Address.parse(json.owner),
            json.description,
            json.url,
            BigInt(json.znnFundsNeeded.toString()),
            BigInt(json.qsrFundsNeeded.toString()),
            json.creationTimestamp,
            json.lastUpdateTimestamp,
            json.status,
            (json.phaseIds as Array<any>).map(phaseId => Hash.parse(phaseId)),
            VoteBreakdown.fromJson(json.votes),
            (json.phases as Array<any>).map(Phase.fromJson)
        );
    }

    getPaidZnnFunds(): bigint {
        let amount = 0n;
        this.phases.forEach(phase => {
            if (phase.status === AcceleratorProjectStatus.paid) {
                amount = amount + phase.znnFundsNeeded;
            }
        });
        return amount;
    }

    getPendingZnnFunds(): bigint {
        if (this.phases.length === 0) return 0n;
        const lastPhase = this.getLastPhase();
        if (lastPhase && lastPhase.status === AcceleratorProjectStatus.active) {
            return lastPhase.znnFundsNeeded;
        }
        return 0n;
    }

    getRemainingZnnFunds(): bigint {
        if (this.phases.length === 0) return this.znnFundsNeeded;
        return this.znnFundsNeeded - this.getPaidZnnFunds();
    }

    getTotalZnnFunds(): bigint {
        return this.znnFundsNeeded;
    }

    getPaidQsrFunds(): bigint {
        let amount = 0n;
        this.phases.forEach(phase => {
            if (phase.status === AcceleratorProjectStatus.paid) {
                amount = amount + phase.qsrFundsNeeded;
            }
        });
        return amount;
    }

    getPendingQsrFunds(): bigint {
        if (this.phases.length === 0) return 0n;
        const lastPhase = this.getLastPhase();
        if (lastPhase && lastPhase.status === AcceleratorProjectStatus.active) {
            return lastPhase.qsrFundsNeeded;
        }
        return 0n;
    }

    getRemainingQsrFunds(): bigint {
        if (this.phases.length === 0) return this.qsrFundsNeeded;
        return this.qsrFundsNeeded - this.getPaidQsrFunds();
    }

    getTotalQsrFunds(): bigint {
        return this.qsrFundsNeeded;
    }

    findPhaseById(id: Hash): Phase | null {
        for (let i = 0; i < this.phaseIds.length; i++) {
            if (id.toString() === this.phaseIds[i].toString()) {
                return this.phases[i];
            }
        }
        return null;
    }

    getLastPhase(): Phase | null {
        if (this.phases.length === 0) return null;
        return this.phases[this.phases.length - 1];
    }
}

export class ProjectList extends Model {
    constructor(
        public count: number,
        public list: Array<Project>
    ) {
        super()
    }

    static fromJson(json: {[key: string]: any}): ProjectList {
        return new ProjectList(
            json.count,
            (json.list as Array<any>).map(Project.fromJson)
        );
    }

    findId(id: Hash): Project | null {
        for (let i = 0; i < this.list.length; i++) {
            if (this.list[i].id.toString() === id.toString()) {
                return this.list[i];
            }
        }
        return null;
    }

    findProjectByPhaseId(id: Hash): Project | null {
        for (let i = 0; i < this.list.length; i++) {
            for (let j = 0; j < this.list[i].phaseIds.length; j++) {
                if (id.toString() === this.list[i].phaseIds[j].toString()) {
                    return this.list[i];
                }
            }
        }
        return null;
    }
}
