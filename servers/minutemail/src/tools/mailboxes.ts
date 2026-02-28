import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MinuteMailClient, MinuteMailError } from "../client.js";
import type { Mailbox } from "../types.js";

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

export function registerMailboxTools(server: McpServer, client: MinuteMailClient) {
  server.tool(
    "create_mailbox",
    "Create a new temporary mailbox",
    {
      domain: z.string().optional().describe("Email domain to use"),
      expiresIn: z
        .number()
        .min(1)
        .max(60)
        .optional()
        .describe("TTL in minutes (1–60)"),
      recoverable: z
        .boolean()
        .optional()
        .describe("If true, the address is archived after expiry for later reuse"),
      tag: z.string().optional().describe("Optional label for the mailbox"),
    },
    async ({ domain, expiresIn, recoverable, tag }) => {
      try {
        const mailbox = await client.post<Mailbox>("/mailboxes", {
          ...(domain && { domain }),
          ...(expiresIn !== undefined && { expiresIn }),
          ...(recoverable !== undefined && { recoverable }),
          ...(tag && { tag }),
        });
        return toolResult(mailbox);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_mailboxes",
    "List all active mailboxes",
    {
      address: z.string().optional().describe("Filter by email address"),
    },
    async ({ address }) => {
      try {
        const path = address
          ? `/mailboxes?address=${encodeURIComponent(address)}`
          : "/mailboxes";
        const mailboxes = await client.get<Mailbox[]>(path);
        return toolResult(mailboxes);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_mailbox",
    "Get details of a specific mailbox",
    {
      mailboxId: z.string().describe("The mailbox ID"),
    },
    async ({ mailboxId }) => {
      try {
        const mailbox = await client.get<Mailbox>(`/mailboxes/${mailboxId}`);
        return toolResult(mailbox);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "delete_mailbox",
    "Delete a single mailbox",
    {
      mailboxId: z.string().describe("The mailbox ID to delete"),
    },
    async ({ mailboxId }) => {
      try {
        await client.delete(`/mailboxes/${mailboxId}`);
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "bulk_delete_mailboxes",
    "Delete multiple mailboxes atomically",
    {
      ids: z.array(z.string()).describe("Array of mailbox IDs to delete"),
    },
    async ({ ids }) => {
      try {
        await client.delete("/mailboxes", { ids });
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
