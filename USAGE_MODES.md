# PostgreSQL MCP Server - Usage Modes

This server can be run in two different modes depending on your use case.

## Mode 1: Claude Desktop (Stdio) - Recommended for Desktop Users

**Best for**: Using with Claude Desktop application

This mode uses stdio (standard input/output) for communication and is the easiest way to integrate with Claude Desktop.

### Setup

1. See **[CLAUDE_SETUP.md](./CLAUDE_SETUP.md)** for complete setup instructions
2. Add configuration to `claude_desktop_config.json`
3. Restart Claude Desktop

### Quick Config

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@calebmabry/postgres-mcp-server"],
      "env": {
        "DB_HOST": "localhost",
        "DB_USER": "your_user",
        "DB_PASSWORD": "your_password",
        "DB_NAME": "your_database"
      }
    }
  }
}
```

## Mode 2: HTTP Server (StreamableHTTP) - For Integration

**Best for**: Web applications, APIs, remote access, custom integrations

This mode runs an HTTP server with Server-Sent Events (SSE) for bidirectional communication.

### Setup

1. See **[HTTP_SERVER.md](./HTTP_SERVER.md)** for complete setup instructions
2. Start the HTTP server
3. Connect via HTTP client

### Quick Start

```bash
# Development
npm run dev:http

# Production
npm run build
npm run start:http
```

Server will be available at:
- MCP endpoint: `http://localhost:3000/mcp`
- Health check: `http://localhost:3000/health`

## Comparison

| Feature | Stdio Mode | HTTP Mode |
|---------|------------|-----------|
| **Use Case** | Claude Desktop | Web apps, APIs |
| **Transport** | stdin/stdout | HTTP + SSE |
| **Startup** | `npx @calebmabry/postgres-mcp-server` | `npm run start:http` |
| **Sessions** | Single | Multiple concurrent |
| **Security** | Local only | Network accessible |
| **Configuration** | Environment vars | Environment vars |
| **Best For** | Desktop AI assistant | Remote access, integrations |

## Environment Variables (Both Modes)

### Required
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

### Optional Security
- `DB_SSL` - Enable SSL (default: false)
- `READ_ONLY` - Restrict to SELECT queries (default: true)
- `AUTO_LIMIT` - Auto-add LIMIT to queries (default: true)
- `DEFAULT_PAGE_SIZE` - Default page size (default: 100)
- `MAX_PAGE_SIZE` - Maximum page size (default: 500)

### HTTP Mode Only
- `PORT` - HTTP server port (default: 3000)

## Choosing the Right Mode

### Use Stdio Mode (Claude Desktop) if:
- ✅ You're using Claude Desktop app
- ✅ You want the simplest setup
- ✅ Database is on same machine or accessible via localhost
- ✅ You only need one user at a time

### Use HTTP Mode if:
- ✅ Building a web application
- ✅ Need remote database access
- ✅ Multiple concurrent users
- ✅ Custom MCP client integration
- ✅ Need RESTful health checks or monitoring

## Available Tools (Both Modes)

Both modes provide the same database tools:

1. **query** - Execute SQL queries with pagination
2. **describe_table** - Get table structure
3. **list_tables** - List all tables
4. **list_schemas** - List database schemas
5. **list_indexes** - List table indexes
6. **list_views** - List database views
7. **list_functions** - List functions/procedures
8. **get_constraints** - Get table constraints
9. **explain_query** - Get query execution plan
10. **get_table_stats** - Get table statistics

## Security Best Practices

### For Both Modes:
- Use `READ_ONLY=true` for production (default)
- Create dedicated database users with minimal permissions
- Use strong passwords
- Enable SSL for remote connections: `DB_SSL=true`

### For HTTP Mode (Additional):
- Run behind a reverse proxy (nginx, Apache)
- Use authentication middleware
- Implement rate limiting
- Use HTTPS in production
- Restrict network access with firewall rules

## Troubleshooting

### Stdio Mode Issues
See [CLAUDE_SETUP.md - Troubleshooting](./CLAUDE_SETUP.md#troubleshooting)

### HTTP Mode Issues
See [HTTP_SERVER.md - Troubleshooting](./HTTP_SERVER.md#troubleshooting)

### Common Issues (Both Modes)

**Connection refused**
- Verify PostgreSQL is running: `pg_isready`
- Check host/port settings
- Verify firewall rules

**Authentication failed**
- Confirm username/password
- Check `pg_hba.conf` for access rules
- Verify database exists: `psql -l`

**SSL errors**
- Set `DB_SSL=true` or `DB_SSL=false` explicitly
- For self-signed certs, may need additional configuration

## Development

```bash
# Install dependencies
npm install

# Run stdio mode in dev
npm run dev

# Run HTTP mode in dev
npm run dev:http

# Run tests
npm test

# Build for production
npm run build
```

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
