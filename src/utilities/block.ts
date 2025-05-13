import { Buffer } from "buffer";
import { GetRequiredPowParam } from "../model/embedded/plasma.js";
import { AccountBlockTemplate, BlockTypeEnum } from "../model/nom/accountBlock.js";
import { EMPTY_HASH, Hash, HashHeight } from "../model/primitives/index.js";
import { generate as generatePoW } from "../pow/pow.js";
import { KeyPair } from "../wallet/keyPair.js";
import { Zenon } from "../zenon.js";
import { numberOrStringToBytes, numberToBytes, zeroPad } from "./bytes.js";
import { Logger } from "./logger.js";
import { ZnnBlockUtilitiesException } from "./errors.js";

const logger = Logger.globalLogger();

export function isSendBlock(blockType?: number): boolean {
    return [BlockTypeEnum.UserSend, BlockTypeEnum.ContractSend].includes(blockType!);
}

export function isReceiveBlock(blockType: number): boolean {
    return [BlockTypeEnum.UserReceive, BlockTypeEnum.GenesisReceive, BlockTypeEnum.ContractReceive].includes(
        blockType!
    );
}

export function getTxHash(transaction: AccountBlockTemplate): Hash {
    // Pre-compute empty hash to avoid redundant computation
    const emptyHash = Hash.digest(Buffer.from([]));
    const dataHash = Hash.digest(transaction.data);

    const source = Buffer.concat([
        numberToBytes(transaction.version, 8),
        numberToBytes(transaction.chainIdentifier, 8),
        numberToBytes(transaction.blockType, 8),
        transaction.previousHash.getBytes(),
        numberToBytes(transaction.height, 8),
        transaction.momentumAcknowledged.getBytes(),
        transaction.address.getBytes(),
        transaction.toAddress.getBytes(),
        numberOrStringToBytes(transaction.amount),
        transaction.tokenStandard.getBytes(),
        transaction.fromBlockHash.getBytes(),
        emptyHash.getBytes(),
        dataHash.getBytes(),
        numberToBytes(transaction.fusedPlasma, 8),
        numberToBytes(transaction.difficulty, 8),
        Buffer.from(zeroPad(Buffer.from(transaction.nonce, "hex"), 8))
    ]);

    return Hash.digest(source);
}

function getTxSignature(keyPair: KeyPair, transaction: AccountBlockTemplate): Buffer {
    return keyPair.sign(transaction.hash.getBytes());
}

function getPoWData(transaction: AccountBlockTemplate): Hash {
    return Hash.digest(Buffer.concat([
        transaction.address.getBytes(),
        transaction.previousHash.getBytes()
    ]));
}

async function autofillTxParameters(
    zenonInstance: Zenon,
    accountBlockTemplate: AccountBlockTemplate
): Promise<AccountBlockTemplate> {
    const frontierAccountBlock = await zenonInstance.ledger.getFrontierAccountBlock(accountBlockTemplate.address);
    const frontierMomentum = await zenonInstance.ledger.getFrontierMomentum();
    let height = 1;
    let previousHash: Hash = EMPTY_HASH;

    if (frontierAccountBlock) {
        height = frontierAccountBlock.height + 1;
        previousHash = frontierAccountBlock.hash;
    }

    accountBlockTemplate.height = height;
    accountBlockTemplate.previousHash = previousHash;
    accountBlockTemplate.momentumAcknowledged = new HashHeight(frontierMomentum.hash, frontierMomentum.height);

    return accountBlockTemplate;
}

async function checkAndSetFields(
    zenonInstance: Zenon,
    transaction: AccountBlockTemplate,
    currentKeyPair: KeyPair
): Promise<AccountBlockTemplate> {
    transaction.address = currentKeyPair.getAddress();
    transaction.publicKey = currentKeyPair.getPublicKey();

    await autofillTxParameters(zenonInstance, transaction);

    if (isReceiveBlock(transaction.blockType)) {
        if (transaction.fromBlockHash === EMPTY_HASH) {
            throw new ZnnBlockUtilitiesException("fromBlockHash cannot be empty for receive blocks");
        }

        const sendBlock = await zenonInstance.ledger.getAccountBlockByHash(transaction.fromBlockHash);

        if (sendBlock === null) {
            throw new ZnnBlockUtilitiesException(`Send block not found: ${transaction.fromBlockHash}`);
        }

        if (sendBlock.toAddress.toString() !== transaction.address.toString()) {
            throw new ZnnBlockUtilitiesException(
                `Send block toAddress (${sendBlock.toAddress}) does not match transaction address (${transaction.address})`
            );
        }

        if (transaction.data.length > 0) {
            throw new ZnnBlockUtilitiesException("Receive blocks cannot have data");
        }
    }

    if (transaction.difficulty > 0 && transaction.nonce === "") {
        throw new ZnnBlockUtilitiesException("Nonce is required when difficulty is set");
    }

    return transaction;
}

async function setDifficulty(
    zenonInstance: Zenon,
    transaction: AccountBlockTemplate,
): Promise<AccountBlockTemplate> {
    const powParam = new GetRequiredPowParam(
        transaction.address,
        transaction.blockType,
        transaction.toAddress,
        transaction.data
    );
    const response = await zenonInstance.embedded.plasma.getRequiredPoWForAccountBlock(powParam);

    if (response.requiredDifficulty !== 0) {
        transaction.fusedPlasma = response.availablePlasma;
        transaction.difficulty = response.requiredDifficulty;
        const powData = getPoWData(transaction);
        logger.info(`Generating Plasma for block: hash=${powData}`, {
            difficulty: transaction.difficulty,
        });

        // Generate PoW nonce using WASM module
        transaction.nonce = await generatePoW(powData.toString(), transaction.difficulty);

        logger.info(`PoW generated: nonce=${transaction.nonce}`);
    } else {
        transaction.fusedPlasma = response.basePlasma;
        transaction.difficulty = 0;
        transaction.nonce = "0000000000000000";
    }

    return transaction;
}

function setHashAndSignature(
    transaction: AccountBlockTemplate,
    currentKeyPair: KeyPair
): AccountBlockTemplate {
    transaction.hash = getTxHash(transaction);
    transaction.signature = getTxSignature(currentKeyPair, transaction);
    return transaction;
}

export async function send(
    zenonInstance: Zenon,
    transaction: AccountBlockTemplate,
    currentKeyPair: KeyPair
): Promise<AccountBlockTemplate> {
    transaction = await checkAndSetFields(zenonInstance, transaction, currentKeyPair);
    transaction = await setDifficulty(zenonInstance, transaction);
    transaction = setHashAndSignature(transaction, currentKeyPair);
    return zenonInstance.ledger.publishRawTransaction(transaction);
}

