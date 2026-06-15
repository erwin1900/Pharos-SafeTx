#!/usr/bin/env node
import fs from "node:fs/promises";
import process from "node:process";
import { analyzeTransaction } from "./analyzeTransaction.js";
import { getInitTargets, initDeployment } from "./initDeploy.js";

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "init") {
    const options = parseInitArgs(args);
    const result = await initDeployment(options);
    process.stdout.write(renderInitResult(result));
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
  node src/cli.js init --target all --out dist/agent-deploy

Commands:
  analyze   Analyze a proposed transaction and return ALLOW / WARN / BLOCK.
  init      Generate the local Codex Skill package.

Init targets:
  ${getInitTargets().join(", ")}
`);
}

function parseInitArgs(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--target" || arg === "-t") {
      options.target = args[++index];
      continue;
    }
    if (arg === "--out" || arg === "--output" || arg === "-o") {
      options.outputDir = args[++index];
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown init option: ${arg}`);
  }

  return options;
}

function renderInitResult(result) {
  const lines = [
    "Pharos SafeTx init complete",
    "",
    `Output: ${result.outputDir}`,
    `Targets: ${result.targets.join(", ")}`,
    "",
    "Generated files:"
  ];

  for (const file of result.files) {
    lines.push(`- ${file}`);
  }

  return `${lines.join("\n")}\n`;
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
