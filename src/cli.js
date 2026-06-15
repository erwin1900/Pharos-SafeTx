#!/usr/bin/env node
import fs from "node:fs/promises";
import process from "node:process";
import { analyzeTransaction } from "./analyzeTransaction.js";

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command !== "analyze") {
    throw new Error(`Unknown command: ${command}`);
  }

  const [filePath] = args;
  const input = filePath ? await fs.readFile(filePath, "utf8") : await readStdin();
  const request = JSON.parse(input);
  const result = analyzeTransaction(request);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function printHelp() {
  process.stdout.write(`Pharos SafeTx Skill

Usage:
  npm run analyze -- examples/warn-infinite-approval.json
  node src/cli.js analyze <request.json>
  cat request.json | node src/cli.js analyze

Commands:
  analyze   Analyze a proposed transaction and return ALLOW / WARN / BLOCK.
`);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

main().catch((error) => {
  process.stderr.write(`SafeTx error: ${error.message}\n`);
  process.exitCode = 1;
});
