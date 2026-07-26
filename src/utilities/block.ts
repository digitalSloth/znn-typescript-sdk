import { Buffer } from "buffer";
import { GetRequiredPowParam } from "../model/embedded/plasma.js";
import { AccountBlockTemplate, BlockTypeEnum } from "../model/nom/accountBlock.js";
import { Address, EMPTY_HASH, Hash, HashHeight } from "../model/primitives/index.js";
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

    // Consensus preimage: do NOT add publicKey/signature/multisigAuth — excluded by protocol.
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

async function validateReceiveBlock(zenonInstance: Zenon, tx: AccountBlockTemplate): Promise<void> {
    if (isReceiveBlock(tx.blockType)) {
        if (tx.fromBlockHash === EMPTY_HASH) {
            throw new ZnnBlockUtilitiesException("fromBlockHash cannot be empty for receive blocks");
        }

        const sendBlock = await zenonInstance.ledger.getAccountBlockByHash(tx.fromBlockHash);

        if (sendBlock === null) {
            throw new ZnnBlockUtilitiesException(`Send block not found: ${tx.fromBlockHash}`);
        }

        if (sendBlock.toAddress.toString() !== tx.address.toString()) {
            throw new ZnnBlockUtilitiesException(
                `Send block toAddress (${sendBlock.toAddress}) does not match transaction address (${tx.address})`
            );
        }

        if (tx.data.length > 0) {
            throw new ZnnBlockUtilitiesException("Receive blocks cannot have data");
        }
    }
}

async function checkAndSetFields(
    zenonInstance: Zenon,
    transaction: AccountBlockTemplate,
    currentKeyPair: KeyPair
): Promise<AccountBlockTemplate> {
    transaction.address = currentKeyPair.getAddress();
    transaction.publicKey = currentKeyPair.getPublicKey();

    await autofillTxParameters(zenonInstance, transaction);

    await validateReceiveBlock(zenonInstance, transaction);

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

        // Generate the PoW nonce. If the consumer has registered a custom PoW
        // provider (e.g. one backed by a Web Worker), use it so the work can run
        // off the main thread; otherwise fall back to the built-in WASM module.
        const provider = Zenon.getPowProvider();
        transaction.nonce = provider
            ? await provider(powData.toString(), transaction.difficulty)
            : await generatePoW(powData.toString(), transaction.difficulty);

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

/**
 * Prepare an account block for publishing without sending it: autofill the
 * fields, run PoW (if required), and set the hash and signature.
 *
 * This is the publish-free portion of {@link send}. It lets consumers control
 * the connection lifecycle around PoW — for example, verifying or restarting
 * the WebSocket connection between preparing the block and publishing it.
 */
export async function prepareBlock(
    zenonInstance: Zenon,
    transaction: AccountBlockTemplate,
    currentKeyPair: KeyPair
): Promise<AccountBlockTemplate> {
    transaction = await checkAndSetFields(zenonInstance, transaction, currentKeyPair);
    transaction = await setDifficulty(zenonInstance, transaction);
    transaction = setHashAndSignature(transaction, currentKeyPair);
    return transaction;
}

export async function send(
    zenonInstance: Zenon,
    transaction: AccountBlockTemplate,
    currentKeyPair: KeyPair
): Promise<AccountBlockTemplate> {
    transaction = await prepareBlock(zenonInstance, transaction, currentKeyPair);
    return zenonInstance.ledger.publishRawTransaction(transaction);
}

/**
 * Autofill + validate + PoW + hash a multisig account block, without signing
 * it. Leaves `publicKey`/`signature` empty. Serves both send blocks and
 * multisig receive blocks (`AccountBlockTemplate.receive(...)`).
 *
 * The signed-with address is explicit (the multisig account), not derived
 * from a keypair.
 */
export async function freezeBlock(
    zenonInstance: Zenon,
    transaction: AccountBlockTemplate,
    address: Address,
): Promise<AccountBlockTemplate> {
    transaction.address = address;
    await autofillTxParameters(zenonInstance, transaction);
    await validateReceiveBlock(zenonInstance, transaction);
    await setDifficulty(zenonInstance, transaction);
    transaction.hash = getTxHash(transaction);
    return transaction;
}

/**
 * Sign a frozen block's hash with a single signer's keypair. The block must
 * be frozen first (`freezeBlock`) so every signer signs the identical hash.
 */
export function signBlock(transaction: AccountBlockTemplate, keyPair: KeyPair): Buffer {
    if (transaction.hash.getBytes().equals(EMPTY_HASH.getBytes())) {
        throw new ZnnBlockUtilitiesException("Block must be frozen before signing");
    }
    return keyPair.sign(transaction.hash.getBytes());
}

/**
 * Attach collected multisig signatures to a frozen block. Order-independent;
 * no threshold enforcement (the node validates the policy on publish).
 */
export function assembleMultisigAuth(
    transaction: AccountBlockTemplate,
    signatures: Buffer[],
): AccountBlockTemplate {
    transaction.multisigAuth = { signatures: [...signatures] };
    return transaction;
}

