# Pharos SafeTx Claude Skill

Use Pharos SafeTx before any Pharos/EVM transaction signing recommendation.

Workflow:

1. Read the user's natural-language intent.
2. Collect the exact transaction payload: `chainId`, `from`, `to`, `value`, `calldata`.
3. Call the MCP tool `pharos_safetx_analyze_transaction`.
4. Explain `ALLOW`, `WARN`, or `BLOCK` with findings and safer alternatives.
5. Never request private keys and never sign or broadcast.
