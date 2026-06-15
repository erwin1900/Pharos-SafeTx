# Pharos SafeTx Operation Instructions

> Network Configuration: read from `assets/networks.json`.
> Secret material: not required. SafeTx is read-only and only analyzes request JSON.

This file keeps the consolidated SafeTx workflow, demo, and interface checks.
For Pharos Skill Engine-style routing, prefer:

- `references/query.md` for read-only explanation and metadata tasks.
- `references/transaction.md` for transaction-payload checks.
- `references/contract.md` for selector, ABI, and unknown-contract handling.

---

## Analyze Transaction Payload

### Overview

Analyze a proposed Pharos/EVM transaction against the user's natural-language
intent and return `ALLOW`, `WARN`, or `BLOCK` before any downstream execution
handoff.

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
| `chainId` | number | Yes | Pharos/EVM chain id. Current testnet examples use `688689`; `1672` remains supported for mainnet analysis. |
| `from` | address | Yes | Account address associated with the prepared transaction. |
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
| `UNKNOWN_CALLDATA` | Selector is not decoded by SafeTx | Treat as warning/blocking signal; decode ABI before execution handoff. |
| `INFINITE_APPROVAL` | Transaction grants max approval | Replace with limited approval matching user intent. |

> **Agent Guidelines**:
> 1. Run SafeTx immediately before any execution handoff.
> 2. Pass the exact `to`, `value`, and `calldata` from the prepared payload.
> 3. If `decision = ALLOW`, continue only if the user session permits autonomous execution.
> 4. If `decision = WARN`, ask for explicit confirmation and show the reasons.
> 5. If `decision = BLOCK`, stop the handoff. Regenerate the payload or use `safer_alternative`.

---

## Run Demo Safety Report

### Overview

Run the bundled SafeTx demo. It simulates a user asking to swap 10 USDC to PHRS
while the prepared payload contains an unlimited ERC20 approval.

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
> 2. Summarize the report; do not claim any network submission occurred.
> 3. If the demo does not end with `PASS`, inspect `examples/warn-infinite-approval.json` and `src/riskEngine.js`.

---

## Verify Portable CLI Interface

### Overview

Verify that SafeTx exposes its core capability through the local CLI and Skill
instructions.

### Command Templates

```bash
npm run analyze -- examples/warn-infinite-approval.json
```

### Output Parsing

| Interface | Success Signal |
| --- | --- |
| CLI | JSON output with `decision`. |
| Skill demo | `Pharos SafeTx Safety Scan Report` and `Skill Test Result`. |

> **Agent Guidelines**:
> 1. Prefer CLI for local deterministic tests.
> 2. Use `SKILL.md` and the reference files for agent routing.
