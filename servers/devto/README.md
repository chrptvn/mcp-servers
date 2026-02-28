# dev.to MCP Server

An MCP (Model Context Protocol) server for [dev.to](https://dev.to) — the developer blogging and community platform powered by [Forem](https://forem.com). Covers the full Forem REST API with 40 tools for articles, comments, users, organizations, tags, reactions, and more.

## Prerequisites

- **Node.js** v18 or higher
- A **dev.to API key** — go to [dev.to/settings/extensions](https://dev.to/settings/extensions), scroll to "DEV API Keys", and generate a key.

> **Note:** Many tools are public and work without an API key. An API key is only required for authenticated endpoints (creating/updating content, accessing your profile, reactions, etc.).

## Setup

### 1. Build

```bash
npm install
npm run build
```

### 2. Configure your MCP client

Set `DEVTO_API_KEY` as an environment variable. Pick your client below:

#### GitHub Copilot CLI

Edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "devto": {
      "type": "local",
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/devto/dist/index.js"],
      "env": {
        "DEVTO_API_KEY": "your_api_key_here"
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
    "devto": {
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/devto/dist/index.js"],
      "env": {
        "DEVTO_API_KEY": "your_api_key_here"
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
    "devto": {
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/devto/dist/index.js"],
      "env": {
        "DEVTO_API_KEY": "your_api_key_here"
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
    "devto": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/devto/dist/index.js"],
      "env": {
        "DEVTO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Available Tools (40)

Legend: 🌐 Public (no API key needed) · 🔐 Auth required · 🛡️ Admin/mod only

---

### Articles (12)

#### `list_articles` 🌐
List articles with optional filters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `per_page` | number | No | Items per page (default: 30, max: 1000) |
| `tag` | string | No | Filter by single tag slug |
| `tags` | string | No | Comma-separated tags to include |
| `tags_exclude` | string | No | Comma-separated tags to exclude |
| `username` | string | No | Filter by author username |
| `state` | `fresh` \| `rising` \| `all` | No | Filter by article state |
| `top` | number | No | Top articles from the last N days |
| `collection_id` | number | No | Filter by collection ID |

#### `list_latest_articles` 🌐
List the latest articles ordered by publish date.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number |
| `per_page` | number | No | Items per page |

#### `get_article_by_id` 🌐
Get a specific article by its numeric ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The article ID |

#### `get_article_by_path` 🌐
Get a specific article by author username and slug.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | The author's username |
| `slug` | string | Yes | The article slug |

#### `list_videos` 🌐
List articles with video content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number |
| `per_page` | number | No | Items per page (default: 24) |

#### `create_article` 🔐
Create a new article. New articles are drafts by default.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Article title |
| `body_markdown` | string | No | Article body in Markdown |
| `published` | boolean | No | Publish immediately (default: false = draft) |
| `tags` | string[] | No | Array of tag strings |
| `series` | string | No | Series name to add this article to |
| `canonical_url` | string | No | Canonical URL if cross-posting |
| `description` | string | No | Article description/summary |
| `main_image` | string | No | Cover image URL |
| `organization_id` | number | No | Publish under an organization |

#### `update_article` 🔐
Update an existing article you own.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The article ID to update |
| `title` | string | No | New title |
| `body_markdown` | string | No | New body in Markdown |
| `published` | boolean | No | Publish or unpublish |
| `tags` | string[] | No | New tag list |
| `series` | string | No | Series name |
| `canonical_url` | string | No | Canonical URL |
| `description` | string | No | Description |
| `main_image` | string | No | Cover image URL |
| `organization_id` | number | No | Organization ID |

#### `list_my_articles` 🔐
List the authenticated user's articles (most recent first).

#### `list_my_published_articles` 🔐
List only the authenticated user's published articles.

#### `list_my_unpublished_articles` 🔐
List only the authenticated user's unpublished (draft) articles.

#### `list_all_my_articles` 🔐
List all of the authenticated user's articles (published and drafts).

> The above four listing tools accept optional `page` and `per_page` parameters.

#### `unpublish_article` 🛡️
Unpublish an article (admin/moderator only).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The article ID |
| `note` | string | No | Reason for unpublishing |

---

### Comments (2)

#### `list_comments` 🌐
List comments for an article or podcast episode.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `a_id` | number | No | Article ID |
| `p_id` | number | No | Podcast episode ID |

#### `get_comment` 🌐
Get a single comment and all its descendants (full thread).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The comment ID code |

---

### Users (5)

#### `get_current_user` 🔐
Get the authenticated user's profile. No parameters.

#### `get_user` 🔐
Get any user's profile by ID or username.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number \| string | Yes | User ID or username |

#### `unpublish_user` 🛡️
Unpublish all of a user's articles and comments.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The user ID |

#### `suspend_user` 🛡️
Suspend a user, preventing them from posting.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The user ID |

#### `invite_user` 🛡️
Invite a new user to the platform (super_admin only).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Email address |
| `name` | string | Yes | Full name |

---

### Organizations (3)

#### `get_organization` 🌐
Get an organization's profile.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Organization username |

#### `list_organization_users` 🌐
List members of an organization.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Organization username |
| `page` | number | No | Page number |
| `per_page` | number | No | Items per page |

#### `list_organization_articles` 🌐
List articles published by an organization.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Organization username |
| `page` | number | No | Page number |
| `per_page` | number | No | Items per page |

---

### Tags (2)

#### `list_tags` 🌐
List popular tags ordered by usage.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number |
| `per_page` | number | No | Items per page (default: 10) |

#### `list_followed_tags` 🔐
List tags the authenticated user follows. No parameters.

---

### Followers (1)

#### `list_followers` 🔐
List users who follow the authenticated user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number |
| `per_page` | number | No | Items per page (default: 80) |
| `sort` | string | No | Sort field (default: `created_at`) |

---

### Podcast Episodes (1)

#### `list_podcast_episodes` 🌐
List podcast episodes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number |
| `per_page` | number | No | Items per page |
| `username` | string | No | Filter by podcast username |

---

### Profile Images (1)

#### `get_profile_image` 🔐
Get a user's or organization's profile image URLs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Username to fetch the image for |

---

### Reactions (2)

#### `create_reaction` 🔐
Add a reaction to an article, comment, or user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | `like` \| `unicorn` \| `exploding_head` \| `raised_hands` \| `fire` | Yes | Reaction type |
| `reactable_id` | number | Yes | ID of the item |
| `reactable_type` | `Article` \| `Comment` \| `User` | Yes | Type of item |

#### `toggle_reaction` 🔐
Toggle a reaction — creates it if absent, removes it if already present. Same parameters as `create_reaction`.

---

### Reading List (1)

#### `list_reading_list` 🔐
List the authenticated user's reading list.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number |
| `per_page` | number | No | Items per page (default: 30) |

---

### Pages (5)

#### `list_pages` 🌐
List all custom pages. No parameters.

#### `get_page` 🌐
Get a specific custom page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The page ID |

#### `create_page` 🔐
Create a new custom page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Page title |
| `slug` | string | Yes | URL slug |
| `description` | string | Yes | Page description |
| `template` | `contained` \| `full_within_layout` \| `nav_bar_included` \| `json` | Yes | Layout template |
| `body_markdown` | string | No | Body in Markdown |
| `body_json` | string | No | Body as JSON (for `json` template) |
| `is_top_level_path` | boolean | No | Use top-level URL path |

#### `update_page` 🔐
Update an existing custom page. Accepts the same fields as `create_page` (all optional) plus `id`.

#### `delete_page` 🔐
Delete a custom page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The page ID |

---

### Display Ads (5) 🛡️

> All display ad tools require admin privileges.

#### `list_display_ads`
List all display ads. No parameters.

#### `get_display_ad`
Get a specific display ad by ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The ad ID |

#### `create_display_ad`
Create a new display ad.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Internal name |
| `body_markdown` | string | Yes | Ad body in Markdown |
| `placement_area` | string | Yes | Where the ad is displayed |
| `approved` | boolean | No | Approval status |
| `published` | boolean | No | Whether the ad is live |
| `tag_list` | string | No | Comma-separated tag targeting |
| `type_of` | `in_house` \| `community` \| `external` | No | Ad type |

#### `update_display_ad`
Update an existing display ad. Same fields as `create_display_ad` (all optional) plus `id`.

#### `unpublish_display_ad`
Unpublish a display ad.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The ad ID |

---

## Error Handling

When an API call fails, the tool returns `isError: true` with a message in the format:

```
[<status_code>] <error_message>
```

| Status | Meaning |
|--------|---------|
| 401 | Missing or invalid API key |
| 403 | Insufficient privileges (admin/mod required) |
| 404 | Resource does not exist |
| 422 | Validation error (invalid parameters) |
| 429 | Rate limit exceeded |
| 500 | dev.to server error |

## Rate Limits

dev.to does not publish hard rate limit numbers. Handle `429 Too Many Requests` responses gracefully with backoff. For best results, avoid making large numbers of requests in rapid succession.
