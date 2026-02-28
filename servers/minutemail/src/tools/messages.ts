import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MinuteMailClient, MinuteMailError } from "../client.js";
import type { Message } from "../types.js";

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

export function registerMessageTools(server: McpServer, client: MinuteMailClient) {
  server.tool(
    "list_messages",
    "List all emails in a mailbox",
    {
      mailboxId: z.string().describe("The mailbox ID"),
    },
    async ({ mailboxId }) => {
      try {
        const messages = await client.get<Message[]>(`/mailboxes/${mailboxId}/mails`);
        return toolResult(messages);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_message",
    "Get a specific email from a mailbox",
    {
      mailboxId: z.string().describe("The mailbox ID"),
      mailId: z.string().describe("The message ID"),
    },
    async ({ mailboxId, mailId }) => {
      try {
        const message = await client.get<Message>(
          `/mailboxes/${mailboxId}/mails/${mailId}`
        );
        return toolResult(message);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "delete_message",
    "Delete a specific email from a mailbox",
    {
      mailboxId: z.string().describe("The mailbox ID"),
      mailId: z.string().describe("The message ID to delete"),
    },
    async ({ mailboxId, mailId }) => {
      try {
        await client.delete(`/mailboxes/${mailboxId}/mails/${mailId}`);
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "bulk_delete_messages",
    "Delete multiple emails from a mailbox atomically",
    {
      mailboxId: z.string().describe("The mailbox ID"),
      ids: z.array(z.string()).describe("Array of message IDs to delete"),
    },
    async ({ mailboxId, ids }) => {
      try {
        await client.delete(`/mailboxes/${mailboxId}/mails`, { ids });
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
