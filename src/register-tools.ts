import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./config.js";
import {
  QueryInputSchema,
  DescribeTableInputSchema,
  ListTablesInputSchema,
  ListSchemasInputSchema,
  ListIndexesInputSchema,
  ExplainQueryInputSchema,
  GetTableStatsInputSchema,
  ListViewsInputSchema,
  ListFunctionsInputSchema,
} from "./validation.js";
import { queryTool, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE, MAX_PAYLOAD_SIZE } from "./tools/query.js";
import { describeTableTool, getConstraintsTool } from "./tools/describe.js";
import { listTablesTool, listViewsTool } from "./tools/list.js";
import { listSchemasTool } from "./tools/schemas.js";
import { listIndexesTool } from "./tools/indexes.js";
import { explainQueryTool, getTableStatsTool } from "./tools/performance.js";
import { listFunctionsTool } from "./tools/functions.js";
import { log } from "./logger.js";

type ToolResult = { error?: string; [key: string]: any };

function wrapTool<T>(name: string, fn: (args: T) => Promise<ToolResult>) {
  return async (args: T) => {
    log.info(`${name}`, "tool");
    log.debug(`${name} args`, "tool", args);
    const start = performance.now();
    const result = await fn(args);
    const ms = (performance.now() - start).toFixed(1);
    if (result.error) {
      log.warn(`${name} failed (${ms}ms): ${result.error}`, "tool");
      return {
        content: [{ type: "text" as const, text: `Error: ${result.error}` }],
        isError: true,
      };
    }
    log.info(`${name} completed (${ms}ms)`, "tool");
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  };
}

/**
 * Register all PostgreSQL tools on an MCP server instance
 */
export function registerTools(server: McpServer) {
  const maxPayloadMB = (MAX_PAYLOAD_SIZE / (1024 * 1024)).toFixed(1);
  const readOnlyMode = config.app.readOnly;
  const queryDescription = `Execute SQL queries with pagination support and parameterized queries for security. ` +
    `Configuration: max ${MAX_PAGE_SIZE} rows/page (default ${DEFAULT_PAGE_SIZE}), max ${maxPayloadMB}MB payload size. ` +
    `${readOnlyMode ? "READ-ONLY mode: only SELECT, WITH, and EXPLAIN queries allowed. " : ""}` +
    `Pagination automatically applied to SELECT queries without LIMIT/OFFSET.`;
  
  server.registerTool("query", {
    description: queryDescription,
    inputSchema: QueryInputSchema,
  }, wrapTool("query", queryTool));

  server.registerTool("describe_table", {
    description: "Get the structure of a database table",
    inputSchema: DescribeTableInputSchema,
  }, wrapTool("describe_table", describeTableTool));

  server.registerTool("list_tables", {
    description: "List all tables in a schema",
    inputSchema: ListTablesInputSchema,
  }, wrapTool("list_tables", listTablesTool));

  server.registerTool("get_constraints", {
    description: "Get constraints for a table",
    inputSchema: DescribeTableInputSchema,
  }, wrapTool("get_constraints", getConstraintsTool));

  server.registerTool("list_schemas", {
    description: "List all schemas in the database",
    inputSchema: ListSchemasInputSchema,
  }, wrapTool("list_schemas", listSchemasTool));

  server.registerTool("list_indexes", {
    description: "List indexes for a table or schema",
    inputSchema: ListIndexesInputSchema,
  }, wrapTool("list_indexes", listIndexesTool));

  server.registerTool("explain_query", {
    description: "Get query execution plan (EXPLAIN)",
    inputSchema: ExplainQueryInputSchema,
  }, wrapTool("explain_query", explainQueryTool));

  server.registerTool("get_table_stats", {
    description: "Get table statistics and size information",
    inputSchema: GetTableStatsInputSchema,
  }, wrapTool("get_table_stats", getTableStatsTool));

  server.registerTool("list_views", {
    description: "List views in a schema",
    inputSchema: ListViewsInputSchema,
  }, wrapTool("list_views", listViewsTool));

  server.registerTool("list_functions", {
    description: "List functions and procedures in a schema",
    inputSchema: ListFunctionsInputSchema,
  }, wrapTool("list_functions", listFunctionsTool));

  log.info(`Registered 10 tools`, "mcp");
}
