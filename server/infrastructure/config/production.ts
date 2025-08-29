/**
 * Production Environment Configuration
 * Centralized configuration management with validation and type safety
 */

import { logger } from '../logging/logger';

export interface ProductionConfig {
  // Application
  nodeEnv: string;
  port: number;
  apiVersion: string;
  
  // Database
  databaseUrl: string;
  maxDatabaseConnections: number;
  databaseTimeout: number;
  
  // Authentication & Security
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  sessionSecret: string;
  corsOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  
  // External Services
  openaiApiKey: string;
  stripeSecretKey: string;
  stripePublicKey: string;
  
  // Caching & Performance
  redisUrl?: string;
  cacheDefaultTtl: number;
  compressionLevel: number;
  
  // Monitoring & Logging
  logLevel: string;
  enableMetrics: boolean;
  healthCheckInterval: number;
  
  // Object Storage
  objectStorageEnabled: boolean;
  publicObjectPaths?: string;
  privateObjectDir?: string;
  
  // Performance Limits
  maxPayloadSize: string;
  requestTimeout: number;
  maxConcurrentRequests: number;
}

/**
 * Validates and loads production configuration
 */
export function loadProductionConfig(): ProductionConfig {
  // Required environment variables
  const requiredVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY'
  ];

  // Check for missing required variables
  const missing = requiredVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `🚨 PRODUCTION ERROR: Missing required environment variables: ${missing.join(', ')}\n\n` +
      'Please ensure all required environment variables are set before starting the application.\n' +
      'Refer to the deployment documentation for the complete list of required variables.'
    );
  }

  // Validate secret lengths for security
  const secrets = {
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    SESSION_SECRET: process.env.SESSION_SECRET!
  };

  Object.entries(secrets).forEach(([name, value]) => {
    if (value.length < 32) {
      throw new Error(
        `🔒 SECURITY ERROR: ${name} must be at least 32 characters long for production security.\n` +
        'Please generate a strong secret using: openssl rand -base64 32'
      );
    }
  });

  // Parse CORS origins
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production'
      ? [] // Strict CORS in production
      : ['http://localhost:3000', 'http://localhost:5000'];

  // Build configuration object
  const config: ProductionConfig = {
    // Application
    nodeEnv: process.env.NODE_ENV!,
    port: parseInt(process.env.PORT || '5000', 10),
    apiVersion: process.env.API_VERSION || 'v1',
    
    // Database
    databaseUrl: process.env.DATABASE_URL!,
    maxDatabaseConnections: parseInt(process.env.MAX_DB_CONNECTIONS || '20', 10),
    databaseTimeout: parseInt(process.env.DATABASE_TIMEOUT || '30000', 10),
    
    // Authentication & Security
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    sessionSecret: process.env.SESSION_SECRET!,
    corsOrigins,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
    },
    
    // External Services
    openaiApiKey: process.env.OPENAI_API_KEY!,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    stripePublicKey: process.env.VITE_STRIPE_PUBLIC_KEY || '',
    
    // Caching & Performance
    redisUrl: process.env.REDIS_URL,
    cacheDefaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10), // 5 minutes
    compressionLevel: parseInt(process.env.COMPRESSION_LEVEL || '6', 10),
    
    // Monitoring & Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
    
    // Object Storage
    objectStorageEnabled: !!(process.env.PUBLIC_OBJECT_SEARCH_PATHS || process.env.PRIVATE_OBJECT_DIR),
    publicObjectPaths: process.env.PUBLIC_OBJECT_SEARCH_PATHS,
    privateObjectDir: process.env.PRIVATE_OBJECT_DIR,
    
    // Performance Limits
    maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || '10mb',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '100', 10)
  };

  // Validate numeric values
  validateNumericConfig(config);
  
  // Log configuration (without secrets)
  logConfigurationSummary(config);
  
  return config;
}

/**
 * Validates numeric configuration values
 */
function validateNumericConfig(config: ProductionConfig): void {
  const validations = [
    { name: 'port', value: config.port, min: 1, max: 65535 },
    { name: 'maxDatabaseConnections', value: config.maxDatabaseConnections, min: 1, max: 100 },
    { name: 'databaseTimeout', value: config.databaseTimeout, min: 1000, max: 300000 },
    { name: 'cacheDefaultTtl', value: config.cacheDefaultTtl, min: 1, max: 86400 },
    { name: 'compressionLevel', value: config.compressionLevel, min: 1, max: 9 },
    { name: 'requestTimeout', value: config.requestTimeout, min: 1000, max: 300000 },
    { name: 'maxConcurrentRequests', value: config.maxConcurrentRequests, min: 1, max: 1000 }
  ];

  for (const validation of validations) {
    if (isNaN(validation.value) || validation.value < validation.min || validation.value > validation.max) {
      throw new Error(
        `⚙️  CONFIGURATION ERROR: ${validation.name} must be a number between ${validation.min} and ${validation.max}, got: ${validation.value}`
      );
    }
  }
}

/**
 * Logs configuration summary (without sensitive data)
 */
function logConfigurationSummary(config: ProductionConfig): void {
  const summary = {
    environment: config.nodeEnv,
    port: config.port,
    apiVersion: config.apiVersion,
    database: {
      maxConnections: config.maxDatabaseConnections,
      timeout: `${config.databaseTimeout}ms`
    },
    security: {
      corsOrigins: config.corsOrigins.length > 0 ? config.corsOrigins : 'None (development)',
      rateLimit: `${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000}s`
    },
    services: {
      redis: config.redisUrl ? 'Enabled' : 'Disabled',
      objectStorage: config.objectStorageEnabled ? 'Enabled' : 'Disabled',
      openai: config.openaiApiKey ? 'Configured' : 'Missing',
      stripe: config.stripeSecretKey ? 'Configured' : 'Missing'
    },
    performance: {
      compression: `Level ${config.compressionLevel}`,
      cacheDefaultTtl: `${config.cacheDefaultTtl}s`,
      maxPayloadSize: config.maxPayloadSize,
      requestTimeout: `${config.requestTimeout}ms`,
      maxConcurrentRequests: config.maxConcurrentRequests
    },
    monitoring: {
      logLevel: config.logLevel,
      metricsEnabled: config.enableMetrics,
      healthCheckInterval: `${config.healthCheckInterval / 1000}s`
    }
  };

  logger.info('🚀 Production configuration loaded successfully', summary);
}

/**
 * Environment-specific feature flags
 */
export class FeatureFlags {
  private config: ProductionConfig;

  constructor(config: ProductionConfig) {
    this.config = config;
  }

  get isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  get enableDetailedErrors(): boolean {
    return !this.isProduction;
  }

  get enableCORS(): boolean {
    return this.config.corsOrigins.length > 0;
  }

  get enableRateLimiting(): boolean {
    return this.isProduction || process.env.ENABLE_RATE_LIMITING === 'true';
  }

  get enableRequestLogging(): boolean {
    return true; // Always enabled, level controlled by LOG_LEVEL
  }

  get enableMetrics(): boolean {
    return this.config.enableMetrics;
  }

  get enableSecurityHeaders(): boolean {
    return this.isProduction || process.env.ENABLE_SECURITY_HEADERS === 'true';
  }

  get enableCompression(): boolean {
    return this.isProduction || process.env.ENABLE_COMPRESSION === 'true';
  }

  get enableHealthChecks(): boolean {
    return true; // Always enabled
  }

  get strictValidation(): boolean {
    return this.isProduction;
  }
}

/**
 * Runtime configuration validation
 */
export function validateRuntimeRequirements(config: ProductionConfig): void {
  const checks = [
    {
      name: 'Node.js Version',
      check: () => {
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        return majorVersion >= 18;
      },
      error: 'Node.js version 18 or higher is required for production'
    },
    {
      name: 'Memory Available',
      check: () => {
        const totalMem = require('os').totalmem();
        const minRequired = 512 * 1024 * 1024; // 512MB
        return totalMem >= minRequired;
      },
      error: 'At least 512MB of memory is required'
    },
    {
      name: 'Production Environment',
      check: () => {
        if (config.nodeEnv === 'production') {
          return config.jwtAccessSecret !== 'dev-access-secret-key-at-least-32-chars-long' &&
                 config.jwtRefreshSecret !== 'dev-refresh-secret-key-at-least-32-chars-long';
        }
        return true;
      },
      error: 'Development secrets detected in production environment'
    }
  ];

  const failures = checks.filter(check => !check.check());
  
  if (failures.length > 0) {
    const errorMessage = failures.map(failure => `❌ ${failure.name}: ${failure.error}`).join('\n');
    throw new Error(`\n🚨 RUNTIME VALIDATION FAILED:\n\n${errorMessage}\n`);
  }

  logger.info('✅ Runtime requirements validation passed');
}

// Export singleton instance
let productionConfig: ProductionConfig;
let featureFlags: FeatureFlags;

export function getProductionConfig(): ProductionConfig {
  if (!productionConfig) {
    productionConfig = loadProductionConfig();
    validateRuntimeRequirements(productionConfig);
  }
  return productionConfig;
}

export function getFeatureFlags(): FeatureFlags {
  if (!featureFlags) {
    const config = getProductionConfig();
    featureFlags = new FeatureFlags(config);
  }
  return featureFlags;
}