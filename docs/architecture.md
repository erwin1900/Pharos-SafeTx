# Architecture

Pharos SafeTx is intentionally narrow: it sits immediately before transaction
signing and decides whether an AI agent should proceed with a RealFi action.
It is the safety layer between AI-generated financial intent and wallet
execution.

```text
User intent
    |
    v
AI Agent builds RealFi transaction
    |  stablecoin transfer / approval / swap / vault / staking / RWA
    |
    v
Pharos SafeTx Skill
    |-- validate request
    |-- parse user intent
    |-- decode calldata
    |-- run risk rules
    |-- produce ALLOW / WARN / BLOCK
    |
    v
Agent signs, asks user, or blocks
```

## AI x RealFi Positioning

SafeTx assumes AI agents will increasingly execute real financial workflows:
stablecoin payments, treasury operations, DeFi swaps, vault deposits,
withdrawals, reward claims, staking, lending, and RWA token movement. The
critical failure mode is not only bad code; it is the gap between what the user
asked for and what the agent is about to sign.

SafeTx protects that boundary by comparing natural-language intent against the
exact `to`, `value`, `chainId`, and `calldata` payload. It does not replace a
wallet, an auditor, or a protocol risk engine. It gives the agent a deterministic
last-mile decision before signing.

## Modules

| Module | Responsibility |
| ------ | -------------- |
| `src/cli.js` | CLI entry point for examples and local demos. |
| `src/initDeploy.js` | Generates local deployment packages for Codex, ChatGPT, MCP, Claude, and Cursor. |
| `src/mcp-server.js` | Newline-delimited JSON-RPC stdio server exposing SafeTx tools. |
| `adapters/http-server.js` | HTTP adapter for platforms that do not support MCP. |
| `skill.json` | Platform-neutral Skill manifest. |
| `schemas/` | JSON Schema contracts for request and result payloads. |
| `SKILL.md` | Pharos Skill Engine-style agent entry point and Capability Index. |
| `references/query.md` | Read-only explanation, metadata, and output parsing guidance. |
| `references/transaction.md` | Main pre-signing transaction decision workflow. |
| `references/contract.md` | ERC20, selector, ABI, and unknown-contract guidance. |
| `references/script-gen.md` | JS/TS/Python integration template guidance. |
| `references/safetx.md` | Legacy consolidated operation instructions and demo/interface checks. |
| `assets/networks.json` | Pharos network metadata. |
| `assets/tokens.json` | Token metadata for examples and policy context. |
| `assets/risk-selectors.json` | Data-driven high-attention selector list. |
| `assets/templates/` | Script generation templates for read and pre-write SafeTx handoffs. |
| `assets/erc20/StandardERC20.sol` | ERC20 ABI reference asset, not a deployment target. |
| `demo/test-prompts.md` | Natural-language prompts for testing SafeTx in agent runtimes. |
| `src/validation.js` | Request shape, address, chain id, and hex validation. |
| `src/intent.js` | Lightweight natural-language intent parser. |
| `src/decoder.js` | EVM calldata decoder for common transaction types. |
| `src/riskEngine.js` | Risk findings, scoring, and final decision policy. |
| `src/i18n.js` | English, Chinese, and bilingual prompt localization. |
| `src/utils.js` | Address, hex, and ABI word helpers. |

## Data Flow

1. The user expresses a RealFi intent, such as transferring stablecoins, making a swap, or entering a vault.
2. The agent or protocol adapter builds the exact transaction it intends to sign.
3. The agent passes that exact transaction to SafeTx.
4. SafeTx validates the request and normalizes addresses and hex values.
5. SafeTx parses intent fields such as action, amount, token, and mentioned addresses.
6. SafeTx decodes calldata into a known transaction kind where possible.
7. Risk rules compare intent against transaction behavior.
8. SafeTx returns a machine-readable decision and next action.

## Current Rule Set

| Rule | Why it matters |
| ---- | -------------- |
| `UNEXPECTED_CHAIN` | Agents should not silently execute on the wrong network. |
| `BLOCKED_TARGET` | Known-bad addresses must stop execution. |
| `INTENT_ACTION_MISMATCH` | A transfer intent should not become an arbitrary contract call. |
| `INTENT_ADDRESS_MISMATCH` | Address drift is one of the clearest signs of unsafe agent execution. |
| `INFINITE_APPROVAL` | Unlimited approvals can drain all token balance. |
| `UNTRUSTED_SPENDER` | Unknown spenders require confirmation or blocking. |
| `UNEXPECTED_APPROVAL` | Approvals should be explicit or clearly part of a swap flow. |
| `UNKNOWN_CALLDATA` | Unknown selectors should not be signed blindly. |
| selector-specific findings | Permit, Permit2, allowance increase, and NFT operator approvals need stronger confirmation. |
| `UNEXPECTED_NATIVE_VALUE` | Native value transfers need clear authorization. |
| `AMOUNT_EXCEEDS_INTENT` | Transaction amount should not exceed the user's instruction. |
| `POLICY_TARGET_NOT_ALLOWED` | Agent wallet policy can restrict which contracts may be called. |
| `POLICY_RECIPIENT_NOT_ALLOWED` | Agent wallet policy can restrict final recipients. |
| `POLICY_SPENDER_NOT_ALLOWED` | Agent wallet policy can restrict approval spenders. |
| `POLICY_TOKEN_LIMIT_EXCEEDED` | Agent wallet policy can cap per-transaction token movement. |
| `POLICY_NATIVE_LIMIT_EXCEEDED` | Agent wallet policy can cap per-transaction native value. |

## Protected RealFi Surfaces

| Surface | What SafeTx checks |
| ------- | ------------------ |
| Stablecoin transfer | Recipient, amount, chain, and unexpected calldata. |
| ERC20 approval | Unlimited approval, spender trust, and approval intent. |
| Swap | Whether the transaction is actually a swap-related call or hidden approval risk. |
| Vault / staking / claim | Known selector handling and unexpected value movement. |
| Treasury payment | Address drift, amount drift, wrong-chain execution, and blocked targets. |
| RWA token operation | Unknown selector, target trust, and intent mismatch before signing. |

## Phase 2 Extension Path

SafeTx can compose with later Pharos Agent Arena projects by adding:

- verified Pharos router registry
- live allowance reads via Pharos RPC
- protocol ABI registry for richer calldata decoding
- pluggable external risk providers
- signed policy profiles for different agent risk appetites
