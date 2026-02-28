# MinuteMail MCP Server

An MCP (Model Context Protocol) server for [MinuteMail](https://minutemail.co) — a temporary/disposable email platform for developers. Programmatically create ephemeral inboxes, read incoming emails, and manage attachments via 18 tools covering the full MinuteMail REST API.

## Prerequisites

- **Node.js** v18 or higher
- A **MinuteMail API key** — sign up at [minutemail.co](https://minutemail.co) and create a key from your dashboard. Keys are prefixed `mmak_`.

## Setup

### 1. Build

```bash
npm install
npm run build
```

### 2. Configure your MCP client

The API key is passed as an environment variable by your MCP client — no separate setup step required. Pick your client below:

#### GitHub Copilot CLI

Edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "minutemail": {
      "type": "local",
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/minutemail/dist/index.js"],
      "env": {
        "MINUTEMAIL_API_KEY": "mmak_your_key_here"
      },
      "tools": ["*"]
    }
  }
}
```

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "minutemail": {
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/minutemail/dist/index.js"],
      "env": {
        "MINUTEMAIL_API_KEY": "mmak_your_key_here"
      }
    }
  }
}
```

#### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "minutemail": {
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/minutemail/dist/index.js"],
      "env": {
        "MINUTEMAIL_API_KEY": "mmak_your_key_here"
      }
    }
  }
}
```

#### VS Code

Edit `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "minutemail": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/minutemail/dist/index.js"],
      "env": {
        "MINUTEMAIL_API_KEY": "mmak_your_key_here"
      }
    }
  }
}
```

## Available Tools (18)

### Mailboxes

#### `create_mailbox`
Create a new temporary mailbox.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | No | Email domain to use (e.g. `minutemail.cc`) |
| `expiresIn` | number | No | TTL in minutes, 1–60 (default: 30) |
| `recoverable` | boolean | No | If `true`, address is archived after expiry for later reuse |
| `tag` | string | No | Optional label for the mailbox |

<details>
<summary>Example response</summary>

```json
{
  "id": "be172e5d-bf8d-442e-a2f2-84d022bb29a5",
  "alias": "ihxyoqimnyla",
  "domain": "minutemail.cc",
  "address": "ihxyoqimnyla@minutemail.cc",
  "recoverable": false,
  "tag": null,
  "owner": "2e8399c0-8791-4143-b7c7-58515441330b",
  "messageCount": 0,
  "expiresAt": "2024-01-01T00:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```
</details>

---

#### `list_mailboxes`
List all active mailboxes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | No | Filter by email address |

---

#### `get_mailbox`
Get details of a specific mailbox.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mailboxId` | string | Yes | The mailbox ID |

---

#### `delete_mailbox`
Delete a single mailbox immediately.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mailboxId` | string | Yes | The mailbox ID to delete |

---

#### `bulk_delete_mailboxes`
Delete multiple mailboxes in a single atomic operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string[] | Yes | Array of mailbox IDs to delete |

---

### Archived Mailboxes

Archived mailboxes reserve an email address for reuse without retaining messages.

#### `list_archived_mailboxes`
List all archived mailboxes. No parameters.

---

#### `get_archived_mailbox`
Get details of a specific archived mailbox.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The archived mailbox ID |

---

#### `reactivate_archived_mailbox`
Reactivate an archived mailbox, creating a new empty mailbox at the same address.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The archived mailbox ID to reactivate |

---

#### `delete_archived_mailbox`
Permanently delete a single archived mailbox.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The archived mailbox ID to delete |

---

#### `bulk_delete_archived_mailboxes`
Permanently delete multiple archived mailboxes atomically.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string[] | Yes | Array of archived mailbox IDs to delete |

---

### Messages

#### `list_messages`
List all emails in a mailbox.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mailboxId` | string | Yes | The mailbox ID |

---

#### `get_message`
Get a specific email, including HTML and plain-text body.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mailboxId` | string | Yes | The mailbox ID |
| `mailId` | string | Yes | The message ID |

<details>
<summary>Example response</summary>

```json
{
  "id": "c3d4e5f6-...",
  "mailboxId": "be172e5d-...",
  "from": "sender@example.com",
  "to": "ihxyoqimnyla@minutemail.cc",
  "subject": "Welcome!",
  "bodyText": "Hello, world!",
  "bodyHtml": "<p>Hello, world!</p>",
  "receivedAt": "2024-01-01T00:05:00Z"
}
```
</details>

---

#### `delete_message`
Delete a single email.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mailboxId` | string | Yes | The mailbox ID |
| `mailId` | string | Yes | The message ID to delete |

---

#### `bulk_delete_messages`
Delete multiple emails from a mailbox atomically.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mailboxId` | string | Yes | The mailbox ID |
| `ids` | string[] | Yes | Array of message IDs to delete |

---

### Attachments

#### `list_attachments`
List all attachments in a specific email.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mailboxId` | string | Yes | The mailbox ID |
| `mailId` | string | Yes | The message ID |

---

#### `get_attachment`
Download a specific attachment. File content is returned as a Base64-encoded `data` field.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mailboxId` | string | Yes | The mailbox ID |
| `mailId` | string | Yes | The message ID |
| `attachmentId` | string | Yes | The attachment ID |

---

#### `delete_attachment`
Delete a single attachment.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mailboxId` | string | Yes | The mailbox ID |
| `mailId` | string | Yes | The message ID |
| `attachmentId` | string | Yes | The attachment ID to delete |

---

#### `bulk_delete_attachments`
Delete multiple attachments atomically.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mailboxId` | string | Yes | The mailbox ID |
| `mailId` | string | Yes | The message ID |
| `ids` | string[] | Yes | Array of attachment IDs to delete |

---

## Error Handling

When an API call fails, the tool returns `isError: true` with a message in the format:

```
[<status_code>] <error_code>: <message>
```

| Status | Code | Meaning |
|--------|------|---------|
| 400 | `bad_request` | Malformed request or missing required fields |
| 401 | `unauthorized` | Invalid or missing API key |
| 403 | `forbidden` | No access, or domain not allowed for your account |
| 404 | `not_found` | Resource does not exist |
| 429 | `rate_limit_exceeded` | Per-minute request limit hit |
| 429 | `quota_exceeded` | Daily quota exhausted |
| 500 | `internal_error` | MinuteMail server-side error |

## Rate Limits

| Plan | Requests/min | Calls/day | Active Mailboxes | Price |
|------|-------------|-----------|-----------------|-------|
| Free | 60 | 100 | 3 | $0 |
| Hobbyist | 120 | 1,000 | 10 | $5/mo |
| Pro | 600 | 10,000 | 50 | $15/mo |
| Team | 1,200 | 50,000 | 200 | $49/mo |

Daily quota resets at 00:00 UTC. See [MinuteMail docs](https://docs.minutemail.co) for full details.


## Setup

### 1. Get an API key

Sign up at [minutemail.co](https://minutemail.co) and create an API key from your dashboard. Keys are prefixed `mmak_`.

### 2. Build

```bash
npm install
npm run build
```

### 3. Configure your MCP client

The API key is passed as an environment variable by your MCP client — no separate setup step required. Pick your client below:

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "minutemail": {
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/minutemail/dist/index.js"],
      "env": {
        "MINUTEMAIL_API_KEY": "mmak_your_key_here"
      }
    }
  }
}
```

#### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "minutemail": {
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/minutemail/dist/index.js"],
      "env": {
        "MINUTEMAIL_API_KEY": "mmak_your_key_here"
      }
    }
  }
}
```

#### VS Code

Edit `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "minutemail": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/minutemail/dist/index.js"],
      "env": {
        "MINUTEMAIL_API_KEY": "mmak_your_key_here"
      }
    }
  }
}
```

## Available Tools (18)

### Mailboxes
| Tool | Description |
|------|-------------|
| `create_mailbox` | Create a new temporary mailbox (TTL 1–60 min) |
| `list_mailboxes` | List all active mailboxes (optional `address` filter) |
| `get_mailbox` | Get details of a specific mailbox |
| `delete_mailbox` | Delete a single mailbox |
| `bulk_delete_mailboxes` | Delete multiple mailboxes atomically |

### Archived Mailboxes
| Tool | Description |
|------|-------------|
| `list_archived_mailboxes` | List all archived mailboxes |
| `get_archived_mailbox` | Get details of a specific archived mailbox |
| `reactivate_archived_mailbox` | Reactivate an archived mailbox at the same address |
| `delete_archived_mailbox` | Permanently delete a single archived mailbox |
| `bulk_delete_archived_mailboxes` | Permanently delete multiple archived mailboxes atomically |

### Messages
| Tool | Description |
|------|-------------|
| `list_messages` | List all emails in a mailbox |
| `get_message` | Get a specific email (includes HTML/text body) |
| `delete_message` | Delete a single email |
| `bulk_delete_messages` | Delete multiple emails atomically |

### Attachments
| Tool | Description |
|------|-------------|
| `list_attachments` | List all attachments in an email |
| `get_attachment` | Download an attachment (content as Base64) |
| `delete_attachment` | Delete a single attachment |
| `bulk_delete_attachments` | Delete multiple attachments atomically |

## Rate Limits

MinuteMail enforces per-plan rate limits. Every API response includes an `X-RateLimit-Remaining` header. See the [MinuteMail docs](https://docs.minutemail.co) for plan details.
