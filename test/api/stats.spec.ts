import { expect } from "chai";
import { StatsApi } from "../../src/api/stats.js";
import {
    ExtraData,
    NetworkInfo,
    OsInfo,
    ProcessInfo,
    SyncInfo,
    SyncState
} from "../../src/model/stats.js";
import { MockClient } from "./mockClient.js";

describe("StatsApi", () => {
    let statsApi: StatsApi;
    let mockClient: MockClient;

    beforeEach(() => {
        mockClient = new MockClient();
        statsApi = new StatsApi();
        statsApi.setClient(mockClient);
    });

    describe("osInfo", () => {
        it("should fetch and parse osInfo correctly", async () => {
            const mockResponse = {
                os: "linux",
                platform: "ubuntu",
                platformFamily: "debian",
                platformVersion: "22.04",
                kernelVersion: "5.15.0-91-generic",
                memoryTotal: 16777216000,
                memoryFree: 8388608000,
                numCPU: 8,
                numGoroutine: 42
            };

            mockClient.setMockResponse("stats.osInfo", mockResponse);

            const result = await statsApi.osInfo();

            // Verify the request was made correctly
            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("stats.osInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            // Verify the response was parsed correctly
            expect(result).to.be.instanceOf(OsInfo);
            expect(result.os).to.equal("linux");
            expect(result.platform).to.equal("ubuntu");
            expect(result.platformFamily).to.equal("debian");
            expect(result.platformVersion).to.equal("22.04");
            expect(result.kernelVersion).to.equal("5.15.0-91-generic");
            expect(result.memoryTotal).to.equal(16777216000);
            expect(result.memoryFree).to.equal(8388608000);
            expect(result.numCPU).to.equal(8);
            expect(result.numGoroutine).to.equal(42);
        });
    });

    describe("processInfo", () => {
        it("should fetch and parse processInfo correctly", async () => {
            const mockResponse = {
                commit: "abc123def456",
                version: "v1.0.0-alpha"
            };

            mockClient.setMockResponse("stats.processInfo", mockResponse);

            const result = await statsApi.processInfo();

            // Verify the request was made correctly
            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("stats.processInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            // Verify the response was parsed correctly
            expect(result).to.be.instanceOf(ProcessInfo);
            expect(result.commit).to.equal("abc123def456");
            expect(result.version).to.equal("v1.0.0-alpha");
        });
    });

    describe("networkInfo", () => {
        it("should fetch and parse networkInfo correctly", async () => {
            const mockResponse = {
                numPeers: 3,
                self: {
                    publicKey: "my-public-key-123",
                    ip: "192.168.1.100"
                },
                peers: [
                    { publicKey: "peer-key-1", ip: "10.0.0.1" },
                    { publicKey: "peer-key-2", ip: "10.0.0.2" },
                    { publicKey: "peer-key-3", ip: "10.0.0.3" }
                ]
            };

            mockClient.setMockResponse("stats.networkInfo", mockResponse);

            const result = await statsApi.networkInfo();

            // Verify the request was made correctly
            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("stats.networkInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            // Verify the response was parsed correctly
            expect(result).to.be.instanceOf(NetworkInfo);
            expect(result.numPeers).to.equal(3);
            expect(result.self.publicKey).to.equal("my-public-key-123");
            expect(result.self.ip).to.equal("192.168.1.100");
            expect(result.peers).to.have.length(3);
            expect(result.peers[0].publicKey).to.equal("peer-key-1");
            expect(result.peers[0].ip).to.equal("10.0.0.1");
        });

        it("should handle no peers", async () => {
            const mockResponse = {
                numPeers: 0,
                self: {
                    publicKey: "isolated-node",
                    ip: "127.0.0.1"
                },
                peers: []
            };

            mockClient.setMockResponse("stats.networkInfo", mockResponse);

            const result = await statsApi.networkInfo();

            expect(result.numPeers).to.equal(0);
            expect(result.peers).to.be.an("array").that.is.empty;
        });

        it("should handle many peers", async () => {
            const peers = Array.from({ length: 50 }, (_, i) => ({
                publicKey: `peer-${i}`,
                ip: `10.0.${Math.floor(i / 255)}.${i % 255}`
            }));

            const mockResponse = {
                numPeers: 50,
                self: { publicKey: "self", ip: "127.0.0.1" },
                peers
            };

            mockClient.setMockResponse("stats.networkInfo", mockResponse);

            const result = await statsApi.networkInfo();

            expect(result.numPeers).to.equal(50);
            expect(result.peers).to.have.length(50);
        });
    });

    describe("syncInfo", () => {
        it("should fetch and parse syncInfo with Syncing state", async () => {
            const mockResponse = {
                state: 1,
                currentHeight: 5000,
                targetHeight: 10000
            };

            mockClient.setMockResponse("stats.syncInfo", mockResponse);

            const result = await statsApi.syncInfo();

            // Verify the request was made correctly
            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("stats.syncInfo");
            expect(lastCall!.parameters).to.deep.equal([]);

            // Verify the response was parsed correctly
            expect(result).to.be.instanceOf(SyncInfo);
            expect(result.state).to.equal(SyncState.Syncing);
            expect(result.currentHeight).to.equal(5000);
            expect(result.targetHeight).to.equal(10000);
        });

        it("should handle SyncDone state", async () => {
            const mockResponse = {
                state: 2,
                currentHeight: 15000,
                targetHeight: 15000
            };

            mockClient.setMockResponse("stats.syncInfo", mockResponse);

            const result = await statsApi.syncInfo();

            expect(result.state).to.equal(SyncState.SyncDone);
            expect(result.currentHeight).to.equal(result.targetHeight);
        });

        it("should handle NotEnoughPeers state", async () => {
            const mockResponse = {
                state: 3,
                currentHeight: 100,
                targetHeight: 0
            };

            mockClient.setMockResponse("stats.syncInfo", mockResponse);

            const result = await statsApi.syncInfo();

            expect(result.state).to.equal(SyncState.NotEnoughPeers);
            expect(result.currentHeight).to.equal(100);
        });

        it("should handle Unknown state", async () => {
            const mockResponse = {
                state: 0,
                currentHeight: 0,
                targetHeight: 0
            };

            mockClient.setMockResponse("stats.syncInfo", mockResponse);

            const result = await statsApi.syncInfo();

            expect(result.state).to.equal(SyncState.Unknown);
        });
    });

    describe("extraData", () => {
        it("should fetch and parse extraData correctly", async () => {
            const jsonString = JSON.stringify({
                affiliate: "z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f"
            });

            mockClient.setMockResponse("stats.extraData", jsonString);

            const result = await statsApi.extraData();

            // Verify the request was made correctly
            const lastCall = mockClient.getLastCall();
            expect(lastCall).to.exist;
            expect(lastCall!.method).to.equal("stats.extraData");
            expect(lastCall!.parameters).to.deep.equal([]);

            // Verify the response was parsed correctly
            expect(result).to.be.instanceOf(ExtraData);
            expect(result.affiliate.toString()).to.equal("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
        });
    });
});
