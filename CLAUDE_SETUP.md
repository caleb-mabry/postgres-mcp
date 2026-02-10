# Using with Claude Desktop

This server can be used with Claude Desktop via the Model Context Protocol (MCP).

## Quick Setup

### Option 1: Using npx (Recommended)

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "postgres-mcp-server"
      ],
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

### Option 2: Using Local Installation

If you've cloned this repository:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "node",
      "args": [
        "/absolute/path/to/postgres-mcp-server/dist/index.js"
      ],
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

Required:
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

Optional:
- `DB_SSL` - Enable SSL connection (default: false)
- `READ_ONLY` - Restrict to SELECT queries only (default: true)
- `AUTO_LIMIT` - Automatically add LIMIT to queries without one (default: true)
- `DEFAULT_PAGE_SIZE` - Default rows per page (default: 100)
- `MAX_PAGE_SIZE` - Maximum allowed page size (default: 500)

## Security Notes

### Read-Only Mode (Recommended)

When `READ_ONLY=true` (default):
- Only `SELECT`, `WITH` (CTEs), and `EXPLAIN` queries are allowed
- All write operations (`INSERT`, `UPDATE`, `DELETE`) are blocked
- Schema modifications (`CREATE`, `ALTER`, `DROP`) are blocked

### Write Mode

When `READ_ONLY=false`:
- `UPDATE` and `DELETE` require `WHERE` clauses
- Prevents accidental mass updates/deletes
- Still blocks dangerous operations like `DROP`, `TRUNCATE`

## Available Tools

Once configured, Claude Desktop will have access to these PostgreSQL tools:

1. **query** - Execute SQL queries with pagination
2. **describe_table** - Get table structure and column details
3. **list_tables** - List all tables in a schema
4. **list_schemas** - List all database schemas
5. **list_indexes** - List table or schema indexes
6. **list_views** - List database views
7. **list_functions** - List functions and procedures
8. **get_constraints** - Get table constraints
9. **explain_query** - Get query execution plan
10. **get_table_stats** - Get table statistics and size

## Troubleshooting

### Server Not Starting

1. Check Claude Desktop logs:
   - **macOS**: `~/Library/Logs/Claude/mcp*.log`
   - **Windows**: `%APPDATA%\Claude\logs\mcp*.log`

2. Verify database connection:
   ```bash
   psql -h localhost -U your_username -d your_database
   ```

3. Test the server manually:
   ```bash
   npx -y postgres-mcp-server
   ```

### Permission Issues

Ensure your database user has appropriate permissions:

```sql
-- For read-only access
GRANT CONNECT ON DATABASE your_database TO your_username;
GRANT USAGE ON SCHEMA public TO your_username;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_username;

-- For write access (if READ_ONLY=false)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_username;
```

### Connection Errors

- Verify PostgreSQL is running: `pg_isready -h localhost`
- Check firewall settings
- Confirm database credentials
- For SSL issues, set `DB_SSL=true` or `DB_SSL=false` explicitly

## Example Usage in Claude

Once configured, you can ask Claude things like:

- "What tables are in the database?"
- "Show me the structure of the users table"
- "Run a query to find all active users"
- "Explain the performance of this query: SELECT * FROM orders WHERE created_at > '2024-01-01'"
- "What indexes exist on the products table?"

## Advanced Configuration

### Custom Port or SSL

```json
{
  "env": {
    "DB_HOST": "db.example.com",
    "DB_PORT": "5433",
    "DB_SSL": "true",
    "DB_USER": "readonly_user",
    "DB_PASSWORD": "secure_password",
    "DB_NAME": "production_db",
    "READ_ONLY": "true",
    "MAX_PAGE_SIZE": "1000"
  }
}
```

### Multiple Databases

You can configure multiple PostgreSQL connections:

```json
{
  "mcpServers": {
    "postgres-prod": {
      "command": "npx",
      "args": ["-y", "postgres-mcp-server"],
      "env": {
        "DB_NAME": "production",
        "READ_ONLY": "true"
      }
    },
    "postgres-dev": {
      "command": "npx",
      "args": ["-y", "postgres-mcp-server"],
      "env": {
        "DB_NAME": "development",
        "READ_ONLY": "false"
      }
    }
  }
}
```

## Restart Required

After modifying the configuration, restart Claude Desktop for changes to take effect.
