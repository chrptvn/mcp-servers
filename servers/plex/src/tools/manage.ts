import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { promises as fs } from "node:fs";
import { PlexClient, PlexError } from "../client.js";
import type { PlexMediaContainer, PlexLibrarySection } from "../types.js";
import { getPathConfig, toVirtual } from "../paths.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof PlexError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

/** Infer agent/scanner/language from the first library section matching the given type */
async function inferDefaults(client: PlexClient, type: string) {
  const data = await client.get<PlexMediaContainer<PlexLibrarySection>>("/library/sections");
  const sections = data.MediaContainer.Directory ?? [];
  const match = sections.find((s) => s.type === type);
  return {
    agent: match?.agent ?? (type === "movie" ? "tv.plex.agents.movie" : "tv.plex.agents.series"),
    scanner: match?.scanner ?? (type === "movie" ? "Plex Movie" : "Plex TV Series"),
    language: match?.language ?? "en-US",
  };
}

export function registerManageTools(server: McpServer, client: PlexClient) {
  server.tool(
    "create_library",
    [
      "Create a new Plex library section pointing to a directory on disk.",
      "Automatically infers agent, scanner, and language from the existing library of the same type.",
      "Use list_libraries to verify the result afterwards.",
    ].join(" "),
    {
      title: z.string().describe("Display name for the new library (e.g. 'Action', 'Animation')"),
      path: z.string().describe(
        "Absolute path to the directory on the Plex server (e.g. /data/movies/Action)"
      ),
      type: z.enum(["movie", "show", "artist", "photo"]).optional().describe(
        "Library type (default: movie)"
      ),
      language: z.string().optional().describe(
        "Language code, e.g. 'fr-FR'. Inferred from existing libraries if omitted."
      ),
    },
    async ({ title, path, type = "movie", language }) => {
      try {
        const defaults = await inferDefaults(client, type);
        const params: Record<string, string> = {
          name: title,
          type,
          agent: defaults.agent,
          scanner: defaults.scanner,
          language: language ?? defaults.language,
          location: path,
        };
        const data = await client.post<PlexMediaContainer<PlexLibrarySection>>(
          "/library/sections",
          params
        );
        return toolResult(data?.MediaContainer?.Directory?.[0] ?? { success: true, name, location });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "sync_libraries",
    [
      "Create one Plex library section per subdirectory under the movies folder.",
      "Skips directories that already have a matching Plex library (by path or title).",
      "Use dry_run=true to preview what would be created without making any changes.",
    ].join(" "),
    {
      type: z.enum(["movie", "show", "artist", "photo"]).optional().describe("Library type (default: movie)"),
      language: z.string().optional().describe("Language code, e.g. 'fr-FR'. Inferred from existing libraries if omitted."),
      dry_run: z.boolean().optional().describe("If true, report planned creates without touching Plex (default: false)"),
    },
    async ({ type = "movie", language, dry_run = false }) => {
      try {
        const { physicalBase, virtualBase } = getPathConfig();
        if (!physicalBase) {
          return { content: [{ type: "text" as const, text: "Media path is not configured on the server." }], isError: true };
        }

        // List subdirectories under physicalBase
        const entries = await fs.readdir(physicalBase, { withFileTypes: true });
        const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

        // Get existing libraries (by their location paths)
        const sectionsData = await client.get<PlexMediaContainer<PlexLibrarySection>>("/library/sections");
        const existing = sectionsData.MediaContainer.Directory ?? [];
        const existingLocations = new Set(
          existing.flatMap((s) => (s.Location ?? []).map((l) => l.path.replace(/\/$/, "")))
        );
        const existingTitles = new Set(existing.map((s) => s.title.toLowerCase()));

        const defaults = await inferDefaults(client, type);
        const created: { title: string; path: string; key?: string }[] = [];
        const skipped: { title: string; reason: string }[] = [];

        for (const dir of dirs) {
          const virtualPath = virtualBase ? `${virtualBase}/${dir}` : `/${dir}`;
          const physicalPath = `${physicalBase}/${dir}`;

          // Skip if a library already points to this location or has the same title
          if (existingLocations.has(virtualPath) || existingLocations.has(physicalPath)) {
            skipped.push({ title: dir, reason: "library already exists for this path" });
            continue;
          }
          if (existingTitles.has(dir.toLowerCase())) {
            skipped.push({ title: dir, reason: "library with this title already exists" });
            continue;
          }

          if (dry_run) {
            created.push({ title: dir, path: virtualPath });
          } else {
            try {
              const params: Record<string, string> = {
                name: dir,
                type,
                agent: defaults.agent,
                scanner: defaults.scanner,
                language: language ?? defaults.language,
                location: virtualPath,
              };
              const data = await client.post<PlexMediaContainer<PlexLibrarySection>>(
                "/library/sections",
                params
              );
              const section = data?.MediaContainer?.Directory?.[0];
              created.push({ title: dir, path: virtualPath, key: section?.key });
            } catch (err) {
              const msg = err instanceof PlexError ? `[${err.statusCode}] ${err.message}` : String(err);
              skipped.push({ title: dir, reason: `error: ${msg}` });
            }
          }
        }

        return toolResult({ dry_run, created, skipped, total_dirs: dirs.length });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "delete_library",
    "Permanently delete a Plex library section (does NOT delete files on disk).",
    {
      section_id: z.string().describe(
        "The numeric key of the library section to delete (from list_libraries)"
      ),
    },
    async ({ section_id }) => {
      try {
        await client.delete(`/library/sections/${section_id}`);
        return toolResult({ success: true, deleted_section_id: section_id });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
