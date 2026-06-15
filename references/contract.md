# Contract Reference

Use this reference when SafeTx encounters contract-oriented questions: unknown
selectors, ERC20 approval semantics, target allow/block lists, or ABI review.

## ERC20 ABI Reference

The local ERC20 reference asset is:

```text
assets/erc20/StandardERC20.sol
```

SafeTx currently decodes these ERC20 functions:

| Selector | Function |
| --- | --- |
| `0xa9059cbb` | `transfer(address,uint256)` |
| `0x095ea7b3` | `approve(address,uint256)` |
| `0x23b872dd` | `transferFrom(address,address,uint256)` |

## Monitored RealFi Selectors

Selector policy data lives in:

```text
assets/risk-selectors.json
```

Use this file for monitored RealFi methods that require stronger confirmation
before an AI agent signs.

| Category | Examples |
| --- | --- |
| Payments | ERC20 `transfer`, `transferFrom` |
| Approvals | ERC20 `approve`, Permit, Permit2, `increaseAllowance`, NFT `setApprovalForAll` |
| DEX swaps | Uniswap V2-style `swapExact*`, `swap*ForExact*` |
| Router bundles | Universal Router `execute` |
| Vaults | `deposit`, `withdraw`, ERC4626 `deposit`, `withdraw`, `redeem` |
| Staking / rewards | `stake`, `getReward`, `claim` |
| Lending | Aave-style `supply`, `withdraw`, `borrow`, `repay` |

Selector entries include `selector`, `name`, `severity`, `code`, `category`,
and `recommendation`. Add new monitored methods there first, then add matching
localized messages in `src/i18n.js`.

## Unknown Contracts

If the target contract or calldata selector is unknown:

1. Keep the decision conservative.
2. Ask the integrating agent for ABI, verified contract metadata, or protocol adapter output.
3. If signing would move value or grant allowance, prefer `WARN` or `BLOCK`.
4. Never whitelist a contract solely because the user mentioned its name.

## Deployment / Verification

SafeTx is not a contract deployment Skill. It does not compile, deploy, or verify
contracts. If another Skill generates a deployment transaction, run that
transaction through `references/transaction.md` before signing.
