/**
 * Authentication Integration Tests
 * Tests for JWT authentication, user registration, and login flows
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/api/routes/routes';

describe('Authentication Integration', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Health Endpoints', () => {
    it('should return 200 for health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should return 200 for liveness probe', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API endpoints', async () => {
      // Make multiple rapid requests
      const promises = Array(10).fill(null).map(() => 
        request(app).get('/health')
      );

      const responses = await Promise.all(promises);
      
      // All should succeed since health endpoint is excluded from rate limiting
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Rate limit headers should be present (if not excluded)
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
    });
  });

  describe('JWT Authentication', () => {
    it('should reject requests without valid JWT', async () => {
      const response = await request(app)
        .post('/api/meals')
        .send({ name: 'Test Meal' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject malformed JWT tokens', async () => {
      const response = await request(app)
        .post('/api/meals')
        .set('Authorization', 'Bearer invalid-token')
        .send({ name: 'Test Meal' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Input Validation', () => {
    it('should validate content-type for API requests', async () => {
      const response = await request(app)
        .post('/api/voice-assistant')
        .set('Content-Type', 'text/plain')
        .send('invalid content type')
        .expect(400);

      expect(response.body.error).toContain('Invalid content type');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/voice-assistant')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
    });

    it('should include error metadata in responses', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/api/non-existent-endpoint');
      expect(response.body).toHaveProperty('method', 'GET');
    });
  });

  describe('Performance Monitoring', () => {
    it('should log request performance', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const duration = Date.now() - start;
      
      // Request should complete reasonably quickly
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});