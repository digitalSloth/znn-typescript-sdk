import { Command } from "commander";
import { Manager } from "./wallet/manager";
import { Logger } from "../src/utilities/logger";
const logger = Logger.globalLogger();

export function createWalletCommands(): Command {
    const wallet = new Command("wallet");
    wallet.description("Wallet management commands");

    // wallet.list - List all wallets
    wallet
        .command("list")
        .description("List all wallets in the wallet directory")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action((options) => {
            try {
                if (options.walletPath) {
                    Manager.setWalletPath(options.walletPath);
                }

                const wallets = Manager.listWallets();

                if (wallets.length === 0) {
                    logger.info("No wallets found in", Manager.getWalletPath());
                    return;
                }

                logger.info(`\nFound ${wallets.length} wallet(s) in ${Manager.getWalletPath()}:\n`);
                wallets.forEach((wallet, index) => {
                    logger.info(`${index + 1}. ${wallet.address}`);
                    logger.info(`   File: ${wallet.fileName}`);
                });
                logger.info();
            } catch (error: any) {
                logger.warn("Error listing wallets:", error.message);
                process.exit(1);
            }
        });

    // wallet.create - Create a new wallet (optionally from mnemonic)
    wallet
        .command("create")
        .description("Create a new wallet (optionally from an existing mnemonic)")
        .requiredOption("-p, --password <password>", "Wallet password")
        .option("-n, --name <name>", "Custom wallet name (defaults to base address)")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action(async (options) => {
            try {
                if (options.walletPath) {
                    Manager.setWalletPath(options.walletPath);
                }

                // Create new random wallet
                const result = await Manager.createNew(options.password, options.name);
                logger.info("\n✓ Wallet created successfully!\n");
                logger.info("Address:", result.address);
                logger.info("Mnemonic:", result.mnemonic);
                logger.info("File:", result.filePath);
                logger.info("\n⚠️  IMPORTANT: Save your mnemonic in a secure location. It cannot be recovered if lost!\n");
            } catch (error: any) {
                logger.warn("Error creating wallet:", error.message);
                process.exit(1);
            }
        });

    // wallet.import - Import wallet from mnemonic
    wallet
        .command("import")
        .description("Import a wallet from a mnemonic phrase")
        .requiredOption("-m, --mnemonic <mnemonic>", "Mnemonic phrase")
        .requiredOption("-p, --password <password>", "Wallet password")
        .option("-n, --name <name>", "Custom wallet name (defaults to base address)")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action(async (options) => {
            try {
                if (options.walletPath) {
                    Manager.setWalletPath(options.walletPath);
                }

                const result = await Manager.createFromMnemonic(options.mnemonic, options.password, options.name);

                logger.info("\n✓ Wallet imported successfully!\n");
                logger.info("Address:", result.address);
                logger.info("File:", result.filePath);
                logger.info();
            } catch (error: any) {
                logger.warn("Error importing wallet:", error.message);
                process.exit(1);
            }
        });

    // wallet.export - Export wallet mnemonic
    wallet
        .command("export <address>")
        .description("Export the mnemonic from a wallet")
        .requiredOption("-p, --password <password>", "Wallet password")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action(async (address, options) => {
            try {
                if (options.walletPath) {
                    Manager.setWalletPath(options.walletPath);
                }

                const mnemonic = await Manager.dumpMnemonic(address, options.password);

                logger.info("\n✓ Mnemonic exported successfully!\n");
                logger.info("Mnemonic:", mnemonic);
                logger.info("\n⚠️  IMPORTANT: Keep your mnemonic secure. Anyone with access to it can control your wallet!\n");
            } catch (error: any) {
                logger.warn("Error exporting wallet:", error.message);
                process.exit(1);
            }
        });

    // wallet.derive - Derive addresses
    wallet
        .command("derive <address> <start> <end>")
        .description("Derive addresses from a wallet by index range")
        .requiredOption("-p, --password <password>", "Wallet password")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action(async (address, start, end, options) => {
            try {
                if (options.walletPath) {
                    Manager.setWalletPath(options.walletPath);
                }
                const startIndex = parseInt(start);
                const endIndex = parseInt(end);

                if (isNaN(startIndex) || isNaN(endIndex)) {
                    logger.warn("Error: Start and end indices must be numbers");
                    process.exit(1);
                }

                const addresses = await Manager.deriveAddresses(address, options.password, startIndex, endIndex);

                logger.info(`\n✓ Derived ${addresses.length} address(es):\n`);
                addresses.forEach((addr, index) => {
                    logger.info(`Index ${startIndex + index}: ${addr}`);
                });
                logger.info();
            } catch (error: any) {
                logger.warn("Error deriving addresses:", error.message);
                process.exit(1);
            }
        });

    // wallet.copy - Copy wallet to custom location
    wallet
        .command("copy <address> <destination>")
        .description("Copy a wallet file to a custom location")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action((address, destination, options) => {
            try {
                if (options.walletPath) {
                    Manager.setWalletPath(options.walletPath);
                }
                Manager.exportWallet(address, destination);
                logger.info(`\n✓ Wallet copied successfully to ${destination}\n`);
            } catch (error: any) {
                logger.warn("Error copying wallet:", error.message);
                process.exit(1);
            }
        });

    // wallet.delete - Delete wallet
    wallet
        .command("delete <address>")
        .description("Delete a wallet from the wallet directory")
        .option("-f, --force", "Skip confirmation prompt")
        .option("--wallet-path <path>", "Custom wallet directory path")
        .action(async (address, options) => {
            try {
                if (options.walletPath) {
                    Manager.setWalletPath(options.walletPath);
                }
                if (!Manager.walletExists(address)) {
                    logger.warn(`Error: Wallet not found: ${address}`);
                    process.exit(1);
                }

                // Confirm deletion unless --force is used
                if (!options.force) {
                    const readline = await import("readline");
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });

                    const confirm = await new Promise<string>((resolve) => {
                        rl.question(`Are you sure you want to delete wallet ${address}? (yes/no): `, (answer) => {
                            rl.close();
                            resolve(answer.toLowerCase());
                        });
                    });

                    if (confirm !== "yes" && confirm !== "y") {
                        logger.info("Deletion cancelled.");
                        return;
                    }
                }

                Manager.deleteWallet(address);
                logger.info(`\n✓ Wallet deleted successfully: ${address}\n`);
            } catch (error: any) {
                logger.warn("Error deleting wallet:", error.message);
                process.exit(1);
            }
        });

    return wallet;
}
