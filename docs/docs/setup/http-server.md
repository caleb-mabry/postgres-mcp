---
sidebar_position: 5
---

# HTTP Server Setup

This server supports the **Streamable HTTP** transport from MCP SDK 1.26.0, which is a modern HTTP-based protocol that supports:

- **Bi-directional streaming** with Server-Sent Events (SSE)
- **Session management** with automatic reconnection
- **Direct HTTP responses** for simple requests
- **Better performance** than traditional SSE-only approaches

## Quick Start

```bash
# Development mode
npm run dev:http

# Production mode
npm run build
npm run start:http
```

The server will start on `http://localhost:3000` by default.

## Configuration

Set these environment variables in your `.env` file:

```env
# PostgreSQL connection
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=postgres
DB_SSL=true

# HTTP server (optional)
PORT=3000
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Docker Setup

To run the HTTP server in Docker, use the `MODE` environment variable:

```bash
# Using docker run
docker run -p 3000:3000 \
  -e MODE=http \
  -e DB_HOST=your_host \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=postgres \
  -e PORT=3000 \
  -e ALLOWED_HOSTS=localhost,127.0.0.1 \
  postgres-mcp-server
```

```yaml
# Using docker-compose
services:
  postgres-mcp-http:
    image: postgres-mcp-server:latest
    environment:
      MODE: http
      PORT: 3000
      ALLOWED_HOSTS: localhost,127.0.0.1
      # ... database config
    ports:
      - "3000:3000"
```

See [Docker Setup](./docker.md) for more details.

## Endpoints

### POST `/mcp`
Main MCP endpoint for sending requests. Requires `mcp-session-id` header after initialization.

**Initialization Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'
```

The response will include an `mcp-session-id` header. Use this for all subsequent requests.

**Tool Call Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_tables",
      "arguments": {
        "schema": "public"
      }
    },
    "id": 2
  }'
```

### GET `/mcp`
Establishes an SSE stream for receiving server notifications. Requires `mcp-session-id` header.

```bash
curl -N -H "mcp-session-id: YOUR_SESSION_ID" \
  http://localhost:3000/mcp
```

### DELETE `/mcp`
Terminates a session. Requires `mcp-session-id` header.

```bash
curl -X DELETE \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  http://localhost:3000/mcp
```

### GET `/health`
Health check endpoint.

```bash
curl http://localhost:3000/health
```

## Features

### Streamable HTTP Transport

The MCP SDK's `StreamableHTTPServerTransport` provides:

1. **Stateful sessions**: Each client gets a unique session ID
2. **SSE streaming**: Long-lived connections for server-to-client messages
3. **HTTP requests**: Client-to-server messages via POST
4. **Automatic reconnection**: Clients can reconnect with `Last-Event-ID`
5. **Session cleanup**: Automatic cleanup on disconnect

### Available Tools

All the standard PostgreSQL tools are available:

- `query` - Execute SQL queries with pagination
- `describe_table` - Get table structure
- `list_tables` - List tables in a schema
- `list_schemas` - List all schemas
- `get_constraints` - Get table constraints
- `list_indexes` - List indexes
- `explain_query` - Get query execution plan
- `get_table_stats` - Get table statistics
- `list_views` - List views
- `list_functions` - List functions and procedures

## Using with MCP Clients

Most MCP clients will handle the Streamable HTTP protocol automatically. Just configure your client with the endpoint URL:

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:3000/mcp')
);

const client = new Client({
  name: 'my-client',
  version: '1.0.0',
}, {
  capabilities: {}
});

await client.connect(transport);

// Use the client...
const tools = await client.listTools();
```

## Advantages Over SSE-Only

The new Streamable HTTP transport offers several advantages:

1. **Better for Claude Desktop/Web**: Modern MCP protocol support
2. **Stateful sessions**: Proper session management with reconnection
3. **Bi-directional**: Both client and server can initiate messages
4. **Built-in reconnection**: Handles network issues gracefully
5. **Industry standard**: Uses standard HTTP + SSE, works with proxies/load balancers

## Troubleshooting

**Session ID errors**: Make sure you're using the session ID from the initialize response in all subsequent requests.

**Connection closed**: The server will close SSE streams periodically. Clients should reconnect automatically using the `Last-Event-ID` header.

**Port in use**: Change the `PORT` environment variable if 3000 is already in use.
