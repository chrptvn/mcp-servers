import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PlexClient, PlexError } from "../client.js";
import type { PlexMediaContainer, PlexMovie } from "../types.js";
import { toPhysical, getPathConfig } from "../paths.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof PlexError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

/** Replace characters illegal or problematic in directory names */
function sanitizeDirName(name: string): string {
  return name.replace(/\//g, "-").replace(/\0/g, "").trim() || "Uncategorized";
}

/** Fetch all movies from a section, paging through in batches */
async function fetchAllMovies(client: PlexClient, sectionId: string): Promise<PlexMovie[]> {
  const batchSize = 100;
  let start = 0;
  const all: PlexMovie[] = [];

  while (true) {
    const data = await client.get<PlexMediaContainer<PlexMovie>>(
      `/library/sections/${sectionId}/all`,
      { "X-Plex-Container-Start": start, "X-Plex-Container-Size": batchSize, sort: "titleSort" }
    );
    const batch = data.MediaContainer.Metadata ?? [];
    all.push(...batch);
    start += batch.length;
    const total = data.MediaContainer.totalSize ?? data.MediaContainer.size ?? 0;
    if (batch.length === 0 || start >= total) break;
  }

  return all;
}

export function registerOrganizeTools(server: McpServer, client: PlexClient) {
  server.tool(
    "organize_movies_by_genre",
    [
      "Organize movie files into genre subdirectories.",
      "Reads every movie's genre from Plex, creates a subdirectory per genre, and moves each movie file there.",
      "Run with dry_run=true first to preview without touching files.",
      "After a real run, Plex is rescanned automatically.",
    ].join(" "),
    {
      section_id: z.string().optional().describe(
        "Library section key (from list_libraries). Omit to auto-select the first movie library."
      ),
      dry_run: z.boolean().optional().describe(
        "If true, report planned moves without touching the filesystem (default: false)"
      ),
    },
    async ({ section_id, dry_run = false }) => {
      try {
        const { physicalBase } = getPathConfig();
        const rootDir = physicalBase.replace(/\/$/, "");
        if (!rootDir) {
          return { content: [{ type: "text" as const, text: "Media path is not configured. Set PLEX_MEDIA_PATH in the server .env file." }], isError: true };
        }

        const resolvedId = await client.resolveSectionId(section_id, "movie");
        const movies = await fetchAllMovies(client, resolvedId);

        /** Convert a Plex-internal file path to a real host path */
        function toHostPath(plexFile: string): string {
          return toPhysical(plexFile) !== plexFile ? toPhysical(plexFile) : path.join(rootDir, path.basename(plexFile));
        }

        const genreCounts: Record<string, number> = {};
        const moved: string[] = [];
        const skipped: string[] = [];
        const errors: string[] = [];

        for (const movie of movies) {
          // Collect all file paths for this movie (converted to host paths)
          const files: string[] = [];
          for (const media of movie.Media ?? []) {
            for (const part of media.Part ?? []) {
              if (part.file) files.push(toHostPath(part.file));
            }
          }

          if (files.length === 0) {
            skipped.push(`${movie.title}: no file path in Plex metadata`);
            continue;
          }

          const rawGenre = movie.Genre?.[0]?.tag?.trim() || "Uncategorized";
          const genreDir = sanitizeDirName(rawGenre);
          genreCounts[genreDir] = (genreCounts[genreDir] ?? 0) + 1;

          const targetDir = path.join(rootDir, genreDir);

          for (const srcFile of files) {
            const srcDir = path.dirname(srcFile);

            // Already in the right place
            if (srcDir === targetDir) {
              skipped.push(`${movie.title}: already in ${genreDir}/`);
              continue;
            }

            // Safety: only move files that live directly under rootDir
            if (srcDir !== rootDir) {
              skipped.push(`${movie.title}: not directly under base_path, skipping (${srcFile})`);
              continue;
            }

            const destFile = path.join(targetDir, path.basename(srcFile));

            if (dry_run) {
              moved.push(`[DRY RUN] ${path.basename(srcFile)} → ${genreDir}/`);
            } else {
              try {
                await fs.mkdir(targetDir, { recursive: true });
                await fs.rename(srcFile, destFile);
                moved.push(`${path.basename(srcFile)} → ${genreDir}/`);
              } catch (e) {
                errors.push(`${movie.title}: ${String(e)}`);
              }
            }
          }
        }

        // Trigger Plex rescan so it picks up the relocated files
        if (!dry_run && moved.length > 0) {
          try {
            await client.put(`/library/sections/${resolvedId}/refresh`);
          } catch {
            // Non-fatal — user can call refresh_library manually
          }
        }

        return toolResult({
          dry_run,
          root_dir: rootDir,
          total_movies: movies.length,
          moved: moved.length,
          skipped: skipped.length,
          errors: errors.length,
          genres: genreCounts,
          details: { moved, skipped, errors },
        });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "refresh_library",
    "Trigger a Plex library scan to pick up added, moved, or deleted files",
    {
      section_id: z.string().optional().describe(
        "Library section key to refresh. Omit to refresh the first movie library."
      ),
    },
    async ({ section_id }) => {
      try {
        const resolvedId = await client.resolveSectionId(section_id, "movie");
        await client.put(`/library/sections/${resolvedId}/refresh`);
        return toolResult({ success: true, section_id: resolvedId });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
