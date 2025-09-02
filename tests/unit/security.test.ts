/**
 * Security Module Unit Tests
 * Tests for authentication, validation, and security utilities
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { 
  sanitizeInput, 
  validateRequest, 
  passwordSchema, 
  emailSchema,
  secureErrorResponse,
  bruteForceProtection,
  recordFailedLogin,
  clearLoginAttempts
} from '../../server/infrastructure/security/security';
import { z } from 'zod';

describe('Security Module', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      body: {},
      headers: {},
      path: '/test',
      method: 'POST'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('Input Sanitization', () => {
    it('should remove XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello World');
    });

    it('should remove javascript: protocol', () => {
      const maliciousInput = 'javascript:alert("xss")';
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle non-string input safely', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
      expect(sanitizeInput(123 as any)).toBe('');
    });
  });

  describe('Password Validation', () => {
    it('should accept strong passwords', () => {
      const strongPassword = 'StrongP@ssw0rd123';
      expect(() => passwordSchema.parse(strongPassword)).not.toThrow();
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',           // Too short
        'nouppercase1!',  // No uppercase
        'NOLOWERCASE1!',  // No lowercase
        'NoNumbers!',     // No numbers
        'NoSpecialChar1'  // No special characters
      ];

      weakPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow();
      });
    });
  });

  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name+tag@domain.co.uk',
        'valid.email@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });

    it('should normalize email case', () => {
      const result = emailSchema.parse('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });
  });

  describe('Request Validation', () => {
    it('should validate valid request data', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0)
      });

      mockReq.body = { name: 'John', age: 25 };
      
      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject invalid request data', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0)
      });

      mockReq.body = { name: '', age: -1 };
      
      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Brute Force Protection', () => {
    beforeEach(() => {
      // Clear any existing attempts
      clearLoginAttempts('127.0.0.1');
    });

    it('should allow requests under the limit', () => {
      bruteForceProtection(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block after too many failed attempts', () => {
      // Record multiple failed attempts
      for (let i = 0; i < 6; i++) {
        recordFailedLogin('127.0.0.1');
      }

      bruteForceProtection(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Secure Error Response', () => {
    it('should sanitize errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Sensitive database connection details');
      const response = secureErrorResponse(error, mockReq as Request);

      expect(response.error).toBe('Internal server error');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should show detailed errors in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Detailed error message');
      const response = secureErrorResponse(error, mockReq as Request);

      expect(response.error).toBe('Detailed error message');
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});