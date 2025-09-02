// ============================================================================
// DATABASE CONNECTION - Simple & Production Ready
// ============================================================================

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../types/schema';

// Create connection pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Initialize Drizzle with schema
export const db = drizzle(pool, { schema });

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}