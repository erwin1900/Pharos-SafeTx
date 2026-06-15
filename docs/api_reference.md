# API Reference

Pharos SafeTx now exposes a local CLI-oriented Skill surface. The request and
response shapes are shared by the CLI, examples, JSON Schemas, and generated
Codex Skill package.

## CLI

```bash
npm run analyze -- examples/warn-infinite-approval.json
cat examples/allow-transfer.json | node src/cli.js analyze
npm run init -- --target all
```

For Pharos Skill Engine-style operation instructions, see
`references/safetx.md`.

## Init Command

Use `init` to generate the local Codex Skill package:

```bash
node src/cli.js init --target all --out dist/agent-deploy
```

Supported targets:

| Target | Generated package |
| ------ | ----------------- |
| `codex` | `SKILL.md` wrapper and install instructions. |
| `all` | Alias for `codex`. |

This command is local-only. It writes files under the requested output
directory and does not install globally, upload, sign, submit, or publish
anything.

## Request

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `user_intent` | string | yes | Natural-language user instruction the agent is trying to satisfy. |
| `chainId` | number | yes | Target chain id. Current Pharos testnet examples use `688689`. |
| `from` | string | yes | User or agent wallet address. |
| `to` | string | yes | Transaction target contract or recipient. |
| `value` | string | no | Native value as hex. Defaults to `0x0`. |
| `calldata` | string | no | Transaction calldata. Defaults to `0x`. |
| `language` | string | no | Output language: `en`, `zh`, `zh-CN`, or `bilingual`. |
| `trustedSpenders` | string[] | no | Spenders an agent is allowed to approve without extra warning. |
| `blockedAddresses` | string[] | no | Targets that should always be blocked. |
| `tokenDecimals` | object | no | Token decimals by symbol or address for ERC20 base-unit amount comparison. |
| `policy` | object | no | Optional whitelist and per-transaction limit policy. |
| `addressBook` | object | no | Human-readable labels for known addresses. |

Example:

```json
{
  "user_intent": "Swap 10 USDC to PHRS on Pharos",
  "chainId": 688689,
  "from": "0x146b605c8b371d5b50c3ea560fd1a2081aee7557",
  "to": "0xcfc8330f4bcab529c625d12781b1c19466a9fc8b",
  "value": "0x0",
  "calldata": "0x095ea7b3...",
  "language": "bilingual",
  "tokenDecimals": {
    "USDC": 6,
    "0xcfc8330f4bcab529c625d12781b1c19466a9fc8b": 6
  },
  "policy": {
    "allowedTargets": ["0xcfc8330f4bcab529c625d12781b1c19466a9fc8b"],
    "allowedSpenders": ["0x5555555555555555555555555555555555555555"],
    "maxTokenAmounts": {
      "USDC": "50"
    }
  },
  "trustedSpenders": ["0x5555555555555555555555555555555555555555"]
}
```

## Full Analysis Response

```json
{
  "decision": "BLOCK",
  "risk_score": 98,
  "intent": {
    "action": "swap",
    "amount": "10",
    "token": "USDC"
  },
  "transaction": {
    "kind": "erc20_approve",
    "selector": "0x095ea7b3",
    "functionName": "approve(address,uint256)"
  },
  "findings": [
    {
      "severity": "critical",
      "code": "INFINITE_APPROVAL",
      "message": "Transaction grants unlimited token approval, which can drain the full token balance.",
      "score": 46
    }
  ],
  "agent_action": "Do not sign or submit this transaction.",
  "safer_alternative": "Replace unlimited approval with a limited approval close to 10 USDC for a trusted spender."
}
```

## Decision Semantics

| Decision | Agent behavior |
| -------- | -------------- |
| `ALLOW` | The transaction can proceed if the user session permits autonomous execution. |
| `WARN` | The agent should pause and ask for explicit user confirmation. |
| `BLOCK` | The agent must not sign or submit the transaction. |
