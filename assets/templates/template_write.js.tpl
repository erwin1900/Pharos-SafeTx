import fs from "node:fs";
import { analyzeTransaction } from "../../src/analyzeTransaction.js";

const requestPath = "{{request_path}}";
const request = JSON.parse(fs.readFileSync(requestPath, "utf8"));
const result = analyzeTransaction(request);

console.log(JSON.stringify(result, null, 2));

if (result.decision !== "ALLOW") {
  throw new Error(`SafeTx refused write handoff: ${result.decision}`);
}

// SafeTx never signs or broadcasts. Hand the reviewed transaction to the
// caller's signer only after the caller enforces its own user-confirmation
// policy.
