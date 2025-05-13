import { Zenon } from "../../src/zenon";
import { Address, TokenStandard, Hash, ZNN_ZTS, QSR_ZTS } from "../../src/model/primitives";
import { AccountBlockTemplate } from "../../src/model/nom/accountBlock";
import { extractNumberDecimals } from "../../src/utilities/amounts";
import { Manager } from "../wallet/manager";
import { KeyStore } from "../../src/wallet";
import { Logger } from "../../src/utilities/logger";

const logger = Logger.globalLogger();

export class Transactions {
    /**
     * Send tokens to an address
     */
    public static async send(
        to: string,
        amount: string,
        tokenStandard: string,
        decimals: number,
        walletAddress: string,
        password: string,
        nodeUrl: string,
        accountIndex: number
    ): Promise<AccountBlockTemplate> {
        const zenon = Zenon.getInstance();

        try {
            // Parse amount
            const amountFloat = parseFloat(amount);
            if (isNaN(amountFloat) || amountFloat <= 0) {
                throw new Error("Amount must be a positive number");
            }

            if (tokenStandard.toLowerCase() === "znn") {
                tokenStandard = ZNN_ZTS.toString()
            }

            if (tokenStandard.toLowerCase() === "qsr") {
                tokenStandard = QSR_ZTS.toString()
            }

            // Parse addresses and token standard
            const toAddress = Address.parse(to);
            const zts = TokenStandard.parse(tokenStandard);

            logger.info(`\n🚀 Sending ${amount} tokens...`);
            logger.info(`From: ${walletAddress} (index: ${accountIndex})`);
            logger.info(`To: ${toAddress.toString()}`);
            logger.info(`Token: ${tokenStandard}`);
            logger.info(`Node: ${nodeUrl}\n`);

            // Check if wallet exists
            if (!Manager.walletExists(walletAddress)) {
                throw new Error(`Wallet not found: ${walletAddress}`);
            }

            // Connect to node
            logger.info("Connecting to node...");
            await zenon.initialize(nodeUrl);
            logger.info("✓ Connected\n");

            // Load wallet
            logger.info("Loading wallet...");
            const mnemonic = await Manager.dumpMnemonic(walletAddress, password);
            const keyStore = KeyStore.fromMnemonic(mnemonic);
            const keyPair = keyStore.getKeyPair(accountIndex);
            logger.info("✓ Wallet loaded\n");

            // Convert amount to base units
            const amountInBaseUnits = extractNumberDecimals(amountFloat, decimals);

            // Create block template
            logger.info("Creating transaction...");
            const blockTemplate = AccountBlockTemplate.send(
                toAddress,
                zts,
                amountInBaseUnits
            );

            // Send transaction (PoW will be generated automatically if needed)
            logger.info("Sending transaction...");
            logger.info("(PoW will be generated automatically if you don't have enough Plasma)\n");

            const transaction = await zenon.send(blockTemplate, keyPair);

            // Success!
            logger.info("✅ Transaction sent successfully!\n");
            logger.info("Transaction Details:");
            logger.info("  Hash:", transaction.hash.toString());
            logger.info("  Height:", transaction.height);
            logger.info("  Amount:", amount);
            logger.info("  Token:", tokenStandard);
            logger.info("  Nonce:", transaction.nonce);
            logger.info("  Difficulty:", transaction.difficulty);

            if (transaction.difficulty > 0) {
                logger.info("\n✓ PoW was generated for this transaction");
            } else {
                logger.info("\n✓ Transaction used fused Plasma (no PoW needed)");
            }

            logger.info();

            return transaction;
        } catch (error: any) {
            throw new Error(`Transaction failed: ${error.message}`);
        } finally {
            zenon.clearConnection();
        }
    }

    /**
     * Receive a transaction by hash
     */
    public static async receive(
        transactionHash: string,
        walletAddress: string,
        password: string,
        nodeUrl: string,
        accountIndex: number
    ): Promise<AccountBlockTemplate> {
        const zenon = Zenon.getInstance();

        try {
            // Parse transaction hash
            const hash = Hash.parse(transactionHash);

            logger.info(`\n📥 Receiving transaction...`);
            logger.info(`Wallet: ${walletAddress} (index: ${accountIndex})`);
            logger.info(`Transaction Hash: ${hash.toString()}`);
            logger.info(`Node: ${nodeUrl}\n`);

            // Check if wallet exists
            if (!Manager.walletExists(walletAddress)) {
                throw new Error(`Wallet not found: ${walletAddress}`);
            }

            // Connect to node
            logger.info("Connecting to node...");
            await zenon.initialize(nodeUrl);
            logger.info("✓ Connected\n");

            // Load wallet
            logger.info("Loading wallet...");
            const mnemonic = await Manager.dumpMnemonic(walletAddress, password);
            const keyStore = KeyStore.fromMnemonic(mnemonic);
            const keyPair = keyStore.getKeyPair(accountIndex);
            logger.info("✓ Wallet loaded\n");

            // Verify the send block exists and is for this address
            logger.info("Verifying transaction...");
            const sendBlock = await zenon.ledger.getAccountBlockByHash(hash);

            if (!sendBlock) {
                throw new Error(`Transaction not found: ${hash.toString()}`);
            }

            const receiverAddress = keyPair.getAddress();
            if (sendBlock.toAddress.toString() !== receiverAddress.toString()) {
                throw new Error(`Transaction is not addressed to this wallet. Expected: ${receiverAddress.toString()}, Got: ${sendBlock.toAddress.toString()}`);
            }

            logger.info("✓ Transaction verified\n");

            // Create receive block template
            logger.info("Creating receive block...");
            const blockTemplate = AccountBlockTemplate.receive(hash);

            // Send receive transaction
            logger.info("Receiving transaction...");
            logger.info("(PoW will be generated automatically if you don't have enough Plasma)\n");

            const transaction = await zenon.send(blockTemplate, keyPair);

            // Success!
            logger.info("✅ Transaction received successfully!\n");
            logger.info("Receive Block Details:");
            logger.info("  Hash:", transaction.hash.toString());
            logger.info("  Height:", transaction.height);
            logger.info("  From Block Hash:", sendBlock.hash.toString());
            logger.info("  Amount:", sendBlock.amount.toString());
            logger.info("  Token:", sendBlock.token?.symbol || sendBlock.tokenStandard.toString());
            logger.info("  Nonce:", transaction.nonce);
            logger.info("  Difficulty:", transaction.difficulty);

            if (transaction.difficulty > 0) {
                logger.info("\n✓ PoW was generated for this transaction");
            } else {
                logger.info("\n✓ Transaction used fused Plasma (no PoW needed)");
            }

            logger.info();

            return transaction;
        } catch (error: any) {
            throw new Error(`Receive failed: ${error.message}`);
        } finally {
            zenon.clearConnection();
        }
    }

    /**
     * Receive a transaction by hash
     */
    public static async receiveAll(
        walletAddress: string,
        password: string,
        nodeUrl: string,
        accountIndex: number
    ): Promise<void> {
        const zenon = Zenon.getInstance();

        try {
            logger.info(`\n📥 Receiving all transaction...`);
            logger.info(`Wallet: ${walletAddress} (index: ${accountIndex})`);
            logger.info(`Node: ${nodeUrl}\n`);

            // Check if wallet exists
            if (!Manager.walletExists(walletAddress)) {
                throw new Error(`Wallet not found: ${walletAddress}`);
            }

            // Connect to node
            logger.info("Connecting to node...");
            await zenon.initialize(nodeUrl);
            logger.info("✓ Connected\n");

            // Load wallet
            logger.info("Loading wallet...");
            const mnemonic = await Manager.dumpMnemonic(walletAddress, password);
            const keyStore = KeyStore.fromMnemonic(mnemonic);
            const keyPair = keyStore.getKeyPair(accountIndex);
            const address = keyPair.getAddress()
            logger.info("✓ Wallet loaded\n");

            // Unreceived transactions for address
            let unreceived = await zenon.ledger.getUnreceivedBlocksByAddress(address)

            if (unreceived.count === 0) {
                logger.info("No unreceived transactions found");
            }

            // Loop through unreceived blocks
            while (unreceived.count > 0) {
                for (const unreceivedBlock of unreceived.list) {

                    logger.info("Creating receive block...");
                    const receiveBlock = AccountBlockTemplate.receive(unreceivedBlock.hash)

                    logger.info("Receiving transaction...");
                    const transaction = await zenon.send(receiveBlock, keyPair)

                    // Success!
                    logger.info("✅ Transaction received successfully!\n");
                    logger.info("Receive Block Details:");
                    logger.info("  Hash:", transaction.hash.toString());
                    logger.info("  Height:", transaction.height);
                    logger.info("  From Block Hash:", unreceivedBlock.hash.toString());
                    logger.info("  Amount:", unreceivedBlock.amount.toString());
                    logger.info("  Token:", unreceivedBlock.tokenStandard.toString());
                    logger.info("  Nonce:", transaction.nonce);
                    logger.info("  Difficulty:", transaction.difficulty);

                    if (transaction.difficulty > 0) {
                        logger.info("\n✓ PoW was generated for this transaction");
                    } else {
                        logger.info("\n✓ Transaction used fused Plasma (no PoW needed)");
                    }

                    logger.info();
                }

                unreceived = await zenon.ledger.getUnreceivedBlocksByAddress(address);
            }
        } catch (error: any) {
            throw new Error(`Receive failed: ${error.message}`);
        } finally {
            zenon.clearConnection();
        }
    }

    /**
     * Receive a transaction by hash
     */
    public static async autoReceive(
        walletAddress: string,
        password: string,
        nodeUrl: string,
        accountIndex: number
    ): Promise<void> {
        const zenon = Zenon.getInstance();

        try {
            logger.info(`\n📥 Listening for all incoming transaction...`);
            logger.info(`Wallet: ${walletAddress} (index: ${accountIndex})`);
            logger.info(`Node: ${nodeUrl}\n`);

            // Check if wallet exists
            if (!Manager.walletExists(walletAddress)) {
                throw new Error(`Wallet not found: ${walletAddress}`);
            }

            // Connect to node
            logger.info("Connecting to node...");
            await zenon.initialize(nodeUrl);
            logger.info("✓ Connected\n");

            // Load wallet
            logger.info("Loading wallet...");
            const mnemonic = await Manager.dumpMnemonic(walletAddress, password);
            const keyStore = KeyStore.fromMnemonic(mnemonic);
            const keyPair = keyStore.getKeyPair(accountIndex);
            const address = keyPair.getAddress()
            logger.info("✓ Wallet loaded\n");

            // Subscribe to incoming transactions
            logger.info("Subscribe to toUnreceivedAccountBlocksByAddress endpoint...");
            const unreceivedTxStream = await zenon.subscribe.toUnreceivedAccountBlocksByAddress(address);
            logger.info("✓ Subscribed\n");

            unreceivedTxStream.onNotification(async (data) => {

                logger.info(`Receiving incoming tx [Hash: ${data[0].hash}]`);
                const hash = Hash.parse(data[0].hash)

                logger.info("Creating receive block...");
                const receiveBlock = AccountBlockTemplate.receive(hash)

                logger.info("Receiving transaction...");
                await zenon.send(receiveBlock, keyPair)

                // Success!
                logger.info("✅ Transaction received successfully!\n");
                logger.info();
            });

            logger.info("Listening for incoming transactions. Press Ctrl+C to stop...\n");

            // Wait indefinitely until interrupted
            await new Promise<void>((resolve) => {
                process.on("SIGINT", () => {
                    logger.info("\n\n🛑 Stopping auto-receive...");
                    resolve();
                });
            });
        } catch (error: any) {
            throw new Error(`Receive failed: ${error.message}`);
        } finally {
            zenon.clearConnection();
        }
    }
}
