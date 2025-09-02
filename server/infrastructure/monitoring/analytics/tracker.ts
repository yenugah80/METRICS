/**
 * Production Analytics and User Behavior Tracking
 * Comprehensive metrics collection for production insights
 */

import { Request } from 'express';
import { logger } from '../logging/logger';

export interface UserEvent {
  userId?: string;
  sessionId?: string;
  eventType: string;
  eventName: string;
  properties?: Record<string, any>;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  path?: string;
  source?: string;
}

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

class AnalyticsTracker {
  private metrics: Map<string, number> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_ANALYTICS === 'true';
  }

  // User Behavior Tracking
  trackUserEvent(event: Omit<UserEvent, 'timestamp'>): void {
    if (!this.isEnabled) return;

    const fullEvent: UserEvent = {
      ...event,
      timestamp: new Date()
    };

    // Log for immediate processing
    logger.info('User event tracked', fullEvent);

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsService(fullEvent);
    }
  }

  // System Performance Metrics
  trackSystemMetric(metric: Omit<SystemMetric, 'timestamp'>): void {
    if (!this.isEnabled) return;

    const fullMetric: SystemMetric = {
      ...metric,
      timestamp: new Date()
    };

    // Store current value
    this.metrics.set(metric.name, metric.value);

    logger.performance(`System metric: ${metric.name}`, fullMetric);

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(fullMetric);
    }
  }

  // Authentication Events
  trackAuth(type: 'login' | 'logout' | 'register' | 'failed_login', userId: string, req?: Request): void {
    this.trackUserEvent({
      userId,
      eventType: 'authentication',
      eventName: type,
      properties: {
        success: type !== 'failed_login',
        method: 'jwt'
      },
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
      path: req?.path
    });
  }

  // Nutrition Analysis Events
  trackNutritionAnalysis(userId: string, analysisType: string, success: boolean, req?: Request): void {
    this.trackUserEvent({
      userId,
      eventType: 'nutrition_analysis',
      eventName: analysisType,
      properties: {
        success,
        analysis_type: analysisType
      },
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
      path: req?.path
    });
  }

  // AI Usage Tracking
  trackAIUsage(userId: string, feature: string, tokens: number, req?: Request): void {
    this.trackUserEvent({
      userId,
      eventType: 'ai_usage',
      eventName: feature,
      properties: {
        tokens_used: tokens,
        feature_type: feature
      },
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
      path: req?.path
    });

    // Track AI costs
    this.trackSystemMetric({
      name: 'ai_tokens_consumed',
      value: tokens,
      unit: 'tokens',
      tags: { feature, user_id: userId }
    });
  }

  // API Performance Tracking
  trackAPIPerformance(endpoint: string, method: string, duration: number, status: number): void {
    this.trackSystemMetric({
      name: 'api_response_time',
      value: duration,
      unit: 'milliseconds',
      tags: { endpoint, method, status: status.toString() }
    });

    // Track API errors
    if (status >= 400) {
      this.trackSystemMetric({
        name: 'api_errors',
        value: 1,
        unit: 'count',
        tags: { endpoint, method, status: status.toString() }
      });
    }
  }

  // Database Performance
  trackDatabaseQuery(query: string, duration: number, success: boolean): void {
    this.trackSystemMetric({
      name: 'database_query_time',
      value: duration,
      unit: 'milliseconds',
      tags: { 
        query_type: query.split(' ')[0].toLowerCase(),
        success: success.toString()
      }
    });
  }

  // User Engagement Metrics
  trackPageView(userId: string, page: string, req?: Request): void {
    this.trackUserEvent({
      userId,
      eventType: 'page_view',
      eventName: 'view',
      properties: {
        page,
        referrer: req?.headers.referer
      },
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
      path: req?.path
    });
  }

  // Feature Usage
  trackFeatureUsage(userId: string, feature: string, action: string, req?: Request): void {
    this.trackUserEvent({
      userId,
      eventType: 'feature_usage',
      eventName: action,
      properties: {
        feature,
        action
      },
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
      path: req?.path
    });
  }

  // Business Metrics
  trackSubscriptionEvent(userId: string, event: 'upgrade' | 'downgrade' | 'cancel', plan: string): void {
    this.trackUserEvent({
      userId,
      eventType: 'subscription',
      eventName: event,
      properties: {
        plan,
        revenue_impact: event === 'upgrade' ? 'positive' : 'negative'
      }
    });
  }

  // Get Current Metrics (for health checks)
  getCurrentMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Health and Status Metrics
  updateHealthStatus(component: string, status: 'healthy' | 'degraded' | 'unhealthy'): void {
    const statusValue = status === 'healthy' ? 1 : status === 'degraded' ? 0.5 : 0;
    
    this.trackSystemMetric({
      name: 'component_health',
      value: statusValue,
      unit: 'status',
      tags: { component }
    });
  }

  // Memory and Resource Usage
  trackResourceUsage(): void {
    const usage = process.memoryUsage();
    
    this.trackSystemMetric({
      name: 'memory_usage',
      value: usage.heapUsed,
      unit: 'bytes',
      tags: { type: 'heap_used' }
    });

    this.trackSystemMetric({
      name: 'memory_usage',
      value: usage.heapTotal,
      unit: 'bytes',
      tags: { type: 'heap_total' }
    });

    this.trackSystemMetric({
      name: 'memory_usage',
      value: usage.external,
      unit: 'bytes',
      tags: { type: 'external' }
    });
  }

  // Send to external analytics service (placeholder)
  private sendToAnalyticsService(event: UserEvent): void {
    // In production, integrate with analytics service
    // Examples: Google Analytics, Mixpanel, Amplitude, PostHog
    if (process.env.ANALYTICS_SERVICE_URL) {
      // fetch(process.env.ANALYTICS_SERVICE_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // }).catch(error => {
      //   logger.error('Failed to send analytics event', error);
      // });
    }
  }

  // Send to external monitoring service (placeholder)
  private sendToMonitoringService(metric: SystemMetric): void {
    // In production, integrate with monitoring service
    // Examples: DataDog, New Relic, Prometheus, CloudWatch
    if (process.env.MONITORING_SERVICE_URL) {
      // fetch(process.env.MONITORING_SERVICE_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metric)
      // }).catch(error => {
      //   logger.error('Failed to send monitoring metric', error);
      // });
    }
  }

  // Start periodic resource monitoring
  startResourceMonitoring(): void {
    if (!this.isEnabled) return;

    // Track resource usage every 30 seconds
    setInterval(() => {
      this.trackResourceUsage();
    }, 30000);

    // Clean up old metrics periodically
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // 5 minutes
  }

  private cleanupOldMetrics(): void {
    // Keep only recent metrics to prevent memory growth
    // In production, this would be handled by the external service
    logger.debug('Cleaned up old metrics');
  }
}

// Export singleton instance
export const analyticsTracker = new AnalyticsTracker();

// Middleware for automatic tracking
export function analyticsMiddleware() {
  return (req: Request, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Track API performance
      analyticsTracker.trackAPIPerformance(
        req.path,
        req.method,
        duration,
        res.statusCode
      );

      // Track page views for authenticated users
      if ((req as any).user?.id && req.method === 'GET') {
        analyticsTracker.trackPageView((req as any).user.id, req.path, req);
      }
    });
    
    next();
  };
}

// Start monitoring when module loads
if (process.env.NODE_ENV === 'production') {
  analyticsTracker.startResourceMonitoring();
}