import type { PlexMediaContainer, PlexLibrarySection } from "./types.js";

const DEFAULT_PLEX_URL = "http://localhost:32400";

export class PlexError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "PlexError";
  }
}

export class PlexClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(token?: string, baseUrl?: string) {
    this.token = token ?? process.env["PLEX_TOKEN"] ?? "";
    this.baseUrl = (baseUrl ?? process.env["PLEX_URL"] ?? DEFAULT_PLEX_URL).replace(/\/$/, "");

    if (!this.token) {
      throw new Error("PLEX_TOKEN environment variable is required");
    }
  }

  private headers(): Record<string, string> {
    return {
      "X-Plex-Token": this.token,
      "Accept": "application/json",
      "X-Plex-Client-Identifier": "mcp-server-plex",
      "X-Plex-Product": "MCP Server Plex",
    };
  }

  private buildUrl(path: string, params: Record<string, string | number | boolean | undefined> = {}): string {
    const allParams: Record<string, string | number | boolean | undefined> = {
      ...params,
    };
    const query = Object.entries(allParams)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    return `${this.baseUrl}${path}${query ? `?${query}` : ""}`;
  }

  private async request<T>(method: string, path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, {
      method,
      headers: this.headers(),
    });

    if (!res.ok) {
      let message = res.statusText;
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore parse errors
      }
      throw new PlexError(res.status, message);
    }

    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  }

  get<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    return this.request<T>("GET", path, params);
  }

  /** Resolve a section ID by numeric key, title, or type ("movie"/"show").
   * If `sectionId` is omitted, returns the first section of the given type (default: "movie"). */
  async resolveSectionId(sectionId?: string, fallbackType = "movie"): Promise<string> {
    const data = await this.get<PlexMediaContainer<PlexLibrarySection>>("/library/sections");
    const sections = data.MediaContainer.Directory ?? [];
    if (!sectionId) {
      const match = sections.find((s) => s.type === fallbackType) ?? sections[0];
      if (!match) throw new Error("No Plex library sections found");
      return match.key;
    }
    // Exact numeric key match
    if (sections.some((s) => s.key === sectionId)) return sectionId;
    // Match by title (case-insensitive) or type
    const lower = sectionId.toLowerCase();
    const byName = sections.find(
      (s) => s.title.toLowerCase() === lower || s.type.toLowerCase() === lower
    );
    if (byName) return byName.key;
    // Fall back to returning as-is (let Plex return the error)
    return sectionId;
  }

  delete<T = void>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    return this.request<T>("DELETE", path, params);
  }

  put<T = void>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    return this.request<T>("PUT", path, params);
  }

  post<T = void>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    return this.request<T>("POST", path, params);
  }
}
