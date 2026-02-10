#!/bin/sh
set -e

# Determine which server to run based on MODE environment variable
MODE=${MODE:-stdio}

case "$MODE" in
  http)
    echo "Starting HTTP server on port ${PORT:-3000}..."
    exec node dist/http-server.js
    ;;
  stdio)
    echo "Starting stdio MCP server..."
    exec node dist/index.js
    ;;
  *)
    echo "Invalid MODE: $MODE. Use 'stdio' or 'http'."
    exit 1
    ;;
esac
