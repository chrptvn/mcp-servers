import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spawnGog, GogError } from "../runner.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof GogError
      ? `[exit ${err.exitCode ?? "?"}] ${err.message}`
      : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerGmailTools(server: McpServer) {
  server.tool(
    "gmail_search",
    "Search Gmail messages/threads by query string (supports Gmail search syntax, e.g. 'from:alice newer_than:7d')",
    {
      query: z.string().describe("Gmail search query"),
      maxResults: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Maximum number of results to return"),
    },
    async ({ query, maxResults }) => {
      try {
        const args = ["gmail", "search", query];
        if (maxResults !== undefined) args.push("--max-results", String(maxResults));
        const result = spawnGog(args);
        return toolResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "gmail_get_message",
    "Get a specific Gmail message by its ID",
    {
      id: z.string().describe("Gmail message ID"),
    },
    async ({ id }) => {
      try {
        const result = spawnGog(["gmail", "get", id]);
        return toolResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "gmail_send",
    "Send an email via Gmail",
    {
      to: z.string().describe("Recipient email address(es), comma-separated"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body (plain text)"),
      cc: z.string().optional().describe("CC email address(es), comma-separated"),
    },
    async ({ to, subject, body, cc }) => {
      try {
        const args = ["gmail", "send", "--to", to, "--subject", subject, "--body", body];
        if (cc) args.push("--cc", cc);
        const result = spawnGog(args);
        return toolResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
