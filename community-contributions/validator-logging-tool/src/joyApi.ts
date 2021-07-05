import { WsProvider, ApiPromise } from "@polkadot/api";
import { types } from "@joystream/types";
import { AccountId, Hash, Moment } from "@polkadot/types/interfaces";
import { config } from "dotenv";
import BN from "bn.js";
import { log } from './debug';
import {Option, Vec} from "@polkadot/types";

config();

export interface ActiveEra {
  era: number,
  block: number,
  date: string,
  points: number
}

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


  async getActiveEras() {
    const stash = '5EhDdcWm4TdqKp1ew1PqtSpoAELmjbZZLm5E34aFoVYkXdRW'
    const blockStart = 1069639;
    const startHash = (await this.api.rpc.chain.getBlockHash(blockStart));
    console.log(`Start Hash [${startHash}]`);
    const startEra = (await this.api.query.staking.activeEra.at(startHash)).unwrap().index.toNumber();
    console.log(`Start Era [${startEra}]`);
    const startTimestamp = new Date((await this.api.query.timestamp.now.at(startHash)).toNumber()).toISOString();
    console.log(`Start Date [${startTimestamp}]`);
    const blockEnd = 1270177;
    const endHash = (await this.api.rpc.chain.getBlockHash(blockStart));
    console.log(`End Hash [${endHash}]`);
    const endEra = (await this.api.query.staking.activeEra.at(endHash)).unwrap().index.toNumber();
    console.log(`End Era [${endEra}]`);
    const endTimestamp = new Date((await this.api.query.timestamp.now.at(endHash)).toNumber()).toISOString();
    console.log(`End Date [${endTimestamp}]`);

    let activeEras: number[] = [];
    for (let blockHeight = blockStart; blockHeight < blockEnd; blockHeight += 1) {
      const blockHash = (await this.api.rpc.chain.getBlockHash(blockHeight));
      //console.log(`Block Hash [${startHash}]`);
      const blockEra = (await this.api.query.staking.activeEra.at(blockHash)).unwrap().index.toNumber();
      //console.log(`Block Era [${blockEra}]`);
      const blockTimestamp = new Date((await this.api.query.timestamp.now.at(blockHash)).toNumber()).toISOString();
      //console.log(`Block Date [${blockTimestamp}]`);  
      const eraPoints = await this.api.query.staking.erasRewardPoints.at(blockHash, blockEra)
      //console.log(`Era Points [${eraPoints}]`);
      // const currPoints = 0;
      eraPoints.individual.forEach((points,author) => {
          //console.log(`Author Points [${author}]`);
          //console.log(`Individual Points [${points}]`);
          if(author.toString() === stash) {
            // const pn = Number(points.toBigInt())
            // const activeEra = {
            //   era: blockEra,
            //   block: blockHeight,
            //   date: blockTimestamp,
            //   points: pn
            // }
            const activeEra = blockEra
            if (activeEras.indexOf(activeEra) < 0) {
              activeEras.push(activeEra)
              console.log(`Era [${blockEra}], Date [${blockTimestamp}]`); //, Points [${pn}]
            }
          }
      });
    }
    return {
      activeEras
    }
  }

  // async scoringPeriodBlocksEras() {
  //   const scoringPeriodStartTime = "2021-06-21T00:00:00.000Z";
  //   const scoringPeriodEndTime = "2021-07-04T23:59:59.999Z";
  //   do {

  //   }
  // }

  async scoringPeriodData() {
    const blockStart = 1069700;
    const blockEnd = 1270000;

    const blocksData = []

    let newBlock = blockStart
    while(true) {
      const blockHash = (await this.api.rpc.chain.getBlockHash(newBlock)) as Hash;
      const blockEra = (await this.api.query.staking.activeEra.at(blockHash)).unwrap().index.toNumber();
      const blockTimestamp = new Date((await this.api.query.timestamp.now.at(blockHash) as unknown as Moment).toNumber()).toISOString();
      blocksData.push(
        {
          newBlock,
          blockHash,
          blockEra,
          blockTimestamp
        }
      )
      if (blockTimestamp.indexOf("2021-06-20") > -1) {
        break;
      }
      newBlock -= 1
    }
    // {
    //     "newBlock": 1069639,
    //     "blockHash": "0x2ac052528a1d1a28a4fef7f95c61092396a709bde571f2464e27cde657d4f1b1",
    //     "blockEra": 1786,
    //     "blockTimestamp": "2021-06-21T00:00:00.000Z"
    // },
    // {
    //   "newBlock": 1270177,
    //   "blockHash": "0x1af139be716904820c7d2a9d6ed05f6245f8c58aecbdaf05064ff174c645e5e8",
    //   "blockEra": 2122,
    //   "blockTimestamp": "2021-07-04T23:59:54.001Z"
    // },

    const startHash = (await this.api.rpc.chain.getBlockHash(blockStart)) as Hash;
    const startEra = (await this.api.query.staking.activeEra.at(startHash)).unwrap().index.toNumber();
    const startTimestamp = new Date((await this.api.query.timestamp.now.at(startHash) as unknown as Moment).toNumber()).toISOString();

    const endHash = (await this.api.rpc.chain.getBlockHash(blockEnd)) as Hash;
    const endTimestamp = new Date((await this.api.query.timestamp.now.at(endHash) as unknown as Moment).toNumber()).toISOString();
    const endEra = (await this.api.query.staking.activeEra.at(endHash)).unwrap().index.toNumber();

    return {
      startEra,
      startHash,
      startTimestamp,
      endEra,
      endHash,
      endTimestamp,
      blocksData
    }
  }

  async eraData() {
    const address = '5EhDdcWm4TdqKp1ew1PqtSpoAELmjbZZLm5E34aFoVYkXdRW';
    const account = await this.api.query.system.account(address);
    const era = await this.api.query.staking.currentEra();
    
    const firstHead = this.api.rpc.chain.getHeader();
    const currHash = await this.api.query.system.account.hash(address);
    const currSize = await this.api.query.system.account.size(address);
    const stashes = (await this.api.derive.staking.stashes()).map((s) => String(s))
    const stakers = await this.api.query.staking.erasStakers(era.unwrap(), stashes[0]);
    
    // let startHash = (await this.api.rpc.chain.getBlockHash(1000000)) as Hash;
    // const startEra = (await this.api.query.staking.currentEra.at(startHash) as Option<EraIndex>).unwrap().toNumber();
    // let startTimestamp = new Date((await this.api.query.timestamp.now.at(startHash) as unknown as Moment).toNumber()).toISOString();
    
    // let endHash = (await this.api.rpc.chain.getBlockHash(1274434)) as Hash;
    // let endTimestamp = new Date((await this.api.query.timestamp.now.at(endHash) as unknown as Moment).toNumber()).toISOString();
    // const endEra = (await this.api.query.staking.currentEra.at(endHash) as Option<EraIndex>).unwrap().toNumber();

    // let startValidators = await this.findActiveValidators(startHash, false);
    // let endValidators = await this.findActiveValidators(endHash, true);

    return {
      currentEra: era.isSome ? era.unwrap().toNumber() : {},
      // startEra,
      // startHash,
      // startTimestamp,
      // endEra,
      // endHash,
      // endTimestamp,
      // startValidators,
      // endValidators,
      firstHead,
      account,
      currHash,
      currSize,
      stashes,
      stakers
    }
  }

  async findActiveValidators(hash: Hash, searchPreviousBlocks: boolean): Promise<AccountId[]> {
    const block = await this.api.rpc.chain.getBlock(hash);

    let currentBlockNr = block.block.header.number.toNumber();
    let activeValidators;
    do {
        let currentHash = (await this.api.rpc.chain.getBlockHash(currentBlockNr)) as Hash;
        let allValidators = await this.api.query.staking.snapshotValidators.at(currentHash) as Option<Vec<AccountId>>;
        if (!allValidators.isEmpty) {
            let max = (await this.api.query.staking.validatorCount.at(currentHash)).toNumber();
            activeValidators = Array.from(allValidators.unwrap()).slice(0, max);
        }

        if (searchPreviousBlocks) {
            --currentBlockNr;
        } else {
            ++currentBlockNr;
        }

    } while (activeValidators == undefined);
    return activeValidators;
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
