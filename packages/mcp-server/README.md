# Browser MCP Server

Standalone MCP server package for the personal browser MCP assistant.

It starts a WebSocket bridge for a browser extension, then exposes MCP tools to
an AI client through stdio by default or SSE when started with `--sse`.

## Commands

From the repository root:

```powershell
npm install
npm run build
npm run mcp
```

From this package directory:

```powershell
npm run build
npm run start
```

## Environment

- `MCP_TOKEN` or `BROWSER_MCP_TOKEN`: shared secret expected by the browser
  extension.
- `SYNC_WS_PORT`: WebSocket bridge port, default `9527`.
- `SYNC_HTTP_PORT`: SSE HTTP port, default `9529`.

## Tools

- `list_platforms`
- `check_auth`
- `sync_article`
- `extract_article`
- `upload_image_file`
