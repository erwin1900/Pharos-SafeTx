#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { analyzeTransaction } from "../src/analyzeTransaction.js";
import { UINT256_MAX, normalizeAddress } from "../src/utils.js";

const rootDir = path.resolve(import.meta.dirname, "..");

const DEFAULTS = {
  chainId: 1672,
  from: "0x146b605c8b371d5b50c3ea560fd1a2081aee7557",
  usdc: "0xc879c018db60520f4355c26ed1a6d572cdac1815",
  recipient: "0x2222222222222222222222222222222222222222",
  router: "0x4444444444444444444444444444444444444444",
  trustedRouter: "0x5555555555555555555555555555555555555555"
};

const args = process.argv.slice(2);
const scenario = args.find((arg) => !arg.startsWith("--")) || "risky-swap-approval";
const shouldWrite = args.includes("--write");

const from = safeAddress(process.env.SAFETX_FROM, DEFAULTS.from);
const token = safeAddress(process.env.SAFETX_TOKEN, DEFAULTS.usdc);
const recipient = safeAddress(process.env.SAFETX_RECIPIENT, DEFAULTS.recipient);
const router = safeAddress(process.env.SAFETX_ROUTER, DEFAULTS.router);
const trustedRouter = safeAddress(process.env.SAFETX_TRUSTED_ROUTER, DEFAULTS.trustedRouter);
const chainId = Number(process.env.SAFETX_CHAIN_ID || DEFAULTS.chainId);

const txBuilderOutput = buildScenario(scenario, {
  chainId,
  from,
  token,
  recipient,
  router,
  trustedRouter
});

const request = {
  user_intent: txBuilderOutput.user_intent,
  chainId: txBuilderOutput.transaction.chainId,
  from: txBuilderOutput.transaction.from,
  to: txBuilderOutput.transaction.to,
  value: txBuilderOutput.transaction.value,
  calldata: txBuilderOutput.transaction.calldata,
  trustedSpenders: txBuilderOutput.policy.trustedSpenders,
  blockedAddresses: txBuilderOutput.policy.blockedAddresses,
  tokenDecimals: txBuilderOutput.policy.tokenDecimals,
  addressBook: txBuilderOutput.policy.addressBook
};

const analysis = analyzeTransaction(request);
const report = {
  scenario,
  note: "This simulation builds real EVM calldata and a SafeTx request, but does not sign or broadcast.",
  txBuilderOutput,
  safeTxRequest: request,
  safeTxResult: analysis
};

if (shouldWrite) {
  const outputDir = path.join(rootDir, "artifacts");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, "txbuilder-simulation.json");
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${path.relative(rootDir, outputFile)}`);
}

console.log(renderReport(report));

function buildScenario(name, ctx) {
  if (name === "safe-transfer") {
    const amount = parseUnits("100", 6);
    return {
      user_intent: `Transfer 100 USDC to ${ctx.recipient}`,
      transaction: {
        chainId: ctx.chainId,
        from: ctx.from,
        to: ctx.token,
        value: "0x0",
        calldata: encodeErc20Transfer(ctx.recipient, amount)
      },
      policy: {
        trustedSpenders: [ctx.trustedRouter],
        blockedAddresses: [],
        tokenDecimals: {
          USDC: 6,
          [ctx.token]: 6
        },
        addressBook: {
          USDC: ctx.token,
          recipient: ctx.recipient,
          trustedRouter: ctx.trustedRouter
        }
      }
    };
  }

  if (name === "risky-swap-approval") {
    return {
      user_intent: "Swap 10 USDC to PHRS on Pharos",
      transaction: {
        chainId: ctx.chainId,
        from: ctx.from,
        to: ctx.token,
        value: "0x0",
        calldata: encodeErc20Approve(ctx.router, UINT256_MAX)
      },
      policy: {
        trustedSpenders: [ctx.trustedRouter],
        blockedAddresses: [],
        tokenDecimals: {
          USDC: 6,
          [ctx.token]: 6
        },
        addressBook: {
          USDC: ctx.token,
          untrustedRouter: ctx.router,
          trustedRouter: ctx.trustedRouter
        }
      }
    };
  }

  throw new Error(`Unknown TxBuilder scenario: ${name}`);
}

function encodeErc20Transfer(to, amount) {
  return `0xa9059cbb${encodeAddress(to)}${encodeUint256(amount)}`;
}

function encodeErc20Approve(spender, amount) {
  return `0x095ea7b3${encodeAddress(spender)}${encodeUint256(amount)}`;
}

function encodeAddress(address) {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    throw new Error(`Invalid EVM address: ${address}`);
  }
  return normalized.slice(2).padStart(64, "0");
}

function encodeUint256(value) {
  const amount = BigInt(value);
  if (amount < 0n || amount > UINT256_MAX) {
    throw new Error(`uint256 out of range: ${value}`);
  }
  return amount.toString(16).padStart(64, "0");
}

function parseUnits(value, decimals) {
  const [whole, fraction = ""] = String(value).split(".");
  const padded = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(padded || "0");
}

function safeAddress(candidate, fallback) {
  return normalizeAddress(candidate) || fallback;
}

function renderReport({ scenario, txBuilderOutput, safeTxRequest, safeTxResult }) {
  const lines = [
    "# SafeTx Full TxBuilder Simulation",
    "",
    `- Scenario: \`${scenario}\``,
    "- Private key: not read, not printed, not required",
    "- Signing: not performed",
    "- Broadcast: not performed",
    "",
    "## TxBuilder Output",
    "",
    `- User intent: ${txBuilderOutput.user_intent}`,
    `- Chain ID: ${txBuilderOutput.transaction.chainId}`,
    `- From: \`${txBuilderOutput.transaction.from}\``,
    `- To: \`${txBuilderOutput.transaction.to}\``,
    `- Value: \`${txBuilderOutput.transaction.value}\``,
    `- Calldata: \`${txBuilderOutput.transaction.calldata}\``,
    "",
    "## SafeTx Request",
    "",
    "```json",
    JSON.stringify(safeTxRequest, null, 2),
    "```",
    "",
    "## SafeTx Result",
    "",
    `- Decision: **${safeTxResult.decision}**`,
    `- Risk score: **${safeTxResult.risk_score}/100**`,
    `- Decoded function: \`${safeTxResult.transaction.functionName}\``,
    `- Transaction kind: \`${safeTxResult.transaction.kind}\``,
    `- Agent action: ${safeTxResult.agent_action}`,
    "",
    "## Findings",
    ""
  ];

  if (safeTxResult.findings.length === 0) {
    lines.push("- No findings.");
  } else {
    for (const finding of safeTxResult.findings) {
      lines.push(`- [${finding.severity.toUpperCase()}] ${finding.code}: ${finding.message}`);
    }
  }

  lines.push("", "## Safer Alternative", "", safeTxResult.safer_alternative);
  return `${lines.join("\n")}\n`;
}
