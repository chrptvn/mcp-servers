# @chrptvn/mcp-server-gogcli

MCP server for [gogcli](https://github.com/steipete/gogcli) — wraps the `gog` CLI to expose Gmail, Calendar, and Drive as MCP tools.

## Prerequisites

Install `gogcli` and authenticate at least one Google account:

```bash
# macOS
brew install gogcli

# Auth
gog auth credentials ~/Downloads/client_secret_....json
gog auth add you@gmail.com
```

## Configuration

| Environment variable | Required | Description |
|----------------------|----------|-------------|
| `GOG_ACCOUNT`        | Yes      | Google account email (e.g. `you@gmail.com`) |
| `GOG_BINARY`         | No       | Path to the `gog` binary (defaults to `gog`) |

## Tools

### Gmail
- **`gmail_search`** — Search messages/threads by query string
- **`gmail_get_message`** — Get a specific message by ID
- **`gmail_send`** — Send an email

### Calendar
- **`calendar_list_events`** — List upcoming calendar events
- **`calendar_create_event`** — Create a new calendar event

### Drive
- **`drive_list`** — List or search files in Google Drive
- **`drive_download`** — Download file content by file ID

## Usage with MCP client

```json
{
  "mcpServers": {
    "gogcli": {
      "command": "npx",
      "args": ["-y", "@chrptvn/mcp-server-gogcli"],
      "env": {
        "GOG_ACCOUNT": "you@gmail.com"
      }
    }
  }
}
```
