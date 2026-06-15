import test from "node:test";
import assert from "node:assert/strict";
import { parseIntent } from "../src/intent.js";

test("parses Atlantic and Pacific wrapped native token symbols", () => {
  assert.equal(parseIntent("Swap 1 WPHRS to USDC on Pharos").token, "WPHRS");
  assert.equal(parseIntent("Swap 1 WPROS to USDC on Pharos").token, "WPROS");
});
