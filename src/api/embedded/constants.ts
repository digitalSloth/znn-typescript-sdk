import { BigNumber } from "../../utilities/bignumber.js";

export const ZNN_DECIMALS = 8;
export const QSR_DECIMALS = 8;

export const ONE_ZNN: number = Math.pow(10, ZNN_DECIMALS);
export const ONE_QSR: number = Math.pow(10, QSR_DECIMALS);

const INTERVAL_BETWEEN_MOMENTUMS: number = 10;

// Plasma
export const FUSE_MIN_QSR_AMOUNT: number = 10 * ONE_QSR;
export const MIN_PLASMA_AMOUNT: number = 21000;

// Pillar
export const PILLAR_REGISTER_ZNN_AMOUNT: BigNumber = BigNumber.from(15000).multipliedBy(BigNumber.from(ONE_ZNN));
export const PILLAR_REGISTER_QSR_AMOUNT: BigNumber = BigNumber.from(150000).multipliedBy(BigNumber.from(ONE_QSR));
export const PILLAR_NAME_MAX_LENGTH: number = 40;
export const PILLAR_NAME_REG_EXP: RegExp = RegExp(
    "^([a-zA-Z0-9]+[-._]?)*[a-zA-Z0-9]$"
);

// Sentinel
export const SENTINEL_REGISTER_ZNN_AMOUNT: BigNumber = BigNumber.from(5000).multipliedBy(BigNumber.from(ONE_ZNN));
export const SENTINEL_REGISTER_QSR_AMOUNT: BigNumber = BigNumber.from(50000).multipliedBy(BigNumber.from(ONE_QSR));

// Staking
export const STAKE_TIME_UNIT_SEC: number = 30 * 24 * 60 * 60;
export const STAKE_TIME_MAX_SEC: number = 12 * STAKE_TIME_UNIT_SEC;
export const STAKE_MIN_ZNN_AMOUNT: BigNumber = BigNumber.from(ONE_ZNN);
export const STAKE_UNIT_DURATION_NAME: string = "month";

// Token
export const TOKEN_ZTS_ISSUE_FEE_IN_ZNN: BigNumber = BigNumber.from(ONE_ZNN);
export const TOKEN_NAME_MAX_LENGTH: number = 40;
export const TOKEN_NAME_REG_EXP: RegExp = RegExp(
    "^([a-zA-Z0-9]+[-._]?)*[a-zA-Z0-9]$"
);
export const TOKEN_SYMBOL_REG_EXP: RegExp = RegExp(
    "^[A-Z0-9]+$"
);
export const TOKEN_SYMBOL_MAX_LENGTH: number = 10;
export const TOKEN_SYMBOL_EXCEPTIONS: Array<string> = ["ZNN", "QSR"];
export const TOKEN_DOMAIN_REG_EXP: RegExp = RegExp(
    "^([A-Za-z0-9][A-Za-z0-9-]{0,61}[A-Za-z0-9].)+[A-Za-z]{2,}$"
);

// Accelerator
export const PROPOSAL_URL_REG_EXP: RegExp = RegExp(
    "^[a-zA-Z0-9]{2,60}.[a-zA-Z]{1,6}([a-zA-Z0-9()@:%_\\+.~#?&/=-]{0,100})$"
);
export const PROPOSAL_DESCRIPTION_MAX_LENGTH: number = 240;
export const PROPOSAL_NAME_MAX_LENGTH: number = 30;
export const PROPOSAL_CREATION_COST_IN_ZNN: number = 10;
export const PROPOSAL_MAXIMUM_FUNDS_IN_ZNN: number = 5000;
export const PROPOSAL_MINIMUM_FUNDS_IN_ZNN: number = 10;
export const PROPOSAL_VOTING_STATUS: number = 0;
export const PROPOSAL_ACTIVE_STATUS: number = 1;
export const PROPOSAL_PAID_STATUS: number = 2;
export const PROPOSAL_CLOSED_STATUS: number = 3;
