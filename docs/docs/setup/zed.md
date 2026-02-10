---
sidebar_position: 3
---

# Zed Editor Setup

Zed is a modern, high-performance code editor with built-in MCP support. Here's how to configure postgres-mcp-server with Zed.

See also: [zed_settings_example.json](https://github.com/caleb-mabry/postgres-mcp/blob/main/zed_settings_example.json) in the repository.

## Configuration

Open your Zed settings and add the MCP server configuration:

**Location**: Zed → Settings → Context Servers (or `settings.json`)

```json
{
  "context_servers": {
    "postgres-mcp-server": {
      "command": {
        "path": "npx",
        "args": ["-y", "postgres-mcp-server"]
      },
      "settings": {
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

## Using Local Installation

If you prefer to use a local installation:

```json
{
  "context_servers": {
    "postgres-mcp-server": {
      "command": {
        "path": "node",
        "args": ["/absolute/path/to/postgres-mcp-server/dist/index.js"]
      },
      "settings": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_USER": "your_username",
        "DB_PASSWORD": "your_password",
        "DB_NAME": "your_database",
        "READ_ONLY": "true"
      }
    }
  }
}
```

## Environment Variables

All standard environment variables are supported through the `settings` object:

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_SSL` - Enable SSL ("true"/"false")
- `READ_ONLY` - Restrict to SELECT queries only
- `AUTO_LIMIT` - Automatically limit queries
- `MAX_PAGE_SIZE` - Maximum rows per page
- `DEFAULT_PAGE_SIZE` - Default rows per page
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

## Multiple Database Connections

You can configure multiple databases for different projects:

```json
{
  "context_servers": {
    "postgres-prod": {
      "command": {
        "path": "npx",
        "args": ["-y", "postgres-mcp-server"]
      },
      "settings": {
        "DB_HOST": "prod.example.com",
        "DB_NAME": "production",
        "DB_USER": "readonly_user",
        "DB_PASSWORD": "secure_password",
        "DB_SSL": "true",
        "READ_ONLY": "true"
      }
    },
    "postgres-dev": {
      "command": {
        "path": "npx",
        "args": ["-y", "postgres-mcp-server"]
      },
      "settings": {
        "DB_HOST": "localhost",
        "DB_NAME": "development",
        "DB_USER": "dev_user",
        "DB_PASSWORD": "dev_password",
        "READ_ONLY": "false"
      }
    }
  }
}
```

## Usage in Zed

Once configured, you can use the postgres-mcp-server through Zed's AI assistant:

- Query database tables and schemas
- Execute SQL queries with automatic pagination
- Analyze query performance with EXPLAIN
- Get table statistics and structure

## Troubleshooting

### Server Not Starting

1. Check Zed's console output (View → Toggle Console)
2. Verify database connectivity: `psql -h localhost -U your_username -d your_database`
3. Test the server manually: `npx -y postgres-mcp-server`

### Restart Required

After modifying the configuration, restart Zed for changes to take effect.
