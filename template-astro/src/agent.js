console.log("b");
import { Actor, HttpAgent } from "@dfinity/agent";
console.log("c");
import {
  idlFactory as counter_idl,
  canisterId as counter_id,
} from "dfx-generated/counter";
console.log("d");

const agentOptions = {
  host: "http://localhost:8000",
};

const agent = new HttpAgent(agentOptions);
const counter = Actor.createActor(counter_idl, {
  agent,
  canisterId: counter_id,
});

console.log("a");

export { counter };
