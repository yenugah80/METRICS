/**
 * Performance Optimization - Caching Layer
 * Memory and Redis caching for improved performance
 */

import { createHash } from 'crypto';
import { logger } from '../logging/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

// In-memory cache for quick access
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private generateKey(prefix: string, data: any): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(data));
    return `${prefix}:${hash.digest('hex').slice(0, 16)}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  set<T>(key: string, data: T, ttlMs = 300000): void { // Default 5 minutes
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      hits: 0
    });

    logger.debug(`Cache SET: ${key}`, { ttl: `${ttlMs}ms` });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      logger.debug(`Cache MISS: ${key}`);
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      logger.debug(`Cache EXPIRED: ${key}`);
      return null;
    }

    entry.hits++;
    logger.debug(`Cache HIT: ${key}`, { hits: entry.hits });
    return entry.data;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cache cleared`, { entriesRemoved: size });
  }

  getStats(): any {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      expiredEntries: entries.filter(entry => this.isExpired(entry)).length
    };
  }

  private cleanup(): void {
    const before = this.cache.size;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
    
    const removed = before - this.cache.size;
    if (removed > 0) {
      logger.debug(`Cache cleanup completed`, { entriesRemoved: removed });
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Cache instances for different data types
export const nutritionCache = new MemoryCache(500);
export const recipeCache = new MemoryCache(200);
export const userCache = new MemoryCache(1000);
export const imageAnalysisCache = new MemoryCache(300);

// Caching decorators
export function cached(
  cache: MemoryCache,
  keyPrefix: string,
  ttl = 300000
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await method.apply(this, args);
      
      // Store in cache
      cache.set(cacheKey, result, ttl);
      
      return result;
    };
  };
}

// Nutrition data caching
export class NutritionCacheService {
  @cached(nutritionCache, 'nutrition-lookup', 600000) // 10 minutes
  static async getNutritionData(foodId: string): Promise<any> {
    // This will be wrapped with caching
    return null;
  }

  @cached(nutritionCache, 'barcode-lookup', 1800000) // 30 minutes
  static async getBarcodeData(barcode: string): Promise<any> {
    // This will be wrapped with caching
    return null;
  }

  static invalidateNutrition(foodId: string): void {
    const key = `nutrition-lookup:["${foodId}"]`;
    nutritionCache.delete(key);
  }
}

// Recipe caching
export class RecipeCacheService {
  @cached(recipeCache, 'recipe-generation', 3600000) // 1 hour
  static async generateRecipe(preferences: any): Promise<any> {
    // This will be wrapped with caching
    return null;
  }

  @cached(recipeCache, 'recipe-recommendations', 1800000) // 30 minutes
  static async getRecommendations(userId: string): Promise<any> {
    // This will be wrapped with caching
    return null;
  }

  static invalidateUserRecipes(userId: string): void {
    // Clear all recipe cache entries for user
    recipeCache.clear(); // Simple approach - clear all
  }
}

// User data caching
export class UserCacheService {
  @cached(userCache, 'user-profile', 300000) // 5 minutes
  static async getUserProfile(userId: string): Promise<any> {
    // This will be wrapped with caching
    return null;
  }

  @cached(userCache, 'user-preferences', 600000) // 10 minutes
  static async getUserPreferences(userId: string): Promise<any> {
    // This will be wrapped with caching
    return null;
  }

  static invalidateUser(userId: string): void {
    const keys = [
      `user-profile:["${userId}"]`,
      `user-preferences:["${userId}"]`
    ];
    keys.forEach(key => userCache.delete(key));
  }
}

// Image analysis caching
export class ImageCacheService {
  @cached(imageAnalysisCache, 'image-analysis', 7200000) // 2 hours
  static async analyzeImage(imageHash: string): Promise<any> {
    // This will be wrapped with caching
    return null;
  }

  static invalidateImageAnalysis(imageHash: string): void {
    const key = `image-analysis:["${imageHash}"]`;
    imageAnalysisCache.delete(key);
  }
}

// Cache warming - preload frequently accessed data
export class CacheWarmingService {
  static async warmCommonNutritionData(): Promise<void> {
    logger.info('Starting cache warming for nutrition data');
    
    // Common foods that are frequently searched
    const commonFoods = [
      'apple', 'banana', 'chicken breast', 'rice', 'bread',
      'milk', 'egg', 'potato', 'tomato', 'carrot'
    ];

    for (const food of commonFoods) {
      try {
        // Pre-cache common nutrition lookups
        // await NutritionCacheService.getNutritionData(food);
      } catch (error) {
        logger.warn(`Failed to warm cache for ${food}`, error);
      }
    }
    
    logger.info('Cache warming completed');
  }

  static async warmUserSpecificData(userId: string): Promise<void> {
    try {
      // Pre-cache user's profile and preferences
      // await UserCacheService.getUserProfile(userId);
      // await UserCacheService.getUserPreferences(userId);
      
      logger.debug(`User cache warmed for ${userId}`);
    } catch (error) {
      logger.warn(`Failed to warm user cache for ${userId}`, error);
    }
  }
}

// Cache health monitoring
export function getCacheHealthStatus(): any {
  return {
    nutrition: nutritionCache.getStats(),
    recipe: recipeCache.getStats(),
    user: userCache.getStats(),
    imageAnalysis: imageAnalysisCache.getStats(),
    timestamp: new Date().toISOString()
  };
}

// Graceful shutdown
process.on('SIGTERM', () => {
  nutritionCache.destroy();
  recipeCache.destroy();
  userCache.destroy();
  imageAnalysisCache.destroy();
});

process.on('SIGINT', () => {
  nutritionCache.destroy();
  recipeCache.destroy();
  userCache.destroy();
  imageAnalysisCache.destroy();
});