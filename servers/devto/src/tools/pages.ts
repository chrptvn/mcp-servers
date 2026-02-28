import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DevToClient, DevToError } from "../client.js";
import type { Page } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof DevToError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerPageTools(server: McpServer, client: DevToClient) {
  server.tool(
    "list_pages",
    "List all custom pages on the platform",
    {},
    async () => {
      try {
        const pages = await client.get<Page[]>("/pages");
        return toolResult(pages);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_page",
    "Get a specific custom page by ID",
    {
      id: z.number().describe("The page ID"),
    },
    async ({ id }) => {
      try {
        const page = await client.get<Page>(`/pages/${id}`);
        return toolResult(page);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "create_page",
    "Create a new custom page (requires authentication)",
    {
      title: z.string().describe("Page title"),
      slug: z.string().describe("URL slug for the page"),
      description: z.string().describe("Page description"),
      template: z
        .enum(["contained", "full_within_layout", "nav_bar_included", "json"])
        .describe("Page layout template"),
      body_markdown: z.string().optional().describe("Page body in Markdown"),
      body_json: z.string().optional().describe("Page body as JSON (for json template)"),
      is_top_level_path: z.boolean().optional().describe("Whether to use a top-level URL path"),
    },
    async (body) => {
      try {
        const page = await client.post<Page>("/pages", body);
        return toolResult(page);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "update_page",
    "Update an existing custom page (requires authentication)",
    {
      id: z.number().describe("The page ID to update"),
      title: z.string().optional().describe("New title"),
      slug: z.string().optional().describe("New URL slug"),
      description: z.string().optional().describe("New description"),
      template: z
        .enum(["contained", "full_within_layout", "nav_bar_included", "json"])
        .optional()
        .describe("New layout template"),
      body_markdown: z.string().optional().describe("New body in Markdown"),
      body_json: z.string().optional().describe("New body as JSON"),
      is_top_level_path: z.boolean().optional().describe("Top-level path setting"),
    },
    async ({ id, ...body }) => {
      try {
        const page = await client.put<Page>(`/pages/${id}`, body);
        return toolResult(page);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "delete_page",
    "Delete a custom page (requires authentication)",
    {
      id: z.number().describe("The page ID to delete"),
    },
    async ({ id }) => {
      try {
        await client.delete(`/pages/${id}`);
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
