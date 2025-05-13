import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface WalletInfo {
    address: string;
    fileName: string;
    filePath: string;
}

/**
 * CLI-specific file system storage utility
 * Provides file operations and wallet management for CLI applications
 */
export class Storage {
    private static walletDirectory?: string;

    // ===== Generic File System Operations =====

    /**
     * Ensure a directory exists, creating it if necessary
     */
    private static ensureDirectory(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * List all files in a directory
     */
    private static listFiles(directory: string): string[] {
        if (!fs.existsSync(directory)) {
            return [];
        }
        return fs.readdirSync(directory);
    }

    /**
     * Read file contents as a string
     */
    private static readFile(filePath: string): string {
        return fs.readFileSync(filePath, "utf-8");
    }

    /**
     * Write string data to a file
     */
    private static writeFile(filePath: string, data: string): void {
        const dir = path.dirname(filePath);
        Storage.ensureDirectory(dir);
        fs.writeFileSync(filePath, data, "utf-8");
    }

    /**
     * Delete a file if it exists
     */
    private static deleteFile(filePath: string): void {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    /**
     * Check if a file exists
     */
    private static fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    /**
     * Copy a file from source to destination
     */
    private static copyFile(sourcePath: string, destinationPath: string): void {
        const dir = path.dirname(destinationPath);
        Storage.ensureDirectory(dir);
        fs.copyFileSync(sourcePath, destinationPath);
    }

    // ===== Wallet-Specific Operations =====

    /**
     * Get the default wallet directory path based on OS
     * macOS: ~/Library/znn/wallet
     * Linux: ~/.znn/wallet
     * Windows: %APPDATA%/znn/wallet
     */
    public static getDefaultWalletPath(): string {
        const platform = os.platform();
        const homeDir = os.homedir();

        switch (platform) {
            case "darwin": // macOS
                return path.join(homeDir, "Library", "znn", "wallet");
            case "win32": // Windows
                return path.join(process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"), "znn", "wallet");
            default: // Linux and others
                return path.join(homeDir, ".znn", "wallet");
        }
    }

    /**
     * Set the wallet directory path. If not set, defaults to OS-specific path.
     */
    public static setWalletPath(customPath?: string): void {
        Storage.walletDirectory = customPath || Storage.getDefaultWalletPath();
        Storage.ensureDirectory(Storage.walletDirectory);
    }

    /**
     * Get the current wallet directory path
     */
    public static getWalletPath(): string {
        if (!Storage.walletDirectory) {
            Storage.setWalletPath();
        }
        return Storage.walletDirectory!;
    }

    /**
     * List all wallets in the wallet directory
     */
    public static listWallets(): WalletInfo[] {
        const walletPath = Storage.getWalletPath();
        const files = Storage.listFiles(walletPath);

        return files
            .filter(file => file.endsWith(".json") || !file.includes("."))
            .map(file => {
                const filePath = path.join(walletPath, file);
                const address = file.replace(".json", "");
                return {
                    address,
                    fileName: file,
                    filePath
                };
            });
    }

    /**
     * Save a wallet to the wallet directory
     */
    public static saveWallet(address: string, encryptedKeyFileData: object): void {
        const walletPath = Storage.getWalletPath();
        const filePath = path.join(walletPath, address);

        const jsonData = JSON.stringify(encryptedKeyFileData, null, 2);
        Storage.writeFile(filePath, jsonData);
    }

    /**
     * Load a wallet from the wallet directory
     */
    public static loadWallet(address: string): any {
        const walletPath = Storage.getWalletPath();
        let filePath = path.join(walletPath, address);

        // Try with and without .json extension
        if (!Storage.fileExists(filePath)) {
            filePath = path.join(walletPath, `${address}.json`);
        }

        if (!Storage.fileExists(filePath)) {
            throw new Error(`Wallet not found: ${address}`);
        }

        const fileContent = Storage.readFile(filePath);
        return JSON.parse(fileContent);
    }

    /**
     * Check if a wallet exists
     */
    public static walletExists(address: string): boolean {
        const walletPath = Storage.getWalletPath();
        const filePath1 = path.join(walletPath, address);
        const filePath2 = path.join(walletPath, `${address}.json`);

        return Storage.fileExists(filePath1) || Storage.fileExists(filePath2);
    }

    /**
     * Delete a wallet from the wallet directory
     */
    public static deleteWallet(address: string): void {
        const walletPath = Storage.getWalletPath();
        let filePath = path.join(walletPath, address);

        // Try with and without .json extension
        if (!Storage.fileExists(filePath)) {
            filePath = path.join(walletPath, `${address}.json`);
        }

        if (!Storage.fileExists(filePath)) {
            throw new Error(`Wallet not found: ${address}`);
        }

        Storage.deleteFile(filePath);
    }

    /**
     * Export a wallet to a custom destination
     */
    public static exportWallet(address: string, destinationPath: string): void {
        const walletPath = Storage.getWalletPath();
        let sourcePath = path.join(walletPath, address);

        // Try with and without .json extension
        if (!Storage.fileExists(sourcePath)) {
            sourcePath = path.join(walletPath, `${address}.json`);
        }

        if (!Storage.fileExists(sourcePath)) {
            throw new Error(`Wallet not found: ${address}`);
        }

        Storage.copyFile(sourcePath, destinationPath);
    }

    /**
     * Get the full path to a wallet file
     */
    public static getWalletFilePath(address: string): string {
        const walletPath = Storage.getWalletPath();
        let filePath = path.join(walletPath, address);

        if (!Storage.fileExists(filePath)) {
            filePath = path.join(walletPath, `${address}.json`);
        }

        return filePath;
    }
}
