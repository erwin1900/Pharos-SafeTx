#!/usr/bin/env node
import http from "node:http";
import { analyzeTransaction } from "../src/analyzeTransaction.js";

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, {
        ok: true,
        name: "pharos-safetx",
        interfaces: ["cli", "mcp", "http"]
      });
      return;
    }

    if (req.method === "POST" && ["/analyze", "/explain", "/suggest"].includes(req.url)) {
      const request = JSON.parse(await readBody(req));
      const result = analyzeTransaction(request);
      sendJson(res, 200, formatHttpResult(req.url, result));
      return;
    }

    sendJson(res, 404, {
      error: "Not found",
      endpoints: ["GET /health", "POST /analyze", "POST /explain", "POST /suggest"]
    });
  } catch (error) {
    sendJson(res, 400, {
      error: error.message,
      name: error.name || "Error",
      errors: error.errors || undefined
    });
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Pharos SafeTx HTTP adapter listening on http://${host}:${port}\n`);
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8") || "{}"));
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8"
  });
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function formatHttpResult(url, result) {
  if (url === "/explain") {
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

  if (url === "/suggest") {
    return {
      decision: result.decision,
      agent_action: result.agent_action,
      safer_alternative: result.safer_alternative,
      reasons: result.reasons
    };
  }

  return result;
}
