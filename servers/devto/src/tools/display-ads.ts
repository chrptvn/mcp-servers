import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DevToClient, DevToError } from "../client.js";
import type { DisplayAd } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof DevToError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerDisplayAdTools(server: McpServer, client: DevToClient) {
  server.tool(
    "list_display_ads",
    "List all display ads (requires admin privileges)",
    {},
    async () => {
      try {
        const ads = await client.get<DisplayAd[]>("/display_ads", true);
        return toolResult(ads);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_display_ad",
    "Get a specific display ad by ID (requires admin privileges)",
    {
      id: z.number().describe("The display ad ID"),
    },
    async ({ id }) => {
      try {
        const ad = await client.get<DisplayAd>(`/display_ads/${id}`, true);
        return toolResult(ad);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "create_display_ad",
    "Create a new display ad (requires admin privileges)",
    {
      name: z.string().describe("Ad name (internal reference)"),
      body_markdown: z.string().describe("Ad body in Markdown"),
      placement_area: z.string().describe("Where the ad is displayed"),
      approved: z.boolean().optional().describe("Whether the ad is approved"),
      published: z.boolean().optional().describe("Whether the ad is live"),
      tag_list: z.string().optional().describe("Comma-separated tag list to target"),
      type_of: z
        .enum(["in_house", "community", "external"])
        .optional()
        .describe("Ad type"),
    },
    async (body) => {
      try {
        const ad = await client.post<DisplayAd>("/display_ads", body);
        return toolResult(ad);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "update_display_ad",
    "Update an existing display ad (requires admin privileges)",
    {
      id: z.number().describe("The display ad ID to update"),
      name: z.string().optional().describe("New name"),
      body_markdown: z.string().optional().describe("New body in Markdown"),
      placement_area: z.string().optional().describe("New placement area"),
      approved: z.boolean().optional().describe("Approval status"),
      published: z.boolean().optional().describe("Published status"),
      tag_list: z.string().optional().describe("New tag list"),
      type_of: z
        .enum(["in_house", "community", "external"])
        .optional()
        .describe("Ad type"),
    },
    async ({ id, ...body }) => {
      try {
        const ad = await client.put<DisplayAd>(`/display_ads/${id}`, body);
        return toolResult(ad);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "unpublish_display_ad",
    "Unpublish a display ad (requires admin privileges)",
    {
      id: z.number().describe("The display ad ID to unpublish"),
    },
    async ({ id }) => {
      try {
        await client.put(`/display_ads/${id}/unpublish`);
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
