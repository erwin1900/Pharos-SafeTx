#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { analyzeTransaction } from "../src/analyzeTransaction.js";

const rootDir = path.resolve(import.meta.dirname, "..");
const scenarioFile = process.argv[2] || "examples/warn-infinite-approval.json";
const request = JSON.parse(fs.readFileSync(path.resolve(rootDir, scenarioFile), "utf8"));

const result = analyzeTransaction(request);
process.stdout.write(renderSafetyReport(request, result, scenarioFile));

function renderSafetyReport(input, analysis, source) {
  const lines = [
    "# Pharos SafeTx Safety Scan Report",
    "",
    "## Scenario",
    "",
    `- Source: \`${source}\``,
    `- User intent: ${input.user_intent}`,
    `- Chain ID: ${input.chainId}`,
    `- From: \`${input.from}\``,
    `- To: \`${input.to}\``,
    "",
    "## Transaction Under Review",
    "",
    `- Decoded function: \`${analysis.transaction.functionName}\``,
    `- Transaction kind: \`${analysis.transaction.kind}\``,
    `- Selector: \`${analysis.transaction.selector}\``,
    `- Value: \`${input.value || "0x0"}\``,
    "",
    "## Decision",
    "",
    `- Decision: **${analysis.decision}**`,
    `- Risk score: **${analysis.risk_score}/100**`,
    `- Agent action: ${analysis.agent_action}`,
    "",
    "## Findings",
    ""
  ];

  if (analysis.findings.length === 0) {
    lines.push("- No findings. The transaction matches the current SafeTx policy.", "");
  } else {
    for (const finding of analysis.findings) {
      lines.push(`- [${finding.severity.toUpperCase()}] ${finding.code}: ${finding.message}`);
    }
    lines.push("");
  }

  lines.push("## Safer Alternative", "", analysis.safer_alternative, "", "## Skill Test Result", "");
  lines.push(
    analysis.decision === "BLOCK"
      ? "PASS: SafeTx prevented the agent from signing a risky transaction."
      : "PASS: SafeTx produced a structured pre-signing decision."
  );

  return `${lines.join("\n")}\n`;
}
