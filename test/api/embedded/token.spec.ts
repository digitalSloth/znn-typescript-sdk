import { expect } from "chai";
import { TokenApi } from "../../../src/api/embedded/token.js";
import { ONE_ZNN } from "../../../src/api/embedded/constants.js";
import { Token as TokenContract } from "../../../src/embedded/token.js";
import { Token, TokenList } from "../../../src/model/nom/index.js";
import { AccountBlockTemplate } from "../../../src/model/nom/index.js";
import {
    Address,
    TokenStandard,
    TOKEN_ADDRESS,
    ZNN_ZTS
} from "../../../src/model/primitives/index.js";
import { arrayify } from "../../../src/utilities/bytes.js";
import { BigNumber } from "../../../src/utilities/bignumber.js";
import { MockClient } from "../mockClient.js";

const ADDRESS = "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f";
const TOKEN_STANDARD = "zts1znnxxxxxxxxxxxxx9z4ulx";

const makeTokenJson = (overrides: Record<string, any> = {}) => ({
    name: "Zenon",
    symbol: "ZNN",
    domain: "zenon",
    totalSupply: "1000000",
    decimals: 8,
    owner: ADDRESS,
    tokenStandard: TOKEN_STANDARD,
    maxSupply: "100000000",
    isBurnable: true,
    isMintable: true,
    isUtility: true,
    ...overrides
});

const makeTokenListJson = (overrides: Record<string, any> = {}) => ({
    count: 1,
    list: [makeTokenJson()],
    ...overrides
});

describe("TokenApi", () => {
    let tokenApi: TokenApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        tokenApi = new TokenApi();
        tokenApi.setClient(mockClient);
    });

    describe("getAll", () => {
        it("should fetch and parse tokens", async () => {
            mockClient.setMockResponse("embedded.token.getAll", makeTokenListJson());

            const result = await tokenApi.getAll(0, 5);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.token.getAll");
            expect(lastCall!.parameters).to.deep.equal([0, 5]);

            expect(result).to.be.instanceOf(TokenList);
            expect(result.list[0]).to.be.instanceOf(Token);
            expect(result.list[0].symbol).to.equal("ZNN");
        });
    });

    describe("getByOwner", () => {
        it("should fetch tokens by owner", async () => {
            mockClient.setMockResponse("embedded.token.getByOwner", makeTokenListJson());

            const address = Address.parse(ADDRESS);
            const result = await tokenApi.getByOwner(address, 1, 3);

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.token.getByOwner");
            expect(lastCall!.parameters).to.deep.equal([address.toString(), 1, 3]);

            expect(result).to.be.instanceOf(TokenList);
        });
    });

    describe("getByZts", () => {
        it("should fetch token by ZTS", async () => {
            mockClient.setMockResponse("embedded.token.getByZts", makeTokenJson());

            const result = await tokenApi.getByZts(TokenStandard.parse(TOKEN_STANDARD));

            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("embedded.token.getByZts");
            expect(lastCall!.parameters).to.deep.equal([TOKEN_STANDARD]);

            expect(result).to.be.instanceOf(Token);
            expect(result!.tokenStandard.toString()).to.equal(TOKEN_STANDARD);
        });

        it("should return null when token is missing", async () => {
            mockClient.setMockResponse("embedded.token.getByZts", null);

            const result = await tokenApi.getByZts(TokenStandard.parse(TOKEN_STANDARD));

            expect(result).to.equal(null);
        });
    });

    describe("issueToken", () => {
        it("should build an issue token block", async () => {
            const totalSupply = BigNumber.from(1000);
            const maxSupply = BigNumber.from(2000);

            const template = await tokenApi.issueToken(
                "TokenName",
                "TKN",
                "example.com",
                totalSupply,
                maxSupply,
                8,
                true,
                false,
                true
            );

            const expectedData = TokenContract.abi.encodeFunctionData("IssueToken", [
                "TokenName",
                "TKN",
                "example.com",
                totalSupply.toString(),
                maxSupply.toString(),
                8,
                true,
                false,
                true
            ]);

            expect(template).to.be.instanceOf(AccountBlockTemplate);
            expect(template.toAddress.toString()).to.equal(TOKEN_ADDRESS.toString());
            expect(template.tokenStandard.toString()).to.equal(ZNN_ZTS.toString());
            expect(template.amount.toString()).to.equal(ONE_ZNN.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("mint", () => {
        it("should build a mint block", () => {
            const tokenStandard = TokenStandard.parse(TOKEN_STANDARD);
            const amount = BigNumber.from(50);
            const receiveAddress = Address.parse(ADDRESS);

            const template = tokenApi.mint(tokenStandard, amount, receiveAddress);

            const expectedData = TokenContract.abi.encodeFunctionData("Mint", [
                tokenStandard.toString(),
                amount.toString(),
                receiveAddress.toString()
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("burnToken", () => {
        it("should build a burn token block", () => {
            const tokenStandard = TokenStandard.parse(TOKEN_STANDARD);
            const amount = BigNumber.from(10);

            const template = tokenApi.burnToken(tokenStandard, amount);

            const expectedData = TokenContract.abi.encodeFunctionData("Burn", []);

            expect(template.tokenStandard.toString()).to.equal(tokenStandard.toString());
            expect(template.amount.toString()).to.equal(amount.toString());
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });

    describe("updateToken", () => {
        it("should build an update token block", () => {
            const tokenStandard = TokenStandard.parse(TOKEN_STANDARD);
            const owner = Address.parse(ADDRESS);

            const template = tokenApi.updateToken(tokenStandard, owner, true, false);

            const expectedData = TokenContract.abi.encodeFunctionData("UpdateToken", [
                tokenStandard.toString(),
                owner.toString(),
                true,
                false
            ]);

            expect(template.amount.toString()).to.equal("0");
            expect(template.data.toString("hex"))
                .to.equal(Buffer.from(arrayify(expectedData)).toString("hex"));
        });
    });
});
