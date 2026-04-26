import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlexClient, PlexError } from "../client.js";
import type { PlexMediaContainer, PlexLibrarySection, PlexMovie, PlexGenre } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof PlexError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerLibraryTools(server: McpServer, client: PlexClient) {
  server.tool(
    "list_libraries",
    "List all Plex library sections (movies, shows, music, etc.)",
    {},
    async () => {
      try {
        const data = await client.get<PlexMediaContainer<PlexLibrarySection>>("/library/sections");
        return toolResult(data.MediaContainer.Directory ?? []);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_movies",
    "List all movies in a Plex library section",
    {
      section_id: z.string().optional().describe("The library section numeric key (from list_libraries). Omit to auto-select the first movie library."),
      start: z.number().optional().describe("Offset for pagination (default: 0)"),
      count: z.number().optional().describe("Number of items to return (default: 50)"),
      sort: z.string().optional().describe("Sort field, e.g. 'titleSort', 'addedAt:desc', 'rating:desc'"),
    },
    async ({ section_id, start, count, sort }) => {
      try {
        const resolvedId = await client.resolveSectionId(section_id, "movie");
        const params: Record<string, string | number | boolean | undefined> = {
          "X-Plex-Container-Start": start,
          "X-Plex-Container-Size": count ?? 50,
          sort,
        };
        const data = await client.get<PlexMediaContainer<PlexMovie>>(
          `/library/sections/${resolvedId}/all`,
          params
        );
        return toolResult(data.MediaContainer);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "search_movies",
    "Search for movies in the Plex library by title",
    {
      query: z.string().describe("Search query string"),
      section_id: z.string().optional().describe("Limit search to a specific library section key"),
    },
    async ({ query, section_id }) => {
      try {
        // type=1 means movies in Plex search
        const params: Record<string, string | number | boolean | undefined> = {
          query,
          type: 1,
          ...(section_id ? { sectionId: section_id } : {}),
        };
        const data = await client.get<PlexMediaContainer<PlexMovie>>("/search", params);
        return toolResult(data.MediaContainer.Metadata ?? []);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_recently_added",
    "Get recently added movies in a Plex library section",
    {
      section_id: z.string().optional().describe("The library section numeric key (from list_libraries). Omit to auto-select the first movie library."),
      count: z.number().optional().describe("Number of items to return (default: 20)"),
    },
    async ({ section_id, count }) => {
      try {
        const resolvedId = await client.resolveSectionId(section_id, "movie");
        const params: Record<string, string | number | boolean | undefined> = {
          "X-Plex-Container-Size": count ?? 20,
        };
        const data = await client.get<PlexMediaContainer<PlexMovie>>(
          `/library/sections/${resolvedId}/recentlyAdded`,
          params
        );
        return toolResult(data.MediaContainer.Metadata ?? []);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_on_deck",
    "Get in-progress / on-deck items across all libraries",
    {
      count: z.number().optional().describe("Number of items to return (default: 20)"),
    },
    async ({ count }) => {
      try {
        const params: Record<string, string | number | boolean | undefined> = {
          "X-Plex-Container-Size": count ?? 20,
        };
        const data = await client.get<PlexMediaContainer<PlexMovie>>("/library/onDeck", params);
        return toolResult(data.MediaContainer.Metadata ?? []);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_genres",
    "List available genres in a Plex library section. Use the numeric key from list_libraries as section_id, or omit to use the first movie library automatically.",
    {
      section_id: z.string().optional().describe("The library section numeric key (from list_libraries). Omit to auto-select the first movie library."),
    },
    async ({ section_id }) => {
      try {
        const resolvedId = await client.resolveSectionId(section_id, "movie");
        const data = await client.get<PlexMediaContainer<PlexGenre>>(
          `/library/sections/${resolvedId}/genre`
        );
        return toolResult(data.MediaContainer.Directory ?? []);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
