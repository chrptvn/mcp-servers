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

export function registerDriveTools(server: McpServer) {
  server.tool(
    "drive_list",
    "List or search files in Google Drive",
    {
      query: z
        .string()
        .optional()
        .describe("Search query using Drive query syntax (e.g. 'name contains \"report\"')"),
      maxResults: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Maximum number of files to return"),
      folderId: z
        .string()
        .optional()
        .describe("Restrict listing to a specific folder ID"),
    },
    async ({ query, maxResults, folderId }) => {
      try {
        const args = ["drive", "list"];
        if (query) args.push("--query", query);
        if (maxResults !== undefined) args.push("--max-results", String(maxResults));
        if (folderId) args.push("--folder", folderId);
        const result = spawnGog(args);
        return toolResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "drive_download",
    "Download the content of a Google Drive file by its file ID",
    {
      fileId: z.string().describe("Google Drive file ID"),
      mimeType: z
        .string()
        .optional()
        .describe(
          "Export MIME type for Google Workspace files (e.g. 'text/plain' for Docs, 'text/csv' for Sheets)"
        ),
    },
    async ({ fileId, mimeType }) => {
      try {
        const args = ["drive", "download", fileId];
        if (mimeType) args.push("--mime-type", mimeType);
        const result = spawnGog(args);
        return toolResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
