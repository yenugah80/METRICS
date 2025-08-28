/**
 * Security Middleware and Utilities
 * Comprehensive security hardening for MyFoodMatrics
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import crypto from 'crypto';

// Security Headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.stripe.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// Rate Limiting Configurations
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit login attempts
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit API calls
  message: {
    error: 'API rate limit exceeded, please slow down.',
    retryAfter: '1 minute'
  }
});

export const premiumRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Higher limit for premium users
  message: {
    error: 'Premium API rate limit exceeded.',
    retryAfter: '1 minute'
  },
  skip: (req: any) => {
    // Higher limits for premium users
    return req.user?.isPremium === true;
  }
});

// Slow Down Middleware
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Max delay of 20 seconds
  validate: { delayMs: false }, // Disable delayMs validation warning
});

// Input Sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove potential XSS
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Additional sanitization
  return sanitized
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// SQL Injection Prevention Schema
export const sqlSafeString = z.string()
  .min(1)
  .max(1000)
  .regex(/^[a-zA-Z0-9\s\-_.,!?@#$%^&*()+={}[\]:";'<>?/\\|`~]*$/)
  .transform(sanitizeInput);

// Secure Request Validation
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and sanitize request body
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(400).json({ error: 'Request validation failed' });
    }
  };
}

// CSRF Protection
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for API endpoints with proper authentication
  if (req.path.startsWith('/api/') && req.headers.authorization) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || !crypto.timingSafeEqual(
    Buffer.from(token, 'utf8'),
    Buffer.from(sessionToken, 'utf8')
  )) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }
  
  next();
}

// Generate CSRF Token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// IP Whitelist for Admin Operations
const ADMIN_IP_WHITELIST = (process.env.ADMIN_IP_WHITELIST || '').split(',').filter(Boolean);

export function adminIPWhitelist(req: Request, res: Response, next: NextFunction) {
  if (ADMIN_IP_WHITELIST.length === 0) {
    return next(); // No whitelist configured
  }
  
  const clientIP = req.ip || req.connection.remoteAddress || '';
  
  if (!ADMIN_IP_WHITELIST.includes(clientIP)) {
    return res.status(403).json({ error: 'Access denied from this IP address' });
  }
  
  next();
}

// Security Event Logging
export function logSecurityEvent(
  level: 'info' | 'warn' | 'error',
  event: string,
  details: any,
  req?: Request
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    details,
    ip: req?.ip,
    userAgent: req?.headers['user-agent'],
    path: req?.path,
    method: req?.method
  };
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to security monitoring service
    // securityMonitor.log(logEntry);
  }
  
  console.log(`[SECURITY-${level.toUpperCase()}]`, JSON.stringify(logEntry));
}

// Brute Force Protection
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export function bruteForceProtection(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'unknown';
  const now = new Date();
  const attempts = loginAttempts.get(key);
  
  if (attempts) {
    const timeDiff = now.getTime() - attempts.lastAttempt.getTime();
    const minutesPassed = timeDiff / (1000 * 60);
    
    // Reset counter after 15 minutes
    if (minutesPassed > 15) {
      loginAttempts.delete(key);
    } else if (attempts.count >= 5) {
      logSecurityEvent('warn', 'Brute force attempt blocked', { ip: key, attempts: attempts.count }, req);
      return res.status(429).json({
        error: 'Too many failed login attempts. Please try again in 15 minutes.',
        retryAfter: Math.ceil(15 - minutesPassed)
      });
    }
  }
  
  next();
}

export function recordFailedLogin(ip: string) {
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: new Date() };
  attempts.count += 1;
  attempts.lastAttempt = new Date();
  loginAttempts.set(ip, attempts);
}

export function clearLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// Password Strength Validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Email Validation
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email must be less than 254 characters')
  .transform(email => email.toLowerCase().trim());

// Secure Error Response
export function secureErrorResponse(error: any, req: Request): any {
  // Log full error details for debugging
  logSecurityEvent('error', 'Application error', {
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body
  }, req);
  
  // Return sanitized error to client
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Internal server error' };
  } else {
    return { 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
  }
}

// Content-Type Validation
export function validateContentType(expectedType: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes(expectedType)) {
        return res.status(400).json({
          error: `Invalid content type. Expected ${expectedType}`
        });
      }
    }
    next();
  };
}