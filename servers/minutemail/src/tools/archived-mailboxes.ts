import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MinuteMailClient, MinuteMailError } from "../client.js";
import type { ArchivedMailbox } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof MinuteMailError
      ? `[${err.statusCode}] ${err.code}: ${err.message}`
      : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerArchivedMailboxTools(server: McpServer, client: MinuteMailClient) {
  server.tool(
    "list_archived_mailboxes",
    "List all archived mailboxes",
    {},
    async () => {
      try {
        const archived = await client.get<ArchivedMailbox[]>("/archived-mailboxes");
        return toolResult(archived);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_archived_mailbox",
    "Get details of a specific archived mailbox",
    {
      id: z.string().describe("The archived mailbox ID"),
    },
    async ({ id }) => {
      try {
        const archived = await client.get<ArchivedMailbox>(`/archived-mailboxes/${id}`);
        return toolResult(archived);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "reactivate_archived_mailbox",
    "Reactivate an archived mailbox, creating a new empty mailbox at the same address",
    {
      id: z.string().describe("The archived mailbox ID to reactivate"),
    },
    async ({ id }) => {
      try {
        const mailbox = await client.post(`/archived-mailboxes/${id}/reactivate`);
        return toolResult(mailbox);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "delete_archived_mailbox",
    "Permanently delete a single archived mailbox",
    {
      id: z.string().describe("The archived mailbox ID to delete"),
    },
    async ({ id }) => {
      try {
        await client.delete(`/archived-mailboxes/${id}`);
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "bulk_delete_archived_mailboxes",
    "Permanently delete multiple archived mailboxes atomically",
    {
      ids: z.array(z.string()).describe("Array of archived mailbox IDs to delete"),
    },
    async ({ ids }) => {
      try {
        await client.delete("/archived-mailboxes", { ids });
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
