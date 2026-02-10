---
sidebar_position: 2
---

# Cline (VS Code) Setup

Cline is a popular VS Code extension that supports MCP servers. Here's how to configure postgres-mcp-server with Cline.

See also: [cline_mcp_settings_example.json](https://github.com/caleb-mabry/postgres-mcp/blob/main/cline_mcp_settings_example.json) in the repository.

## Configuration

### Option 1: Using npx (Recommended)

Open your Cline MCP settings file and add:

**Location**: `.cline/mcp_settings.json` in your workspace or VS Code settings

```json
{
  "mcpServers": {
    "postgres-mcp-server": {
      "command": "npx",
      "args": ["-y", "postgres-mcp-server"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_USER": "your_username",
        "DB_PASSWORD": "your_password",
        "DB_NAME": "your_database",
        "DB_SSL": "false",
        "READ_ONLY": "true",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Option 2: Using Local Installation

If you've installed the package globally or locally:

```json
{
  "mcpServers": {
    "postgres-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/postgres-mcp-server/dist/index.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_USER": "your_username",
        "DB_PASSWORD": "your_password",
        "DB_NAME": "your_database",
        "DB_SSL": "false",
        "READ_ONLY": "true"
      }
    }
  }
}
```

## Environment Variables

All standard environment variables are supported. See the [Claude Desktop Setup](./claude-desktop.md#environment-variables) page for details.

## Workspace-Specific Configuration

For project-specific database connections, create `.cline/mcp_settings.json` in your workspace:

```json
{
  "mcpServers": {
    "project-db": {
      "command": "npx",
      "args": ["-y", "postgres-mcp-server"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_USER": "dev_user",
        "DB_PASSWORD": "dev_password",
        "DB_NAME": "project_dev",
        "READ_ONLY": "false",
        "AUTO_LIMIT": "true",
        "MAX_PAGE_SIZE": "500"
      }
    }
  }
}
```

## Usage in Cline

Once configured, you can use the postgres-mcp-server tools within Cline:

- Ask Cline to query your database
- Request table structures and schemas
- Analyze query performance
- Get database statistics

## Troubleshooting

### Server Not Connecting

1. Check the Cline output panel for error messages
2. Verify your database is running and accessible
3. Test connection manually: `psql -h localhost -U your_username -d your_database`

### Extension Reload

After modifying the configuration, reload the Cline extension or restart VS Code.
