/**
 * Secure Logging System
 * Replaces console.log with structured, secure logging
 */

import fs from 'fs';
import path from 'path';
import { Request } from 'express';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SECURITY = 4
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  category: string;
  metadata?: any;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

class SecureLogger {
  private logLevel: LogLevel;
  private logDir: string;
  private enableFileLogging: boolean;
  private enableConsoleLogging: boolean;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    this.logDir = path.join(process.cwd(), 'logs');
    this.enableFileLogging = process.env.NODE_ENV === 'production';
    this.enableConsoleLogging = process.env.NODE_ENV !== 'production';
    
    // Ensure logs directory exists
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private sanitizeMetadata(metadata: any): any {
    if (!metadata) return {};
    
    // Remove sensitive data from logs
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'session', 'access_token', 'refresh_token',
      'stripe_secret', 'api_key', 'private_key'
    ];
    
    const sanitized = JSON.parse(JSON.stringify(metadata));
    
    function recursiveSanitize(obj: any): any {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      for (const key in obj) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          obj[key] = recursiveSanitize(obj[key]);
        }
      }
      return obj;
    }
    
    return recursiveSanitize(sanitized);
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    category: string,
    metadata?: any,
    req?: Request
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message: this.sanitizeMessage(message),
      category,
      metadata: this.sanitizeMetadata(metadata),
      requestId: req?.headers['x-request-id'] as string,
      userId: (req as any)?.user?.id,
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
      path: req?.path,
      method: req?.method
    };
  }

  private sanitizeMessage(message: string): string {
    // Remove potential sensitive data from log messages
    return message
      .replace(/password[=:\s]+[^\s]+/gi, 'password=[REDACTED]')
      .replace(/token[=:\s]+[^\s]+/gi, 'token=[REDACTED]')
      .replace(/key[=:\s]+[^\s]+/gi, 'key=[REDACTED]')
      .replace(/secret[=:\s]+[^\s]+/gi, 'secret=[REDACTED]');
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.enableFileLogging) return;
    
    const logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(entry) + '\n';
    
    fs.appendFileSync(logFile, logLine, 'utf8');
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.enableConsoleLogging) return;
    
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      SECURITY: '\x1b[35m' // Magenta
    };
    
    const color = colors[entry.level as keyof typeof colors] || '';
    const reset = '\x1b[0m';
    
    console.log(
      `${color}[${entry.timestamp}] ${entry.level}/${entry.category}${reset}:`,
      entry.message,
      entry.metadata ? JSON.stringify(entry.metadata, null, 2) : ''
    );
  }

  private log(level: LogLevel, message: string, category: string, metadata?: any, req?: Request): void {
    if (level < this.logLevel) return;
    
    const entry = this.createLogEntry(level, message, category, metadata, req);
    
    this.writeToConsole(entry);
    this.writeToFile(entry);
    
    // In production, send critical logs to monitoring service
    if (process.env.NODE_ENV === 'production' && level >= LogLevel.ERROR) {
      // Example: Send to monitoring service
      // monitoringService.sendAlert(entry);
    }
  }

  debug(message: string, metadata?: any, req?: Request): void {
    this.log(LogLevel.DEBUG, message, 'DEBUG', metadata, req);
  }

  info(message: string, metadata?: any, req?: Request): void {
    this.log(LogLevel.INFO, message, 'INFO', metadata, req);
  }

  warn(message: string, metadata?: any, req?: Request): void {
    this.log(LogLevel.WARN, message, 'WARN', metadata, req);
  }

  error(message: string, error?: Error | any, req?: Request): void {
    const metadata = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : error;
    
    this.log(LogLevel.ERROR, message, 'ERROR', metadata, req);
  }

  security(message: string, metadata?: any, req?: Request): void {
    this.log(LogLevel.SECURITY, message, 'SECURITY', metadata, req);
  }

  // Specific logging methods for different components
  auth(message: string, metadata?: any, req?: Request): void {
    this.log(LogLevel.INFO, message, 'AUTH', metadata, req);
  }

  api(message: string, metadata?: any, req?: Request): void {
    this.log(LogLevel.INFO, message, 'API', metadata, req);
  }

  database(message: string, metadata?: any, req?: Request): void {
    this.log(LogLevel.INFO, message, 'DATABASE', metadata, req);
  }

  payment(message: string, metadata?: any, req?: Request): void {
    this.log(LogLevel.INFO, message, 'PAYMENT', metadata, req);
  }

  performance(message: string, metadata?: any, req?: Request): void {
    this.log(LogLevel.INFO, message, 'PERFORMANCE', metadata, req);
  }

  // Request logging middleware
  requestLogger() {
    return (req: Request, res: any, next: any) => {
      const start = Date.now();
      
      // Generate request ID
      req.headers['x-request-id'] = req.headers['x-request-id'] || 
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
        
        this.log(level, `${req.method} ${req.path}`, 'REQUEST', {
          status: res.statusCode,
          duration: `${duration}ms`,
          size: res.get('content-length') || 0
        }, req);
      });
      
      next();
    };
  }

  // Cleanup old log files (keep last 30 days)
  cleanupLogs(): void {
    if (!this.enableFileLogging || !fs.existsSync(this.logDir)) return;
    
    const files = fs.readdirSync(this.logDir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    files.forEach(file => {
      const filePath = path.join(this.logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        this.info(`Cleaned up old log file: ${file}`);
      }
    });
  }
}

// Export singleton instance
export const logger = new SecureLogger();

// Performance monitoring
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    this.timers.set(label, Date.now());
  }

  static end(label: string, req?: Request): void {
    const start = this.timers.get(label);
    if (!start) return;
    
    const duration = Date.now() - start;
    this.timers.delete(label);
    
    logger.performance(`${label} completed`, { duration: `${duration}ms` }, req);
    
    // Alert on slow operations
    if (duration > 5000) { // 5 seconds
      logger.warn(`Slow operation detected: ${label}`, { duration: `${duration}ms` }, req);
    }
  }
}

// Replace console.log in production
if (process.env.NODE_ENV === 'production') {
  console.log = (...args) => logger.info(args.join(' '));
  console.error = (...args) => logger.error(args.join(' '));
  console.warn = (...args) => logger.warn(args.join(' '));
}

// Graceful shutdown logging
process.on('SIGTERM', () => {
  logger.info('Application shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Application interrupted, shutting down');
  process.exit(0);
});