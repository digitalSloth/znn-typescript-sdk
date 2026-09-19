import { ZnnClientException } from "./errors.js";

export class ZnnEmbeddedContractException extends ZnnClientException {
    public readonly contract: string;

    constructor(contract: string, message: string, code: number, method?: string, params?: any[], data?: any) {
        super(message, code, method, params, data);
        this.name = "ZnnEmbeddedContractException";
        this.contract = contract;
    }
}

export class MultisigPolicyLockedException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("multisig", message, code, method, params, data);
        this.name = "MultisigPolicyLockedException";
    }
}

export class MultisigAccountExistsException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("multisig", message, code, method, params, data);
        this.name = "MultisigAccountExistsException";
    }
}

export class MultisigNoPolicyException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("multisig", message, code, method, params, data);
        this.name = "MultisigNoPolicyException";
    }
}

export class MultisigInvalidPolicyException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("multisig", message, code, method, params, data);
        this.name = "MultisigInvalidPolicyException";
    }
}

export class MultisigSporkNotActivatedException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("multisig", message, code, method, params, data);
        this.name = "MultisigSporkNotActivatedException";
    }
}

export class MultisigThresholdMismatchException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("multisig", message, code, method, params, data);
        this.name = "MultisigThresholdMismatchException";
    }
}

export class AccountBlockPublicKeyNotZeroException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("account-block", message, code, method, params, data);
        this.name = "AccountBlockPublicKeyNotZeroException";
    }
}

export class AccountBlockSignatureNotZeroException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("account-block", message, code, method, params, data);
        this.name = "AccountBlockSignatureNotZeroException";
    }
}

export class AccountBlockMultisigAuthMissingException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("account-block", message, code, method, params, data);
        this.name = "AccountBlockMultisigAuthMissingException";
    }
}

export class AccountBlockMomentumTooOldException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("account-block", message, code, method, params, data);
        this.name = "AccountBlockMomentumTooOldException";
    }
}

export class MultisigStaleAuthorityException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("multisig", message, code, method, params, data);
        this.name = "MultisigStaleAuthorityException";
    }
}

export class AccountBlockMultisigAuthMustBeZeroException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("account-block", message, code, method, params, data);
        this.name = "AccountBlockMultisigAuthMustBeZeroException";
    }
}

export class MultisigCreatorMustBeSingleSigException extends ZnnEmbeddedContractException {
    constructor(message: string, code: number, method?: string, params?: any[], data?: any) {
        super("multisig", message, code, method, params, data);
        this.name = "MultisigCreatorMustBeSingleSigException";
    }
}

const NODE_ERROR_REGISTRY: Array<{ match: string; create: (m: string, c: number, meth?: string, p?: any[], d?: any) => ZnnClientException }> = [
    { match: "multisig: policy is locked",                                  create: (...a) => new MultisigPolicyLockedException(...a) },
    { match: "multisig: account already exists",                           create: (...a) => new MultisigAccountExistsException(...a) },
    { match: "multisig: no policy for this account",                       create: (...a) => new MultisigNoPolicyException(...a) },
    { match: "multisig: invalid policy",                                   create: (...a) => new MultisigInvalidPolicyException(...a) },
    { match: "multisig: spork not activated",                              create: (...a) => new MultisigSporkNotActivatedException(...a) },
    { match: "multisig: signature count does not match policy threshold",  create: (...a) => new MultisigThresholdMismatchException(...a) },
    { match: "account-block publicKey must be zero",                       create: (...a) => new AccountBlockPublicKeyNotZeroException(...a) },
    { match: "account-block signature must be zero",                       create: (...a) => new AccountBlockSignatureNotZeroException(...a) },
    { match: "account-block multisig-auth is missing",                     create: (...a) => new AccountBlockMultisigAuthMissingException(...a) },
    { match: "account-block momentum-acknowledged is too old",             create: (...a) => new AccountBlockMomentumTooOldException(...a) },
    { match: "multisig: authorization does not satisfy current active policy", create: (...a) => new MultisigStaleAuthorityException(...a) },
    { match: "multisig: creator must be a single-sig account",                 create: (...a) => new MultisigCreatorMustBeSingleSigException(...a) },
    { match: "account-block multisig-auth must be zero",                       create: (...a) => new AccountBlockMultisigAuthMustBeZeroException(...a) },
];

export function mapNodeError(message: string, code: number, method?: string, params?: any[], data?: any): ZnnClientException {
    const hit = NODE_ERROR_REGISTRY.find(e => message.includes(e.match));
    return hit ? hit.create(message, code, method, params, data)
               : new ZnnClientException(message, code, method, params, data);
}
