import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PlexClient, PlexError } from "../client.js";
import { resolvePhysical, getPathConfig } from "../paths.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof PlexError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerFileTools(server: McpServer, _client: PlexClient) {
  const { physicalBase, virtualBase } = getPathConfig();

  server.tool(
    "move_file",
    "Move or rename a file or directory on the media filesystem. Accepts both host paths and Plex-internal paths interchangeably.",
    {
      source: z.string().describe("Source path (file or directory)"),
      destination: z.string().describe("Destination path (file or directory)"),
    },
    async ({ source, destination }) => {
      try {
        const src = resolvePhysical(source);
        const dst = resolvePhysical(destination);

        // Ensure destination parent directory exists
        await fs.mkdir(path.dirname(dst), { recursive: true });
        await fs.rename(src, dst);

        return toolResult({ success: true, moved: src, to: dst });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "create_directory",
    "Create a directory (and any missing parents) on the media filesystem. Accepts both host paths and Plex-internal paths interchangeably.",
    {
      path: z.string().describe("Directory path to create"),
    },
    async ({ path: dirPath }) => {
      try {
        const physical = resolvePhysical(dirPath);
        await fs.mkdir(physical, { recursive: true });
        return toolResult({ success: true, created: physical });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_directory",
    "List the contents of a directory on the media filesystem. Omit path to list the movies root directory.",
    {
      path: z.string().optional().describe(
        "Directory path to list. Omit to list the movies root directory."
      ),
    },
    async ({ path: dirPath }) => {
      try {
        const physical = dirPath ? resolvePhysical(dirPath) : physicalBase;
        if (!physical) return { content: [{ type: "text" as const, text: "No path provided and media directory is not configured on the server." }], isError: true };
        const entries = await fs.readdir(physical, { withFileTypes: true });
        const result = entries.map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : "file",
          physical: path.join(physical, e.name),
          virtual: virtualBase
            ? path.join(virtualBase, path.relative(physicalBase, physical), e.name)
            : null,
        }));
        return toolResult({ path: physical, entries: result });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
