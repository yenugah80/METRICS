/**
 * Database Performance Optimization
 * Connection pooling, query optimization, and monitoring
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { logger, PerformanceMonitor } from '../logging/logger';
import * as schema from '../../shared/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

// Enhanced database configuration
const databaseConfig = {
  connectionString: process.env.DATABASE_URL!,
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
};

// Validate database configuration
if (!databaseConfig.connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create connection pool with optimized settings
export const pool = new Pool({
  connectionString: databaseConfig.connectionString,
  max: databaseConfig.maxConnections,
  idleTimeoutMillis: databaseConfig.idleTimeout,
  connectionTimeoutMillis: databaseConfig.connectionTimeout,
});

// Create Drizzle instance with performance monitoring
export const db = drizzle({ client: pool, schema });

// Database performance monitoring
class DatabaseMonitor {
  private queryCount = 0;
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];
  private connectionCount = 0;

  logQuery(query: string, duration: number): void {
    this.queryCount++;
    
    if (duration > 1000) { // Slow query threshold: 1 second
      this.slowQueries.push({
        query: query.substring(0, 200), // Truncate long queries
        duration,
        timestamp: new Date()
      });
      
      logger.warn('Slow database query detected', {
        query: query.substring(0, 200),
        duration: `${duration}ms`
      });
    }
    
    logger.debug('Database query executed', {
      duration: `${duration}ms`,
      queryPreview: query.substring(0, 100)
    });
  }

  getStats(): any {
    return {
      totalQueries: this.queryCount,
      slowQueries: this.slowQueries.length,
      activeConnections: this.connectionCount,
      recentSlowQueries: this.slowQueries.slice(-5) // Last 5 slow queries
    };
  }

  reset(): void {
    this.queryCount = 0;
    this.slowQueries = [];
  }
}

export const dbMonitor = new DatabaseMonitor();

// Enhanced query wrapper with performance monitoring
export async function monitoredQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = Date.now();
  PerformanceMonitor.start(`db:${queryName}`);
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    dbMonitor.logQuery(queryName, duration);
    PerformanceMonitor.end(`db:${queryName}`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Database query failed: ${queryName}`, {
      error,
      duration: `${duration}ms`
    });
    throw error;
  }
}

// Optimized database operations
export class OptimizedQueries {
  // Batch operations for better performance
  static async batchInsert<T extends keyof typeof schema>(
    table: T,
    data: any[],
    batchSize = 100
  ): Promise<void> {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await monitoredQuery(
        () => db.insert(schema[table] as any).values(batch),
        `batch-insert-${String(table)}`
      );
    }
  }

  // Optimized user queries with proper indexing
  static async getUserWithStats(userId: string): Promise<any> {
    return monitoredQuery(async () => {
      // Single query to get user with related stats
      const [userWithStats] = await db
        .select({
          user: schema.users,
          mealCount: sql<number>`count(${schema.meals.id})`,
          premiumStatus: schema.users.isPremium,
          lastActivity: sql<Date>`max(${schema.meals.createdAt})`
        })
        .from(schema.users)
        .leftJoin(schema.meals, eq(schema.meals.userId, schema.users.id))
        .where(eq(schema.users.id, userId))
        .groupBy(schema.users.id);

      return userWithStats;
    }, 'get-user-with-stats');
  }

  // Optimized meal queries with pagination
  static async getUserMealsPaginated(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<any> {
    return monitoredQuery(async () => {
      const offset = (page - 1) * limit;
      
      const meals = await db
        .select({
          id: schema.meals.id,
          name: schema.meals.name,
          imageUrl: schema.meals.imageUrl,
          createdAt: schema.meals.createdAt,
          totalCalories: schema.meals.totalCalories,
          itemCount: sql<number>`count(${schema.mealItems.id})`
        })
        .from(schema.meals)
        .leftJoin(schema.mealItems, eq(schema.mealItems.mealId, schema.meals.id))
        .where(eq(schema.meals.userId, userId))
        .groupBy(schema.meals.id)
        .orderBy(desc(schema.meals.createdAt))
        .limit(limit)
        .offset(offset);

      return meals;
    }, 'get-user-meals-paginated');
  }

  // Optimized nutrition aggregation
  static async getDailyNutritionStats(
    userId: string,
    date: Date
  ): Promise<any> {
    return monitoredQuery(async () => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const [stats] = await db
        .select({
          totalCalories: sql<number>`coalesce(sum(${schema.meals.totalCalories}), 0)`,
          totalProtein: sql<number>`coalesce(sum(${schema.meals.totalProtein}), 0)`,
          totalCarbs: sql<number>`coalesce(sum(${schema.meals.totalCarbs}), 0)`,
          totalFat: sql<number>`coalesce(sum(${schema.meals.totalFat}), 0)`,
          mealCount: sql<number>`count(${schema.meals.id})`
        })
        .from(schema.meals)
        .where(
          and(
            eq(schema.meals.userId, userId),
            sql`${schema.meals.createdAt} >= ${startOfDay}`,
            sql`${schema.meals.createdAt} <= ${endOfDay}`
          )
        );

      return stats;
    }, 'get-daily-nutrition-stats');
  }

  // Optimized recipe queries with filtering
  static async getPersonalizedRecipes(
    userId: string,
    dietary_preferences: string[] = [],
    limit = 10
  ): Promise<any> {
    return monitoredQuery(async () => {
      let query = db
        .select()
        .from(schema.recipes)
        .where(eq(schema.recipes.userId, userId))
        .orderBy(desc(schema.recipes.createdAt))
        .limit(limit);

      // Add dietary preference filtering if provided
      if (dietary_preferences.length > 0) {
        query = query.where(
          sql`${schema.recipes.dietaryTags} && ${dietary_preferences}`
        );
      }

      return await query;
    }, 'get-personalized-recipes');
  }

  // Optimized search with full-text search
  static async searchFoods(
    searchTerm: string,
    limit = 50
  ): Promise<any> {
    return monitoredQuery(async () => {
      // Use PostgreSQL full-text search for better performance
      const foods = await db
        .select()
        .from(schema.foods)
        .where(
          sql`to_tsvector('english', ${schema.foods.name} || ' ' || coalesce(${schema.foods.description}, '')) 
              @@ plainto_tsquery('english', ${searchTerm})`
        )
        .orderBy(
          sql`ts_rank(to_tsvector('english', ${schema.foods.name}), plainto_tsquery('english', ${searchTerm})) DESC`
        )
        .limit(limit);

      return foods;
    }, 'search-foods-fulltext');
  }
}

// Database health monitoring
export async function getDatabaseHealth(): Promise<any> {
  try {
    const start = Date.now();
    
    // Test basic connectivity
    await db.execute(sql`SELECT 1`);
    const connectionTime = Date.now() - start;
    
    // Get pool statistics (if available)
    const poolStats = {
      totalConnections: pool.totalCount || 0,
      idleConnections: pool.idleCount || 0,
      waitingClients: pool.waitingCount || 0,
    };
    
    return {
      status: 'healthy',
      connectionTime: `${connectionTime}ms`,
      pool: poolStats,
      monitor: dbMonitor.getStats(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check failed', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// Database migration safety
export async function validateSchema(): Promise<boolean> {
  try {
    // Basic schema validation queries
    const tables = [
      'users', 'meals', 'meal_items', 'recipes', 'foods',
      'nutrition_scores', 'user_usage_stats', 'auth_providers'
    ];
    
    for (const table of tables) {
      await db.execute(sql.raw(`SELECT 1 FROM ${table} LIMIT 1`));
    }
    
    logger.info('Database schema validation passed');
    return true;
  } catch (error) {
    logger.error('Database schema validation failed', error);
    return false;
  }
}

// Cleanup and optimization
export async function optimizeDatabase(): Promise<void> {
  try {
    logger.info('Starting database optimization');
    
    // Analyze tables for better query planning
    const tables = [
      'users', 'meals', 'meal_items', 'recipes', 'foods'
    ];
    
    for (const table of tables) {
      await db.execute(sql.raw(`ANALYZE ${table}`));
    }
    
    // Clean up old data (if needed)
    // await cleanupOldData();
    
    logger.info('Database optimization completed');
  } catch (error) {
    logger.error('Database optimization failed', error);
    throw error;
  }
}

// Graceful database shutdown
export async function closeDatabaseConnections(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections', error);
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  await closeDatabaseConnections();
});

process.on('SIGINT', async () => {
  await closeDatabaseConnections();
});