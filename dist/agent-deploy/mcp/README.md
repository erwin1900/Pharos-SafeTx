# MCP Setup

Use `mcp-server.json` as a template for MCP-compatible clients.

Smoke test:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\n' | node src/mcp-server.js
```

The server exposes SafeTx tools and read-only resources for schemas, references, and examples.
