import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DevToClient, DevToError } from "../client.js";
import type { Article } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof DevToError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export function registerArticleTools(server: McpServer, client: DevToClient) {
  server.tool(
    "list_articles",
    "List articles on dev.to with optional filters",
    {
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().min(1).max(1000).optional().describe("Items per page (default: 30)"),
      tag: z.string().optional().describe("Filter by tag slug"),
      tags: z.string().optional().describe("Comma-separated list of tags to include"),
      tags_exclude: z.string().optional().describe("Comma-separated list of tags to exclude"),
      username: z.string().optional().describe("Filter by author username"),
      state: z.enum(["fresh", "rising", "all"]).optional().describe("Filter by article state"),
      top: z.number().optional().describe("Return top articles from the last N days"),
      collection_id: z.number().optional().describe("Filter by collection ID"),
    },
    async (params) => {
      try {
        const articles = await client.get<Article[]>(`/articles${buildQuery(params)}`);
        return toolResult(articles);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_latest_articles",
    "List the latest articles ordered by publish date",
    {
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().min(1).max(1000).optional().describe("Items per page (default: 30)"),
    },
    async (params) => {
      try {
        const articles = await client.get<Article[]>(`/articles/latest${buildQuery(params)}`);
        return toolResult(articles);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_article_by_id",
    "Get a specific article by its ID",
    {
      id: z.number().describe("The article ID"),
    },
    async ({ id }) => {
      try {
        const article = await client.get<Article>(`/articles/${id}`);
        return toolResult(article);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_article_by_path",
    "Get a specific article by author username and slug",
    {
      username: z.string().describe("The author's username"),
      slug: z.string().describe("The article slug"),
    },
    async ({ username, slug }) => {
      try {
        const article = await client.get<Article>(`/articles/${username}/${slug}`);
        return toolResult(article);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_videos",
    "List articles with video content",
    {
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().min(1).max(1000).optional().describe("Items per page (default: 24)"),
    },
    async (params) => {
      try {
        const videos = await client.get<Article[]>(`/videos${buildQuery(params)}`);
        return toolResult(videos);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "create_article",
    "Create a new article (requires authentication)",
    {
      title: z.string().describe("Article title"),
      body_markdown: z.string().optional().describe("Article body in Markdown"),
      published: z.boolean().optional().describe("Publish immediately (default: false = draft)"),
      tags: z.array(z.string()).optional().describe("Array of tag strings"),
      series: z.string().optional().describe("Series name to add this article to"),
      canonical_url: z.string().optional().describe("Canonical URL if cross-posting"),
      description: z.string().optional().describe("Article description/summary"),
      main_image: z.string().optional().describe("Cover image URL"),
      organization_id: z.number().optional().describe("Publish under an organization"),
    },
    async (params) => {
      try {
        const article = await client.post<Article>("/articles", { article: params });
        return toolResult(article);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "update_article",
    "Update an existing article (requires authentication, must be article owner)",
    {
      id: z.number().describe("The article ID to update"),
      title: z.string().optional().describe("New title"),
      body_markdown: z.string().optional().describe("New body in Markdown"),
      published: z.boolean().optional().describe("Publish or unpublish"),
      tags: z.array(z.string()).optional().describe("New tag list"),
      series: z.string().optional().describe("Series name"),
      canonical_url: z.string().optional().describe("Canonical URL"),
      description: z.string().optional().describe("Description"),
      main_image: z.string().optional().describe("Cover image URL"),
      organization_id: z.number().optional().describe("Organization ID"),
    },
    async ({ id, ...body }) => {
      try {
        const article = await client.put<Article>(`/articles/${id}`, { article: body });
        return toolResult(article);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_my_articles",
    "List the authenticated user's articles (most recent first)",
    {
      page: z.number().optional().describe("Page number"),
      per_page: z.number().optional().describe("Items per page"),
    },
    async (params) => {
      try {
        const articles = await client.get<Article[]>(`/articles/me${buildQuery(params)}`, true);
        return toolResult(articles);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_my_published_articles",
    "List the authenticated user's published articles",
    {
      page: z.number().optional().describe("Page number"),
      per_page: z.number().optional().describe("Items per page"),
    },
    async (params) => {
      try {
        const articles = await client.get<Article[]>(`/articles/me/published${buildQuery(params)}`, true);
        return toolResult(articles);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_my_unpublished_articles",
    "List the authenticated user's unpublished (draft) articles",
    {
      page: z.number().optional().describe("Page number"),
      per_page: z.number().optional().describe("Items per page"),
    },
    async (params) => {
      try {
        const articles = await client.get<Article[]>(`/articles/me/unpublished${buildQuery(params)}`, true);
        return toolResult(articles);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_all_my_articles",
    "List all of the authenticated user's articles (published and drafts)",
    {
      page: z.number().optional().describe("Page number"),
      per_page: z.number().optional().describe("Items per page"),
    },
    async (params) => {
      try {
        const articles = await client.get<Article[]>(`/articles/me/all${buildQuery(params)}`, true);
        return toolResult(articles);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "unpublish_article",
    "Unpublish an article (requires admin or moderator privileges)",
    {
      id: z.number().describe("The article ID to unpublish"),
      note: z.string().optional().describe("Reason for unpublishing"),
    },
    async ({ id, note }) => {
      try {
        await client.put(`/articles/${id}/unpublish${note ? `?note=${encodeURIComponent(note)}` : ""}`);
        return toolResult({ success: true });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
