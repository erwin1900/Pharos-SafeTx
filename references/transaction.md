# Transaction Reference

Use this reference for pre-signing SafeTx checks. This is the main workflow for
deciding whether an agent may sign, must ask the user, or must block.

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

Use `policy` when an agent wallet should obey session-level or treasury-level
guardrails in addition to user intent checks.

```json
{
  "policy": {
    "allowedTargets": ["0xc879c018db60520f4355c26ed1a6d572cdac1815"],
    "allowedRecipients": ["0x2222222222222222222222222222222222222222"],
    "allowedSpenders": ["0x5555555555555555555555555555555555555555"],
    "maxNativeValue": "0x0",
    "maxTokenAmounts": {
      "USDC": "50",
      "0xc879c018db60520f4355c26ed1a6d572cdac1815": "50"
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
| `ALLOW` | Continue only if the user session permits autonomous signing. |
| `WARN` | Pause and ask for explicit user confirmation. |
| `BLOCK` | Do not sign or submit. Regenerate the transaction or use `safer_alternative`. |

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

## Write Operation Pre-checks

Before any downstream signer receives a transaction:

1. Confirm the exact `to`, `value`, and `calldata` match the transaction to be signed.
2. Confirm `chainId` matches the user intent and the signer network.
3. Confirm no private key, seed phrase, or auth token appears in the request JSON.
4. Run SafeTx immediately before signing.
5. Enforce the returned decision without weakening it.

## Error Handling

| Error / Finding | Cause | Suggested action |
| --- | --- | --- |
| `must be a valid 0x-prefixed EVM address` | Malformed address | Ask for a valid address. |
| `calldata must be valid hex` | Malformed calldata | Rebuild from ABI or transaction builder. |
| `UNEXPECTED_CHAIN` | Chain id outside configured Pharos networks | Confirm network using `assets/networks.json`. |
| `INFINITE_APPROVAL` | Max ERC20 allowance | Replace with limited approval. |
| `UNKNOWN_CALLDATA` | Selector is not decoded | Decode ABI before signing or block. |
| `POLICY_TARGET_NOT_ALLOWED` | Transaction target not whitelisted | Add the target to policy or regenerate the transaction. |
| `POLICY_RECIPIENT_NOT_ALLOWED` | Decoded recipient not whitelisted | Confirm the intended recipient and update policy only if approved. |
| `POLICY_SPENDER_NOT_ALLOWED` | Approval spender not whitelisted | Use an allowed router/spender or ask for explicit policy update. |
| `POLICY_TOKEN_LIMIT_EXCEEDED` | Token amount exceeds policy cap | Reduce amount or request a higher limit. |

## Agent Guidelines

1. Never sign from inside SafeTx.
2. Show `reasons[]` to the user for `WARN` and `BLOCK`.
3. Prefer limited approvals over unlimited approvals.
4. Treat `ALLOW` as a policy result, not a protocol audit guarantee.
