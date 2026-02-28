import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DevToClient, DevToError } from "../client.js";
import type { Organization, Article, User } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof DevToError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export function registerOrganizationTools(server: McpServer, client: DevToClient) {
  server.tool(
    "get_organization",
    "Get an organization's profile by username",
    {
      username: z.string().describe("The organization's username"),
    },
    async ({ username }) => {
      try {
        const org = await client.get<Organization>(`/organizations/${username}`);
        return toolResult(org);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_organization_users",
    "List members of an organization",
    {
      username: z.string().describe("The organization's username"),
      page: z.number().optional().describe("Page number"),
      per_page: z.number().optional().describe("Items per page"),
    },
    async ({ username, ...params }) => {
      try {
        const users = await client.get<User[]>(`/organizations/${username}/users${buildQuery(params)}`);
        return toolResult(users);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_organization_articles",
    "List articles published by an organization",
    {
      username: z.string().describe("The organization's username"),
      page: z.number().optional().describe("Page number"),
      per_page: z.number().optional().describe("Items per page"),
    },
    async ({ username, ...params }) => {
      try {
        const articles = await client.get<Article[]>(`/organizations/${username}/articles${buildQuery(params)}`);
        return toolResult(articles);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
