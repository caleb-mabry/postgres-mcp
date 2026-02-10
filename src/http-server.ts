#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { randomUUID } from "crypto";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { Request, Response } from "express";
import { config } from "./config.js";
import { registerTools } from "./register-tools.js";
import { closeDb } from "./db.js";
import { log } from "./logger.js";
import { VERSION, PACKAGE_NAME } from "./version.js";

// Store active transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

function createServer() {
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

  registerTools(server)

  return server;
}


const PORT = config.server.port;

// Get allowed hosts from environment variable or use defaults
const allowedHostsEnv = config.server.allowedHosts;
const allowedHosts = allowedHostsEnv 
  ? allowedHostsEnv.split(',').map(h => h.trim())
  : undefined;

const app = createMcpExpressApp({ 
  host: '0.0.0.0',
  allowedHosts 
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const mcpPostHandler = async (req: Request, res: Response) => {
  try {
    let sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Check if this is an initialization request
    const isInit = isInitializeRequest(req.body);

    if (isInit) {
      // Create new session for initialization
      sessionId = randomUUID();
      log.info(`New session created: ${sessionId}`, "http");

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId as string,
      });

      const server = createServer();
      
      await server.connect(transport);

      transports[sessionId] = transport;

      // Clean up on transport close
      const capturedSessionId = sessionId;
      transport.onclose = () => {
        log.info(`Session ${capturedSessionId} closed`, "http");
        delete transports[capturedSessionId];
      };
    } else if (!sessionId || !transports[sessionId]) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "Invalid or missing session ID",
        },
        id: null,
      });
      return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    log.error("Error handling MCP request", "http", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
};

app.post("/mcp", mcpPostHandler);

// MCP GET handler for SSE streaming
const mcpGetHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const lastEventId = req.headers["last-event-id"];
  if (lastEventId) {
    log.debug(`Client reconnecting with Last-Event-ID: ${lastEventId}`, "http");
  } else {
    log.info(`Establishing SSE stream for session ${sessionId}`, "http");
  }

  // Set headers for SSE
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Handle client disconnect
  req.on('close', () => {
    log.info(`Client disconnected SSE stream for session ${sessionId}`, "http");
  });

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get("/mcp", mcpGetHandler);

// MCP DELETE handler for session termination
const mcpDeleteHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  log.info(`Session termination requested: ${sessionId}`, "http");

  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    log.error(`Error handling session termination for ${sessionId}`, "http", error);
    if (!res.headersSent) {
      res.status(500).send("Error processing session termination");
    }
  }
};

app.delete("/mcp", mcpDeleteHandler);

log.banner("http", VERSION);

const server = app.listen(PORT, () => {
  log.info(`Listening on http://localhost:${PORT}`, "http");
  log.info(`MCP endpoint: http://localhost:${PORT}/mcp`, "http");
  log.info(`Health check: http://localhost:${PORT}/health`, "http");
});

// Configure keepalive timeout for long-running SSE connections
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // Slightly longer than keepAlive

server.on("error", (error: any) => {
  if (error.code === "EADDRINUSE") {
    log.error(`Port ${PORT} is already in use. Set a different PORT env var.`, "http");
  } else {
    log.error("Server error", "http", error);
  }
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  log.error("Uncaught exception", "http", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log.error("Unhandled rejection", "http", { reason, promise });
  process.exit(1);
});

process.on("SIGINT", async () => {
  log.warn("Shutting down server...", "http");

  server.close(() => {
    log.info("HTTP server closed", "http");
  });

  for (const sessionId in transports) {
    try {
      log.debug(`Closing transport for session ${sessionId}`, "http");
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      log.error(`Error closing transport for session ${sessionId}`, "http", error);
    }
  }

  await closeDb();
  log.info("Server shutdown complete", "http");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  log.warn("Received SIGTERM signal...", "http");
  process.emit("SIGINT" as any);
});
