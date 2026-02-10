import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import fs from 'fs';
import path from 'path';

// Get directory path for file loading
const getCurrentDir = () => path.dirname(__filename);

export interface TestDatabase {
  [key: string]: any;
}

let container: StartedPostgreSqlContainer | null = null;
let pool: Pool | null = null;
let db: Kysely<any> | null = null;

export async function isDockerAvailable(): Promise<boolean> {
  try {
    // Try to create a container to check if Docker is available
    await new PostgreSqlContainer('postgres:15').start().then(c => c.stop());
    return true;
  } catch (error) {
    return false;
  }
}

export async function setupTestContainer(): Promise<{
  container: StartedPostgreSqlContainer;
  pool: Pool;
  connectionInfo: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
}> {
  if (!(await isDockerAvailable())) {
    throw new Error('Docker is not available. Testcontainer tests require Docker to be running.');
  }

  // Start PostgreSQL container
  container = await new PostgreSqlContainer('postgres:15')
    .withDatabase('testdb')
    .withUsername('testuser')
    .withPassword('testpass')
    .start();

  const connectionInfo = {
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  };

  pool = new Pool({
    host: connectionInfo.host,
    port: connectionInfo.port,
    user: connectionInfo.username,
    password: connectionInfo.password,
    database: connectionInfo.database,
    max: 5,
    idleTimeoutMillis: 30000,
  });

  // Create Kysely instance
  db = new Kysely({
    dialect: new PostgresDialect({
      pool,
    }),
  });

  // Set up schema and data
  await setupTestSchema(pool);
  await loadSampleData(pool);

  return { container, pool, connectionInfo };
}

export async function teardownTestContainer(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
  }
  if (pool && !pool.ended) {
    await pool.end();
    pool = null;
  }
  if (container) {
    await container.stop();
    container = null;
  }
}

async function setupTestSchema(pool: Pool): Promise<void> {
  const schemaPath = path.join(getCurrentDir(), '../fixtures/test-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function loadSampleData(pool: Pool): Promise<void> {
  const dataPath = path.join(getCurrentDir(), '../fixtures/sample-data.sql');
  const data = fs.readFileSync(dataPath, 'utf-8');

  // Split by semicolon and execute each statement
  const statements = data
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

export function getTestPool(): Pool {
  if (!pool) {
    throw new Error('Test pool not initialized. Call setupTestContainer first.');
  }
  return pool;
}

export function getTestContainer(): StartedPostgreSqlContainer {
  if (!container) {
    throw new Error('Test container not initialized. Call setupTestContainer first.');
  }
  return container;
}

export function getTestDb(): Kysely<any> {
  if (!db) {
    throw new Error('Test database not initialized. Call setupTestContainer first.');
  }
  return db;
}
