import { JoyApi } from "./joyApi";
import { PromiseAllObj } from "./utils";

// const api = new JoyApi('wss://rome-rpc-endpoint.joystream.org:9944/');
const api = new JoyApi();

export async function getStatus() {
  await api.init;

  const status = await PromiseAllObj({
    activeEras: await api.getActiveEras(),
    // totalIssuance: await api.totalIssuance(),
    // currentEra: await api.eraData(),
    // system: await api.systemData(),
    // finalizedBlockHeight: await api.finalizedBlockHeight(),
    // validators: await api.validatorsData(),
    // memberships: await api.membershipData(),
  });

  return status;
}
