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

export function registerCalendarTools(server: McpServer) {
  server.tool(
    "calendar_list_events",
    "List upcoming Google Calendar events",
    {
      calendarId: z
        .string()
        .optional()
        .describe("Calendar ID (defaults to primary calendar)"),
      maxResults: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Maximum number of events to return"),
      timeMin: z
        .string()
        .optional()
        .describe("Lower bound for event start time (ISO 8601, e.g. '2024-01-01T00:00:00Z')"),
      timeMax: z
        .string()
        .optional()
        .describe("Upper bound for event start time (ISO 8601)"),
    },
    async ({ calendarId, maxResults, timeMin, timeMax }) => {
      try {
        const args = ["cal", "list"];
        if (calendarId) args.push("--calendar", calendarId);
        if (maxResults !== undefined) args.push("--max-results", String(maxResults));
        if (timeMin) args.push("--time-min", timeMin);
        if (timeMax) args.push("--time-max", timeMax);
        const result = spawnGog(args);
        return toolResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "calendar_create_event",
    "Create a new Google Calendar event",
    {
      summary: z.string().describe("Event title/summary"),
      start: z
        .string()
        .describe("Event start date/time (ISO 8601, e.g. '2024-06-01T10:00:00')"),
      end: z
        .string()
        .describe("Event end date/time (ISO 8601, e.g. '2024-06-01T11:00:00')"),
      description: z.string().optional().describe("Event description or notes"),
      location: z.string().optional().describe("Event location"),
      calendarId: z
        .string()
        .optional()
        .describe("Calendar ID (defaults to primary calendar)"),
      attendees: z
        .string()
        .optional()
        .describe("Attendee email address(es), comma-separated"),
    },
    async ({ summary, start, end, description, location, calendarId, attendees }) => {
      try {
        const args = [
          "cal",
          "create",
          "--summary",
          summary,
          "--start",
          start,
          "--end",
          end,
        ];
        if (description) args.push("--description", description);
        if (location) args.push("--location", location);
        if (calendarId) args.push("--calendar", calendarId);
        if (attendees) args.push("--attendees", attendees);
        const result = spawnGog(args);
        return toolResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
