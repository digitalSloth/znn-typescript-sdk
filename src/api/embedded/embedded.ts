import { Api } from "../base.js";
import { Client } from "../../client/interfaces.js";
import { AcceleratorApi } from "./accelerator.js";
import { BridgeApi } from "./bridge.js";
import { HtlcApi } from "./htlc.js";
import { LiquidityApi } from "./liquidity.js";
import { PillarApi } from "./pillar.js";
import { PlasmaApi } from "./plasma.js";
import { SentinelApi } from "./sentinel.js";
import { SporkApi } from "./spork.js";
import { StakeApi } from "./stake.js";
import { SwapApi } from "./swap.js";
import { TokenApi } from "./token.js";


export class EmbeddedApi extends Api {
    constructor(
        public accelerator = new AcceleratorApi(),
        public bridge = new BridgeApi(),
        public htlc = new HtlcApi(),
        public liquidity = new LiquidityApi(),
        public pillar = new PillarApi(),
        public plasma = new PlasmaApi(),
        public sentinel = new SentinelApi(),
        public spork = new SporkApi(),
        public stake = new StakeApi(),
        public swap = new SwapApi(),
        public token = new TokenApi(),
    ){
        super()
    }

    setClient(client: Client): void{
        this.client = client;
        this.accelerator.setClient(client);
        this.bridge.setClient(client);
        this.htlc.setClient(client);
        this.liquidity.setClient(client);
        this.pillar.setClient(client);
        this.plasma.setClient(client);
        this.sentinel.setClient(client);
        this.spork.setClient(client);
        this.stake.setClient(client);
        this.swap.setClient(client);
        this.token.setClient(client);
    }
}
