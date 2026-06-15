---
name: pharos-safetx
description: Use when an AI agent needs an AI x RealFi pre-signing safety check for Pharos/EVM transactions, including stablecoin transfers, token approvals, swaps, vault or staking flows, RWA/treasury movement, user-intent vs calldata analysis, unlimited approval detection, Permit2 or permit selector review, spender trust checks, ALLOW/WARN/BLOCK decisions, safer transaction alternatives, demo safety reports, CLI/MCP/HTTP interface verification, or portable Agent Skill integration. Trigger for requests like "check if this transaction should be signed", "analyze this calldata", "SafeTx demo", "transaction firewall", "pre-signing risk report", "approve safety", "Permit2 safety", "RealFi agent safety", "AI payment guardrail", or "agent signing guardrail".
---

# Pharos SafeTx Skill

Pharos SafeTx is a portable AI x RealFi pre-signing safety Skill for AI agents
on Pharos. It checks whether a proposed EVM transaction matches the user's
stated financial intent and returns `ALLOW`, `WARN`, or `BLOCK` before an agent
signs.

SafeTx is read-only by design. It never signs, broadcasts, revokes, or submits a
transaction. It can be consumed through `SKILL.md`, CLI, MCP, HTTP, and JSON
Schema interfaces.

Use SafeTx as the guardrail between AI-generated RealFi actions and wallet
signing. Typical protected flows include stablecoin transfers, approvals,
swaps, vault deposits or withdrawals, staking, reward claims, treasury
payments, payroll-style payouts, and RWA token operations.

## Layer 1: Agent Reads This File First

When a developer asks an AI agent to check a Pharos transaction, the agent must
read this `SKILL.md` before running any command. This file does two things:

1. Declares the prerequisites the agent must satisfy.
2. Provides a Capability Index that maps user intent to the correct reference
   file for exact command templates, parameters, output parsing, and error
   handling.

Do not skip directly to MCP, HTTP, or CLI tools. Select the workflow from the
Capability Index first, then load only the referenced file needed for the task.

## Prerequisites

- Node.js 20+
- Foundry is optional for SafeTx core; run `npm run prereq` to detect `forge` and `cast`
- `cast` is only needed if an integrating agent performs live RPC reads before calling SafeTx
- `forge` is only needed if another Pharos Skill compiles or deploys contracts before SafeTx review
- No private key required; never ask the user for one
- A SafeTx request must include `user_intent`, `chainId`, `from`, and `to`
- `calldata` and `value` must be the exact fields the downstream agent plans to sign
- Run commands from the project root

```text
/Users/liuyanwen/Documents/Pharos SafeTx
```

## Network Configuration

Read network metadata and token metadata from:

```text
assets/networks.json
assets/tokens.json
```

SafeTx currently supports examples for:

- Pharos Pacific Mainnet: `chainId = 1672`
- Pharos Atlantic Testnet: `chainId = 688689`
- Legacy compatibility: `chainId = 688688`

## Capability Index

| User Need | Capability | Detailed Instructions |
| --- | --- | --- |
| "AI agent wants to move funds", "RealFi transaction safety", "treasury payment guardrail", "stablecoin transfer check" | AI x RealFi pre-signing safety gate | `references/transaction.md` |
| "configure whitelist", "enforce transaction limit", "only allow this recipient/spender", "cap USDC transfers" | policy whitelist and transaction limits | `references/transaction.md` |
| "中文提示", "双语输出", "Chinese output", "bilingual prompts" | localized safety prompt output | `references/transaction.md` |
| "check my wallet balance", "what network/token metadata should I use?", "explain this previous result" | read-only query and explanation | `references/query.md` |
| "Should my agent sign this transaction?", "check this calldata", "is this transaction safe?" | analyze transaction before signing | `references/transaction.md` |
| "Why did SafeTx block this?", "explain the risk score", "why is this WARN?" | risk explanation and output parsing | `references/query.md` |
| "This selector/contract is unknown", "is this ERC20 approval safe?", "review Permit2" | contract and selector review | `references/contract.md` |
| "Generate a JS/TS/Python integration script", "wire SafeTx before signing" | script generation templates | `references/script-gen.md` |
| "Run SafeTx demo", "test skill mode", "show the safety scan report" | demo safety report | `references/safetx.md#run-demo-safety-report` |
| "Verify SafeTx interfaces", "check CLI/MCP/HTTP", "is this portable across agent platforms?" | portable interface check | `references/safetx.md#verify-portable-interfaces` |

## Decision Policy

- `ALLOW`: no meaningful risk was detected. The agent may proceed only if the
  user session permits autonomous execution.
- `WARN`: risk exists. The agent should pause and ask for explicit user
  confirmation.
- `BLOCK`: critical risk or strong intent mismatch. The agent must not sign or
  submit the transaction.

## Current Risk Rules

- unexpected chain
- blocked transaction target
- action mismatch between user intent and calldata
- address mismatch between user intent and transaction recipient or target
- unlimited ERC20 approval
- approval to an untrusted spender
- approval when the user did not ask for approval or swap
- high-attention selectors from `assets/risk-selectors.json`
- unknown calldata selector
- native value transfer not authorized by intent
- decoded amount greater than the amount in user intent
- policy target, recipient, or spender whitelist violations
- policy native value or token amount limit violations

## Portable Interfaces

| Interface | Command |
| --- | --- |
| CLI | `npm run analyze -- <request.json>` |
| MCP | `npm run mcp` |
| HTTP | `npm run http` |
| Manifest | `skill.json` |
| Request schema | `schemas/safetx-request.schema.json` |
| Result schema | `schemas/safetx-result.schema.json` |
| Templates | `assets/templates/` |

## Write Operation Pre-Checks

SafeTx itself performs no write operation. If a downstream agent uses SafeTx
before a real transaction, the agent must still complete its own signing
pre-checks:

1. Confirm the exact `to`, `value`, and `calldata` match the transaction to be signed.
2. Confirm the target chain id matches user intent.
3. Confirm private keys are never pasted into SafeTx request payloads.
4. Run SafeTx immediately before signing.
5. Obey the SafeTx decision.

## General Error Handling

| Error / Finding | Cause | Suggested Action |
| --- | --- | --- |
| `must be a valid 0x-prefixed EVM address` | Malformed address | Ask for a valid `0x` + 40 hex address. |
| `calldata must be valid hex` | Calldata is malformed or not byte-aligned | Rebuild calldata from ABI. |
| `UNEXPECTED_CHAIN` | Chain id is outside SafeTx's known Pharos set | Confirm intended network using `assets/networks.json`. |
| `UNKNOWN_CALLDATA` | SafeTx does not decode the selector | Decode ABI or route through a verified protocol adapter. |
| `INFINITE_APPROVAL` | Transaction grants max ERC20 allowance | Replace with limited approval. |

## Local Commands

```bash
npm run prereq
npm test
npm run demo:skill
npm run analyze -- examples/warn-infinite-approval.json
npm run analyze -- examples/warn-permit2-selector.json
```

## Security Reminders

- Never sign or submit transactions from SafeTx.
- Never put private keys, seed phrases, or auth tokens in request JSON.
- Treat `ALLOW` as a policy decision, not a guarantee that a protocol is safe.
- Treat `WARN` and `BLOCK` as human-in-the-loop moments.
