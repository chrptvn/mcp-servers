import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DevToClient, DevToError } from "../client.js";
import type { User } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof DevToError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerUserTools(server: McpServer, client: DevToClient) {
  server.tool(
    "get_current_user",
    "Get the authenticated user's profile (requires authentication)",
    {},
    async () => {
      try {
        const user = await client.get<User>("/users/me", true);
        return toolResult(user);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_user",
    "Get a user's profile by ID (requires authentication)",
    {
      id: z.union([z.number(), z.string()]).describe("The user ID or username"),
    },
    async ({ id }) => {
      try {
        const user = await client.get<User>(`/users/${id}`, true);
        return toolResult(user);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "unpublish_user",
    "Unpublish all of a user's articles and comments (requires admin/mod privileges)",
    {
      id: z.number().describe("The user ID to unpublish"),
    },
    async ({ id }) => {
      try {
        await client.put(`/users/${id}/unpublish`);
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "suspend_user",
    "Suspend a user, preventing new posts (requires admin/mod privileges)",
    {
      id: z.number().describe("The user ID to suspend"),
    },
    async ({ id }) => {
      try {
        await client.put(`/users/${id}/suspend`);
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "invite_user",
    "Invite a new user to the platform (requires super_admin privileges)",
    {
      email: z.string().email().describe("Email address of the user to invite"),
      name: z.string().describe("Full name of the user to invite"),
    },
    async ({ email, name }) => {
      try {
        const result = await client.post("/admin/users", { email, name });
        return toolResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
