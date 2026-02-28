import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MinuteMailClient, MinuteMailError } from "../client.js";
import type { Attachment, AttachmentWithData } from "../types.js";

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

export function registerAttachmentTools(server: McpServer, client: MinuteMailClient) {
  server.tool(
    "list_attachments",
    "List all attachments in a specific email",
    {
      mailboxId: z.string().describe("The mailbox ID"),
      mailId: z.string().describe("The message ID"),
    },
    async ({ mailboxId, mailId }) => {
      try {
        const attachments = await client.get<Attachment[]>(
          `/mailboxes/${mailboxId}/mails/${mailId}/attachments`
        );
        return toolResult(attachments);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_attachment",
    "Download a specific attachment (content returned as Base64)",
    {
      mailboxId: z.string().describe("The mailbox ID"),
      mailId: z.string().describe("The message ID"),
      attachmentId: z.string().describe("The attachment ID"),
    },
    async ({ mailboxId, mailId, attachmentId }) => {
      try {
        const attachment = await client.get<AttachmentWithData>(
          `/mailboxes/${mailboxId}/mails/${mailId}/attachments/${attachmentId}`
        );
        return toolResult(attachment);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "delete_attachment",
    "Delete a specific attachment",
    {
      mailboxId: z.string().describe("The mailbox ID"),
      mailId: z.string().describe("The message ID"),
      attachmentId: z.string().describe("The attachment ID to delete"),
    },
    async ({ mailboxId, mailId, attachmentId }) => {
      try {
        await client.delete(
          `/mailboxes/${mailboxId}/mails/${mailId}/attachments/${attachmentId}`
        );
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "bulk_delete_attachments",
    "Delete multiple attachments atomically",
    {
      mailboxId: z.string().describe("The mailbox ID"),
      mailId: z.string().describe("The message ID"),
      ids: z.array(z.string()).describe("Array of attachment IDs to delete"),
    },
    async ({ mailboxId, mailId, ids }) => {
      try {
        await client.delete(`/mailboxes/${mailboxId}/mails/${mailId}/attachments`, {
          ids,
        });
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
