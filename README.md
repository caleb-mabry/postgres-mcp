# Postgres MCP Server

[![npm version](https://badge.fury.io/js/@calebmabry%2Fpostgres-mcp-server.svg)](https://www.npmjs.com/package/@calebmabry/postgres-mcp-server)
[![Tests](https://github.com/caleb-mabry/postgres-mcp/actions/workflows/test.yml/badge.svg)](https://github.com/caleb-mabry/postgres-mcp/actions/workflows/test.yml)
[![GitHub issues](https://img.shields.io/github/issues/caleb-mabry/postgres-mcp)](https://github.com/caleb-mabry/postgres-mcp/issues)
[![Documentation](https://img.shields.io/badge/docs-docusaurus-blue)](https://caleb-mabry.github.io/postgres-mcp/)

A Model Context Protocol (MCP) server that provides secure database access to PostgreSQL through Kysely ORM. This server enables Claude Desktop to interact with PostgreSQL databases using natural language.

## 📚 Documentation

**Full documentation is available at: [caleb-mabry.github.io/postgres-mcp](https://caleb-mabry.github.io/postgres-mcp/)**

## Features

- **MCP Tools**: Query execution, table listing, schema inspection, and constraint information
- **Type Safety**: Full TypeScript support with typed inputs/outputs
- **Connection Pooling**: Configurable connection limits with idle timeout
- **Error Handling**: Graceful error messages for connection and query issues
- **Security**: Parameterized queries to prevent SQL injection

## Quick Start

### For Claude Desktop Users

👉 **See [CLAUDE_SETUP.md](./CLAUDE_SETUP.md) for complete Claude Desktop setup instructions**

### For HTTP/API Usage

See [HTTP_SERVER.md](./HTTP_SERVER.md) for HTTP transport setup

### Direct Installation

```bash
npx -y @calebmabry/postgres-mcp-server
```

## Configuration

Create a `.env` file with your database credentials:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=postgres
DB_SSL=true

# HTTP Server mode only (optional)
PORT=3000
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Available Tools

| Tool                  | Description                                 | Required Parameters                 | Optional Parameters                                         |
| --------------------- | ------------------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| **`query`**           | Execute SQL queries with pagination support | `sql` (string)                      | `pageSize` (1-500), `offset` (number), `parameters` (array) |
| **`describe_table`**  | Get table structure and column details      | `schema` (string), `table` (string) | -                                                           |
| **`list_tables`**     | List all tables in a schema                 | `schema` (string)                   | -                                                           |
| **`list_schemas`**    | List all schemas in the database            | -                                   | `includeSystemSchemas` (boolean)                            |
| **`get_constraints`** | Get table constraints (PK, FK, etc.)        | `schema` (string), `table` (string) | -                                                           |
| **`list_indexes`**    | List indexes for a table or schema          | `schema` (string)                   | `table` (string)                                            |
| **`list_views`**      | List views in a schema                      | `schema` (string)                   | -                                                           |
| **`list_functions`**  | List functions and procedures               | `schema` (string)                   | -                                                           |
| **`explain_query`**   | Get query execution plan                    | `sql` (string)                      | `analyze` (boolean), `format` (text/json/xml/yaml)          |
| **`get_table_stats`** | Get table size and statistics               | `schema` (string)                   | `table` (string)                                            |

### Key Features

- **Pagination**: Query tool supports up to 500 rows per page with automatic LIMIT/OFFSET handling
- **Security**: Parameterized queries prevent SQL injection, READ_ONLY mode by default
- **Type Safety**: Full TypeScript support with Zod schema validation

## Client Configuration

The postgres-mcp-server works with any MCP-compatible client. See configuration examples below:

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "postgres-mcp-server": {
      "command": "npx",
      "args": ["-y", "@calebmabry/postgres-mcp-server"],
      "env": {
        "DB_HOST": "127.0.0.1",
        "DB_PORT": "5432",
        "DB_USER": "postgres",
        "DB_PASSWORD": "your_password_here",
        "DB_NAME": "your_database_name",
        "DB_SSL": "false",
        "READ_ONLY": "true"
      }
    }
  }
}
```

**Config locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

See [claude_config_example.json](./claude_config_example.json) for a full example.

### Cline (VS Code)

Add to `.cline/mcp_settings.json`:

```json
{
  "mcpServers": {
    "postgres-mcp-server": {
      "command": "npx",
      "args": ["-y", "@calebmabry/postgres-mcp-server"],
      "env": {
        "DB_HOST": "localhost",
        "DB_NAME": "your_database",
        "DB_USER": "postgres",
        "DB_PASSWORD": "your_password"
      }
    }
  }
}
```

See [cline_mcp_settings_example.json](./cline_mcp_settings_example.json) for a full example.

### Zed Editor

Add to Zed settings (Settings → Context Servers):

```json
{
  "context_servers": {
    "postgres-mcp-server": {
      "command": {
        "path": "npx",
        "args": ["-y", "@calebmabry/postgres-mcp-server"]
      },
      "settings": {
        "DB_HOST": "localhost",
        "DB_NAME": "your_database",
        "DB_USER": "postgres",
        "DB_PASSWORD": "your_password"
      }
    }
  }
}
```

See [zed_settings_example.json](./zed_settings_example.json) for a full example.

### Docker

Use the included Dockerfile or docker-compose.yml:

```bash
docker-compose up -d
```

See [docker-compose.example.yml](./docker-compose.example.yml) for a full example.

## Development

```bash
# Clone and install dependencies
git clone https://github.com/caleb-mabry/postgres-mcp.git
cd postgres-mcp-server
npm install

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
```

## Environment Variables

| Variable            | Default     | Description                             |
| ------------------- | ----------- | --------------------------------------- |
| `DB_HOST`           | `127.0.0.1` | PostgreSQL host                         |
| `DB_PORT`           | `5432`      | PostgreSQL port                         |
| `DB_USER`           | `postgres`  | Database user                           |
| `DB_PASSWORD`       | _required_  | Database password                       |
| `DB_NAME`           | `postgres`  | Database name                           |
| `DB_SSL`            | `true`      | Enable SSL connection                   |
| `READ_ONLY`         | `true`      | Restrict to SELECT/WITH/EXPLAIN queries |
| `QUERY_TIMEOUT`     | `30000`     | Query timeout in milliseconds           |
| `MAX_PAGE_SIZE`     | `500`       | Maximum rows per page                   |
| `DEFAULT_PAGE_SIZE` | `100`       | Default page size when not specified    |
| `PORT`              | `3000`      | HTTP server port (HTTP mode only)       |
| `ALLOWED_HOSTS`     | _none_      | Comma-separated allowed hosts (HTTP mode only). Example: `localhost,127.0.0.1,example.com` |

## License

ISC
