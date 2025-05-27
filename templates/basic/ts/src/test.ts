//import initHostBind, * as hostbind from "./wasmbind/hostbind.js";
//import initHostBind, * as hostbind from "./wasmbind/hostbind.js";
import { Player } from "./api.js";
let account = "1234";
let player = new Player(account, "http://localhost:3000");


async function main() {
  //let towerId = 10038n + y;
  let state = await player.getState();
  console.log(state);
  console.log("register");
  state = await player.register();
  console.log(state);
  console.log("inc counter");
  state = await player.incCounter();
  console.log(state);
}

main();

