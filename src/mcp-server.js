#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { analyzeTransaction } from "./analyzeTransaction.js";

const rootDir = path.resolve(import.meta.dirname, "..");
const REQUEST_SCHEMA = JSON.parse(fs.readFileSync(path.join(rootDir, "schemas/safetx-request.schema.json"), "utf8"));

const TOOLS = [
  {
    name: "pharos_safetx_analyze_transaction",
    description: "Analyze a proposed Pharos/EVM transaction against user intent and return ALLOW, WARN, or BLOCK.",
    inputSchema: REQUEST_SCHEMA,
    annotations: {
      title: "Analyze SafeTx Transaction",
      readOnlyHint: true,
      destructiveHint: false
    }
  },
  {
    name: "pharos_safetx_explain_risk",
    description: "Explain why SafeTx allowed, warned, or blocked a transaction.",
    inputSchema: REQUEST_SCHEMA,
    annotations: {
      title: "Explain SafeTx Risk",
      readOnlyHint: true,
      destructiveHint: false
    }
  },
  {
    name: "pharos_safetx_suggest_safe_action",
    description: "Suggest the safest next action for an AI agent before transaction signing.",
    inputSchema: REQUEST_SCHEMA,
    annotations: {
      title: "Suggest SafeTx Action",
      readOnlyHint: true,
      destructiveHint: false
    }
  },
  {
    name: "analyze_transaction",
    description: "Backward-compatible alias for pharos_safetx_analyze_transaction.",
    inputSchema: REQUEST_SCHEMA,
    annotations: {
      title: "Analyze Transaction",
      readOnlyHint: true,
      destructiveHint: false
    }
  }
];

const RESOURCES = [
  {
    uri: "safetx://schema/request",
    name: "SafeTx Request Schema",
    description: "JSON Schema for SafeTx transaction analysis requests.",
    mimeType: "application/schema+json",
    file: "schemas/safetx-request.schema.json"
  },
  {
    uri: "safetx://schema/result",
    name: "SafeTx Result Schema",
    description: "JSON Schema for SafeTx transaction analysis results.",
    mimeType: "application/schema+json",
    file: "schemas/safetx-result.schema.json"
  },
  {
    uri: "safetx://reference/transaction",
    name: "SafeTx Transaction Reference",
    description: "Pre-signing transaction analysis workflow and policy configuration.",
    mimeType: "text/markdown",
    file: "references/transaction.md"
  },
  {
    uri: "safetx://reference/query",
    name: "SafeTx Query Reference",
    description: "Read-only explanation and metadata workflow.",
    mimeType: "text/markdown",
    file: "references/query.md"
  },
  {
    uri: "safetx://reference/contract",
    name: "SafeTx Contract Reference",
    description: "Selector, ERC20, ABI, and unknown-contract guidance.",
    mimeType: "text/markdown",
    file: "references/contract.md"
  },
  {
    uri: "safetx://reference/script-gen",
    name: "SafeTx Script Generation Reference",
    description: "JS/TS/Python integration template guidance.",
    mimeType: "text/markdown",
    file: "references/script-gen.md"
  },
  {
    uri: "safetx://example/allow-transfer",
    name: "Example: Allow Transfer",
    description: "Safe ERC20 transfer example.",
    mimeType: "application/json",
    file: "examples/allow-transfer.json"
  },
  {
    uri: "safetx://example/warn-infinite-approval",
    name: "Example: Infinite Approval",
    description: "Risky unlimited approval example.",
    mimeType: "application/json",
    file: "examples/warn-infinite-approval.json"
  },
  {
    uri: "safetx://example/block-policy-token-limit",
    name: "Example: Policy Token Limit",
    description: "Policy limit violation example.",
    mimeType: "application/json",
    file: "examples/block-policy-token-limit.json"
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function respond(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function fail(id, error, code = -32000, data = undefined) {
  process.stdout.write(
    `${JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: {
        code: error.code || code,
        message: error.message,
        ...(data === undefined ? {} : { data })
      }
    })}\n`
  );
}

rl.on("line", (line) => {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    fail(null, error, -32700);
    return;
  }

  try {
    handle(message);
  } catch (error) {
    fail(message?.id ?? null, error, error.code || -32000);
  }
});

function handle(message) {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    throw rpcError(-32600, "Invalid Request");
  }

  const { id, method, params } = message;
  const isNotification = id === undefined || id === null;

  if (typeof method !== "string") {
    throw rpcError(-32600, "Invalid Request: method must be a string");
  }

  if (method === "initialize") {
    if (isNotification) return;
    respond(id, {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {}
      },
      serverInfo: {
        name: "pharos-safetx",
        version: "0.1.0"
      }
    });
    return;
  }

  if (method === "tools/list") {
    if (isNotification) return;
    respond(id, {
      tools: TOOLS
    });
    return;
  }

  if (method === "resources/list") {
    if (isNotification) return;
    respond(id, {
      resources: RESOURCES.map(({ file, ...resource }) => resource)
    });
    return;
  }

  if (method === "resources/read") {
    if (isNotification) return;
    if (!params || typeof params !== "object" || typeof params.uri !== "string") {
      throw rpcError(-32602, "Invalid params: resources/read requires params.uri");
    }

    const resource = RESOURCES.find((item) => item.uri === params.uri);
    if (!resource) {
      throw rpcError(-32602, `Unknown resource: ${params.uri}`);
    }

    respond(id, {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: fs.readFileSync(path.join(rootDir, resource.file), "utf8")
        }
      ]
    });
    return;
  }

  if (method === "tools/call") {
    if (isNotification) return;
    if (!params || typeof params !== "object" || typeof params.name !== "string") {
      throw rpcError(-32602, "Invalid params: tools/call requires params.name");
    }

    const tool = TOOLS.find((item) => item.name === params.name);
    if (!tool) {
      throw rpcError(-32602, `Unknown tool: ${params.name}`);
    }

    const result = analyzeTransaction(params.arguments || {});
    const payload = formatToolResult(params.name, result);
    respond(id, {
      structuredContent: payload,
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2)
        }
      ]
    });
    return;
  }

  if (method === "notifications/initialized") {
    return;
  }

  throw rpcError(-32601, `Unsupported method: ${method}`);
}

function formatToolResult(toolName, result) {
  if (toolName === "pharos_safetx_explain_risk") {
    return {
      decision: result.decision,
      risk_score: result.risk_score,
      functionName: result.transaction.functionName,
      findings: result.findings.map((finding) => ({
        severity: finding.severity,
        code: finding.code,
        explanation: finding.message
      }))
    };
  }

  if (toolName === "pharos_safetx_suggest_safe_action") {
    return {
      decision: result.decision,
      agent_action: result.agent_action,
      safer_alternative: result.safer_alternative,
      reasons: result.reasons
    };
  }

  return result;
}

function rpcError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
