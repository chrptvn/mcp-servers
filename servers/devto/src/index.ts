#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DevToClient } from "./client.js";
import { registerArticleTools } from "./tools/articles.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerUserTools } from "./tools/users.js";
import { registerOrganizationTools } from "./tools/organizations.js";
import { registerMiscTools } from "./tools/misc.js";
import { registerPageTools } from "./tools/pages.js";
import { registerDisplayAdTools } from "./tools/display-ads.js";

const server = new McpServer({
  name: "devto",
  version: "1.0.0",
});

const client = new DevToClient();

registerArticleTools(server, client);
registerCommentTools(server, client);
registerUserTools(server, client);
registerOrganizationTools(server, client);
registerMiscTools(server, client);
registerPageTools(server, client);
registerDisplayAdTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
