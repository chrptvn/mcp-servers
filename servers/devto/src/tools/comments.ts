import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DevToClient, DevToError } from "../client.js";
import type { Comment } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof DevToError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerCommentTools(server: McpServer, client: DevToClient) {
  server.tool(
    "list_comments",
    "List comments for an article or podcast episode",
    {
      a_id: z.number().optional().describe("Article ID to fetch comments for"),
      p_id: z.number().optional().describe("Podcast episode ID to fetch comments for"),
    },
    async ({ a_id, p_id }) => {
      try {
        const params = new URLSearchParams();
        if (a_id !== undefined) params.set("a_id", String(a_id));
        if (p_id !== undefined) params.set("p_id", String(p_id));
        const query = params.toString() ? `?${params.toString()}` : "";
        const comments = await client.get<Comment[]>(`/comments${query}`);
        return toolResult(comments);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_comment",
    "Get a single comment and all its descendants",
    {
      id: z.string().describe("The comment ID code"),
    },
    async ({ id }) => {
      try {
        const comment = await client.get<Comment>(`/comments/${id}`);
        return toolResult(comment);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
