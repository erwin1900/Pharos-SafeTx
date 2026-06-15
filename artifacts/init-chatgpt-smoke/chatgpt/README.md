# ChatGPT Custom GPT Setup

Use `instructions.md` as the GPT instruction text.

Use `actions-openapi.json` as the Action schema after hosting the SafeTx HTTP adapter behind a public HTTPS URL.

Local development command:

```bash
npm run http
```

For production, replace `https://YOUR-SAFETX-HOST.example.com` in the OpenAPI server URL with your deployed HTTPS endpoint.
