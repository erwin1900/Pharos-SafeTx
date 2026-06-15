# Pharos SafeTx Operation Instructions

> Network Configuration: read from `assets/networks.json`.
> Private Key: not required. SafeTx is read-only and must never sign or submit transactions.

This file keeps the consolidated SafeTx workflow, demo, and interface checks.
For Pharos Skill Engine-style routing, prefer:

- `references/query.md` for read-only explanation and metadata tasks.
- `references/transaction.md` for pre-signing transaction checks.
- `references/contract.md` for selector, ABI, and unknown-contract handling.
- `references/script-gen.md` for JS/TS/Python integration templates.

---

## Analyze Transaction Before Signing

### Overview

Analyze a proposed Pharos/EVM transaction against the user's natural-language
intent and return `ALLOW`, `WARN`, or `BLOCK` before an agent signs.

### Command Template

```bash
npm run analyze -- <request.json>
```

For stdin-based agent integration:

```bash
cat <request.json> | node src/cli.js analyze
```

### Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `user_intent` | string | Yes | User instruction the agent is trying to satisfy. |
| `chainId` | number | Yes | Pharos/EVM chain id. Supported examples: `1672`, `688689`, `688688`. |
| `from` | address | Yes | Wallet or agent address initiating the transaction. |
| `to` | address | Yes | Transaction target contract or recipient. |
| `value` | hex quantity | No | Native value. Defaults to `0x0`. |
| `calldata` | hex bytes | No | Transaction calldata. Defaults to `0x`. |
| `trustedSpenders` | address[] | No | Spenders allowed by the current agent policy. |
| `blockedAddresses` | address[] | No | Addresses that should always be blocked. |
| `addressBook` | object | No | Optional labels for known addresses. |

### Output Parsing

| Field | Description |
| --- | --- |
| `decision` | `ALLOW`, `WARN`, or `BLOCK`. |
| `risk_score` | Integer from 0 to 100. |
| `transaction.functionName` | Decoded function or `unknown`. |
| `findings[].code` | Machine-readable risk code. |
| `reasons[]` | Human-readable explanation list. |
| `agent_action` | What the agent should do next. |
| `safer_alternative` | Safer transaction or workflow suggestion. |

### Error Handling

| Error Signature | Cause | Suggested Action |
| --- | --- | --- |
| `must be a valid 0x-prefixed EVM address` | Address is malformed | Ask user or upstream agent to provide a valid address. |
| `calldata must be valid hex` | Calldata is not byte-aligned hex | Rebuild calldata from ABI or transaction builder. |
| `chainId must be a positive integer` | Missing or invalid chain id | Read `assets/networks.json` and pass the intended Pharos chain id. |
| `UNKNOWN_CALLDATA` | Selector is not decoded by SafeTx | Treat as warning/blocking signal; decode ABI before signing. |
| `INFINITE_APPROVAL` | Transaction grants max approval | Replace with limited approval matching user intent. |

> **Agent Guidelines**:
> 1. Run SafeTx immediately before signing or submitting any transaction.
> 2. Pass the exact `to`, `value`, and `calldata` that would be signed.
> 3. If `decision = ALLOW`, continue only if the user session permits autonomous execution.
> 4. If `decision = WARN`, ask for explicit confirmation and show the reasons.
> 5. If `decision = BLOCK`, do not sign or submit. Regenerate the transaction or use `safer_alternative`.

---

## Run Demo Safety Report

### Overview

Run the bundled SafeTx demo. It simulates a user asking to swap 10 USDC to PHRS
while the agent attempts to sign an unlimited ERC20 approval.

### Command Template

```bash
npm run demo:skill
```

### Output Parsing

The output must include:

| Section | Expected Content |
| --- | --- |
| `Pharos SafeTx Safety Scan Report` | Report title. |
| `Transaction Under Review` | Decoded function and selector. |
| `Decision` | `BLOCK` with risk score. |
| `Findings` | Infinite approval, untrusted spender, amount exceeds intent. |
| `Skill Test Result` | PASS statement. |

> **Agent Guidelines**:
> 1. Use this demo to prove the Skill is locally runnable.
> 2. Summarize the report; do not claim any transaction was submitted.
> 3. If the demo does not end with `PASS`, inspect `examples/warn-infinite-approval.json` and `src/riskEngine.js`.

---

## Verify Portable Interfaces

### Overview

Verify that SafeTx exposes the same core capability through CLI, MCP, and HTTP.

### Command Templates

```bash
npm run analyze -- examples/warn-infinite-approval.json
```

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\n' | node src/mcp-server.js
```

```bash
npm run http
```

### Output Parsing

| Interface | Success Signal |
| --- | --- |
| CLI | JSON output with `decision`. |
| MCP | Tool list includes `pharos_safetx_analyze_transaction`. |
| HTTP | `GET /health` returns `ok: true`; `POST /analyze` returns a SafeTx result. |

> **Agent Guidelines**:
> 1. Prefer CLI for local deterministic tests.
> 2. Use MCP when the agent runtime supports MCP tools.
> 3. Use HTTP for Dify, LangChain, CrewAI, or custom agent backends.
