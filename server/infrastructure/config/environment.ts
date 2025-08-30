/**
 * Production Environment Validation and Configuration
 * Ensures all required environment variables are present and valid
 */

import { logger } from '../monitoring/logging/logger';

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  OPENAI_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  SESSION_SECRET?: string;
  
  // Optional monitoring and analytics
  ANALYTICS_SERVICE_URL?: string;
  MONITORING_SERVICE_URL?: string;
  ENABLE_ANALYTICS?: string;
  
  // Security and performance
  ADMIN_IP_WHITELIST?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  
  // Database optimization
  DB_POOL_MAX?: string;
  DB_CONNECTION_TIMEOUT?: string;
  DB_IDLE_TIMEOUT?: string;
}

// Required environment variables for production
const REQUIRED_PRODUCTION_VARS = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET', 
  'JWT_REFRESH_SECRET'
];

// Optional but recommended for full functionality
const RECOMMENDED_VARS = [
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'SESSION_SECRET'
];

class EnvironmentValidator {
  private config: Partial<EnvironmentConfig> = {};
  private errors: string[] = [];
  private warnings: string[] = [];

  validate(): EnvironmentConfig {
    this.loadEnvironmentVariables();
    this.validateRequired();
    this.validateRecommended();
    this.validateFormats();
    this.setDefaults();
    
    if (this.errors.length > 0) {
      logger.error('Environment validation failed', { errors: this.errors });
      throw new Error(`Environment validation failed:\n${this.errors.join('\n')}`);
    }

    if (this.warnings.length > 0) {
      logger.warn('Environment validation warnings', { warnings: this.warnings });
    }

    logger.info('Environment validation successful', { 
      environment: this.config.NODE_ENV,
      warnings: this.warnings.length 
    });

    return this.config as EnvironmentConfig;
  }

  private loadEnvironmentVariables(): void {
    this.config = {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      PORT: parseInt(process.env.PORT || '5000', 10),
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      SESSION_SECRET: process.env.SESSION_SECRET,
      ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL,
      MONITORING_SERVICE_URL: process.env.MONITORING_SERVICE_URL,
      ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
      ADMIN_IP_WHITELIST: process.env.ADMIN_IP_WHITELIST,
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
      RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
      DB_POOL_MAX: process.env.DB_POOL_MAX,
      DB_CONNECTION_TIMEOUT: process.env.DB_CONNECTION_TIMEOUT,
      DB_IDLE_TIMEOUT: process.env.DB_IDLE_TIMEOUT
    };
  }

  private validateRequired(): void {
    for (const varName of REQUIRED_PRODUCTION_VARS) {
      const value = this.config[varName as keyof EnvironmentConfig];
      
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        this.errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Validate NODE_ENV
    if (!['development', 'production', 'test'].includes(this.config.NODE_ENV!)) {
      this.errors.push('NODE_ENV must be one of: development, production, test');
    }

    // Validate PORT
    if (isNaN(this.config.PORT!) || this.config.PORT! < 1 || this.config.PORT! > 65535) {
      this.errors.push('PORT must be a valid port number (1-65535)');
    }
  }

  private validateRecommended(): void {
    for (const varName of RECOMMENDED_VARS) {
      const value = this.config[varName as keyof EnvironmentConfig];
      
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        this.warnings.push(`Missing recommended environment variable: ${varName}`);
      }
    }
  }

  private validateFormats(): void {
    // Validate DATABASE_URL format
    if (this.config.DATABASE_URL && !this.config.DATABASE_URL.startsWith('postgres')) {
      this.errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
    }

    // Validate JWT secrets strength
    if (this.config.JWT_ACCESS_SECRET && this.config.JWT_ACCESS_SECRET.length < 32) {
      this.warnings.push('JWT_ACCESS_SECRET should be at least 32 characters for security');
    }

    if (this.config.JWT_REFRESH_SECRET && this.config.JWT_REFRESH_SECRET.length < 32) {
      this.warnings.push('JWT_REFRESH_SECRET should be at least 32 characters for security');
    }

    // Validate numeric configurations
    if (this.config.RATE_LIMIT_WINDOW_MS) {
      const windowMs = parseInt(this.config.RATE_LIMIT_WINDOW_MS, 10);
      if (isNaN(windowMs) || windowMs < 1000) {
        this.warnings.push('RATE_LIMIT_WINDOW_MS should be at least 1000 (1 second)');
      }
    }

    if (this.config.RATE_LIMIT_MAX_REQUESTS) {
      const maxRequests = parseInt(this.config.RATE_LIMIT_MAX_REQUESTS, 10);
      if (isNaN(maxRequests) || maxRequests < 1) {
        this.warnings.push('RATE_LIMIT_MAX_REQUESTS should be a positive number');
      }
    }

    if (this.config.DB_POOL_MAX) {
      const poolMax = parseInt(this.config.DB_POOL_MAX, 10);
      if (isNaN(poolMax) || poolMax < 1) {
        this.warnings.push('DB_POOL_MAX should be a positive number');
      }
    }
  }

  private setDefaults(): void {
    // Set production-optimized defaults
    if (this.config.NODE_ENV === 'production') {
      this.config.ENABLE_ANALYTICS = this.config.ENABLE_ANALYTICS || 'true';
      this.config.RATE_LIMIT_WINDOW_MS = this.config.RATE_LIMIT_WINDOW_MS || '900000'; // 15 minutes
      this.config.RATE_LIMIT_MAX_REQUESTS = this.config.RATE_LIMIT_MAX_REQUESTS || '100';
      this.config.DB_POOL_MAX = this.config.DB_POOL_MAX || '20';
      this.config.DB_CONNECTION_TIMEOUT = this.config.DB_CONNECTION_TIMEOUT || '5000';
      this.config.DB_IDLE_TIMEOUT = this.config.DB_IDLE_TIMEOUT || '30000';
    } else {
      // Development defaults
      this.config.ENABLE_ANALYTICS = this.config.ENABLE_ANALYTICS || 'false';
      this.config.RATE_LIMIT_WINDOW_MS = this.config.RATE_LIMIT_WINDOW_MS || '900000';
      this.config.RATE_LIMIT_MAX_REQUESTS = this.config.RATE_LIMIT_MAX_REQUESTS || '1000';
      this.config.DB_POOL_MAX = this.config.DB_POOL_MAX || '5';
      this.config.DB_CONNECTION_TIMEOUT = this.config.DB_CONNECTION_TIMEOUT || '5000';
      this.config.DB_IDLE_TIMEOUT = this.config.DB_IDLE_TIMEOUT || '30000';
    }
  }

  // Check if running in production-like environment
  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  // Check if all recommended features are available
  hasFullFeatures(): boolean {
    return !!(
      this.config.OPENAI_API_KEY &&
      this.config.STRIPE_SECRET_KEY &&
      this.config.SESSION_SECRET
    );
  }

  // Get feature availability status
  getFeatureStatus(): Record<string, boolean> {
    return {
      ai_features: !!this.config.OPENAI_API_KEY,
      payment_processing: !!this.config.STRIPE_SECRET_KEY,
      session_management: !!this.config.SESSION_SECRET,
      analytics: this.config.ENABLE_ANALYTICS === 'true',
      monitoring: !!this.config.MONITORING_SERVICE_URL,
      admin_security: !!this.config.ADMIN_IP_WHITELIST
    };
  }
}

// Validate and export configuration
const validator = new EnvironmentValidator();
export const envConfig = validator.validate();

// Export feature checks
export const isProduction = validator.isProduction();
export const hasFullFeatures = validator.hasFullFeatures();
export const featureStatus = validator.getFeatureStatus();

// Log configuration status
logger.info('Application configuration loaded', {
  environment: envConfig.NODE_ENV,
  features: featureStatus,
  production_ready: isProduction && hasFullFeatures
});

export default envConfig;