import { expect } from "chai";
import {
    ExtraData,
    NetworkInfo,
    OsInfo,
    Peer,
    ProcessInfo,
    SyncInfo,
    SyncState
} from "../../src/model/stats.js";
import { Address } from "../../src/model/primitives/address.js";

describe("Stats Model Classes", () => {

    describe("Peer", () => {
        it("should create instance with correct properties", () => {
            const peer = new Peer("publicKey123", "192.168.1.1");

            expect(peer.publicKey).to.equal("publicKey123");
            expect(peer.ip).to.equal("192.168.1.1");
        });

        it("should deserialize from JSON", () => {
            const json = {
                publicKey: "abc123def456",
                ip: "10.0.0.1"
            };

            const peer = Peer.fromJson(json);

            expect(peer).to.be.instanceOf(Peer);
            expect(peer.publicKey).to.equal("abc123def456");
            expect(peer.ip).to.equal("10.0.0.1");
        });

        it("should serialize to JSON", () => {
            const peer = new Peer("key789", "172.16.0.1");
            const json = peer.toJson();

            expect(json).to.deep.equal({
                publicKey: "key789",
                ip: "172.16.0.1"
            });
        });
    });

    describe("NetworkInfo", () => {
        it("should create instance with correct properties", () => {
            const self = new Peer("selfKey", "127.0.0.1");
            const peers = [
                new Peer("peer1", "10.0.0.1"),
                new Peer("peer2", "10.0.0.2")
            ];

            const networkInfo = new NetworkInfo(2, self, peers);

            expect(networkInfo.numPeers).to.equal(2);
            expect(networkInfo.self).to.equal(self);
            expect(networkInfo.peers).to.deep.equal(peers);
        });

        it("should deserialize from JSON", () => {
            const json = {
                numPeers: 3,
                self: {
                    publicKey: "mySelfKey",
                    ip: "192.168.1.100"
                },
                peers: [
                    { publicKey: "peerKey1", ip: "192.168.1.101" },
                    { publicKey: "peerKey2", ip: "192.168.1.102" },
                    { publicKey: "peerKey3", ip: "192.168.1.103" }
                ]
            };

            const networkInfo = NetworkInfo.fromJson(json);

            expect(networkInfo).to.be.instanceOf(NetworkInfo);
            expect(networkInfo.numPeers).to.equal(3);
            expect(networkInfo.self).to.be.instanceOf(Peer);
            expect(networkInfo.self.publicKey).to.equal("mySelfKey");
            expect(networkInfo.peers).to.have.length(3);
            expect(networkInfo.peers[0]).to.be.instanceOf(Peer);
            expect(networkInfo.peers[0].publicKey).to.equal("peerKey1");
        });

        it("should serialize to JSON", () => {
            const self = new Peer("selfKey", "127.0.0.1");
            const peers = [
                new Peer("peer1", "10.0.0.1")
            ];
            const networkInfo = new NetworkInfo(1, self, peers);
            const json = networkInfo.toJson();

            expect(json).to.deep.equal({
                numPeers: 1,
                self: {
                    publicKey: "selfKey",
                    ip: "127.0.0.1"
                },
                peers: [
                    { publicKey: "peer1", ip: "10.0.0.1" }
                ]
            });
        });

        it("should handle empty peers array", () => {
            const json = {
                numPeers: 0,
                self: { publicKey: "onlyMe", ip: "127.0.0.1" },
                peers: []
            };

            const networkInfo = NetworkInfo.fromJson(json);

            expect(networkInfo.numPeers).to.equal(0);
            expect(networkInfo.peers).to.be.an("array").that.is.empty;
        });
    });

    describe("ProcessInfo", () => {
        it("should create instance with correct properties", () => {
            const processInfo = new ProcessInfo("abc123", "v1.0.0");

            expect(processInfo.commit).to.equal("abc123");
            expect(processInfo.version).to.equal("v1.0.0");
        });

        it("should deserialize from JSON", () => {
            const json = {
                commit: "def456789",
                version: "v2.3.4"
            };

            const processInfo = ProcessInfo.fromJson(json);

            expect(processInfo).to.be.instanceOf(ProcessInfo);
            expect(processInfo.commit).to.equal("def456789");
            expect(processInfo.version).to.equal("v2.3.4");
        });

        it("should serialize to JSON", () => {
            const processInfo = new ProcessInfo("commit123", "v0.1.0");
            const json = processInfo.toJson();

            expect(json).to.deep.equal({
                commit: "commit123",
                version: "v0.1.0"
            });
        });
    });

    describe("OsInfo", () => {
        it("should create instance with correct properties", () => {
            const osInfo = new OsInfo(
                "linux",
                "ubuntu",
                "debian",
                "22.04",
                "5.15.0",
                16000000000,
                8000000000,
                8,
                42
            );

            expect(osInfo.os).to.equal("linux");
            expect(osInfo.platform).to.equal("ubuntu");
            expect(osInfo.platformFamily).to.equal("debian");
            expect(osInfo.platformVersion).to.equal("22.04");
            expect(osInfo.kernelVersion).to.equal("5.15.0");
            expect(osInfo.memoryTotal).to.equal(16000000000);
            expect(osInfo.memoryFree).to.equal(8000000000);
            expect(osInfo.numCPU).to.equal(8);
            expect(osInfo.numGoroutine).to.equal(42);
        });

        it("should deserialize from JSON", () => {
            const json = {
                os: "darwin",
                platform: "macOS",
                platformFamily: "darwin",
                platformVersion: "13.0",
                kernelVersion: "22.1.0",
                memoryTotal: 32000000000,
                memoryFree: 16000000000,
                numCPU: 16,
                numGoroutine: 100
            };

            const osInfo = OsInfo.fromJson(json);

            expect(osInfo).to.be.instanceOf(OsInfo);
            expect(osInfo.os).to.equal("darwin");
            expect(osInfo.platform).to.equal("macOS");
            expect(osInfo.platformFamily).to.equal("darwin");
            expect(osInfo.platformVersion).to.equal("13.0");
            expect(osInfo.kernelVersion).to.equal("22.1.0");
            expect(osInfo.memoryTotal).to.equal(32000000000);
            expect(osInfo.memoryFree).to.equal(16000000000);
            expect(osInfo.numCPU).to.equal(16);
            expect(osInfo.numGoroutine).to.equal(100);
        });

        it("should serialize to JSON", () => {
            const osInfo = new OsInfo(
                "windows",
                "win10",
                "windows",
                "10.0.19041",
                "10.0.19041",
                8000000000,
                4000000000,
                4,
                20
            );
            const json = osInfo.toJson();

            expect(json).to.deep.equal({
                os: "windows",
                platform: "win10",
                platformFamily: "windows",
                platformVersion: "10.0.19041",
                kernelVersion: "10.0.19041",
                memoryTotal: 8000000000,
                memoryFree: 4000000000,
                numCPU: 4,
                numGoroutine: 20
            });
        });
    });

    describe("SyncInfo", () => {
        it("should create instance with correct properties", () => {
            const syncInfo = new SyncInfo(SyncState.Syncing, 1000, 5000);

            expect(syncInfo.state).to.equal(SyncState.Syncing);
            expect(syncInfo.currentHeight).to.equal(1000);
            expect(syncInfo.targetHeight).to.equal(5000);
        });

        it("should deserialize from JSON with Syncing state", () => {
            const json = {
                state: 1,
                currentHeight: 2500,
                targetHeight: 10000
            };

            const syncInfo = SyncInfo.fromJson(json);

            expect(syncInfo).to.be.instanceOf(SyncInfo);
            expect(syncInfo.state).to.equal(SyncState.Syncing);
            expect(syncInfo.currentHeight).to.equal(2500);
            expect(syncInfo.targetHeight).to.equal(10000);
        });

        it("should deserialize from JSON with SyncDone state", () => {
            const json = {
                state: 2,
                currentHeight: 10000,
                targetHeight: 10000
            };

            const syncInfo = SyncInfo.fromJson(json);

            expect(syncInfo.state).to.equal(SyncState.SyncDone);
            expect(syncInfo.currentHeight).to.equal(10000);
            expect(syncInfo.targetHeight).to.equal(10000);
        });

        it("should deserialize from JSON with NotEnoughPeers state", () => {
            const json = {
                state: 3,
                currentHeight: 100,
                targetHeight: 0
            };

            const syncInfo = SyncInfo.fromJson(json);

            expect(syncInfo.state).to.equal(SyncState.NotEnoughPeers);
        });

        it("should serialize to JSON", () => {
            const syncInfo = new SyncInfo(SyncState.SyncDone, 5000, 5000);
            const json = syncInfo.toJson();

            expect(json).to.deep.equal({
                state: 2,
                currentHeight: 5000,
                targetHeight: 5000
            });
        });
    });

    describe("ExtraData", () => {
        it("should create instance with correct properties", () => {
            const address = Address.parse("z1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsggv2f");
            const extraData = new ExtraData(address);

            expect(extraData.affiliate).to.equal(address);
        });

        it("should deserialize from JSON", () => {
            const json = {
                affiliate: "z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq"
            };

            const extraData = ExtraData.fromJson(json);

            expect(extraData).to.be.instanceOf(ExtraData);
            expect(extraData.affiliate).to.be.instanceOf(Address);
            expect(extraData.affiliate.toString()).to.equal("z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq");
        });

        it("should serialize to JSON", () => {
            const address = Address.parse("z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp");
            const extraData = new ExtraData(address);
            const json = extraData.toJson();

            expect(json).to.deep.equal({
                affiliate: "z1qxemdeddedxplasmaxxxxxxxxxxxxxxxxsctrp"
            });
        });
    });

    describe("SyncState Enum", () => {
        it("should have correct enum values", () => {
            expect(SyncState.Unknown).to.equal(0);
            expect(SyncState.Syncing).to.equal(1);
            expect(SyncState.SyncDone).to.equal(2);
            expect(SyncState.NotEnoughPeers).to.equal(3);
        });
    });
});
