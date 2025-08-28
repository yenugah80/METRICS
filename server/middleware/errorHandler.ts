/**
 * Centralized Error Handling Middleware
 * Secure error responses and logging
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger';
import { secureErrorResponse } from '../security/security';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

// Custom error classes
export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;
  code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  isOperational = true;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  isOperational = true;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  isOperational = true;
  code = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends Error {
  statusCode = 500;
  isOperational = true;
  code = 'DATABASE_ERROR';

  constructor(message: string = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error {
  statusCode = 502;
  isOperational = true;
  code = 'EXTERNAL_SERVICE_ERROR';

  constructor(service: string, message?: string) {
    super(message || `External service ${service} is unavailable`);
    this.name = 'ExternalServiceError';
  }
}

// Error handler middleware
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error details
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;
  
  if (statusCode >= 500) {
    logger.error('Server error', error, req);
  } else if (statusCode >= 400) {
    logger.warn('Client error', { message: error.message, code: error.code }, req);
  }

  // Security: Don't expose sensitive information
  const response = {
    error: {
      message: isOperational ? error.message : 'Internal server error',
      code: error.code || 'UNKNOWN_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error
      })
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  res.status(statusCode).json(response);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
}

// Graceful error handling for unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled promise rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack
  });
  
  // In production, consider graceful shutdown
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Graceful error handling for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', error);
  
  // Always exit on uncaught exceptions
  process.exit(1);
});

// Validation error handler for Zod
export function handleZodError(error: any): ValidationError {
  if (error.name === 'ZodError') {
    const messages = error.errors.map((err: any) => 
      `${err.path.join('.')}: ${err.message}`
    );
    return new ValidationError(`Validation failed: ${messages.join(', ')}`);
  }
  return error;
}

// Database error handler
export function handleDatabaseError(error: any): DatabaseError | AppError {
  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // Unique violation
      return new ValidationError('Resource already exists');
    case '23503': // Foreign key violation
      return new ValidationError('Referenced resource does not exist');
    case '23502': // Not null violation
      return new ValidationError('Required field is missing');
    case '22001': // String data too long
      return new ValidationError('Input data too long');
    case '08006': // Connection failure
      return new DatabaseError('Database connection failed');
    default:
      return new DatabaseError(error.message);
  }
}

// External service error handler
export function handleExternalServiceError(
  error: any, 
  serviceName: string
): ExternalServiceError | AppError {
  if (error.response) {
    // HTTP error response
    const status = error.response.status;
    if (status >= 400 && status < 500) {
      return new ValidationError(`${serviceName} request failed: ${error.message}`);
    } else {
      return new ExternalServiceError(serviceName, error.message);
    }
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return new ExternalServiceError(serviceName, 'Service unavailable');
  } else {
    return new ExternalServiceError(serviceName, error.message);
  }
}