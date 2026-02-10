import { describe, test, expect, afterEach } from '@jest/globals';
import { cleanupDatabase } from '../../helpers/cleanup';

// Mock pool.query for unit tests
const mockQuery = jest.fn((sql: string) => {
  if (sql.includes('ERROR')) {
    return Promise.reject(new Error('Mocked SQL error'));
  }
  if (sql.toUpperCase().includes('SELECT') || sql.toUpperCase().includes('WITH') || sql.toUpperCase().includes('EXPLAIN')) {
    return Promise.resolve({ rows: [{ id: 1, name: 'test' }], rowCount: 1 });
  }
  return Promise.resolve({ rows: [], rowCount: 1 });
});

// Mock database module — query.ts imports getPool
jest.mock('../../../src/db', () => ({
  getPool: jest.fn(() => ({
    query: mockQuery
  })),
  closeDb: jest.fn(() => Promise.resolve())
}));

describe('Query Tool Unit Tests', () => {
  beforeAll(() => {
    // Set READ_ONLY=false for unit tests that test write operations
    process.env.READ_ONLY = 'false';
    process.env.NODE_ENV = 'development';
  });

  afterEach(async () => {
    await cleanupDatabase();
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    test('should accept valid query input', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'SELECT 1' });

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    test('should handle empty query string', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: '' });

      expect(result).toBeDefined();
      // Should not crash, behavior depends on database
    });
  });

  describe('Query Type Detection', () => {
    test('should identify SELECT queries correctly', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'SELECT * FROM users' });

      expect(result.rows).toBeDefined();
      expect(result.rowCount).toBe(1);
    });

    test('should identify WITH queries as SELECT-type', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'WITH test AS (SELECT 1) SELECT * FROM test' });

      expect(result.rows).toBeDefined();
      expect(result.rowCount).toBe(1);
    });

    test('should handle INSERT queries correctly', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'INSERT INTO users (name) VALUES (\'test\')' });

      expect(result.rows).toBeUndefined();
      expect(result.rowCount).toBe(1);
    });

    test('should handle UPDATE queries correctly', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'UPDATE users SET name = \'updated\' WHERE id = 1' });

      expect(result.rows).toBeUndefined();
      expect(result.rowCount).toBe(1);
    });

    test('should handle DELETE queries correctly', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'DELETE FROM users WHERE id = 1' });

      expect(result.rows).toBeUndefined();
      expect(result.rowCount).toBe(1);
    });

    test('should block UPDATE queries without WHERE clause', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'UPDATE users SET name = \'updated\'' });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('WHERE clause');
    });

    test('should block DELETE queries without WHERE clause', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'DELETE FROM users' });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('WHERE clause');
    });
  });

  describe('Error Handling', () => {
    test('should return error object for failed queries', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'ERROR QUERY' });

      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.rows).toBeUndefined();
      expect(result.rowCount).toBeUndefined();
    });

    test('should handle non-Error exceptions', async () => {
      mockQuery.mockRejectedValueOnce('string error');

      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'SELECT 1' });

      expect(result.error).toBe('Unknown error occurred');
    });
  });

  describe('Return Value Structure', () => {
    test('should return rows and rowCount for SELECT queries', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'SELECT id FROM users' });

      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('rowCount');
      expect(result).not.toHaveProperty('error');
      expect(Array.isArray(result.rows)).toBe(true);
      expect(typeof result.rowCount).toBe('number');
    });

    test('should return only rowCount for DML queries', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'INSERT INTO users (name) VALUES (\'test\')' });

      expect(result).not.toHaveProperty('rows');
      expect(result).toHaveProperty('rowCount');
      expect(result).not.toHaveProperty('error');
      expect(typeof result.rowCount).toBe('number');
    });

    test('should return only rowCount for UPDATE queries with WHERE', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'UPDATE users SET name = \'test\' WHERE id = 1' });

      expect(result).not.toHaveProperty('rows');
      expect(result).toHaveProperty('rowCount');
      expect(result).not.toHaveProperty('error');
      expect(typeof result.rowCount).toBe('number');
    });

    test('should return error for failed queries', async () => {
      const { queryTool } = await import('../../../src/tools/query');

      const result = await queryTool({ sql: 'ERROR QUERY' });

      expect(result).toHaveProperty('error');
      expect(result).not.toHaveProperty('rows');
      expect(result).not.toHaveProperty('rowCount');
      expect(typeof result.error).toBe('string');
    });
  });
});
