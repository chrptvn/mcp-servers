import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DevToClient, DevToError } from "../client.js";
import type { Tag, FollowedTag, Follower, PodcastEpisode, ProfileImage, Reaction, ReadingListItem } from "../types.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof DevToError ? `[${err.statusCode}] ${err.message}` : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export function registerMiscTools(server: McpServer, client: DevToClient) {
  // Tags
  server.tool(
    "list_tags",
    "List popular tags ordered by usage",
    {
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().optional().describe("Items per page (default: 10)"),
    },
    async (params) => {
      try {
        const tags = await client.get<Tag[]>(`/tags${buildQuery(params)}`);
        return toolResult(tags);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_followed_tags",
    "List tags the authenticated user follows (requires authentication)",
    {},
    async () => {
      try {
        const tags = await client.get<FollowedTag[]>("/follows/tags", true);
        return toolResult(tags);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // Followers
  server.tool(
    "list_followers",
    "List users who follow the authenticated user (requires authentication)",
    {
      page: z.number().optional().describe("Page number"),
      per_page: z.number().optional().describe("Items per page (default: 80)"),
      sort: z.string().optional().describe("Sort field (default: created_at)"),
    },
    async (params) => {
      try {
        const followers = await client.get<Follower[]>(`/followers/users${buildQuery(params)}`, true);
        return toolResult(followers);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // Podcast Episodes
  server.tool(
    "list_podcast_episodes",
    "List podcast episodes",
    {
      page: z.number().optional().describe("Page number"),
      per_page: z.number().optional().describe("Items per page"),
      username: z.string().optional().describe("Filter by podcast username"),
    },
    async (params) => {
      try {
        const episodes = await client.get<PodcastEpisode[]>(`/podcast_episodes${buildQuery(params)}`);
        return toolResult(episodes);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // Profile Images
  server.tool(
    "get_profile_image",
    "Get a user's or organization's profile image URLs (requires authentication)",
    {
      username: z.string().describe("The username to fetch the profile image for"),
    },
    async ({ username }) => {
      try {
        const image = await client.get<ProfileImage>(`/profile_images/${username}`, true);
        return toolResult(image);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // Reactions
  server.tool(
    "create_reaction",
    "Add a reaction to an article, comment, or user (requires authentication)",
    {
      category: z
        .enum(["like", "unicorn", "exploding_head", "raised_hands", "fire"])
        .describe("Reaction type"),
      reactable_id: z.number().describe("ID of the item to react to"),
      reactable_type: z
        .enum(["Article", "Comment", "User"])
        .describe("Type of item to react to"),
    },
    async (params) => {
      try {
        const qs = new URLSearchParams({ category: params.category, reactable_id: String(params.reactable_id), reactable_type: params.reactable_type });
        const reaction = await client.post<Reaction>(`/reactions?${qs.toString()}`);
        return toolResult(reaction);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "toggle_reaction",
    "Toggle a reaction — creates it if absent, removes it if present (requires authentication)",
    {
      category: z
        .enum(["like", "unicorn", "exploding_head", "raised_hands", "fire"])
        .describe("Reaction type"),
      reactable_id: z.number().describe("ID of the item to react to"),
      reactable_type: z
        .enum(["Article", "Comment", "User"])
        .describe("Type of item to react to"),
    },
    async (params) => {
      try {
        const qs = new URLSearchParams({ category: params.category, reactable_id: String(params.reactable_id), reactable_type: params.reactable_type });
        const reaction = await client.post<Reaction>(`/reactions/toggle?${qs.toString()}`);
        return toolResult(reaction);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // Reading List
  server.tool(
    "list_reading_list",
    "List the authenticated user's reading list (requires authentication)",
    {
      page: z.number().optional().describe("Page number"),
      per_page: z.number().optional().describe("Items per page (default: 30)"),
    },
    async (params) => {
      try {
        const items = await client.get<ReadingListItem[]>(`/readinglist${buildQuery(params)}`, true);
        return toolResult(items);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
