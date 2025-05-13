import { expect } from "chai";
import { Zenon, DEFAULT_CHAIN_ID, DEFAULT_NET_ID, DEFAULT_POW_BASE_PATH } from "../src/zenon.js";
import { HttpClient } from "../src/client/http.js";
import { WsClient } from "../src/client/websocket.js";
import { AccountBlockTemplate, BlockTypeEnum } from "../src/model/nom/accountBlock.js";
import { Address, Hash, EMPTY_HASH, ZNN_ZTS } from "../src/model/primitives/index.js";
import { BigNumber } from "../src/utilities/bignumber.js";
import { KeyPair } from "../src/wallet/keyPair.js";

const ADDRESS_B = "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp";
const HASH_A = "a".repeat(64);

describe("Zenon", () => {
    beforeEach(() => {
        (Zenon as any)._singleton = undefined;
        Zenon.setNetworkID(DEFAULT_NET_ID);
        Zenon.setChainID(DEFAULT_CHAIN_ID);
        Zenon.setPowBasePath(DEFAULT_POW_BASE_PATH);
    });

    it("should return the same singleton instance", () => {
        const a = Zenon.getInstance();
        const b = Zenon.getInstance();
        expect(a).to.equal(b);
    });

    it("should initialize with an HTTP client", async () => {
        const zenon = Zenon.getInstance();
        await zenon.initialize("http://localhost:35997");

        expect(zenon.client).to.be.instanceOf(HttpClient);
        expect(zenon.ledger.client).to.equal(zenon.client);
        expect(zenon.stats.client).to.equal(zenon.client);
        expect(zenon.embedded.client).to.equal(zenon.client);
        expect((zenon.subscribe as any).client).to.equal(undefined);
    });

    it("should clear websocket connections", () => {
        const zenon = Zenon.getInstance();
        const wsClient = new WsClient("ws://localhost");
        let stopped = false;

        wsClient.stop = () => {
            stopped = true;
        };

        zenon.client = wsClient;
        zenon.clearConnection();

        expect(stopped).to.equal(true);
        expect(zenon.client).to.equal(undefined);
    });

    it("should update network and chain identifiers", () => {
        Zenon.setNetworkID(7);
        Zenon.setChainID(9);

        expect(Zenon.getNetworkID()).to.equal(7);
        expect(Zenon.getChainIdentifier()).to.equal(9);
    });

    it("should update and retrieve PoW base path", () => {
        // Absolute path with trailing slash
        Zenon.setPowBasePath("/assets/");
        expect(Zenon.getPowBasePath()).to.equal("/assets/");

        // Absolute path without trailing slash
        Zenon.setPowBasePath("/public");
        expect(Zenon.getPowBasePath()).to.equal("/public/");

        // Relative path - should auto-add ./
        Zenon.setPowBasePath("node_modules/znn-typescript-sdk/dist/browser");
        expect(Zenon.getPowBasePath()).to.equal("./node_modules/znn-typescript-sdk/dist/browser/");

        // Already has ./
        Zenon.setPowBasePath("./assets");
        expect(Zenon.getPowBasePath()).to.equal("./assets/");

        // Already has ../
        Zenon.setPowBasePath("../dist/browser");
        expect(Zenon.getPowBasePath()).to.equal("../dist/browser/");

        // Full URL
        Zenon.setPowBasePath("https://cdn.example.com/pow");
        expect(Zenon.getPowBasePath()).to.equal("https://cdn.example.com/pow/");

        // Empty string
        Zenon.setPowBasePath("");
        expect(Zenon.getPowBasePath()).to.equal("/");
    });

    it("should send transactions through the utility helper", async () => {
        const zenon = Zenon.getInstance();
        const keyPair = KeyPair.fromPrivateKey(Buffer.alloc(32, 1));
        const publishCalls: AccountBlockTemplate[] = [];

        (zenon as any).ledger = {
            getFrontierAccountBlock: async () => null,
            getFrontierMomentum: async () => ({ hash: Hash.parse(HASH_A), height: 10 }),
            getAccountBlockByHash: async () => null,
            publishRawTransaction: async (tx: AccountBlockTemplate) => {
                publishCalls.push(tx);
                return tx;
            }
        };
        (zenon as any).embedded = {
            plasma: {
                getRequiredPoWForAccountBlock: async () => ({
                    requiredDifficulty: 0,
                    basePlasma: 5,
                    availablePlasma: 5
                })
            }
        };

        const tx = new AccountBlockTemplate({
            blockType: BlockTypeEnum.UserSend,
            toAddress: Address.parse(ADDRESS_B),
            amount: BigNumber.from(1),
            tokenStandard: ZNN_ZTS,
            data: Buffer.from([])
        });

        const result = await zenon.send(tx, keyPair);

        expect(publishCalls).to.have.length(1);
        expect(result.address.toString()).to.equal(keyPair.getAddress().toString());
        expect(result.previousHash.toString()).to.equal(EMPTY_HASH.toString());
        expect(result.nonce).to.equal("0000000000000000");
    });
});
