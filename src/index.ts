#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./register-tools.js";
import { closeDb } from "./db.js";
import { log } from "./logger.js";

async function shutdown() {
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function main() {
  log.banner("stdio", "1.0.2");

  const server = new McpServer(
    {
      name: "postgres-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("Server connected via stdio transport", "mcp");
}

main().catch((error) => {
  log.error("Server error", "mcp", error);
  process.exit(1);
});
