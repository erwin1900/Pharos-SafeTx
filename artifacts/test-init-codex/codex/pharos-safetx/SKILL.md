---
name: pharos-safetx
description: Use when Codex needs to run or test the local Pharos SafeTx Agent Skill, analyze an AI x RealFi Pharos/EVM transaction before signing, explain ALLOW/WARN/BLOCK decisions, run SafeTx demo scenarios, or verify the portable Skill interfaces in /Users/liuyanwen/Documents/Pharos SafeTx. Trigger on requests like "use pharos-safetx skill", "SafeTx check this transaction", "RealFi transaction safety", "AI payment guardrail", "test SafeTx skill mode", "run SafeTx demo", or "analyze this calldata with SafeTx".
---

# Pharos SafeTx

SafeTx is an AI x RealFi pre-signing safety gate for agent-generated Pharos/EVM
transactions. It protects flows such as stablecoin transfers, approvals, swaps,
vault operations, staking, treasury payments, and RWA token actions before a
wallet signs.

Use the local project at:

```text
/Users/liuyanwen/Documents/Pharos SafeTx
```

## Core Workflow

When the user asks to test the Skill mode, first run:

```bash
npm run demo:skill
```

This should output a `Pharos SafeTx Safety Scan Report`, not just a tool list.

When the user gives a JSON file, run:

```bash
npm run analyze -- <file>
```

When the user asks for Chinese or bilingual prompt content, add or preserve the
request field:

```json
{ "language": "zh" }
```

or:

```json
{ "language": "bilingual" }
```

For Pharos Skill Engine-style routing:

- Read `SKILL.md` first as the agent entry point.
- Use `references/transaction.md` for pre-signing checks.
- Use `references/query.md` for explanation and read-only inspection.
- Use `references/contract.md` for unknown selectors, ERC20 approvals, and ABI handling.
- Use `references/script-gen.md` for JS/TS/Python integration templates.

When the user pastes a transaction object, pass it to the CLI through stdin:

```bash
node src/cli.js analyze
```

When the user asks to verify Agent tool interfaces, run:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\n' | node src/mcp-server.js
```

When the user asks to verify HTTP compatibility, run:

```bash
npm run http
```

Then call `POST /analyze`, `POST /explain`, or `POST /suggest`.

## Interpretation

- `ALLOW`: the transaction can proceed if the user session permits autonomous signing.
- `WARN`: the agent should pause and ask the user for explicit confirmation.
- `BLOCK`: the agent must not sign or submit the transaction.

## Reporting

After running SafeTx, summarize:

- which SafeTx interface was used
- whether a safety scan report was produced
- the decoded transaction function
- the decision and risk score
- the top reasons
- the recommended agent action
- whether the Skill mode test passed

Never claim SafeTx signed or submitted a transaction. SafeTx is a pre-signing firewall.
