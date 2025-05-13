import { Buffer } from "buffer";
import { Address } from "../model/primitives/address.js";
import { Crypto } from "../crypto/crypto.js";

/**
 * Represents a cryptographic key pair, including a private key, public key,
 * and associated address. Provides methods for retrieving keys,
 * generating a public address, and signing data.
 */
export class KeyPair {

    privateKey: Buffer;
    publicKey: Buffer;
    address: Address;

    constructor(privateKey : Buffer) {
        if (! privateKey || privateKey.length === 0) {
            throw new Error("Invalid private key");
        }

        this.privateKey = Buffer.from(privateKey);
        this.publicKey = Crypto.getPublicKey(this.privateKey);
        this.address = Address.fromPublicKey(this.publicKey);
    }

    public static fromPrivateKey(privateKey: Buffer) {
        return new KeyPair(privateKey);
    }

    public getPrivateKey(): Buffer {
        return this.privateKey;
    }

    public getPublicKey(): Buffer {
        return this.publicKey;
    }

    public getAddress(): Address {
        return this.address;
    }

    public sign(data: Buffer): Buffer{
        return Crypto.sign(data, this.privateKey);
    }
}

