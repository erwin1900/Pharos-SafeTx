import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { localizeResult, ZH_MESSAGES } from "../src/i18n.js";

const rootDir = path.join(import.meta.dirname, "..");

function loadRiskEngineCodes() {
  const source = fs.readFileSync(path.join(rootDir, "src", "riskEngine.js"), "utf8");
  return [...source.matchAll(/finding\(\s*["'][^"']+["']\s*,\s*["']([A-Z0-9_]+)["']/gs)].map((match) => match[1]);
}

function loadRiskSelectorCodes() {
  const source = fs.readFileSync(path.join(rootDir, "assets", "risk-selectors.json"), "utf8");
  return JSON.parse(source).selectors.map((item) => item.code);
}

function sampleResultFor(code) {
  return {
    decision: "BLOCK",
    risk_score: 80,
    intent: { action: "unknown" },
    transaction: { kind: "unknown_call" },
    findings: [
      {
        severity: "high",
        code,
        message: `English message for ${code}`,
        score: 10
      }
    ],
    reasons: [`English message for ${code}`],
    agent_action: "Do not sign or submit this transaction.",
    safer_alternative: "Regenerate the transaction from the original user intent and re-run SafeTx before signing."
  };
}

test("all emitted finding message codes have Chinese translations", () => {
  const emittedCodes = new Set([...loadRiskEngineCodes(), ...loadRiskSelectorCodes()]);
  const missing = [...emittedCodes].filter((code) => !ZH_MESSAGES[code]);

  assert.deepEqual(missing, []);
});

test("all finding message codes localize to Chinese and bilingual output", () => {
  const emittedCodes = new Set([...loadRiskEngineCodes(), ...loadRiskSelectorCodes()]);

  for (const code of emittedCodes) {
    const zh = localizeResult(sampleResultFor(code), "zh");
    assert.match(zh.findings[0].message, /[\u4e00-\u9fff]/, `${code} should have Chinese text`);
    assert.doesNotMatch(zh.findings[0].message, /SafeTx 检测到交易风险/, `${code} should not use fallback text`);

    const bilingual = localizeResult(sampleResultFor(code), "bilingual");
    assert.match(bilingual.findings[0].message, new RegExp(`English message for ${code}`));
    assert.match(bilingual.findings[0].message, / \/ .+[\u4e00-\u9fff]/);
  }
});
