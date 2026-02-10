import { Kysely, PostgresDialect } from "kysely";
import { Pool, PoolConfig } from "pg";
import { config } from "./config.js";
import { log } from "./logger.js";

export interface Database {
  [key: string]: any;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  maxConnections: number;
  idleTimeoutMs: number;
  ssl: boolean | { rejectUnauthorized: boolean; ca?: string };
  connectionTimeoutMs: number;
  queryTimeoutMs: number;
}

class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private db: Kysely<Database> | null = null;
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private loadConfig(): DatabaseConfig {
    return {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      maxConnections: config.db.maxConnections,
      idleTimeoutMs: config.db.idleTimeoutMs,
      connectionTimeoutMs: config.db.connectionTimeoutMs,
      queryTimeoutMs: config.db.queryTimeoutMs,
      ssl: this.buildSSLConfig(),
    };
  }

  private buildSSLConfig():
    | boolean
    | { rejectUnauthorized: boolean; ca?: string } {
    if (!config.db.ssl.enabled) {
      return false;
    }

    const sslConfig: { rejectUnauthorized: boolean; ca?: string } = {
      rejectUnauthorized: config.db.ssl.rejectUnauthorized,
    };

    // Add CA certificate if provided
    if (config.db.ssl.caCert) {
      sslConfig.ca = config.db.ssl.caCert;
    }

    // For when explicitly allowing self-signed certs
    if (config.db.ssl.allowSelfSigned) {
      sslConfig.rejectUnauthorized = false;
    }

    return sslConfig;
  }

  public getDatabase(): Kysely<Database> {
    if (!this.db) {
      this.connect();
    }
    return this.db!;
  }

  private connect(): void {
    if (this.db) {
      return;
    }

    const poolConfig: PoolConfig = {
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.idleTimeoutMs,
      connectionTimeoutMillis: this.config.connectionTimeoutMs,
      statement_timeout: this.config.queryTimeoutMs,
      query_timeout: this.config.queryTimeoutMs,
      ssl: this.config.ssl,
    };

    this.pool = new Pool(poolConfig);

    this.pool.on("error", (err) => {
      log.error(`Pool error: ${err.message}`, "db", { code: (err as any).code });
    });

    this.pool.on("connect", () => {
      log.debug("New pool connection established", "db");
    });

    this.db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: this.pool,
      }),
    });
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.destroy();
      this.db = null;
    }

    if (this.pool && !this.pool.ended) {
      await this.pool.end();
      this.pool = null;
    }
  }

  public async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      if (!this.db) {
        this.connect();
      }

      await this.db!.selectFrom("information_schema.tables")
        .select("table_name")
        .limit(1)
        .execute();

      return { healthy: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        healthy: false,
        error: errorMessage,
      };
    }
  }

  public getConfig(): DatabaseConfig {
    return { ...this.config }; // Return a copy to prevent modification
  }

  public getPool(): Pool {
    if (!this.pool) {
      this.connect();
    }
    return this.pool!;
  }

  public isConnected(): boolean {
    return this.db !== null && this.pool !== null;
  }
}

export function getDb(): Kysely<Database> {
  return DatabaseManager.getInstance().getDatabase();
}

export async function closeDb(): Promise<void> {
  await DatabaseManager.getInstance().close();
}

export function getPool(): Pool {
  return DatabaseManager.getInstance().getPool();
}

export function getDbManager(): DatabaseManager {
  return DatabaseManager.getInstance();
}
