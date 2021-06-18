import { JoyApi } from "./joyApi";
import { PromiseAllObj } from "./utils";

const api = new JoyApi();

export async function getStatus() {
  await api.init;

  const status = await PromiseAllObj({
    totalIssuance: await api.totalIssuance(),
    system: await api.systemData(),
    finalizedBlockHeight: await api.finalizedBlockHeight(),
    validators: await api.validatorsData(),
    memberships: await api.membershipData()
  });

  return status;
}
