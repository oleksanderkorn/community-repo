import { WsProvider, ApiPromise } from "@polkadot/api";
import { types } from "@joystream/types";
import { Hash } from "@polkadot/types/interfaces";
import { config } from "dotenv";
import BN from "bn.js";
import { log } from './debug';

config();

export class JoyApi {
  endpoint: string;
  isReady: Promise<ApiPromise>;
  api!: ApiPromise;

  constructor(endpoint?: string) {
    const wsEndpoint =
      endpoint || process.env.PROVIDER || "ws://127.0.0.1:9944";
    log(`Endpoint: [${wsEndpoint}]`)
    this.endpoint = wsEndpoint;
    this.isReady = (async () => {
      const api = await new ApiPromise({ provider: new WsProvider(wsEndpoint), types })
        .isReadyOrError;
      return api;
    })();
  }
  get init(): Promise<JoyApi> {
    return this.isReady.then((instance) => {
      this.api = instance;
      return this;
    });
  }

  async totalIssuance(blockHash?: Hash) {
    const issuance =
      blockHash === undefined
        ? await this.api.query.balances.totalIssuance()
        : await this.api.query.balances.totalIssuance.at(blockHash);

    return issuance.toNumber();
  }

  async systemData() {
    const [chain, nodeName, nodeVersion, peers] = await Promise.all([
      this.api.rpc.system.chain(),
      this.api.rpc.system.name(),
      this.api.rpc.system.version(),
      this.api.rpc.system.peers(),
    ]);

    return {
      chain: chain.toString(),
      nodeName: nodeName.toString(),
      nodeVersion: nodeVersion.toString(),
      peerCount: peers.length,
    };
  }

  async finalizedHash() {
    return this.api.rpc.chain.getFinalizedHead();
  }

  async finalizedBlockHeight() {
    const finalizedHash = await this.finalizedHash();
    const { number } = await this.api.rpc.chain.getHeader(`${finalizedHash}`);
    return number.toNumber();
  }

  async validatorsData() {
    const validators = await this.api.query.session.validators();
    const era = await this.api.query.staking.currentEra();
    const totalStake = era.isSome ?
      await this.api.query.staking.erasTotalStake(era.unwrap())
      : new BN(0);

    return {
      count: validators.length,
      validators: validators.toJSON(),
      total_stake: totalStake.toNumber(),
    };
  }

  async membershipData() {
    // Member ids start from 0, so nextMemberId === number of members created
    const membersCreated = await this.api.query.members.nextMemberId();
    return {
      platform_members: membersCreated.toNumber(),
    };
  }

}
