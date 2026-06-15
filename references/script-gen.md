# Script Generation Reference

Use this reference when an agent needs a small integration script around SafeTx.
Generated scripts should create or load a SafeTx request, call an interface, and
enforce the returned decision. They must not sign or broadcast.

## Templates

Template assets live in:

```text
assets/templates/
```

Available templates:

| Template | Use |
| --- | --- |
| `template_read.js.tpl` | JavaScript read-only request view. |
| `template_write.js.tpl` | JavaScript SafeTx pre-write gate. |
| `template_read.ts.tpl` | TypeScript read-only request view. |
| `template_write.ts.tpl` | TypeScript SafeTx pre-write gate. |
| `template_read.py.tpl` | Python read-only request view. |
| `template_write.py.tpl` | Python SafeTx pre-write gate via CLI. |

## Generation Rules

1. Replace `{{request_path}}` with a local JSON request path.
2. Keep request payloads free of private keys and secrets.
3. For write handoff scripts, abort when `decision` is not `ALLOW`.
4. Add signer code only outside SafeTx and only after user-confirmation policy.

## CLI Script Pattern

```bash
npm run analyze -- examples/warn-infinite-approval.json
```

## HTTP Script Pattern

```bash
curl -s http://127.0.0.1:8787/analyze \
  -H 'content-type: application/json' \
  --data @examples/warn-infinite-approval.json
```

## MCP Script Pattern

Start:

```bash
npm run mcp
```

Call tool:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"pharos_safetx_analyze_transaction","arguments":{}}}
```

Fill `arguments` with the same fields described in `references/transaction.md`.
