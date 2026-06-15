import test from "node:test";
import assert from "node:assert/strict";
import { parseIntent } from "../src/intent.js";

test("parses Atlantic and Pacific wrapped native token symbols", () => {
  assert.equal(parseIntent("Swap 1 WPHRS to USDC on Pharos").token, "WPHRS");
  assert.equal(parseIntent("Swap 1 WPROS to USDC on Pharos").token, "WPROS");
});

test("parses Chinese action keywords without word-boundary assumptions", () => {
  assert.equal(parseIntent("转账 10 USDC 到 0x2222222222222222222222222222222222222222").action, "transfer");
  assert.equal(parseIntent("授权 10 USDC 给 router").action, "approve");
  assert.equal(parseIntent("兑换 10 USDC 为 PHRS").action, "swap");
});
