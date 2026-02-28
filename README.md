# mcp-servers

A monorepo of MCP (Model Context Protocol) servers, each integrating with a different platform or service.

## Language

All servers are written in **TypeScript** and use the official [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk).

## Available Servers

| Server | Description | Docs |
|--------|-------------|------|
| [`minutemail`](./servers/minutemail/) | Temporary/disposable email — create & manage mailboxes, read emails, download attachments | [README](./servers/minutemail/README.md) |
| [`devto`](./servers/devto/) | dev.to developer blogging platform — articles, comments, users, reactions, and more | [README](./servers/devto/README.md) |

## Structure

```
mcp-servers/
├── package.json           # npm workspaces root
├── tsconfig.base.json     # shared TypeScript config
└── servers/
    └── <server-name>/     # one directory per MCP server
        ├── package.json
        ├── tsconfig.json
        ├── README.md
        └── src/
```

## Adding a New Server

1. Create a new directory under `servers/`
2. Add a `package.json` with `"type": "module"` and the `@modelcontextprotocol/sdk` dependency
3. Add a `tsconfig.json` extending `../../tsconfig.base.json`
4. Implement your tools and wire them into an `McpServer` with `StdioServerTransport`
5. Add a `README.md` documenting the tools and configuration