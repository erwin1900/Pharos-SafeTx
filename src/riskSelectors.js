import fs from "node:fs";
import path from "node:path";

const riskSelectorsPath = path.resolve(import.meta.dirname, "..", "assets", "risk-selectors.json");
const riskSelectors = JSON.parse(fs.readFileSync(riskSelectorsPath, "utf8"));

const SCORE_BY_SEVERITY = {
  low: 8,
  medium: 18,
  high: 30,
  critical: 50
};

export function getRiskSelector(selector) {
  if (!selector || selector === "0x") return null;
  const match = riskSelectors.selectors.find((entry) => entry.selector.toLowerCase() === selector.toLowerCase());
  if (!match) return null;
  return {
    ...match,
    score: SCORE_BY_SEVERITY[match.severity] || 12
  };
}
