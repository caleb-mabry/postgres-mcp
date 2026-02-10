#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./register-tools.js";
import { closeDb } from "./db.js";
import { log } from "./logger.js";
import { VERSION, PACKAGE_NAME } from "./version.js";

// Check if --http flag is provided
const args = process.argv.slice(2);
if (args.includes('--http') || args.includes('-h')) {
  // Dynamically import and run HTTP server
  import('./http-server.js').catch((error) => {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  });
} else {
  // Run stdio server
  async function shutdown() {
    await closeDb();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  async function main() {
    log.banner("stdio", VERSION);

    const server = new McpServer(
      {
        name: PACKAGE_NAME,
        version: VERSION,
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
}
