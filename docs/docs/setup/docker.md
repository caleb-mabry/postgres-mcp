---
sidebar_position: 4
---

# Docker Setup

Run postgres-mcp-server and PostgreSQL together using Docker and Docker Compose.

See also: [docker-compose.example.yml](https://github.com/caleb-mabry/postgres-mcp/blob/main/docker-compose.example.yml) and [Dockerfile](https://github.com/caleb-mabry/postgres-mcp/blob/main/Dockerfile) in the repository.

## Docker Compose (Recommended)

Create a `docker-compose.yml` file in your project:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  postgres-mcp-server:
    image: postgres-mcp-server:latest
    # Or build from source:
    # build: .
    container_name: postgres-mcp-server
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: mydb
      DB_SSL: "false"
      READ_ONLY: "true"
      LOG_LEVEL: info
    depends_on:
      postgres:
        condition: service_healthy
    stdin_open: true
    tty: true

volumes:
  postgres_data:
```

## Running with Docker Compose

```bash
# Start both services
docker-compose up -d

# View logs
docker-compose logs -f postgres-mcp-server

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Building the Docker Image

The Dockerfile is included in the repository:

```bash
# Build the image
docker build -t postgres-mcp-server .

# Run the container
docker run -it \
  -e DB_HOST=your_db_host \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=your_database \
  -e DB_SSL=false \
  -e READ_ONLY=true \
  postgres-mcp-server
```

## Using with External Database

If you have an existing PostgreSQL database, you can run just the MCP server:

```yaml
version: '3.8'

services:
  postgres-mcp-server:
    image: postgres-mcp-server:latest
    environment:
      DB_HOST: external-db.example.com
      DB_PORT: 5432
      DB_USER: your_username
      DB_PASSWORD: your_password
      DB_NAME: your_database
      DB_SSL: "true"
      READ_ONLY: "true"
    stdin_open: true
    tty: true
```

## Environment Variables

All standard environment variables are supported:

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_SSL` - Enable SSL connection
- `DB_SSL_REJECT_UNAUTHORIZED` - Reject unauthorized SSL certificates
- `DB_SSL_ALLOW_SELF_SIGNED` - Allow self-signed certificates
- `READ_ONLY` - Restrict to SELECT queries only
- `AUTO_LIMIT` - Automatically limit queries
- `MAX_PAGE_SIZE` - Maximum rows per page
- `DEFAULT_PAGE_SIZE` - Default rows per page
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

## Production Considerations

### Using Secrets

For production, use Docker secrets or environment files instead of inline environment variables:

```yaml
services:
  postgres-mcp-server:
    image: postgres-mcp-server:latest
    env_file:
      - .env.production
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### Health Checks

Add health checks to ensure the service is ready:

```yaml
services:
  postgres-mcp-server:
    image: postgres-mcp-server:latest
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Network Configuration

The MCP server communicates via stdin/stdout, so no network ports need to be exposed. However, if using HTTP mode, expose port 3000:

```yaml
services:
  postgres-mcp-server:
    image: postgres-mcp-server:latest
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
    command: ["node", "dist/http-server.js"]
```

## Troubleshooting

### Container Not Starting

```bash
# Check logs
docker-compose logs postgres-mcp-server

# Check if database is reachable
docker-compose exec postgres-mcp-server ping postgres

# Test database connection
docker-compose exec postgres psql -U postgres -d mydb
```

### Permission Issues

Ensure the database user has appropriate permissions:

```bash
docker-compose exec postgres psql -U postgres -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_user;"
```
