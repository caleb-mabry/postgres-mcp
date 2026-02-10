---
sidebar_position: 1
---

# Getting Started

Welcome to **Postgres MCP Server** - a Model Context Protocol server for PostgreSQL database operations.

## What is Postgres MCP Server?

Postgres MCP Server enables AI assistants like Claude to interact with PostgreSQL databases through the Model Context Protocol (MCP). It provides a secure, read-only (by default) interface for querying databases, inspecting schemas, and analyzing query performance.

## Key Features

- 🔒 **Secure by Default** - Read-only mode prevents accidental data modifications
- 📄 **Smart Pagination** - Automatic result limiting with configurable page sizes
- 🔍 **Schema Introspection** - Explore tables, views, functions, and constraints
- ⚡ **Query Analysis** - EXPLAIN plans and table statistics
- 🚀 **Dual Mode** - Works with Claude Desktop (stdio) or as HTTP server (SSE)
- 🛡️ **SQL Validation** - AST-based parsing to prevent unsafe queries

## Quick Start

### Installation Options

Install via npx (no installation required):

```bash
npx -y postgres-mcp-server
```

Or install globally:

```bash
npm install -g postgres-mcp-server
```

### Client Setup

Postgres MCP Server works with multiple MCP-compatible clients:

- **[Claude Desktop](./setup/claude-desktop)** - Anthropic's desktop app
- **[Cline](./setup/cline)** - VS Code extension for AI-assisted coding
- **[Zed](./setup/zed)** - High-performance code editor
- **[Docker](./setup/docker)** - Containerized deployment
- **[HTTP Server](./setup/http-server)** - SSE transport for web clients

### Quick Configuration Example

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "postgres-mcp-server"],
      "env": {
        "DB_HOST": "localhost",
        "DB_USER": "your_username",
        "DB_PASSWORD": "your_password",
        "DB_NAME": "your_database",
        "READ_ONLY": "true"
      }
    }
  }
}
```

Choose your client from the Setup section for detailed configuration instructions.

### For Developers

Install and run as HTTP server:

```bash
npm install postgres-mcp-server
npm run start:http
```

See [HTTP Server Setup](./setup/http-server) for detailed instructions.

## Available Tools

Once configured, you'll have access to these PostgreSQL tools:

- **query** - Execute SQL queries with pagination
- **describe_table** - Get table structure and column details
- **list_tables** - List all tables in a schema
- **list_schemas** - List all database schemas
- **list_indexes** - List table or schema indexes
- **list_views** - List database views
- **list_functions** - List functions and procedures
- **get_constraints** - Get table constraints (foreign keys, unique, etc.)
- **explain_query** - Get query execution plan for performance analysis
- **get_table_stats** - Get table statistics (size, row count, etc.)

## Next Steps

- [Claude Desktop Setup](./setup/claude-desktop) - Configure for Claude Desktop
- [HTTP Server Setup](./setup/http-server) - Run as HTTP server
- [Usage Modes](./guides/usage-modes) - Compare stdio vs HTTP modes

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [GitHub Repository](https://github.com/caleb-mabry/postgres-mcp)

