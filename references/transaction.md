# Transaction Reference

Use this reference for SafeTx transaction-payload checks. This is the main
workflow for deciding whether an agent may continue, must ask the user, or must
block.

## Command Template

```bash
npm run analyze -- <request.json>
```

## Request Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `user_intent` | string | Yes | User instruction the agent is trying to satisfy. |
| `chainId` | number | Yes | Pharos/EVM chain id. |
| `from` | address | Yes | Wallet or agent address initiating the transaction. |
| `to` | address | Yes | Transaction target contract or recipient. |
| `value` | hex quantity | No | Native value. Defaults to `0x0`. |
| `calldata` | hex bytes | No | Transaction calldata. Defaults to `0x`. |
| `language` | string | No | Output language: `en`, `zh`, `zh-CN`, or `bilingual`. Defaults to `en`. |
| `trustedSpenders` | address[] | No | Spenders allowed by current policy. |
| `blockedAddresses` | address[] | No | Addresses that should always be blocked. |
| `tokenDecimals` | object | No | Token decimals by symbol or token address, used to compare human amounts with ERC20 base-unit calldata. |
| `policy` | object | No | Optional whitelist and per-transaction limit policy. |
| `addressBook` | object | No | Optional labels for known addresses. |

## Policy Configuration

Use `policy` when an agent account should obey session-level or treasury-level
guardrails in addition to user intent checks.

```json
{
  "policy": {
    "allowedTargets": ["0xcfc8330f4bcab529c625d12781b1c19466a9fc8b"],
    "allowedRecipients": ["0x2222222222222222222222222222222222222222"],
    "allowedSpenders": ["0x5555555555555555555555555555555555555555"],
    "maxNativeValue": "0x0",
    "maxTokenAmounts": {
      "USDC": "50",
      "0xcfc8330f4bcab529c625d12781b1c19466a9fc8b": "50"
    }
  }
}
```

| Policy Field | Effect |
| --- | --- |
| `allowedTargets` | If non-empty, `to` must be in this whitelist. |
| `allowedRecipients` | If non-empty, decoded transfer/native recipient must be in this whitelist. |
| `allowedSpenders` | If non-empty, decoded approval spender must be in this whitelist. |
| `maxNativeValue` | Blocks native value above this hex quantity. |
| `maxTokenAmounts` | Blocks decoded token amount above the configured human-unit limit. Requires `tokenDecimals` for ERC20 human-unit comparison. |

## Decision Handling

| Decision | Agent action |
| --- | --- |
| `ALLOW` | Continue only if the user session permits autonomous execution. |
| `WARN` | Pause and ask for explicit user confirmation. |
| `BLOCK` | Stop wallet handoff. Regenerate the transaction or use `safer_alternative`. |

## Language / Prompt Output

Set `language` to control SafeTx user-facing prompts:

```json
{
  "language": "bilingual"
}
```

| Value | Output |
| --- | --- |
| `en` | English findings, reasons, action, and safer alternative. |
| `zh` or `zh-CN` | Chinese findings, reasons, action, and safer alternative. |
| `bilingual` | English and Chinese in the same fields. |

## Wallet Handoff Pre-checks

Before any downstream wallet or execution component receives a transaction
payload:

1. Confirm the exact `to`, `value`, and `calldata` match the prepared transaction payload.
2. Confirm `chainId` matches the user intent and the execution network.
3. Confirm no secret material or auth token appears in the request JSON.
4. Run SafeTx immediately before downstream wallet review.
5. Enforce the returned decision without weakening it.

## Error Handling

| Error / Finding | Cause | Suggested action |
| --- | --- | --- |
| `must be a valid 0x-prefixed EVM address` | Malformed address | Ask for a valid address. |
| `calldata must be valid hex` | Malformed calldata | Rebuild from ABI or transaction builder. |
| `UNEXPECTED_CHAIN` | Chain id outside configured Pharos networks | Confirm network using `assets/networks.json`. |
| `INFINITE_APPROVAL` | Max ERC20 allowance | Replace with limited approval. |
| `UNKNOWN_CALLDATA` | Selector is not decoded | Decode ABI before wallet handoff or block. |
| `POLICY_TARGET_NOT_ALLOWED` | Transaction target not whitelisted | Add the target to policy or regenerate the transaction. |
| `POLICY_RECIPIENT_NOT_ALLOWED` | Decoded recipient not whitelisted | Confirm the intended recipient and update policy only if approved. |
| `POLICY_SPENDER_NOT_ALLOWED` | Approval spender not whitelisted | Use an allowed router/spender or ask for explicit policy update. |
| `POLICY_TOKEN_LIMIT_EXCEEDED` | Token amount exceeds policy cap | Reduce amount or request a higher limit. |

## Agent Guidelines

1. Never execute transactions from inside SafeTx.
2. SafeTx has no wallet adapter, no secret-material path, no RPC client, and no
   network-write code.
3. Show `reasons[]` to the user for `WARN` and `BLOCK`.
4. Prefer limited approvals over unlimited approvals.
5. Treat `ALLOW` as a policy result, not a protocol audit guarantee.
