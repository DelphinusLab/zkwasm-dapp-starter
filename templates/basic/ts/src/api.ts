import {ZKWasmAppRpc } from "zkwasm-ts-server";

const CMD_INSTALL_PLAYER = 1n;
const CMD_INC_COUNTER = 2n;


function createCommand(nonce: bigint, command: bigint, feature: bigint) {
  return (nonce << 16n) + (feature << 8n) + command;
}

export class Player {
  processingKey: string;
  rpc: ZKWasmAppRpc;
  constructor(key: string, rpc: string) {
    this.processingKey = key
    this.rpc = new ZKWasmAppRpc(rpc);
  }

  async getState(): Promise<any> {
    let state:any = await this.rpc.queryState(this.processingKey);
    return JSON.parse(state.data);
  }

  async getNonce(): Promise<bigint> {
    let state:any = await this.rpc.queryState(this.processingKey);
    let nonce = 0n;
    if (state.data) {
      let data = JSON.parse(state.data);
      if (data.player) {
        nonce = BigInt(data.player.nonce);
      }
    }
    return nonce;
  }

  async register() {
    let nonce = await this.getNonce();
    try {
      let result = await this.rpc.sendTransaction(
        new BigUint64Array([createCommand(nonce, CMD_INSTALL_PLAYER, 0n), 0n, 0n, 0n]),
        this.processingKey
      );
      return result
    } catch(e) {
      if (e instanceof Error) {
        console.log(e.message);
      }
    }
  }

  async incCounter() {
    let nonce = await this.getNonce();
    try {
      let result = await this.rpc.sendTransaction(
        new BigUint64Array([createCommand(nonce, CMD_INC_COUNTER, 0n), 0n, 0n, 0n]), this.processingKey);
      return result;
    } catch(e) {
      if (e instanceof Error) {
        console.log(e.message);
      }
    }
  }
}

