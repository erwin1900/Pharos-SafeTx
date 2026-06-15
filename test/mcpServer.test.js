import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");

test("MCP initialize returns tool capability metadata", async () => {
  const [response] = await callMcp([
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {}
    }
  ]);

  assert.equal(response.id, 1);
  assert.equal(response.result.serverInfo.name, "pharos-safetx");
  assert.deepEqual(response.result.capabilities, { tools: {}, resources: {} });
});

test("MCP tools/list exposes SafeTx tools with the shared request schema", async () => {
  const [response] = await callMcp([
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {}
    }
  ]);

  const names = response.result.tools.map((tool) => tool.name);
  assert.ok(names.includes("pharos_safetx_analyze_transaction"));
  assert.ok(names.includes("pharos_safetx_explain_risk"));
  assert.ok(names.includes("pharos_safetx_suggest_safe_action"));

  const analyzeTool = response.result.tools.find((tool) => tool.name === "pharos_safetx_analyze_transaction");
  assert.equal(analyzeTool.inputSchema.properties.policy.properties.maxTokenAmounts.type, "object");
  assert.equal(analyzeTool.annotations.readOnlyHint, true);
});

test("MCP tools/call returns structured SafeTx analysis", async () => {
  const request = JSON.parse(fs.readFileSync(path.join(rootDir, "examples", "warn-infinite-approval.json"), "utf8"));
  const [response] = await callMcp([
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "pharos_safetx_analyze_transaction",
        arguments: request
      }
    }
  ]);

  assert.equal(response.result.structuredContent.decision, "BLOCK");
  assert.equal(response.result.structuredContent.transaction.functionName, "approve(address,uint256)");
  assert.ok(response.result.structuredContent.findings.some((finding) => finding.code === "INFINITE_APPROVAL"));
  assert.match(response.result.content[0].text, /INFINITE_APPROVAL/);
});

test("MCP resources/list exposes schemas, references, and examples", async () => {
  const [response] = await callMcp([
    {
      jsonrpc: "2.0",
      id: 1,
      method: "resources/list",
      params: {}
    }
  ]);

  const uris = response.result.resources.map((resource) => resource.uri);
  assert.ok(uris.includes("safetx://schema/request"));
  assert.ok(uris.includes("safetx://reference/transaction"));
  assert.ok(uris.includes("safetx://example/block-policy-token-limit"));
});

test("MCP resources/read returns resource contents", async () => {
  const [response] = await callMcp([
    {
      jsonrpc: "2.0",
      id: 1,
      method: "resources/read",
      params: {
        uri: "safetx://reference/transaction"
      }
    }
  ]);

  assert.equal(response.result.contents[0].mimeType, "text/markdown");
  assert.match(response.result.contents[0].text, /Policy Configuration/);
});

test("MCP tools/call returns a JSON-RPC error for unknown tools", async () => {
  const [response] = await callMcp([
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "missing_tool",
        arguments: {}
      }
    }
  ]);

  assert.equal(response.error.code, -32602);
  assert.match(response.error.message, /Unknown tool/);
});

async function callMcp(messages) {
  const child = spawn(process.execPath, ["src/mcp-server.js"], {
    cwd: rootDir,
    stdio: ["pipe", "pipe", "pipe"]
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  for (const message of messages) {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  }
  child.stdin.end();

  const [code] = await once(child, "close");
  assert.equal(code, 0, stderr);

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
