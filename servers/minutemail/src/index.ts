#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MinuteMailClient } from "./client.js";
import { registerMailboxTools } from "./tools/mailboxes.js";
import { registerArchivedMailboxTools } from "./tools/archived-mailboxes.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerAttachmentTools } from "./tools/attachments.js";

const server = new McpServer({
  name: "minutemail",
  version: "1.0.0",
});

const client = new MinuteMailClient();

registerMailboxTools(server, client);
registerArchivedMailboxTools(server, client);
registerMessageTools(server, client);
registerAttachmentTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
