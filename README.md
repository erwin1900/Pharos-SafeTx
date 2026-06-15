# Pharos SafeTx Skill

Pharos SafeTx is an AI x RealFi pre-signing safety layer for agents on Pharos.
Before an agent signs or submits an on-chain financial transaction, SafeTx
checks whether the transaction matches the user's stated intent and returns a
machine-readable `ALLOW`, `WARN`, or `BLOCK` decision.

SafeTx is a portable Agent Skill package. It can be consumed through `SKILL.md`,
JSON Schema, CLI, MCP, or HTTP adapters, so it is not tied to one agent platform.

In RealFi workflows, AI agents may move stablecoins, grant token approvals,
enter vaults, claim rewards, rebalance treasury funds, or interact with RWA and
DeFi contracts. SafeTx acts as the guardrail between "the AI generated a
transaction" and "the wallet signs a transaction."

The package follows the Pharos Skill Engine pattern:

- `SKILL.md` is the agent entry point.
- The agent reads `SKILL.md` first to check prerequisites and choose a workflow from the Capability Index.
- `references/` maps agent intents to query, transaction, contract, and script-generation workflows.
- `assets/networks.json` stores Pharos network metadata.
- `assets/tokens.json` stores known token metadata for examples and policy context.
- `assets/risk-selectors.json` stores high-attention selector rules.
- `assets/templates/` stores JS/TS/Python integration templates.

```text
pharos-safetx/
|-- SKILL.md
|-- assets/
|   |-- networks.json
|   |-- tokens.json
|   |-- risk-selectors.json
|   |-- erc20/
|   |   `-- StandardERC20.sol
|   `-- templates/
|       |-- template_read.js.tpl
|       |-- template_write.js.tpl
|       |-- template_read.ts.tpl
|       |-- template_write.ts.tpl
|       |-- template_read.py.tpl
|       `-- template_write.py.tpl
|-- references/
|   |-- query.md
|   |-- transaction.md
|   |-- contract.md
|   |-- script-gen.md
|   `-- safetx.md
|-- schemas/
|-- src/
|-- adapters/
|-- examples/
`-- skill.json
```

Unlike deployment-oriented Pharos Skills, SafeTx does not require Foundry or a
configured private key. Its core prerequisite is the exact transaction payload
the downstream agent intends to sign. If an integrating workflow uses `cast`
for live RPC reads or `forge` for contract compilation before SafeTx review,
install Foundry in that runner and verify it with:

```bash
npm run prereq
```

If Node.js or npm is not installed at all, install Node.js >=20 first because
`npm run prereq` itself needs Node to start:

```bash
# macOS with Homebrew
brew install node

# or with mise
mise use -g node@20

# or with nvm
nvm install 20 && nvm use 20
```

If Node is present but too old, or a supported local installer is available, you
can ask the prereq script to try an install or upgrade:

```bash
npm run prereq -- --install
```

## Why This Skill Exists

AI agents can already generate transactions, call protocols, and move value.
RealFi makes that power useful, but also raises the cost of small mistakes: a
wrong recipient, unlimited approval, unknown selector, or wrong-chain execution
can become a real asset loss. The missing layer is a reusable preflight check
that asks:

- Does this transaction match what the user actually requested?
- Is this an unlimited approval disguised as a swap?
- Is the recipient or contract different from the address in the user's intent?
- Should the agent proceed, ask for confirmation, or refuse to sign?

SafeTx is designed as a Phase 1 Skill module for the Pharos Skill-to-Agent Dual
Cascade Hackathon. It is intentionally small, reusable, and composable.

## AI x RealFi Use Cases

SafeTx is built for agent-driven financial workflows such as:

- stablecoin transfers and treasury payouts
- ERC20 approvals before swaps or deposits
- DeFi swap, stake, claim, deposit, and withdraw flows
- vault and lending interactions
- RWA token movement or management
- payroll, batch payment, and operational fund movement
- any autonomous or semi-autonomous agent flow that reaches the signing step

## Features

SafeTx focuses on the pre-signing moment. It does not sign, submit, or custody
assets. It only evaluates whether the transaction an AI agent is about to sign
matches the user's stated intent.

Core checks:

- Intent parsing for `transfer`, `approve`, `swap`, `stake`, `claim`, `deposit`, `withdraw`, `borrow`, and `repay` requests.
- EVM calldata decoding for ERC20 `transfer`, `approve`, and `transferFrom`.
- Monitored RealFi method selectors for payments, approvals, DEX swaps, router bundles, vaults, staking, rewards, and lending.
- Recipient and target matching against addresses mentioned in the user intent.
- Amount checks against the user intent, including ERC20 base-unit comparison through `tokenDecimals`.
- Infinite approval detection through `INFINITE_APPROVAL`.
- Untrusted or policy-disallowed spender checks.
- Unknown calldata and monitored/high-risk selector checks through `assets/risk-selectors.json`.
- Blocklist checks through `blockedAddresses`.
- Request validation for addresses, chain ids, hex values, policies, and language options.

Policy guardrails:

- target contract whitelist through `policy.allowedTargets`
- recipient whitelist through `policy.allowedRecipients`
- approval spender whitelist through `policy.allowedSpenders`
- native token limit through `policy.maxNativeValue`
- ERC20 token limit through `policy.maxTokenAmounts`

Agent outputs:

- `ALLOW`: proceed only if the current user session permits autonomous signing.
- `WARN`: pause and ask the user for explicit confirmation.
- `BLOCK`: refuse to sign or submit the transaction.

Interfaces:

- `SKILL.md` for Pharos Skill Engine-style agent routing.
- JSON Schema for portable tool validation.
- CLI for local tests and agent subprocess calls.
- MCP for agent tool integration.
- HTTP adapter for platforms that call external APIs.
- No runtime npm dependencies.

## Quick Start

```bash
npm run prereq
npm test
npm run init -- --target all
npm run analyze -- examples/allow-transfer.json
npm run analyze -- examples/warn-infinite-approval.json
npm run demo:skill
npm run http
```

You can also pipe JSON:

```bash
cat examples/block-unknown-call.json | node src/cli.js analyze
```

## Command Reference

Environment and tests:

```bash
npm run prereq
npm run prereq -- --install
npm test
```

Analyze example transactions:

```bash
npm run analyze -- examples/allow-transfer.json
npm run analyze -- examples/warn-infinite-approval.json
npm run analyze -- examples/block-policy-token-limit.json
```

Analyze a JSON request from stdin:

```bash
cat examples/block-unknown-call.json | node src/cli.js analyze
```

Run local demos:

```bash
npm run demo:skill
npm run demo:txbuilder
```

Start MCP or HTTP interfaces:

```bash
npm run mcp
npm run http
```

Smoke-test the MCP tool list:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\n' | node src/mcp-server.js
```

Call the HTTP analyzer:

```bash
curl -s http://127.0.0.1:8787/analyze \
  -H 'content-type: application/json' \
  --data @examples/warn-infinite-approval.json
```

Generate local deployment packages for different agent surfaces:

```bash
npm run init -- --target all
npm run init -- --target codex
npm run init -- --target chatgpt
npm run init -- --target mcp
npm run init -- --target claude
npm run init -- --target cursor
```

## Local Skill Scenario Demo

Run a local end-to-end simulation where an AI agent builds a transaction, calls
SafeTx as an MCP Skill, and follows the returned safety decision:

```bash
npm run demo:skill
```

Use a specific scenario file:

```bash
npm run demo:skill -- examples/block-intent-address-mismatch.json
```

## Request Format

```json
{
  "user_intent": "Swap 10 USDC to PHRS on Pharos",
  "chainId": 1672,
  "from": "0x146b605c8b371d5b50c3ea560fd1a2081aee7557",
  "to": "0xc879c018db60520f4355c26ed1a6d572cdac1815",
  "value": "0x0",
  "calldata": "0x095ea7b3...",
  "language": "bilingual",
  "tokenDecimals": {
    "USDC": 6,
    "0xc879c018db60520f4355c26ed1a6d572cdac1815": 6
  },
  "trustedSpenders": ["0x5555555555555555555555555555555555555555"],
  "blockedAddresses": [],
  "policy": {
    "allowedTargets": ["0xc879c018db60520f4355c26ed1a6d572cdac1815"],
    "allowedRecipients": ["0x2222222222222222222222222222222222222222"],
    "allowedSpenders": ["0x5555555555555555555555555555555555555555"],
    "maxNativeValue": "0x0",
    "maxTokenAmounts": {
      "USDC": "50"
    }
  },
  "addressBook": {
    "USDC": "0xc879c018db60520f4355c26ed1a6d572cdac1815"
  }
}
```

## Policy Guardrails

SafeTx can enforce request-level policy guardrails for AI x RealFi flows:

- target contract whitelist through `policy.allowedTargets`
- recipient whitelist through `policy.allowedRecipients`
- approval spender whitelist through `policy.allowedSpenders`
- native token limit through `policy.maxNativeValue`
- ERC20 token limit through `policy.maxTokenAmounts`

Try a policy limit violation:

```bash
npm run analyze -- examples/block-policy-token-limit.json
npm run analyze -- examples/block-policy-token-limit-bilingual.json
```

## Bilingual Prompts

SafeTx supports localized prompt content through the optional `language` field:

| Value | Output |
| ----- | ------ |
| `en` | English output, default. |
| `zh` / `zh-CN` | Chinese output. |
| `bilingual` | English and Chinese output in the same fields. |

Localized fields include `findings[].message`, `reasons[]`, `agent_action`, and
`safer_alternative`.

## Response Format

```json
{
  "decision": "BLOCK",
  "risk_score": 100,
  "reasons": [
    "Transaction grants unlimited token approval, which can drain the full token balance.",
    "Approval spender is not in the trusted spender list provided to SafeTx."
  ],
  "agent_action": "Do not sign or submit this transaction.",
  "safer_alternative": "Replace unlimited approval with a limited approval close to 10 USDC for a trusted spender."
}
```

## MCP Usage

Start the server:

```bash
npm run mcp
```

The server exposes one tool:

- `pharos_safetx_analyze_transaction`: full SafeTx analysis.
- `pharos_safetx_explain_risk`: compact risk explanation.
- `pharos_safetx_suggest_safe_action`: agent-focused next action.
- `analyze_transaction`: backward-compatible alias.

The server speaks newline-delimited JSON-RPC over stdio, reuses
`schemas/safetx-request.schema.json` as its MCP input schema, and returns both
`structuredContent` and text JSON for tool calls. It also exposes read-only MCP
resources for schemas, references, and examples. It is intentionally
dependency-free for hackathon portability.

Smoke test:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\n' | node src/mcp-server.js
```

Resource smoke test:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"resources/list","params":{}}\n' | node src/mcp-server.js
```

## HTTP Usage

Start the HTTP adapter:

```bash
npm run http
```

Then call it from any platform that can send HTTP requests:

```bash
curl -s http://127.0.0.1:8787/analyze \
  -H 'content-type: application/json' \
  --data @examples/warn-infinite-approval.json
```

Endpoints:

| Endpoint | Description |
| -------- | ----------- |
| `GET /health` | Basic adapter health check. |
| `POST /analyze` | Full SafeTx analysis. |
| `POST /explain` | Compact risk explanation. |
| `POST /suggest` | Agent next action and safer alternative. |

## Portable Skill Manifest

The platform-neutral manifest is [skill.json](skill.json). It declares the
available interfaces, commands, schemas, and decision semantics.

JSON Schemas:

- [SafeTx request schema](schemas/safetx-request.schema.json)
- [SafeTx result schema](schemas/safetx-result.schema.json)

Pharos Skill Engine-style files:

- [Skill entry point](SKILL.md)
- [SafeTx operation reference](references/safetx.md)
- [Query reference](references/query.md)
- [Transaction reference](references/transaction.md)
- [Contract reference](references/contract.md)
- [Script generation reference](references/script-gen.md)
- [Network metadata](assets/networks.json)
- [Token metadata](assets/tokens.json)
- [Risk selector metadata](assets/risk-selectors.json)
- [Integration templates](assets/templates)

## Init Deployment Packages

Generate local deployment packages for skill/GPT-style agent surfaces:

```bash
npm run init -- --target all
```

Targets:

| Target | Output | Purpose |
| ------ | ------ | ------- |
| `codex` | `dist/agent-deploy/codex/pharos-safetx/` | Codex Skill wrapper with install notes. |
| `chatgpt` | `dist/agent-deploy/chatgpt/` | Custom GPT instructions and OpenAPI Action schema. |
| `mcp` | `dist/agent-deploy/mcp/` | MCP client config template. |
| `claude` | `dist/agent-deploy/claude/` | Claude-oriented skill instructions and MCP config. |
| `cursor` | `dist/agent-deploy/cursor/` | Cursor rule file and MCP config. |

Generate one target:

```bash
npm run init -- --target codex
npm run init -- --target chatgpt --out dist/chatgpt-package
```

The `init` command only writes local configuration packages. It does not upload,
install globally, sign transactions, or publish to any marketplace.

## MCP Tool Table

| Tool | Description |
| ---- | ----------- |
| `pharos_safetx_analyze_transaction` | Returns decoded transaction data, risk findings, final decision, and safer alternative. |
| `pharos_safetx_explain_risk` | Returns decision, score, function name, and concise finding explanations. |
| `pharos_safetx_suggest_safe_action` | Returns the next action an AI agent should take before signing. |

## Docs

- [API Reference](docs/api_reference.md)
- [Architecture](docs/architecture.md)

## Docker

```bash
docker build -t pharos-safetx .
docker run -i pharos-safetx
```

## Example Scenarios

- `examples/allow-transfer.json`: valid ERC20 transfer to the intended recipient.
- `examples/warn-infinite-approval.json`: swap intent but transaction grants unlimited approval to an untrusted spender.
- `examples/block-intent-address-mismatch.json`: transfer recipient differs from the user-provided address.
- `examples/block-unknown-call.json`: claim intent but calldata selector is unknown.

## Demo Script

- [90-second demo script](demo/README.md)
- [Agent test prompts](demo/test-prompts.md)

## Hackathon Positioning

SafeTx is not another generic contract scanner. It focuses on the AI-agent
moment immediately before signing:

> Given the user's intent and the transaction an agent is about to execute,
> should the agent sign it, ask for confirmation, or block it?

That makes SafeTx composable with other Pharos Skills such as token intelligence,
approval scanners, protocol routers, and future autonomous agents.

## License

MIT License. See [LICENSE](LICENSE).
