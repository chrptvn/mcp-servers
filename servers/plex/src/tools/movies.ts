import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlexClient, PlexError } from "../client.js";
import type { PlexMediaContainer, PlexMovie } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof PlexError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerMovieTools(server: McpServer, client: PlexClient) {
  server.tool(
    "get_movie",
    "Get full metadata for a specific movie by its rating key",
    {
      rating_key: z.string().describe("The movie's rating key (from list_movies or search_movies)"),
    },
    async ({ rating_key }) => {
      try {
        const data = await client.get<PlexMediaContainer<PlexMovie>>(
          `/library/metadata/${rating_key}`
        );
        const movie = data.MediaContainer.Metadata?.[0];
        return toolResult(movie);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_similar_movies",
    "Get movies related to / similar to a specific movie",
    {
      rating_key: z.string().describe("The movie's rating key"),
      count: z.number().optional().describe("Number of results to return (default: 10)"),
    },
    async ({ rating_key, count }) => {
      try {
        const params: Record<string, string | number | boolean | undefined> = {
          "X-Plex-Container-Size": count ?? 10,
        };
        const data = await client.get<PlexMediaContainer<PlexMovie>>(
          `/library/metadata/${rating_key}/similar`,
          params
        );
        return toolResult(data.MediaContainer.Metadata ?? []);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
