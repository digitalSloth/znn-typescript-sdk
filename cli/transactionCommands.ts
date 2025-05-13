import { Command } from "commander";
import { Transactions } from "./transactions/transactions";
import { Logger } from "../src/utilities/logger";

const logger = Logger.globalLogger();

export function createTransactionCommands(): Command {
    const transaction = new Command("tx");
    transaction.description("Transaction commands for sending and receiving");

    // transaction.send - Send tokens
    transaction
        .command("send <to> <amount> <tokenStandard>")
        .description("Send tokens to an address (use ZNN, QSR or ZTS like zts1znnxxxxxxxxxxxxx9z4ulx)")
        .requiredOption("-w, --wallet <address>", "Sender wallet address")
        .requiredOption("-p, --password <password>", "Wallet password")
        .option("-n, --node <url>", "Node URL", "wss://node.zenonhub.io:35998")
        .option("-i, --index <index>", "Account index (default: 0)", "0")
        .option("-d, --decimals <decimals>", "Token decimals (default: 8)", "8")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action(async (to, amount, tokenStandard, options) => {
            try {
                const decimals = parseInt(options.decimals);
                const accountIndex = parseInt(options.index);

                await Transactions.send(
                    to,
                    amount,
                    tokenStandard,
                    decimals,
                    options.wallet,
                    options.password,
                    options.node,
                    accountIndex
                );
            } catch (error: any) {
                logger.warn("\n✗ Error:", error.message);
                process.exit(1);
            }
        });

    // transaction.receive - Receive a transaction
    transaction
        .command("receive <transactionHash>")
        .description("Receive a transaction by its hash")
        .requiredOption("-w, --wallet <address>", "Receiver wallet address")
        .requiredOption("-p, --password <password>", "Wallet password")
        .option("-n, --node <url>", "Node URL", "wss://node.zenonhub.io:35998")
        .option("-i, --index <index>", "Account index (default: 0)", "0")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action(async (transactionHash, options) => {
            try {
                const accountIndex = parseInt(options.index);

                await Transactions.receive(
                    transactionHash,
                    options.wallet,
                    options.password,
                    options.node,
                    accountIndex
                );
            } catch (error: any) {
                logger.warn("\n✗ Error:", error.message);
                process.exit(1);
            }
        });

    // transaction.receiveAll - Receive all pending transactions
    transaction
        .command("receiveAll")
        .description("Receive all a wallets unreceived transactions")
        .requiredOption("-w, --wallet <address>", "Receiver wallet address")
        .requiredOption("-p, --password <password>", "Wallet password")
        .option("-n, --node <url>", "Node URL", "wss://node.zenonhub.io:35998")
        .option("-i, --index <index>", "Account index (default: 0)", "0")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action(async (options) => {
            try {
                const accountIndex = parseInt(options.index);

                await Transactions.receiveAll(
                    options.wallet,
                    options.password,
                    options.node,
                    accountIndex
                );
            } catch (error: any) {
                logger.warn("\n✗ Error:", error.message);
                process.exit(1);
            }
        });

    // transaction.autoReceive - Automatically receive all incoming transactions
    transaction
        .command("autoReceive")
        .description("Receive all a wallets unreceived transactions")
        .requiredOption("-w, --wallet <address>", "Receiver wallet address")
        .requiredOption("-p, --password <password>", "Wallet password")
        .option("-n, --node <url>", "Node URL", "wss://node.zenonhub.io:35998")
        .option("-i, --index <index>", "Account index (default: 0)", "0")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action(async (options) => {
            try {
                const accountIndex = parseInt(options.index);

                await Transactions.autoReceive(
                    options.wallet,
                    options.password,
                    options.node,
                    accountIndex
                );
            } catch (error: any) {
                logger.warn("\n✗ Error:", error.message);
                process.exit(1);
            }
        });

    return transaction;
}
