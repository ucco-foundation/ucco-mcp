# ucco-mcp

UCCO Foundation MCP Server — [mcp.ucco.foundation](https://mcp.ucco.foundation)

A [Model Context Protocol](https://modelcontextprotocol.io/) server that makes the UCCO Foundation queryable by any AI system. Connect Claude, ChatGPT, Copilot, Gemini, or any MCP-compatible client to get live, structured, authoritative data about the UCCO standard.

## Connect

**Claude Desktop** — add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "ucco-foundation": {
      "url": "https://mcp.ucco.foundation/mcp"
    }
  }
}
```

**Claude Code:**
```bash
claude mcp add ucco-foundation https://mcp.ucco.foundation/mcp
```

## Available Tools

| Tool | Description |
|------|-------------|
| `get_standard_info` | Current UCCO standard version, status, and submission targets |
| `get_foundation_info` | Foundation overview — name, jurisdiction, leadership, contacts |
| `get_pioneer_stats` | Aggregate Pioneer Programme statistics |
| `verify_pioneer_key` | Verify a pioneer key prefix is valid |
| `get_fact_sheet` | Structured foundation facts for press/research |
| `get_protocol_stack` | Where UCCO sits in the identity/credential/capability stack |
| `get_board_members` | Public board composition (public fields only) |
| `get_specification_outline` | High-level spec section structure |

## What This Does NOT Expose

- No internal ops data
- No financial data
- No private board member details
- No pioneer key hashes or secrets
- No full specification text (available at [ucco-standard](https://github.com/ucco-foundation/ucco-standard))
- No infrastructure details

All data is public. No API key required.

## Infrastructure

- **Worker:** `ucco-mcp` (Cloudflare Workers)
- **Transport:** Streamable HTTP, JSON-RPC 2.0
- **Protocol:** MCP `2025-03-26`
- **Data:** Static foundation data + D1 queries for live pioneer/board data
- **Cache:** 5-minute TTL on all responses

## Deploy

```bash
npx wrangler deploy
```

## License

W3C Software and Document License
