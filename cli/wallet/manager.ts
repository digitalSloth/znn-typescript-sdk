import { KeyFile, KeyStore } from "../../src/wallet";
import { Storage, WalletInfo } from "./storage";

export class Manager {

    /**
     * Create a new wallet with a random mnemonic
     */
    public static async createNew(password: string, name?: string): Promise<{ address: string; mnemonic: string; filePath: string }> {
        if (!password || password.length === 0) {
            throw new Error("Password is required");
        }

        const keyStore = KeyStore.newRandom();
        const address = name || keyStore.getBaseAddress().toString();

        const keyFile = KeyFile.setPassword(password);
        const encryptedData = await keyFile.encrypt(keyStore);

        Storage.saveWallet(address, encryptedData);

        return {
            address: keyStore.getBaseAddress().toString(),
            mnemonic: keyStore.mnemonic,
            filePath: Storage.getWalletFilePath(address)
        };
    }

    /**
     * Import a wallet from a mnemonic
     */
    public static async createFromMnemonic(
        mnemonic: string,
        password: string,
        name?: string
    ): Promise<{ address: string; filePath: string }> {
        if (!mnemonic || mnemonic.length === 0) {
            throw new Error("Mnemonic is required");
        }

        if (!password || password.length === 0) {
            throw new Error("Password is required");
        }

        const keyStore = KeyStore.fromMnemonic(mnemonic);
        const address = name || keyStore.getBaseAddress().toString();

        const keyFile = KeyFile.setPassword(password);
        const encryptedData = await keyFile.encrypt(keyStore);

        Storage.saveWallet(address, encryptedData);

        return {
            address: keyStore.getBaseAddress().toString(),
            filePath: Storage.getWalletFilePath(address)
        };
    }

    /**
     * Export the mnemonic from a wallet
     */
    public static async dumpMnemonic(addressOrName: string, password: string): Promise<string> {
        if (!password || password.length === 0) {
            throw new Error("Password is required");
        }

        const encryptedData = Storage.loadWallet(addressOrName);

        const keyFile = KeyFile.setPassword(password);
        const keyStore = await keyFile.decrypt(encryptedData);

        return keyStore.mnemonic;
    }

    /**
     * Derive addresses from a wallet by index range
     */
    public static async deriveAddresses(addressOrName: string, password: string, startIndex: number, endIndex: number): Promise<string[]> {
        if (!password || password.length === 0) {
            throw new Error("Password is required");
        }

        if (startIndex < 0 || endIndex < startIndex) {
            throw new Error("Invalid index range");
        }

        const encryptedData = Storage.loadWallet(addressOrName);

        const keyFile = KeyFile.setPassword(password);
        const keyStore = await keyFile.decrypt(encryptedData);

        const addresses: string[] = [];
        for (let i = startIndex; i <= endIndex; i++) {
            const keyPair = keyStore.getKeyPair(i);
            addresses.push(keyPair.getAddress().toString());
        }

        return addresses;
    }

    /**
     * List all wallets in the wallet directory
     */
    public static listWallets(): WalletInfo[] {
        return Storage.listWallets();
    }

    /**
     * Export a wallet file to a custom destination
     */
    public static exportWallet(addressOrName: string, destinationPath: string): void {
        Storage.exportWallet(addressOrName, destinationPath);
    }

    /**
     * Delete a wallet
     */
    public static deleteWallet(addressOrName: string): void {
        Storage.deleteWallet(addressOrName);
    }

    /**
     * Check if a wallet exists
     */
    public static walletExists(addressOrName: string): boolean {
        return Storage.walletExists(addressOrName);
    }

    /**
     * Get wallet file path
     */
    public static getWalletFilePath(addressOrName: string): string {
        return Storage.getWalletFilePath(addressOrName);
    }

    /**
     * Set a custom wallet directory path
     */
    public static setWalletPath(customPath?: string): void {
        Storage.setWalletPath(customPath);
    }

    /**
     * Get the current wallet directory path
     */
    public static getWalletPath(): string {
        return Storage.getWalletPath();
    }
}
