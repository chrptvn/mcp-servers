import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlexClient, PlexError } from "../client.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof PlexError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerWatchlistTools(server: McpServer, client: PlexClient) {
  server.tool(
    "mark_as_watched",
    "Mark a movie as watched / scrobble it",
    {
      rating_key: z.string().describe("The movie's rating key (from list_movies or search_movies)"),
    },
    async ({ rating_key }) => {
      try {
        await client.get("/:/scrobble", {
          key: rating_key,
          identifier: "com.plexapp.plugins.library",
        });
        return toolResult({ success: true, rating_key });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "mark_as_unwatched",
    "Mark a movie as unwatched / unscrobble it",
    {
      rating_key: z.string().describe("The movie's rating key (from list_movies or search_movies)"),
    },
    async ({ rating_key }) => {
      try {
        await client.get("/:/unscrobble", {
          key: rating_key,
          identifier: "com.plexapp.plugins.library",
        });
        return toolResult({ success: true, rating_key });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
