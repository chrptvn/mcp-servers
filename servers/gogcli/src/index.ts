#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGmailTools } from "./tools/gmail.js";
import { registerCalendarTools } from "./tools/calendar.js";
import { registerDriveTools } from "./tools/drive.js";

const server = new McpServer({
  name: "gogcli",
  version: "1.0.0",
});

registerGmailTools(server);
registerCalendarTools(server);
registerDriveTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
