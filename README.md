# Pharos SafeTx

**A pre-signing transaction safety Skill for AI agents on [Pharos](https://pharosnetwork.xyz).**

Give an AI agent transaction-building power without giving it blind signing
authority. `pharos-safetx` reviews the exact EVM transaction payload an agent is
about to hand off, compares it with the user's natural-language intent, applies
policy guardrails, and returns a machine-readable `ALLOW`, `WARN`, or `BLOCK`
decision.

SafeTx is intentionally narrow: it does **not** hold keys, sign transactions,
broadcast transactions, revoke approvals, or call RPC. It is a local Skill and
CLI guardrail for the critical moment between "the agent prepared a transaction"
and "a wallet or downstream system may execute it."

Built for the **Pharos Skill-to-Agent Dual Cascade Hackathon (Phase 1)**.

> Pharos is a fully EVM-equivalent L1 for the AI-agent economy. Agentic RealFi
> needs reusable safety checks before value movement, approvals, swaps, vault
> flows, and treasury operations. SafeTx provides that last-mile pre-signing
> review layer.

---

## Highlights

- **Intent-vs-payload safety.** SafeTx checks whether `to`, `value`,
  `calldata`, decoded recipient, decoded spender, and decoded amount match what
  the user actually asked for.
- **Policy guardrails.** Optional target, recipient, spender, native-value, and
  token-amount limits can block unsafe prepared transactions before handoff.
- **RealFi-aware selector monitoring.** ERC20 transfers, approvals, Permit2,
  swaps, vaults, staking, rewards, and lending selectors are monitored through
  data-driven rules.
- **Local and auditable.** The core runs as a local Node CLI with no runtime npm
  dependencies, no network calls, and no private-key requirement.
- **Agent-friendly output.** Every result includes `decision`, `risk_score`,
  decoded transaction details, findings, reasons, next action, and safer
  alternative.
- **Pharos testnet ready.** Examples default to Atlantic Testnet
  `chainId = 688689` and include current USDC / WPHRS metadata.

## What It Checks

| Area | Checks |
| ---- | ------ |
| Intent parsing | `transfer`, `approve`, `swap`, `stake`, `claim`, `deposit`, `withdraw`, `borrow`, `repay` |
| Transaction decoding | native transfer, ERC20 `transfer`, `approve`, `transferFrom`, known high-attention selectors |
| Address safety | target blocklist, intent address mismatch, policy target / recipient / spender allowlists |
| Amount safety | decoded ERC20 base units vs user amount, native value limits, token amount limits |
| Approval safety | unlimited approval, untrusted spender, unexpected approval |
| Unknown calls | unknown calldata selector warning/blocking path |
| Localization | English, Chinese, and bilingual prompt output |

## Quick Start

```bash
git clone <your-fork-url> pharos-safetx
cd pharos-safetx

npm run prereq
npm test
npm run demo:skill
```

Requires **Node >= 20**. There is no install step for runtime dependencies.
Foundry is optional and only useful for external workflows that perform their
own `cast` or `forge` operations before calling SafeTx.

## Use It From The CLI

Analyze an example:

```bash
npm run analyze -- examples/warn-infinite-approval.json
```

Pipe a request through stdin:

```bash
cat examples/allow-transfer.json | node src/cli.js analyze
```

Generate a local Codex Skill package:

```bash
npm run init -- --target codex
```

Run the bundled Skill demo:

```bash
npm run demo:skill
```

Expected demo result:

```text
Pharos SafeTx Safety Scan Report
Decision: BLOCK
Skill Test Result: PASS
```

## Request Format

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
  "trustedSpenders": ["0x5555555555555555555555555555555555555555"],
  "blockedAddresses": [],
  "policy": {
    "allowedTargets": ["0xcfc8330f4bcab529c625d12781b1c19466a9fc8b"],
    "allowedRecipients": ["0x2222222222222222222222222222222222222222"],
    "allowedSpenders": ["0x5555555555555555555555555555555555555555"],
    "maxNativeValue": "0x0",
    "maxTokenAmounts": {
      "USDC": "50"
    }
  },
  "addressBook": {
    "USDC": "0xcfc8330f4bcab529c625d12781b1c19466a9fc8b"
  }
}
```

Required fields are `user_intent`, `chainId`, `from`, and `to`. `calldata`
defaults to `0x`, and `value` defaults to `0x0`.

## Response Format

```json
{
  "decision": "BLOCK",
  "risk_score": 98,
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

Decision semantics:

| Decision | Meaning |
| -------- | ------- |
| `ALLOW` | No blocking risk detected. A downstream system may continue only if user/session policy allows it. |
| `WARN` | Risk exists. Pause and ask the user for explicit confirmation. |
| `BLOCK` | Critical risk or strong intent mismatch. Do not continue the execution handoff. |

## Policy Guardrails

SafeTx can enforce request-level policy guardrails in addition to intent checks:

```json
{
  "policy": {
    "allowedTargets": ["0xcfc8330f4bcab529c625d12781b1c19466a9fc8b"],
    "allowedRecipients": ["0x2222222222222222222222222222222222222222"],
    "allowedSpenders": ["0x5555555555555555555555555555555555555555"],
    "maxNativeValue": "0x0",
    "maxTokenAmounts": {
      "USDC": "50"
    }
  }
}
```

Policy findings include:

| Code | Meaning |
| ---- | ------- |
| `POLICY_TARGET_NOT_ALLOWED` | Transaction target is outside the allowlist. |
| `POLICY_RECIPIENT_NOT_ALLOWED` | Decoded transfer/native recipient is outside the allowlist. |
| `POLICY_SPENDER_NOT_ALLOWED` | Approval spender is outside the allowlist. |
| `POLICY_NATIVE_LIMIT_EXCEEDED` | Native value exceeds configured limit. |
| `POLICY_TOKEN_LIMIT_EXCEEDED` | Decoded token amount exceeds configured human-unit limit. |

Try a policy limit violation:

```bash
npm run analyze -- examples/block-policy-token-limit.json
npm run analyze -- examples/block-policy-token-limit-bilingual.json
```

## Token Metadata

Configured token metadata lives in [assets/tokens.json](assets/tokens.json).
Current highlighted entries:

| Network | Chain ID | Token | Address | Decimals |
| ------- | -------- | ----- | ------- | -------- |
| Atlantic Testnet | `688689` | USDC | `0xcfc8330f4bcab529c625d12781b1c19466a9fc8b` | 6 |
| Atlantic Testnet | `688689` | WPHRS | `0x838800b758277cc111b2d48ab01e5e164f8e9471` | 18 |
| Pacific Mainnet | `1672` | USDC | `0xc879c018db60520f4355c26ed1a6d572cdac1815` | 6 |
| Pacific Mainnet | `1672` | WPROS | `0x52c48d4213107b20bc583832b0d951fb9ca8f0b0` | 18 |

Examples default to **Atlantic Testnet** (`chainId = 688689`).

## Skill Package Layout

```text
pharos-safetx/
  SKILL.md
  skill.json
  package.json
  assets/
    networks.json
    tokens.json
    risk-selectors.json
    erc20/StandardERC20.sol
  references/
    safetx.md
    transaction.md
    query.md
    contract.md
  schemas/
    safetx-request.schema.json
    safetx-result.schema.json
  src/
    cli.js
    analyzeTransaction.js
    validation.js
    intent.js
    decoder.js
    riskEngine.js
    i18n.js
  examples/
  test/
```

Generated output directories such as `dist/`, `artifacts/`, and `codex-skill/`
are ignored. The root [SKILL.md](SKILL.md) is the single source of truth for
Skill instructions.

## Architecture

```text
User intent + prepared transaction payload
    |
    v
validate request
    |
    v
parse intent -> decode calldata -> apply risk rules -> localize output
    |
    v
ALLOW / WARN / BLOCK + reasons + safer alternative
```

Core modules:

| Module | Responsibility |
| ------ | -------------- |
| `src/cli.js` | Local CLI entry point. |
| `src/analyzeTransaction.js` | Public analysis function. |
| `src/validation.js` | Request validation and normalization. |
| `src/intent.js` | Lightweight intent parser. |
| `src/decoder.js` | EVM calldata decoder. |
| `src/riskEngine.js` | Finding generation, scoring, and final decision. |
| `src/i18n.js` | English, Chinese, and bilingual output. |
| `src/initDeploy.js` | Local Codex Skill package generation. |

## Security Notes

- SafeTx never asks for private keys, seed phrases, or auth tokens.
- SafeTx does not sign, submit, broadcast, revoke, or custody assets.
- Treat `ALLOW` as a policy result, not a protocol audit guarantee.
- Unknown calldata should be decoded through ABI or reviewed before any
  execution handoff.
- Use dedicated test wallets and low-value testnet assets while integrating
  agent workflows.

## Testing

```bash
npm test
```

The test suite covers:

- valid and blocked ERC20 transfers
- unlimited approvals
- intent/action/address mismatches
- unknown calldata
- RealFi selector monitoring
- policy allowlists and limits
- Chinese and bilingual output
- Codex Skill package generation
- token parsing for WPHRS and WPROS

Current expected result:

```text
29 tests, 29 pass
```

## License

MIT — see [LICENSE](LICENSE).
