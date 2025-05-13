import { expect } from "chai";
import { Encryptor } from "../../src/wallet/encryptor.js";
import { Crypto } from "../../src/crypto/crypto.js";

describe("Encryptor", () => {
    const testKey = Crypto.randomBytes(32);

    let encryptor: Encryptor;

    beforeEach(() => {
        encryptor = new Encryptor(testKey);
    });

    describe("Constructor", () => {
        it("should create an instance with a key", () => {
            expect(encryptor).to.be.instanceOf(Encryptor);
        });
    });

    describe("setKey", () => {
        it("should create an encryptor with a key using setKey", () => {
            const newEncryptor = Encryptor.setKey(testKey);
            expect(newEncryptor).to.be.instanceOf(Encryptor);
        });
    });

    describe("Encryption and Decryption", () => {
        const testMessage = Buffer.from("Hello, Encryption World!").toString("hex");
        let encryptedResult: [string, Buffer];

        it("should encrypt a message", () => {
            encryptedResult = encryptor.encrypt(testMessage);

            expect(encryptedResult).to.be.an("array");
            expect(encryptedResult[0]).to.be.a("string"); // Encrypted string in hex format
            expect(encryptedResult[1]).to.be.instanceOf(Buffer); // Nonce as buffer
        });

        it("should decrypt the encrypted message", () => {
            const [encryptedText, nonce] = encryptor.encrypt(testMessage);

            // Separate cipher text and auth tag
            const cipherText = encryptedText.slice(0, -32); // Ciphertext (excluding auth tag)
            const authTag = Buffer.from(encryptedText.slice(-32), "hex"); // Last 16 bytes (auth tag)

            // Attempt decryption
            const decryptedBuffer = encryptor.decrypt(
                Buffer.from(cipherText, "hex"), // Convert ciphertext back to buffer
                nonce, // Nonce from encryption
                authTag // Auth tag
            );

            // Convert the decrypted buffer back to a string to verify correctness
            expect(decryptedBuffer.toString("utf8")).to.equal("Hello, Encryption World!");
        });
    });

    describe("Error Handling", () => {
        it("should throw error with invalid decryption parameters", () => {
            const testMessage = "Test message";
            const [encryptedText, nonce] = encryptor.encrypt(testMessage);

            // Attempt to decrypt with incorrect parameters
            expect(() => {
                encryptor.decrypt(Buffer.from("invalid-cipher"), nonce, Buffer.from(encryptedText.slice(-32), "hex"));
            }).to.throw();
        });
    });

    describe("Multiple Encryptions", () => {
        it("should allow multiple independent encryptions", () => {
            const messages = [
                Buffer.from("First secret message").toString("hex"),
                Buffer.from("Second secret message").toString("hex"),
                Buffer.from("Third secret message").toString("hex")
            ];

            const encryptedMessages = messages.map(msg => encryptor.encrypt(msg));

            encryptedMessages.forEach((encData, index) => {
                const [encryptedText, nonce] = encData;

                // Separate cipher text and auth tag
                const cipherText = encryptedText.slice(0, -32); // Ciphertext (excluding auth tag)
                const authTag = Buffer.from(encryptedText.slice(-32), "hex"); // Last 16 bytes (auth tag)

                // Decrypt
                const decryptedBuffer = encryptor.decrypt(
                    Buffer.from(cipherText, "hex"), // Convert ciphertext back to buffer
                    nonce, // Nonce from encryption
                    authTag // Auth tag
                );

                // Convert back to UTF-8 string for comparison
                expect(decryptedBuffer.toString("utf8")).to.equal(Buffer.from(messages[index], "hex").toString("utf8"));
            });
        });
    });
});
