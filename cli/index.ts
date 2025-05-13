#! /usr/bin/env node

import figlet from "figlet";
import { Command } from "commander";
import { ZNN_SDK_VERSION } from "../src/zenon";
import { createWalletCommands } from "./walletCommands";
import { createTransactionCommands } from "./transactionCommands";

// Silence deprecation warnings
process.removeAllListeners("warning");

console.log(figlet.textSync("Zenon CLI"));

const program = new Command();

program
    .version(ZNN_SDK_VERSION)
    .description("A CLI for interacting with the Zenon Network");

// Add wallet commands
program.addCommand(createWalletCommands());

// Add transaction commands
program.addCommand(createTransactionCommands());

program.parse(process.argv);

if (! process.argv.slice(2).length) {
    program.outputHelp();
}
