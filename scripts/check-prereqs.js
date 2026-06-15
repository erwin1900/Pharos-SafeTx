#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import os from "node:os";

const args = new Set(process.argv.slice(2));
const installRequested = args.has("--install");
const MIN_NODE_MAJOR = 20;

const checks = [
  {
    name: "node",
    command: process.execPath,
    args: ["--version"],
    required: true,
    reason: "required for SafeTx CLI, demo, MCP, and HTTP adapters",
    minMajor: MIN_NODE_MAJOR,
    install: installNode
  },
  {
    name: "forge",
    command: "forge",
    args: ["--version"],
    required: false,
    reason: "optional for deployment-oriented Pharos Skills; not required by SafeTx core"
  },
  {
    name: "cast",
    command: "cast",
    args: ["--version"],
    required: false,
    reason: "optional for live RPC reads such as cast balance; not required by SafeTx core"
  }
];

let failed = false;

for (const check of checks) {
  const result = spawnSync(check.command, check.args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.status === 0) {
    const version = (result.stdout || result.stderr).trim().split("\n")[0];
    if (check.minMajor && !versionSatisfiesMajor(version, check.minMajor)) {
      const level = check.required ? "FAIL" : "WARN";
      console.log(`[${level}] ${check.name}: ${version} found, requires >=${check.minMajor}.0.0 (${check.reason})`);
      handleMissingOrOutdated(check);
      if (check.required) failed = true;
      continue;
    }
    console.log(`[OK] ${check.name}: ${version}`);
    continue;
  }

  const level = check.required ? "FAIL" : "WARN";
  console.log(`[${level}] ${check.name}: not found (${check.reason})`);
  handleMissingOrOutdated(check);
  if (check.required) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("\nSafeTx core is ready when required checks pass. Foundry is optional unless an integrating workflow calls forge/cast.");
console.log("Use `npm run prereq -- --install` to let the script try supported local installers for missing required tools.");

function handleMissingOrOutdated(check) {
  if (installRequested && check.install) {
    check.install();
    return;
  }

  const hint = installHint(check.name);
  if (hint) console.log(hint);
}

function versionSatisfiesMajor(versionText, minMajor) {
  const match = versionText.match(/v?(\d+)\./);
  return Boolean(match && Number(match[1]) >= minMajor);
}

function installNode() {
  const platform = os.platform();
  const commands = nodeInstallCommands(platform);

  for (const item of commands) {
    if (!commandExists(item.manager)) continue;
    console.log(`[INSTALL] Running: ${item.command} ${item.args.join(" ")}`);
    const result = spawnSync(item.command, item.args, { stdio: "inherit" });
    if (result.status === 0) {
      console.log("[INSTALL] Node installation command completed. Re-run `npm run prereq` in a new shell.");
      return;
    }
    console.log(`[INSTALL] ${item.manager} installer failed with exit code ${result.status}.`);
  }

  console.log(installHint("node"));
}

function nodeInstallCommands(platform) {
  if (platform === "darwin") {
    return [
      { manager: "brew", command: "brew", args: ["install", "node"] },
      { manager: "mise", command: "mise", args: ["use", "-g", `node@${MIN_NODE_MAJOR}`] }
    ];
  }

  if (platform === "linux") {
    return [
      { manager: "mise", command: "mise", args: ["use", "-g", `node@${MIN_NODE_MAJOR}`] },
      { manager: "brew", command: "brew", args: ["install", "node"] }
    ];
  }

  return [];
}

function commandExists(command) {
  return spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
}

function installHint(name) {
  if (name !== "node") return null;

  return [
    "Install Node.js >=20, then re-run `npm run prereq`:",
    "  macOS Homebrew: brew install node",
    "  mise: mise use -g node@20",
    "  nvm: nvm install 20 && nvm use 20",
    "  official download: https://nodejs.org/"
  ].join("\n");
}
