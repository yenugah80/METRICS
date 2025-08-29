/**
 * Production Configuration & Utilities
 * Handles production-specific settings, environment validation, and performance optimizations
 */

import { Express } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { logger } from './logging/logger';

export interface ProductionConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  stripeSecretKey: string;
  openaiApiKey: string;
  sessionSecret: string;
}

/**
 * Validates all required environment variables for production deployment
 */
export function validateProductionEnvironment(): ProductionConfig {
  const required = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'STRIPE_SECRET_KEY',
    'OPENAI_API_KEY',
    'SESSION_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `PRODUCTION ERROR: Missing required environment variables: ${missing.join(', ')}\n` +
      'Please configure all required environment variables before deploying to production.'
    );
  }

  // Validate critical secrets strength
  const secrets = {
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    SESSION_SECRET: process.env.SESSION_SECRET!
  };

  Object.entries(secrets).forEach(([name, value]) => {
    if (value.length < 32) {
      throw new Error(`SECURITY ERROR: ${name} must be at least 32 characters long`);
    }
  });

  logger.info('✅ Production environment validation passed');

  return {
    nodeEnv: process.env.NODE_ENV!,
    port: parseInt(process.env.PORT!) || 5000,
    databaseUrl: process.env.DATABASE_URL!,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    openaiApiKey: process.env.OPENAI_API_KEY!,
    sessionSecret: process.env.SESSION_SECRET!
  };
}

/**
 * Configures production-grade security and performance middleware
 */
export function configureProductionMiddleware(app: Express): void {
  // Security headers for production
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Allow Stripe iframe
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Gzip compression for better performance
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
    memLevel: 8
  }));

  // Trust proxy for rate limiting and security
  app.set('trust proxy', 1);

  logger.info('✅ Production middleware configured');
}

/**
 * Performance monitoring and optimization utilities
 */
export class ProductionOptimizations {
  static enableGracefulShutdown(server: any): void {
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close((err: any) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }
        
        logger.info('✅ Server shut down gracefully');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  static configureProcessEvents(): void {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    process.on('warning', (warning) => {
      logger.warn('Process Warning:', warning);
    });
  }

  static logStartupInfo(config: ProductionConfig): void {
    logger.info('🚀 MyFoodMatrics Production Server Starting', {
      nodeEnv: config.nodeEnv,
      port: config.port,
      timestamp: new Date().toISOString(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage()
    });
  }
}

/**
 * Production health check utilities
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  database: 'connected' | 'disconnected';
  services: {
    auth: boolean;
    ai: boolean;
    payments: boolean;
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  try {
    // Check database connection
    const { db } = await import('./db');
    let databaseStatus: 'connected' | 'disconnected' = 'connected';
    
    try {
      await db.execute('SELECT 1');
    } catch (error) {
      databaseStatus = 'disconnected';
    }

    // Check essential services
    const servicesStatus = {
      auth: !!process.env.JWT_ACCESS_SECRET,
      ai: !!process.env.OPENAI_API_KEY,
      payments: !!process.env.STRIPE_SECRET_KEY
    };

    const allServicesHealthy = Object.values(servicesStatus).every(Boolean) && 
                              databaseStatus === 'connected';

    return {
      status: allServicesHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: databaseStatus,
      services: servicesStatus
    };
  } catch (error) {
    logger.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'disconnected',
      services: {
        auth: false,
        ai: false,
        payments: false
      }
    };
  }
}