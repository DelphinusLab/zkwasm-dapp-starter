import { Service } from "zkwasm-ts-server";

const service = new Service((txWitness, events) => {
  return Promise.resolve();
}, () => {
  return Promise.resolve();
});
await service.initialize();
await service.serve();


