# API Reference

Pharos SafeTx exposes a CLI and a lightweight MCP-compatible stdio server. Both
surfaces use the same request and response shapes.

It also exposes an HTTP adapter for platforms that do not support MCP.

## CLI

```bash
npm run analyze -- examples/warn-infinite-approval.json
cat examples/allow-transfer.json | node src/cli.js analyze
npm run init -- --target all
```

For Pharos Skill Engine-style operation instructions, see
`references/safetx.md`.

## Init Command

Use `init` to generate local deployment packages for skill/GPT-style agent
surfaces.

```bash
node src/cli.js init --target all --out dist/agent-deploy
```

Supported targets:

| Target | Generated package |
| ------ | ----------------- |
| `codex` | `SKILL.md` wrapper and install instructions. |
| `chatgpt` | Custom GPT instructions and OpenAPI Action schema. |
| `mcp` | MCP server configuration template. |
| `claude` | Claude-oriented instructions and MCP config. |
| `cursor` | Cursor rule file and MCP config. |
| `all` | All targets above. |

This command is local-only. For ChatGPT Actions, host the HTTP adapter behind a
public HTTPS endpoint and replace the generated OpenAPI server URL.

## MCP Tools

| Tool | Purpose |
| ---- | ------- |
| `pharos_safetx_analyze_transaction` | Full SafeTx analysis with decoded transaction, findings, decision, and safer alternative. |
| `pharos_safetx_explain_risk` | Compact explanation of why a transaction was allowed, warned, or blocked. |
| `pharos_safetx_suggest_safe_action` | Agent-focused next action and safer alternative. |
| `analyze_transaction` | Backward-compatible alias for the full analysis tool. |

Start the stdio server:

```bash
npm run mcp
```

List tools:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\n' | node src/mcp-server.js
```

Call the analyzer through MCP:

```bash
node src/mcp-server.js <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"pharos_safetx_analyze_transaction","arguments":{"user_intent":"Transfer 100 USDC to 0x2222222222222222222222222222222222222222","chainId":1672,"from":"0x146b605c8b371d5b50c3ea560fd1a2081aee7557","to":"0xc879c018db60520f4355c26ed1a6d572cdac1815","value":"0x0","calldata":"0xa9059cbb00000000000000000000000022222222222222222222222222222222222222220000000000000000000000000000000000000000000000000000000005f5e100","tokenDecimals":{"USDC":6,"0xc879c018db60520f4355c26ed1a6d572cdac1815":6}}}}
EOF
```

MCP responses include both:

- `structuredContent`: machine-readable SafeTx result for agent runtimes.
- `content[0].text`: JSON text fallback for simple MCP clients.

## MCP Resources

The MCP server also exposes read-only resources so an agent can inspect schemas,
references, and examples without filesystem assumptions.

List resources:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"resources/list","params":{}}\n' | node src/mcp-server.js
```

Read a resource:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"resources/read","params":{"uri":"safetx://reference/transaction"}}\n' | node src/mcp-server.js
```

Important resource URIs:

| URI | Purpose |
| --- | --- |
| `safetx://schema/request` | SafeTx request JSON Schema. |
| `safetx://schema/result` | SafeTx result JSON Schema. |
| `safetx://reference/transaction` | Pre-signing transaction and policy reference. |
| `safetx://reference/query` | Read-only explanation reference. |
| `safetx://reference/contract` | Selector and ABI handling reference. |
| `safetx://reference/script-gen` | Integration script generation reference. |
| `safetx://example/allow-transfer` | ALLOW transfer example. |
| `safetx://example/warn-infinite-approval` | BLOCK unlimited approval example. |
| `safetx://example/block-policy-token-limit` | BLOCK policy limit example. |

## HTTP Adapter

Start:

```bash
npm run http
```

Endpoints:

| Endpoint | Purpose |
| -------- | ------- |
| `GET /health` | Health check and interface metadata. |
| `POST /analyze` | Full SafeTx analysis. |
| `POST /explain` | Compact explanation of risk findings. |
| `POST /suggest` | Agent-focused next action and safer alternative. |

Example:

```bash
curl -s http://127.0.0.1:8787/suggest \
  -H 'content-type: application/json' \
  --data @examples/warn-infinite-approval.json
```

## Request

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `user_intent` | string | yes | Natural-language user instruction the agent is trying to satisfy. |
| `chainId` | number | yes | Target chain id. Current Pharos-oriented examples use `1672`. |
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
  "chainId": 1672,
  "from": "0x146b605c8b371d5b50c3ea560fd1a2081aee7557",
  "to": "0xc879c018db60520f4355c26ed1a6d572cdac1815",
  "value": "0x0",
  "calldata": "0x095ea7b30000000000000000000000004444444444444444444444444444444444444444ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  "language": "bilingual",
  "tokenDecimals": {
    "USDC": 6,
    "0xc879c018db60520f4355c26ed1a6d572cdac1815": 6
  },
  "policy": {
    "allowedTargets": ["0xc879c018db60520f4355c26ed1a6d572cdac1815"],
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
