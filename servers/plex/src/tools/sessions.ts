import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlexClient, PlexError } from "../client.js";
import type { PlexMediaContainer, PlexSession, PlexHistoryItem } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof PlexError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerSessionTools(server: McpServer, client: PlexClient) {
  server.tool(
    "list_sessions",
    "List all currently active Plex playback sessions",
    {},
    async () => {
      try {
        const data = await client.get<PlexMediaContainer<PlexSession>>("/status/sessions");
        return toolResult(data.MediaContainer.Metadata ?? []);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "stop_session",
    "Stop / terminate an active Plex playback session",
    {
      session_id: z.string().describe("The session ID (from list_sessions → Session.id)"),
      reason: z.string().optional().describe("Optional reason shown to the user"),
    },
    async ({ session_id, reason }) => {
      try {
        await client.delete(`/status/sessions/${session_id}`, reason ? { reason } : {});
        return toolResult({ success: true, session_id });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_watch_history",
    "Retrieve Plex playback history",
    {
      account_id: z.number().optional().describe("Filter by Plex account ID"),
      start: z.number().optional().describe("Pagination offset (default: 0)"),
      count: z.number().optional().describe("Number of items to return (default: 50)"),
      sort: z.string().optional().describe("Sort field, e.g. 'viewedAt:desc'"),
    },
    async ({ account_id, start, count, sort }) => {
      try {
        const params: Record<string, string | number | boolean | undefined> = {
          "X-Plex-Container-Start": start ?? 0,
          "X-Plex-Container-Size": count ?? 50,
          sort,
          accountID: account_id,
        };
        const data = await client.get<PlexMediaContainer<PlexHistoryItem>>(
          "/status/sessions/history/all",
          params
        );
        return toolResult(data.MediaContainer);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
