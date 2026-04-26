# @chrptvn/mcp-server-plex

MCP server for [Plex](https://www.plex.tv/) — browse and manage your personal movie library.

## Configuration

Copy `.env.example` to `.env` and fill in the values.

| Environment Variable | Required | Default | Description |
|---|---|---|---|
| `PLEX_TOKEN` | ✅ | — | Your Plex authentication token (`X-Plex-Token`) |
| `PLEX_URL` | ❌ | `http://localhost:32400` | Base URL of your Plex server |
| `PLEX_MEDIA_PATH` | ❌ | — | Host filesystem path to the movies root directory. Required for file management and library sync tools. |
| `PLEX_VIRTUAL_PATH` | ❌ | — | Plex-internal path to the same directory. Set this when Plex runs in a Docker container with a different path than the host. |

To find your Plex token, see the [Plex support article](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/).

### Docker path mapping

When Plex runs in a container, it sees a different path than the host. Set both variables so file operations translate paths automatically:

```
# Host mounts /mnt/data/plex/media as /data inside the Plex container
PLEX_MEDIA_PATH=/mnt/data/plex/media/movies   # host path
PLEX_VIRTUAL_PATH=/data/movies                # Plex-internal path
```

## Tools

### Library — browse

| Tool | Description |
|---|---|
| `list_libraries` | List all Plex library sections |
| `list_movies` | List movies in a library section (paginated) |
| `search_movies` | Search movies by title |
| `get_recently_added` | Recently added movies in a section |
| `get_on_deck` | In-progress / on-deck items |

### Movies — metadata

| Tool | Description |
|---|---|
| `get_movie` | Get full metadata for a movie by rating key |
| `list_genres` | List available genres in a library section |
| `get_similar_movies` | Get related movies |

### Watchlist

| Tool | Description |
|---|---|
| `mark_as_watched` | Mark a movie as watched |
| `mark_as_unwatched` | Mark a movie as unwatched |

### Sessions

| Tool | Description |
|---|---|
| `list_sessions` | List currently active playback sessions |
| `stop_session` | Stop / terminate an active session |
| `get_watch_history` | Retrieve playback history |

### Library — management

> Requires `PLEX_MEDIA_PATH` (and `PLEX_VIRTUAL_PATH` for Docker setups).

| Tool | Description |
|---|---|
| `create_library` | Create a new Plex library section pointing to a directory on disk |
| `delete_library` | Permanently delete a library section (files on disk are untouched) |
| `refresh_library` | Trigger a Plex metadata scan for a section |
| `sync_libraries` | Create one library per subdirectory under the movies root; skips existing ones. Supports `dry_run`. |

### Files — organisation

> Requires `PLEX_MEDIA_PATH`. Accepts both host paths and Plex-internal paths interchangeably.

| Tool | Description |
|---|---|
| `list_directory` | List contents of a directory (defaults to the movies root) |
| `create_directory` | Create a directory and any missing parents |
| `move_file` | Move or rename a file or directory |
| `organize_movies_by_genre` | Move every movie into a `Genre/` subdirectory based on Plex metadata. Supports `dry_run`. |

## Usage with Claude Desktop

```json
{
  "mcpServers": {
    "plex": {
      "command": "npx",
      "args": ["-y", "@chrptvn/mcp-server-plex"],
      "env": {
        "PLEX_TOKEN": "your-plex-token",
        "PLEX_URL": "http://192.168.1.100:32400",
        "PLEX_MEDIA_PATH": "/mnt/data/plex/media/movies",
        "PLEX_VIRTUAL_PATH": "/data/movies"
      }
    }
  }
}
```

## Build

```bash
npm install
npm run build
npm start
```
