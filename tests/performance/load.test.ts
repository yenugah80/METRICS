/**
 * Performance and Load Tests
 * Tests for application performance under various loads
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/api/routes/routes';

describe('Performance Tests', () => {
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

  describe('Response Time', () => {
    it('should respond to health checks quickly', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should respond in under 100ms
    });

    it('should handle metrics endpoint efficiently', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/metrics')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // Should respond in under 500ms
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous health checks', async () => {
      const concurrentRequests = 20;
      const promises = Array(concurrentRequests).fill(null).map(async () => {
        const start = Date.now();
        const response = await request(app).get('/health');
        const duration = Date.now() - start;
        
        return {
          status: response.status,
          duration
        };
      });

      const results = await Promise.all(promises);
      
      // All requests should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.duration).toBeLessThan(1000); // Each should complete in under 1s
      });

      // Average response time should be reasonable
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(avgDuration).toBeLessThan(500);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make many requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/health');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory usage should not increase dramatically
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseRatio = memoryIncrease / initialMemory.heapUsed;
      
      // Allow up to 50% memory increase (generous threshold for tests)
      expect(memoryIncreaseRatio).toBeLessThan(0.5);
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting efficiently', async () => {
      const requests = 50;
      const start = Date.now();
      
      const promises = Array(requests).fill(null).map(() => 
        request(app).get('/health').catch(() => ({ status: 429 }))
      );
      
      const results = await Promise.all(promises);
      const duration = Date.now() - start;
      
      // Should handle all requests (success or rate limited) in reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 50 requests
      
      // At least some requests should succeed
      const successfulRequests = results.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle 404 errors quickly', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/non-existent-route')
        .expect(404);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200); // Error handling should be fast
    });

    it('should handle validation errors efficiently', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/voice-assistant')
        .set('Content-Type', 'text/plain')
        .send('invalid content')
        .expect(400);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });
});