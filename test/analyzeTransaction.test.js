import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyzeTransaction } from "../src/analyzeTransaction.js";
import { ValidationError } from "../src/validation.js";

function loadExample(name) {
  const filePath = path.join(import.meta.dirname, "..", "examples", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function baseRequest() {
  return {
    user_intent: "Transfer 1 USDC",
    chainId: 1672,
    from: "0x146b605c8b371d5b50c3ea560fd1a2081aee7557",
    to: "0xc879c018db60520f4355c26ed1a6d572cdac1815",
    value: "0x0",
    calldata: "0x"
  };
}

test("allows a transfer that matches user intent", () => {
  const result = analyzeTransaction(loadExample("allow-transfer.json"));
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.transaction.kind, "erc20_transfer");
});

test("blocks unlimited approval to an untrusted spender", () => {
  const result = analyzeTransaction(loadExample("warn-infinite-approval.json"));
  assert.equal(result.decision, "BLOCK");
  assert.equal(result.transaction.kind, "erc20_approve");
  assert.ok(result.findings.some((finding) => finding.code === "INFINITE_APPROVAL"));
  assert.ok(result.findings.some((finding) => finding.code === "UNTRUSTED_SPENDER"));
});

test("blocks transfers to a recipient not mentioned in user intent", () => {
  const result = analyzeTransaction(loadExample("block-intent-address-mismatch.json"));
  assert.equal(result.decision, "BLOCK");
  assert.ok(result.findings.some((finding) => finding.code === "INTENT_ADDRESS_MISMATCH"));
});

test("warns or blocks unknown calls before agent signing", () => {
  const result = analyzeTransaction(loadExample("block-unknown-call.json"));
  assert.equal(result.decision, "WARN");
  assert.equal(result.transaction.kind, "unknown_call");
  assert.ok(result.findings.some((finding) => finding.code === "UNKNOWN_CALLDATA"));
});

test("rejects non-hex calldata before decoding", () => {
  assert.throws(
    () =>
      analyzeTransaction({
        ...baseRequest(),
        calldata: `0xa9059cbb${"z".repeat(128)}`
      }),
    ValidationError
  );
});

test("flags high-attention selectors from risk selector assets", () => {
  const result = analyzeTransaction(loadExample("warn-permit2-selector.json"));
  assert.equal(result.decision, "BLOCK");
  assert.ok(result.findings.some((finding) => finding.code === "PERMIT2_APPROVE_SELECTOR"));
});

test("monitors aligned ERC20 transfer methods without blocking", () => {
  const result = analyzeTransaction(loadExample("allow-transfer.json"));

  assert.equal(result.decision, "ALLOW");
  assert.ok(result.findings.some((finding) => finding.code === "ERC20_TRANSFER_SELECTOR"));
});

test("monitors DEX swap execution methods before signing", () => {
  const result = analyzeTransaction({
    ...baseRequest(),
    user_intent: "Swap 10 USDC to PHRS on Pharos",
    to: "0x1111111111111111111111111111111111111111",
    calldata: "0x38ed1739"
  });

  assert.equal(result.decision, "WARN");
  assert.equal(result.transaction.kind, "known_call");
  assert.equal(result.transaction.functionName, "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)");
  assert.ok(result.findings.some((finding) => finding.code === "SWAP_EXACT_TOKENS_FOR_TOKENS_SELECTOR"));
});

test("monitors vault deposit methods", () => {
  const result = analyzeTransaction({
    ...baseRequest(),
    user_intent: "Deposit 100 USDC into the vault",
    to: "0x3333333333333333333333333333333333333333",
    calldata: "0x6e553f65"
  });

  assert.equal(result.intent.action, "deposit");
  assert.equal(result.transaction.functionName, "deposit(uint256,address)");
  assert.ok(result.findings.some((finding) => finding.code === "ERC4626_DEPOSIT_SELECTOR"));
  assert.ok(!result.findings.some((finding) => finding.code === "UNCLEAR_USER_INTENT"));
});

test("monitors lending borrow methods as high-attention RealFi actions", () => {
  const result = analyzeTransaction({
    ...baseRequest(),
    user_intent: "Borrow 25 USDC from the lending market",
    to: "0x3333333333333333333333333333333333333333",
    calldata: "0xa415bcad"
  });

  assert.equal(result.decision, "WARN");
  assert.equal(result.intent.action, "borrow");
  assert.equal(result.transaction.functionName, "borrow(address,uint256,uint256,uint16,address)");
  assert.ok(result.findings.some((finding) => finding.code === "LENDING_BORROW_SELECTOR"));
});

test("compares ERC20 base units with intent amounts when token decimals are provided", () => {
  const token = "0xc879c018db60520f4355c26ed1a6d572cdac1815";
  const recipient = "0x2222222222222222222222222222222222222222";
  const result = analyzeTransaction({
    user_intent: `Transfer 100 USDC to ${recipient}`,
    chainId: 1672,
    from: "0x146b605c8b371d5b50c3ea560fd1a2081aee7557",
    to: token,
    value: "0x0",
    calldata: encodeTransfer(recipient, 100000000n),
    tokenDecimals: {
      USDC: 6,
      [token]: 6
    }
  });

  assert.equal(result.decision, "ALLOW");
  assert.ok(!result.findings.some((finding) => finding.code === "AMOUNT_EXCEEDS_INTENT"));
});

test("flags ERC20 base-unit amounts that exceed decimal-normalized user intent", () => {
  const token = "0xc879c018db60520f4355c26ed1a6d572cdac1815";
  const recipient = "0x2222222222222222222222222222222222222222";
  const result = analyzeTransaction({
    user_intent: `Transfer 100 USDC to ${recipient}`,
    chainId: 1672,
    from: "0x146b605c8b371d5b50c3ea560fd1a2081aee7557",
    to: token,
    value: "0x0",
    calldata: encodeTransfer(recipient, 101000000n),
    tokenDecimals: {
      USDC: 6,
      [token]: 6
    }
  });

  assert.ok(result.findings.some((finding) => finding.code === "AMOUNT_EXCEEDS_INTENT"));
});

test("blocks targets outside the configured policy whitelist", () => {
  const result = analyzeTransaction({
    ...loadExample("allow-transfer.json"),
    policy: {
      allowedTargets: ["0x7777777777777777777777777777777777777777"]
    }
  });

  assert.equal(result.decision, "BLOCK");
  assert.ok(result.findings.some((finding) => finding.code === "POLICY_TARGET_NOT_ALLOWED"));
});

test("blocks recipients outside the configured policy whitelist", () => {
  const result = analyzeTransaction({
    ...loadExample("allow-transfer.json"),
    policy: {
      allowedTargets: ["0xc879c018db60520f4355c26ed1a6d572cdac1815"],
      allowedRecipients: ["0x7777777777777777777777777777777777777777"]
    }
  });

  assert.equal(result.decision, "BLOCK");
  assert.ok(result.findings.some((finding) => finding.code === "POLICY_RECIPIENT_NOT_ALLOWED"));
});

test("blocks token amounts over the configured policy limit", () => {
  const result = analyzeTransaction({
    ...loadExample("allow-transfer.json"),
    policy: {
      maxTokenAmounts: {
        USDC: "50"
      }
    }
  });

  assert.equal(result.decision, "BLOCK");
  assert.ok(result.findings.some((finding) => finding.code === "POLICY_TOKEN_LIMIT_EXCEEDED"));
});

test("blocks approval spenders outside the configured policy whitelist", () => {
  const result = analyzeTransaction({
    user_intent: "Approve 10 USDC for the router on Pharos",
    chainId: 1672,
    from: "0x146b605c8b371d5b50c3ea560fd1a2081aee7557",
    to: "0xc879c018db60520f4355c26ed1a6d572cdac1815",
    value: "0x0",
    calldata: encodeApprove("0x4444444444444444444444444444444444444444", 10000000n),
    tokenDecimals: {
      USDC: 6,
      "0xc879c018db60520f4355c26ed1a6d572cdac1815": 6
    },
    policy: {
      allowedSpenders: ["0x5555555555555555555555555555555555555555"]
    }
  });

  assert.equal(result.decision, "BLOCK");
  assert.ok(result.findings.some((finding) => finding.code === "POLICY_SPENDER_NOT_ALLOWED"));
});

test("returns Chinese safety prompts when language is zh", () => {
  const result = analyzeTransaction({
    ...loadExample("block-policy-token-limit.json"),
    language: "zh"
  });

  assert.equal(result.decision, "BLOCK");
  assert.match(
    result.findings.find((finding) => finding.code === "POLICY_TOKEN_LIMIT_EXCEEDED").message,
    /超过了已配置的单笔策略限额/
  );
  assert.match(result.agent_action, /不要签名/);
});

test("returns bilingual safety prompts when language is bilingual", () => {
  const result = analyzeTransaction(loadExample("block-policy-token-limit-bilingual.json"));

  assert.equal(result.decision, "BLOCK");
  const policyFinding = result.findings.find((finding) => finding.code === "POLICY_TOKEN_LIMIT_EXCEEDED");
  assert.match(policyFinding.message, /Transaction token amount exceeds/);
  assert.match(policyFinding.message, /交易代币金额超过/);
  assert.match(result.agent_action, /Do not sign/);
  assert.match(result.agent_action, /不要签名/);
});

function encodeTransfer(recipient, amount) {
  return `0xa9059cbb${recipient.slice(2).padStart(64, "0")}${amount.toString(16).padStart(64, "0")}`;
}

function encodeApprove(spender, amount) {
  return `0x095ea7b3${spender.slice(2).padStart(64, "0")}${amount.toString(16).padStart(64, "0")}`;
}
