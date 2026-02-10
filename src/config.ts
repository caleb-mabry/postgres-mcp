/**
 * Centralized configuration management for environment variables
 */
import * as dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  // Database configuration
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    maxConnections: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
    queryTimeoutMs: number;
    ssl: {
      enabled: boolean;
      rejectUnauthorized: boolean;
      caCert?: string;
      allowSelfSigned: boolean;
    };
  };

  // Server configuration
  server: {
    port: number;
    allowedHosts?: string;
  };

  // Query configuration
  query: {
    maxPageSize: number;
    defaultPageSize: number;
    autoLimit: boolean;
    maxPayloadSize: number;
  };

  // Application configuration
  app: {
    readOnly: boolean;
    logLevel: "debug" | "info" | "warn" | "error";
  };
}

/**
 * Load and validate configuration from environment variables
 * @param forceReload - Force reloading from environment variables (useful for tests)
 */
export function loadConfig(forceReload = false): AppConfig {
  // For DB_PASSWORD, allow it to be empty in test/dev environments
  // but it will still be required for actual DB connections
  const dbPassword = process.env.DB_PASSWORD || "";

  return {
    db: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      user: process.env.DB_USER || "postgres",
      password: dbPassword,
      database: process.env.DB_NAME || "postgres",
      maxConnections: parseInt(process.env.DB_POOL_MAX || "5", 10),
      idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT || "5000", 10),
      connectionTimeoutMs: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || "10000",
        10
      ),
      queryTimeoutMs: parseInt(process.env.DB_QUERY_TIMEOUT || "30000", 10),
      ssl: {
        enabled: process.env.DB_SSL !== "false",
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
        caCert: process.env.DB_SSL_CA_CERT,
        allowSelfSigned: process.env.DB_SSL_ALLOW_SELF_SIGNED === "true",
      },
    },

    server: {
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
      allowedHosts: process.env.ALLOWED_HOSTS,
    },

    query: {
      maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || "500", 10),
      defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || "100", 10),
      autoLimit: process.env.AUTO_LIMIT !== "false",
      maxPayloadSize: parseInt(
        process.env.MAX_PAYLOAD_SIZE || String(5 * 1024 * 1024),
        10
      ),
    },

    app: {
      readOnly: process.env.READ_ONLY !== "false",
      logLevel: (process.env.LOG_LEVEL as AppConfig["app"]["logLevel"]) || "info",
    },
  };
}

/**
 * Singleton configuration instance
 * Can be accessed directly for most use cases
 */
export const config: AppConfig = loadConfig();
