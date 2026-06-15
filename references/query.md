# Query Reference

Use this reference for read-only SafeTx inspection tasks: explaining decoded
calldata, checking network metadata, or summarizing a previous SafeTx result.

## Balance / Network Metadata

SafeTx does not perform live RPC balance reads in the core package. Network
metadata lives in:

```text
assets/networks.json
```

Token metadata lives in:

```text
assets/tokens.json
```

If an integrating agent needs live balances or allowances, it should perform
those reads with its own RPC tool and pass the resulting policy context into
SafeTx as `trustedSpenders`, `blockedAddresses`, or `addressBook`.

## Transaction Read Spec

To inspect a prepared transaction payload without wallet handoff:

```bash
npm run analyze -- <request.json>
```

For stdin:

```bash
cat <request.json> | node src/cli.js analyze
```

## Output Parsing

Read these fields first:

| Field | Meaning |
| --- | --- |
| `decision` | `ALLOW`, `WARN`, or `BLOCK`. |
| `risk_score` | 0 to 100 score derived from findings. |
| `transaction.functionName` | Decoded function, when known. |
| `findings[].code` | Machine-readable risk identifier. |
| `reasons[]` | Human-readable explanation. |

## Agent Guidelines

1. Treat query tasks as read-only.
2. Do not infer safety from a known token symbol alone.
3. If a selector is unknown, route to `references/contract.md` before wallet handoff.
4. For final handoff decisions, route to `references/transaction.md`.
