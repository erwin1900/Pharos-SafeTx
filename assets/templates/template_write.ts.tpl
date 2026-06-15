import fs from "node:fs";
import { analyzeTransaction } from "../../src/analyzeTransaction.js";

const requestPath = "{{request_path}}";
const request = JSON.parse(fs.readFileSync(requestPath, "utf8"));
const result = analyzeTransaction(request);

console.log(JSON.stringify(result, null, 2));

if (result.decision !== "ALLOW") {
  throw new Error(`SafeTx refused write handoff: ${result.decision}`);
}

// SafeTx never signs or broadcasts. The integrating agent must still enforce
// its own signer, confirmation, and policy checks.
