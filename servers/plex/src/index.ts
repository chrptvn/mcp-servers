#!/usr/bin/env node
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { PlexClient } from "./client.js";
import { registerLibraryTools } from "./tools/library.js";
import { registerMovieTools } from "./tools/movies.js";
import { registerWatchlistTools } from "./tools/watchlist.js";
import { registerSessionTools } from "./tools/sessions.js";
import { registerOrganizeTools } from "./tools/organize.js";
import { registerManageTools } from "./tools/manage.js";
import { registerFileTools } from "./tools/files.js";

const client = new PlexClient();

function createServer(): McpServer {
  const server = new McpServer({ name: "plex", version: "1.0.0" });
  registerLibraryTools(server, client);
  registerMovieTools(server, client);
  registerWatchlistTools(server, client);
  registerSessionTools(server, client);
  registerOrganizeTools(server, client);
  registerManageTools(server, client);
  registerFileTools(server, client);
  return server;
}

const PORT = process.env["PORT"] ? parseInt(process.env["PORT"], 10) : undefined;

if (PORT) {
  // HTTP/SSE mode — used when running as a persistent service
  const HOST = process.env["HOST"] ?? "127.0.0.1";

  // Active SSE transports keyed by session ID
  const transports = new Map<string, SSEServerTransport>();

  const httpServer = http.createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url?.startsWith("/sse")) {
        // Client opens SSE stream; server sends an `endpoint` event with the POST path
        const transport = new SSEServerTransport("/message", res);
        transports.set(transport.sessionId, transport);
        transport.onclose = () => transports.delete(transport.sessionId);

        const server = createServer();
        await server.connect(transport);
      } else if (req.method === "POST" && req.url?.startsWith("/message")) {
        const url = new URL(req.url, `http://${HOST}`);
        const sessionId = url.searchParams.get("sessionId") ?? "";
        const transport = transports.get(sessionId);

        if (!transport) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Session not found");
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        await new Promise<void>((resolve) => req.on("end", resolve));
        const body = JSON.parse(Buffer.concat(chunks).toString());

        await transport.handlePostMessage(req, res, body);
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    } catch (err) {
      console.error("Request error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    }
  });

  httpServer.listen(PORT, HOST, () => {
    console.log(`Plex MCP server listening on http://${HOST}:${PORT}/sse`);
  });
} else {
  // Stdio mode — used when spawned directly by an MCP client
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
