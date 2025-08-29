/**
 * Application Health Monitoring & Metrics
 * Comprehensive health checks and performance metrics
 */

import { Request, Response } from 'express';
import { logger } from '../logging/logger';
import { getCacheHealthStatus } from '../performance/cache';
import { getDatabaseHealth } from '../performance/database';
import os from 'os';
import { performance } from 'perf_hooks';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: any;
    cache: any;
    memory: any;
    disk: any;
    external: any;
  };
  metrics: {
    responseTime: number;
    cpu: any;
    memory: any;
    requests: any;
  };
}

class HealthMonitor {
  private startTime: number;
  private requestCount = 0;
  private errorCount = 0;
  private responseTimeHistory: number[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  recordRequest(responseTime: number, isError = false): void {
    this.requestCount++;
    if (isError) this.errorCount++;
    
    this.responseTimeHistory.push(responseTime);
    
    // Keep only last 100 response times
    if (this.responseTimeHistory.length > 100) {
      this.responseTimeHistory.shift();
    }
  }

  getAverageResponseTime(): number {
    if (this.responseTimeHistory.length === 0) return 0;
    const sum = this.responseTimeHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimeHistory.length);
  }

  getErrorRate(): number {
    if (this.requestCount === 0) return 0;
    return Number((this.errorCount / this.requestCount * 100).toFixed(2));
  }

  private checkMemoryHealth(): any {
    const memUsage = process.memoryUsage();
    const systemMem = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };
    
    const memoryUsagePercent = (systemMem.used / systemMem.total) * 100;
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    return {
      status: memoryUsagePercent > 90 || heapUsagePercent > 90 ? 'critical' : 
              memoryUsagePercent > 75 || heapUsagePercent > 75 ? 'warning' : 'ok',
      process: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsagePercent: Math.round(heapUsagePercent)
      },
      system: {
        total: Math.round(systemMem.total / 1024 / 1024 / 1024), // GB
        free: Math.round(systemMem.free / 1024 / 1024 / 1024), // GB
        used: Math.round(systemMem.used / 1024 / 1024 / 1024), // GB
        usagePercent: Math.round(memoryUsagePercent)
      }
    };
  }

  private checkCPUHealth(): any {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    return {
      status: loadAvg[0] > cpus.length * 0.8 ? 'warning' : 'ok',
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      loadAverage: {
        '1min': Number(loadAvg[0].toFixed(2)),
        '5min': Number(loadAvg[1].toFixed(2)),
        '15min': Number(loadAvg[2].toFixed(2))
      }
    };
  }

  private checkDiskHealth(): any {
    // Basic disk space check (would need more sophisticated implementation for production)
    try {
      return {
        status: 'ok',
        available: 'N/A', // Would need fs.statSync for actual implementation
        usage: 'N/A'
      };
    } catch (error) {
      return {
        status: 'error',
        error: 'Unable to check disk space'
      };
    }
  }

  private async checkExternalServices(): Promise<any> {
    const services = {
      openai: { status: 'unknown', responseTime: 0 },
      stripe: { status: 'unknown', responseTime: 0 },
      database: { status: 'unknown', responseTime: 0 }
    };

    // Check OpenAI availability
    try {
      const start = performance.now();
      // Basic connectivity check - would implement actual API call
      services.openai = {
        status: process.env.OPENAI_API_KEY ? 'ok' : 'missing_config',
        responseTime: Math.round(performance.now() - start)
      };
    } catch (error) {
      services.openai = { status: 'error', responseTime: 0 };
    }

    // Check Stripe availability
    try {
      const start = performance.now();
      services.stripe = {
        status: process.env.STRIPE_SECRET_KEY ? 'ok' : 'missing_config',
        responseTime: Math.round(performance.now() - start)
      };
    } catch (error) {
      services.stripe = { status: 'error', responseTime: 0 };
    }

    return services;
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = performance.now();

    try {
      // Run all health checks
      const [databaseHealth, cacheHealth, externalServices] = await Promise.all([
        getDatabaseHealth(),
        Promise.resolve(getCacheHealthStatus()),
        this.checkExternalServices()
      ]);

      const memoryHealth = this.checkMemoryHealth();
      const cpuHealth = this.checkCPUHealth();
      const diskHealth = this.checkDiskHealth();

      // Determine overall status
      const checks = [
        databaseHealth.status === 'healthy',
        memoryHealth.status === 'ok',
        cpuHealth.status === 'ok',
        diskHealth.status === 'ok'
      ];

      const healthyChecks = checks.filter(Boolean).length;
      const totalChecks = checks.length;

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyChecks === totalChecks) {
        overallStatus = 'healthy';
      } else if (healthyChecks >= totalChecks * 0.7) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'unhealthy';
      }

      const responseTime = Math.round(performance.now() - startTime);

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.round((Date.now() - this.startTime) / 1000), // seconds
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: databaseHealth,
          cache: cacheHealth,
          memory: memoryHealth,
          disk: diskHealth,
          external: externalServices
        },
        metrics: {
          responseTime,
          cpu: cpuHealth,
          memory: memoryHealth,
          requests: {
            total: this.requestCount,
            errors: this.errorCount,
            errorRate: this.getErrorRate(),
            averageResponseTime: this.getAverageResponseTime()
          }
        }
      };

      // Log health status if unhealthy
      if (overallStatus !== 'healthy') {
        logger.warn('Application health degraded', { status: overallStatus, checks: healthStatus.checks });
      }

      return healthStatus;
    } catch (error) {
      logger.error('Health check failed', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Math.round((Date.now() - this.startTime) / 1000),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: { status: 'error', error: 'Health check failed' },
          cache: { status: 'error' },
          memory: { status: 'error' },
          disk: { status: 'error' },
          external: { status: 'error' }
        },
        metrics: {
          responseTime: Math.round(performance.now() - startTime),
          cpu: { status: 'error' },
          memory: { status: 'error' },
          requests: {
            total: this.requestCount,
            errors: this.errorCount,
            errorRate: this.getErrorRate(),
            averageResponseTime: this.getAverageResponseTime()
          }
        }
      };
    }
  }
}

export const healthMonitor = new HealthMonitor();

// Health check endpoints
export async function healthCheck(req: Request, res: Response): Promise<void> {
  try {
    const health = await healthMonitor.getHealthStatus();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check endpoint failed', error, req);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}

// Liveness probe (Kubernetes compatible)
export function livenessProbe(req: Request, res: Response): void {
  // Simple check that the application is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

// Readiness probe (Kubernetes compatible)
export async function readinessProbe(req: Request, res: Response): Promise<void> {
  try {
    // Check if the application is ready to serve traffic
    const databaseHealth = await getDatabaseHealth();
    
    if (databaseHealth.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        reason: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Readiness probe failed', error, req);
    res.status(503).json({
      status: 'not_ready',
      error: 'Readiness check failed',
      timestamp: new Date().toISOString()
    });
  }
}

// Metrics endpoint (Prometheus compatible)
export function metricsEndpoint(req: Request, res: Response): void {
  const metrics = {
    http_requests_total: healthMonitor.requestCount,
    http_request_errors_total: healthMonitor.errorCount,
    http_request_duration_seconds: healthMonitor.getAverageResponseTime() / 1000,
    process_uptime_seconds: process.uptime(),
    process_memory_bytes: process.memoryUsage(),
    nodejs_version: process.version,
    timestamp: Date.now()
  };

  // Return in Prometheus format if requested
  if (req.headers.accept?.includes('text/plain')) {
    let prometheusFormat = '';
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          prometheusFormat += `${key}_${subKey} ${subValue}\n`;
        });
      } else {
        prometheusFormat += `${key} ${value}\n`;
      }
    });
    res.set('Content-Type', 'text/plain').send(prometheusFormat);
  } else {
    res.json(metrics);
  }
}

// Request monitoring middleware
export function requestMonitoringMiddleware() {
  return (req: Request, res: Response, next: any) => {
    const start = performance.now();
    
    res.on('finish', () => {
      const responseTime = performance.now() - start;
      const isError = res.statusCode >= 400;
      
      healthMonitor.recordRequest(responseTime, isError);
    });
    
    next();
  };
}