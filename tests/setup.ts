/**
 * Test Setup and Configuration
 * Sets up test environment and utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// Increase timeout for slow operations
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Initialize test database or any global setup
  console.log('🧪 Test environment initialized');
});

afterAll(async () => {
  // Cleanup test database or any global cleanup
  console.log('✅ Test environment cleaned up');
});

// Per-test setup
beforeEach(() => {
  // Reset any mocks or test state
});

afterEach(() => {
  // Clean up after each test
});

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isPremium: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  
  createMockJWT: () => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token',
  
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};

export {};