import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const responseTrend = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up
    { duration: '2m', target: 50 },  // Stay at 50 VUs
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    // Core performance requirements
    http_req_duration: ['p(95)<1000'], // Overall API response time under 1 second
    http_req_failed: ['rate<0.05'], // Less than 5% request failures
    checks: ['rate>0.95'], // 95%+ of checks should pass
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000';

export default function () {
  const endpoints = [
    {
      name: 'health',
      url: `${BASE_URL}/api/health`,
      method: 'GET'
    },
    {
      name: 'meals',
      url: `${BASE_URL}/api/meals`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    },
    {
      name: 'stats',
      url: `${BASE_URL}/api/stats/dashboard`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    },
    {
      name: 'nutrition-today',
      url: `${BASE_URL}/api/nutrition/today-progress`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    }
  ];

  // Test each endpoint
  endpoints.forEach(endpoint => {
    const response = http.request(endpoint.method, endpoint.url, null, {
      headers: endpoint.headers || {},
      tags: { endpoint: endpoint.name }
    });

    // Check response status
    check(response, {
      [`${endpoint.name} status is 200 or 401`]: (r) => [200, 401].includes(r.status),
      [`${endpoint.name} response time < 1s`]: (r) => r.timings.duration < 1000,
    });

    // Record metrics
    errorRate.add(response.status >= 400);
    responseTrend.add(response.timings.duration, { endpoint: endpoint.name });
  });

  // Test ChefAI separately (slower endpoint)
  const chefAiResponse = http.post(
    `${BASE_URL}/api/chef-ai/chat`,
    JSON.stringify({
      message: 'Quick protein meal suggestions?'
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      tags: { endpoint: 'chef-ai' }
    }
  );

  check(chefAiResponse, {
    'ChefAI status is 200 or 401': (r) => [200, 401].includes(r.status),
    'ChefAI response time < 8s': (r) => r.timings.duration < 8000,
  });

  errorRate.add(chefAiResponse.status >= 400);
  responseTrend.add(chefAiResponse.timings.duration, { endpoint: 'chef-ai' });

  sleep(1); // Wait 1 second between iterations
}