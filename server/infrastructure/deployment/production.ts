/**
 * Production Deployment and Operational Readiness
 * Graceful shutdown, health monitoring, and deployment utilities
 */

import { Server } from 'http';
import { logger } from '../monitoring/logging/logger';
import { analyticsTracker } from '../monitoring/analytics/tracker';
import { getDatabaseHealth, closeDatabaseConnections } from '../performance/database';
import { envConfig } from '../config/environment';

export class ProductionManager {
  private server?: Server;
  private shutdownInProgress = false;
  private healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Initialize production monitoring and health checks
  async initialize(server: Server): Promise<void> {
    this.server = server;
    
    // Setup graceful shutdown handlers
    this.setupGracefulShutdown();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Start resource monitoring
    this.startResourceMonitoring();
    
    // Log startup success
    logger.info('Production manager initialized successfully', {
      environment: envConfig.NODE_ENV,
      features: this.getFeatureStatus()
    });

    analyticsTracker.trackSystemMetric({
      name: 'application_startup',
      value: 1,
      unit: 'count',
      tags: { 
        environment: envConfig.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Setup graceful shutdown handling
  private setupGracefulShutdown(): void {
    // Handle termination signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception detected', error);
      analyticsTracker.trackSystemMetric({
        name: 'uncaught_exception',
        value: 1,
        unit: 'count',
        tags: { error: error.message }
      });
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason, promise });
      analyticsTracker.trackSystemMetric({
        name: 'unhandled_rejection',
        value: 1,
        unit: 'count',
        tags: { reason: String(reason) }
      });
    });
  }

  // Graceful shutdown implementation
  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.shutdownInProgress) {
      logger.warn('Shutdown already in progress, forcing exit');
      process.exit(1);
    }

    this.shutdownInProgress = true;
    logger.info(`Received ${signal}, starting graceful shutdown`);

    try {
      // Set shutdown timeout
      const shutdownTimeout = setTimeout(() => {
        logger.error('Shutdown timeout exceeded, forcing exit');
        process.exit(1);
      }, 30000); // 30 seconds

      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Close database connections
      await closeDatabaseConnections();

      // Final analytics flush
      analyticsTracker.trackSystemMetric({
        name: 'application_shutdown',
        value: 1,
        unit: 'count',
        tags: { 
          signal,
          timestamp: new Date().toISOString()
        }
      });

      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  }

  // Start health monitoring
  private startHealthMonitoring(): void {
    // Check health every 30 seconds
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);

    // Initial health check
    this.performHealthCheck();
  }

  // Comprehensive health check
  private async performHealthCheck(): Promise<void> {
    try {
      const healthData = {
        timestamp: new Date().toISOString(),
        environment: envConfig.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: await getDatabaseHealth(),
        features: this.getFeatureStatus()
      };

      // Determine overall health status
      const dbHealthy = healthData.database.status === 'healthy';
      const memoryHealthy = healthData.memory.heapUsed < (500 * 1024 * 1024); // 500MB threshold
      
      if (dbHealthy && memoryHealthy) {
        this.healthStatus = 'healthy';
      } else if (dbHealthy || memoryHealthy) {
        this.healthStatus = 'degraded';
      } else {
        this.healthStatus = 'unhealthy';
      }

      // Track health metrics
      analyticsTracker.updateHealthStatus('application', this.healthStatus);
      analyticsTracker.trackSystemMetric({
        name: 'memory_usage_mb',
        value: Math.round(healthData.memory.heapUsed / 1024 / 1024),
        unit: 'megabytes'
      });

      if (this.healthStatus !== 'healthy') {
        logger.warn('Application health degraded', healthData);
      }

    } catch (error) {
      logger.error('Health check failed', error);
      this.healthStatus = 'unhealthy';
      analyticsTracker.updateHealthStatus('application', 'unhealthy');
    }
  }

  // Start resource monitoring
  private startResourceMonitoring(): void {
    // Monitor resources every minute
    setInterval(() => {
      this.trackResourceMetrics();
    }, 60000);
  }

  // Track system resource metrics
  private trackResourceMetrics(): void {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Memory metrics
    analyticsTracker.trackSystemMetric({
      name: 'heap_used',
      value: usage.heapUsed,
      unit: 'bytes'
    });

    analyticsTracker.trackSystemMetric({
      name: 'heap_total',
      value: usage.heapTotal,
      unit: 'bytes'
    });

    // CPU metrics
    analyticsTracker.trackSystemMetric({
      name: 'cpu_user',
      value: cpuUsage.user,
      unit: 'microseconds'
    });

    analyticsTracker.trackSystemMetric({
      name: 'cpu_system',
      value: cpuUsage.system,
      unit: 'microseconds'
    });

    // Process uptime
    analyticsTracker.trackSystemMetric({
      name: 'uptime',
      value: process.uptime(),
      unit: 'seconds'
    });
  }

  // Get current feature availability
  private getFeatureStatus(): Record<string, boolean> {
    return {
      database: true,
      authentication: !!envConfig.JWT_ACCESS_SECRET,
      ai_features: !!envConfig.OPENAI_API_KEY,
      payments: !!envConfig.STRIPE_SECRET_KEY,
      analytics: envConfig.ENABLE_ANALYTICS === 'true',
      monitoring: true,
      security: true
    };
  }

  // Get current health status
  getHealthStatus(): { 
    status: string; 
    timestamp: string; 
    uptime: number;
    features: Record<string, boolean>;
  } {
    return {
      status: this.healthStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      features: this.getFeatureStatus()
    };
  }

  // Check if ready for production traffic
  isProductionReady(): boolean {
    const features = this.getFeatureStatus();
    const requiredFeatures = ['database', 'authentication', 'security'];
    
    return requiredFeatures.every(feature => features[feature]) && 
           this.healthStatus !== 'unhealthy';
  }

  // Get production readiness score
  getProductionReadinessScore(): number {
    const features = this.getFeatureStatus();
    const totalFeatures = Object.keys(features).length;
    const enabledFeatures = Object.values(features).filter(Boolean).length;
    
    const featureScore = (enabledFeatures / totalFeatures) * 0.7; // 70% weight
    const healthScore = this.healthStatus === 'healthy' ? 0.3 : 
                       this.healthStatus === 'degraded' ? 0.15 : 0; // 30% weight
    
    return Math.round((featureScore + healthScore) * 100);
  }
}

// Export singleton instance
export const productionManager = new ProductionManager();

// Deployment helper functions
export function validateDeployment(): string[] {
  const issues: string[] = [];
  
  // Check required environment variables
  if (!envConfig.DATABASE_URL) {
    issues.push('DATABASE_URL is required for production deployment');
  }
  
  if (!envConfig.JWT_ACCESS_SECRET || envConfig.JWT_ACCESS_SECRET.length < 32) {
    issues.push('JWT_ACCESS_SECRET must be at least 32 characters');
  }
  
  if (!envConfig.JWT_REFRESH_SECRET || envConfig.JWT_REFRESH_SECRET.length < 32) {
    issues.push('JWT_REFRESH_SECRET must be at least 32 characters');
  }
  
  // Check production environment
  if (envConfig.NODE_ENV !== 'production' && process.env.FORCE_PRODUCTION !== 'true') {
    issues.push('NODE_ENV should be "production" for production deployment');
  }
  
  return issues;
}

export function getDeploymentSummary(): Record<string, any> {
  const issues = validateDeployment();
  const readinessScore = productionManager.getProductionReadinessScore();
  
  return {
    ready: issues.length === 0,
    readinessScore,
    issues,
    features: productionManager.getHealthStatus().features,
    recommendations: getProductionRecommendations()
  };
}

function getProductionRecommendations(): string[] {
  const recommendations: string[] = [];
  
  if (!envConfig.OPENAI_API_KEY) {
    recommendations.push('Add OPENAI_API_KEY for AI-powered features');
  }
  
  if (!envConfig.STRIPE_SECRET_KEY) {
    recommendations.push('Add STRIPE_SECRET_KEY for payment processing');
  }
  
  if (envConfig.ENABLE_ANALYTICS !== 'true') {
    recommendations.push('Enable analytics with ENABLE_ANALYTICS=true');
  }
  
  if (!envConfig.MONITORING_SERVICE_URL) {
    recommendations.push('Configure external monitoring service for production alerts');
  }
  
  return recommendations;
}