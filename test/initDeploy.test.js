import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { initDeployment } from "../src/initDeploy.js";

const rootDir = path.resolve(import.meta.dirname, "..");

test("initDeployment generates Codex skill package", async () => {
  const outputDir = path.join("artifacts", "test-init-codex");
  const result = await initDeployment({ target: "codex", outputDir });
  const skillPath = path.join(rootDir, outputDir, "codex", "pharos-safetx", "SKILL.md");
  const installPath = path.join(rootDir, outputDir, "codex", "pharos-safetx", "INSTALL.md");

  assert.deepEqual(result.targets, ["codex"]);
  assert.ok(fs.existsSync(skillPath));
  assert.ok(fs.existsSync(installPath));
  assert.match(fs.readFileSync(skillPath, "utf8"), /Pharos SafeTx/);
});

test("initDeployment generates ChatGPT action package", async () => {
  const outputDir = path.join("artifacts", "test-init-chatgpt");
  await initDeployment({ target: "chatgpt", outputDir });
  const specPath = path.join(rootDir, outputDir, "chatgpt", "actions-openapi.json");
  const instructionsPath = path.join(rootDir, outputDir, "chatgpt", "instructions.md");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));

  assert.equal(spec.openapi, "3.1.0");
  assert.equal(spec.paths["/analyze"].post.operationId, "analyzeTransaction");
  assert.ok(spec.components.schemas.SafeTxRequest.properties.policy);
  assert.match(fs.readFileSync(instructionsPath, "utf8"), /Never ask for private keys/);
});

test("initDeployment generates MCP config package", async () => {
  const outputDir = path.join("artifacts", "test-init-mcp");
  await initDeployment({ target: "mcp", outputDir });
  const configPath = path.join(rootDir, outputDir, "mcp", "mcp-server.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  assert.equal(config.mcpServers["pharos-safetx"].command, "node");
  assert.ok(config.mcpServers["pharos-safetx"].args[0].endsWith("src/mcp-server.js"));
});
