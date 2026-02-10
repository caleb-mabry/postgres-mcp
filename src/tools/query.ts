import { getPool } from "../db.js";
import { config } from "../config.js";
import {
  QueryInputSchema,
  validateInput,
  type QueryOutput,
} from "../validation.js";
import NodeSQL from "node-sql-parser/build/postgresql.js";

export const MAX_PAGE_SIZE = config.query.maxPageSize;
export const DEFAULT_PAGE_SIZE = config.query.defaultPageSize;
// Set to 'false' to disable automatic LIMIT application
const AUTO_LIMIT = config.query.autoLimit;
// Maximum payload size in bytes (default 5MB)
export const MAX_PAYLOAD_SIZE = config.query.maxPayloadSize;

const sqlParser = new NodeSQL.Parser();

function isReadOnlyMode(): boolean {
  // Check environment variable directly to support test configuration changes
  return process.env.READ_ONLY !== "false";
}

// Dangerous operations that are never allowed
const DANGEROUS_OPERATIONS = [
  "DROP",
  "CREATE",
  "ALTER",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "VACUUM",
  "ANALYZE",
  "CLUSTER",
  "REINDEX",
  "COPY",
  "BACKUP",
  "RESTORE",
  "ATTACH",
  "DETACH",
  "PRAGMA",
];

function validateSqlSafety(sqlString: string): {
  isValid: boolean;
  error?: string;
} {
  if (!sqlString || typeof sqlString !== "string") {
    return {
      isValid: false,
      error: "SQL query is required and must be a string",
    };
  }

  const trimmedSql = sqlString.trim();
  if (!trimmedSql) {
    return { isValid: false, error: "SQL query cannot be empty" };
  }

  // Check for dangerous operations BEFORE parsing (since parser may not support them)
  const upperSql = trimmedSql.toUpperCase();
  const sqlWords = upperSql.split(/\s+/);
  const firstWord = sqlWords[0];
  
  if (DANGEROUS_OPERATIONS.includes(firstWord)) {
    return {
      isValid: false,
      error: `Dangerous operation '${firstWord}' is not allowed`,
    };
  }

  // Handle EXPLAIN queries - they're read-only and don't need parsing
  if (firstWord === 'EXPLAIN') {
    // EXPLAIN is allowed in both read-only and write modes
    return { isValid: true };
  }

  // Handle MERGE and UPSERT - not allowed in read-only mode
  if (firstWord === 'MERGE' || firstWord === 'UPSERT') {
    if (isReadOnlyMode()) {
      return {
        isValid: false,
        error: "Only SELECT, WITH, and EXPLAIN queries are allowed in read-only mode",
      };
    }
    // These operations require WHERE clauses in write mode, but parser can't handle them
    // For now, we'll reject them since we can't safely validate them
    return {
      isValid: false,
      error: "MERGE and UPSERT operations are not currently supported",
    };
  }

  // Parse SQL to understand its structure
  let ast;
  try {
    ast = sqlParser.astify(trimmedSql);
  } catch (parseError) {
    return {
      isValid: false,
      error: "Invalid SQL syntax - unable to parse query",
    };
  }

  // Convert to array if single statement
  const statements = Array.isArray(ast) ? ast : [ast];

  // Validate each statement
  for (const statement of statements) {
    const statementType = statement.type?.toUpperCase();

    // Check for dangerous operations
    if (DANGEROUS_OPERATIONS.includes(statementType)) {
      return {
        isValid: false,
        error: `Dangerous operation '${statementType}' is not allowed`,
      };
    }

    // In read-only mode, only allow SELECT, WITH (CTE), and EXPLAIN
    if (isReadOnlyMode()) {
      const allowedTypes = ["SELECT", "WITH", "EXPLAIN"];
      if (!allowedTypes.includes(statementType)) {
        return {
          isValid: false,
          error: "Only SELECT, WITH, and EXPLAIN queries are allowed in read-only mode",
        };
      }
    } else {
      // Even in write mode, validate UPDATE and DELETE have WHERE clauses
      if (statementType === "UPDATE" || statementType === "DELETE") {
        // Type guard to check if statement has a where property
        if (!("where" in statement) || !statement.where) {
          return {
            isValid: false,
            error: `${statementType} operations must include a WHERE clause`,
          };
        }

        // Check for dangerous WHERE patterns that effectively disable the clause
        // These are patterns like WHERE 1=1, WHERE TRUE, WHERE 1, WHERE '1'='1'
        const where: any = statement.where;
        
        // Check for WHERE TRUE
        if (where && where.type === 'bool' && where.value === true) {
          return {
            isValid: false,
            error: `${statementType} operations cannot use trivial WHERE clauses like WHERE 1=1 or WHERE TRUE`,
          };
        }
        
        // Check for WHERE 1 (just a constant value)
        if (where && where.type === 'number') {
          return {
            isValid: false,
            error: `${statementType} operations cannot use trivial WHERE clauses like WHERE 1=1 or WHERE TRUE`,
          };
        }
        
        // Check for WHERE 1=1 pattern (binary expression comparing same constants)
        if (where && where.type === 'binary_expr' && where.operator === '=') {
          const left = where.left;
          const right = where.right;
          
          // Both sides are the same constant number
          if (left && right && left.type === 'number' && right.type === 'number' && left.value === right.value) {
            return {
              isValid: false,
              error: `${statementType} operations cannot use trivial WHERE clauses like WHERE 1=1 or WHERE TRUE`,
            };
          }
          
          // Both sides are the same string literal
          if (left && right && left.type === 'single_quote_string' && right.type === 'single_quote_string' && left.value === right.value) {
            return {
              isValid: false,
              error: `${statementType} operations cannot use trivial WHERE clauses like WHERE 1=1 or WHERE TRUE`,
            };
          }
          
          // Both sides are the same identifier (double-quoted or column reference)
          // In PostgreSQL, "1"="1" would be comparing column "1" to column "1"
          if (left && right && left.type === 'column_ref' && right.type === 'column_ref') {
            // Extract values from nested structure
            const leftExpr = left.column?.expr || left.column;
            const rightExpr = right.column?.expr || right.column;
            
            // Check if both are double_quote_string with same value
            if (leftExpr && rightExpr && 
                leftExpr.type === 'double_quote_string' && 
                rightExpr.type === 'double_quote_string' && 
                leftExpr.value === rightExpr.value) {
              return {
                isValid: false,
                error: `${statementType} operations cannot use trivial WHERE clauses like WHERE 1=1 or WHERE TRUE`,
              };
            }
            
            // Check if both are the same column name
            if (typeof leftExpr === 'string' && typeof rightExpr === 'string' && leftExpr === rightExpr) {
              return {
                isValid: false,
                error: `${statementType} operations cannot use trivial WHERE clauses like WHERE 1=1 or WHERE TRUE`,
              };
            }
          }
        }
      }
    }
  }

  return { isValid: true };
}

function isReadOnlyQuery(sqlString: string): boolean {
  const upperSql = sqlString.trim().toUpperCase();
  return (
    upperSql.startsWith("SELECT") ||
    upperSql.startsWith("WITH") ||
    upperSql.startsWith("EXPLAIN")
  );
}

function isSingleRowAggregate(upperSql: string): boolean {
  // Check if it's an aggregate query that should return a single row
  const hasAggregates =
    upperSql.includes("COUNT(") ||
    upperSql.includes("SUM(") ||
    upperSql.includes("AVG(") ||
    upperSql.includes("MAX(") ||
    upperSql.includes("MIN(");
  const hasGroupBy = upperSql.includes("GROUP BY");

  // Single row aggregate: has aggregates but no GROUP BY
  return hasAggregates && !hasGroupBy;
}

function applyPagination(
  sqlString: string,
  pageSize?: number,
  offset?: number
): {
  sql: string;
  actualPageSize: number;
  actualOffset: number;
} {
  // Strip trailing semicolons to avoid syntax errors when adding LIMIT/OFFSET
  const cleanedSql = sqlString.trim().replace(/;+$/, '');
  const upperSql = cleanedSql.toUpperCase();

  // Don't modify if already has LIMIT or OFFSET
  if (upperSql.includes("LIMIT") || upperSql.includes("OFFSET")) {
    return {
      sql: cleanedSql,
      actualPageSize: pageSize || DEFAULT_PAGE_SIZE,
      actualOffset: offset || 0,
    };
  }

  // Use client-specified pageSize or default, capped at MAX_PAGE_SIZE
  const actualPageSize = Math.min(pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const actualOffset = offset || 0;

  // Don't add LIMIT to single-row aggregates
  if (isSingleRowAggregate(upperSql)) {
    return { sql: cleanedSql, actualPageSize, actualOffset };
  }

  // If AUTO_LIMIT is disabled and no pageSize was explicitly provided, don't add LIMIT
  if (!AUTO_LIMIT && !pageSize) {
    return { sql: cleanedSql, actualPageSize, actualOffset };
  }

  let paginatedSql = `${cleanedSql} LIMIT ${actualPageSize}`;
  if (actualOffset > 0) {
    paginatedSql += ` OFFSET ${actualOffset}`;
  }

  return { sql: paginatedSql, actualPageSize, actualOffset };
}

function validateParameters(
  parameters: unknown[]
): { error: string } | null {
  for (const param of parameters) {
    if (
      param !== null &&
      typeof param !== "string" &&
      typeof param !== "number" &&
      typeof param !== "boolean"
    ) {
      return {
        error:
          "Invalid parameter type - only string, number, boolean, and null are allowed",
      };
    }
    if (typeof param === "number" && !Number.isFinite(param)) {
      return { error: "Invalid numeric parameter - must be finite number" };
    }
  }
  return null;
}

export async function queryTool(input: unknown): Promise<QueryOutput> {
  try {
    const inputValidation = validateInput(QueryInputSchema, input);
    if (!inputValidation.success) {
      return { error: `Input validation failed: ${inputValidation.error}` };
    }

    const validatedInput = inputValidation.data;

    const sqlValidation = validateSqlSafety(validatedInput.sql);
    if (!sqlValidation.isValid) {
      return { error: sqlValidation.error };
    }

    const pool = getPool();
    const trimmedSql = validatedInput.sql.trim();
    const params = validatedInput.parameters ?? [];

    if (params.length > 0) {
      const paramError = validateParameters(params);
      if (paramError) return paramError;
    }

    if (isReadOnlyQuery(trimmedSql)) {
      const {
        sql: paginatedSql,
        actualPageSize,
        actualOffset,
      } = applyPagination(
        trimmedSql,
        validatedInput.pageSize,
        validatedInput.offset
      );

      // Execute the query
      const result = params.length > 0
        ? await pool.query(paginatedSql, params)
        : await pool.query(paginatedSql);

      // Check payload size after query execution
      const payloadJson = JSON.stringify(result.rows);
      const payloadSize = Buffer.byteLength(payloadJson, 'utf8');
      
      if (payloadSize > MAX_PAYLOAD_SIZE) {
        const sizeMB = (payloadSize / (1024 * 1024)).toFixed(2);
        const maxMB = (MAX_PAYLOAD_SIZE / (1024 * 1024)).toFixed(2);
        return {
          error: `Query result payload (${sizeMB}MB) exceeds maximum allowed size (${maxMB}MB). Please reduce pageSize or add more specific WHERE conditions to limit results.`,
        };
      }

      // Determine if there are more rows available
      const hasMore = result.rows.length === actualPageSize;

      return {
        rows: result.rows as Record<string, any>[],
        rowCount: result.rows.length,
        pagination: {
          hasMore,
          pageSize: actualPageSize,
          offset: actualOffset,
        },
      };
    } else {
      // For write operations (when not in read-only mode)
      const cleanedSql = trimmedSql.replace(/;+$/, '');

      const result = params.length > 0
        ? await pool.query(cleanedSql, params)
        : await pool.query(cleanedSql);

      return {
        rowCount: result.rowCount ?? 0,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Extract PostgreSQL-specific error details if available
    const pgError = error as any;
    const errorCode = pgError?.code || "UNKNOWN";
    const hint = pgError?.hint;
    const sanitizedError = errorMessage.replace(/\s+/g, " ").trim();

    return {
      error: sanitizedError,
      code: errorCode,
      hint: hint,
    };
  }
}
