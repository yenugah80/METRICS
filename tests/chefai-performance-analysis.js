/**
 * SENIOR PERFORMANCE ENGINEER - ChefAI Performance Deep Analysis
 * Comprehensive performance testing and optimization analysis
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

let performanceResults = {
  testSuites: [],
  criticalIssues: [],
  recommendations: [],
  overallHealth: 'unknown'
};

// Performance test configurations
const testScenarios = {
  quickChat: {
    name: 'Quick Chat Response',
    message: 'Hello ChefAI',
    expectedTime: 3000,
    criticalTime: 10000
  },
  mealSuggestion: {
    name: 'Meal Suggestion Request',
    message: 'Can you suggest a healthy breakfast?',
    expectedTime: 8000,
    criticalTime: 15000
  },
  specificRecipe: {
    name: 'Specific Recipe Request',
    message: 'Give me a detailed Mediterranean chicken recipe with exact ingredients and cooking steps',
    expectedTime: 15000,
    criticalTime: 30000
  },
  functionCalls: {
    name: 'Complex Function Calls',
    message: 'What are my nutrition goals and suggest meals for lunch that help me reach them',
    expectedTime: 12000,
    criticalTime: 25000
  }
};

// Performance test runner
async function runPerformanceTest(scenario, conversationId = null) {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chef-ai/chat`, {
      message: scenario.message,
      conversationId
    }, {
      timeout: scenario.criticalTime + 5000
    });
    
    const duration = Date.now() - startTime;
    
    let status = 'excellent';
    if (duration > scenario.criticalTime) {
      status = 'critical';
    } else if (duration > scenario.expectedTime) {
      status = 'warning';
    }
    
    return {
      scenario: scenario.name,
      duration,
      status,
      responseSize: JSON.stringify(response.data).length,
      conversationId: response.data.conversationId,
      success: true
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      scenario: scenario.name,
      duration,
      status: 'failed',
      error: error.response?.data?.error || error.message,
      errorCode: error.response?.status,
      success: false
    };
  }
}

// Main performance analysis
async function runChefAIPerformanceAnalysis() {
  console.log('🚀 SENIOR PERFORMANCE ENGINEER - ChefAI Deep Analysis');
  console.log('='.repeat(70));
  console.log('Comprehensive performance testing and optimization analysis\n');
  
  // Reset results
  performanceResults = {
    testSuites: [],
    criticalIssues: [],
    recommendations: [],
    overallHealth: 'unknown'
  };
  
  // Basic Performance Tests
  console.log('🎯 BASIC PERFORMANCE TESTING');
  let conversationId = null;
  
  for (const [key, scenario] of Object.entries(testScenarios)) {
    console.log(`\n🧪 Testing ${scenario.name}...`);
    
    const result = await runPerformanceTest(scenario, conversationId);
    
    if (result.success) {
      console.log(`   ✅ PASSED - ${result.duration}ms (${result.status})`);
      console.log(`   📊 Response: ${result.responseSize} chars`);
      
      if (result.status === 'critical') {
        performanceResults.criticalIssues.push({
          type: 'slow_response',
          test: scenario.name,
          duration: result.duration,
          severity: 'critical'
        });
      }
    } else {
      console.log(`   ❌ FAILED - ${result.error}`);
      performanceResults.criticalIssues.push({
        type: 'request_failure',
        test: scenario.name,
        error: result.error,
        severity: 'high'
      });
    }
    
    performanceResults.testSuites.push(result);
    conversationId = result.conversationId;
  }
  
  // FINAL ANALYSIS REPORT
  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPREHENSIVE PERFORMANCE ANALYSIS REPORT');
  console.log('='.repeat(70));
  
  const successfulTests = performanceResults.testSuites.filter(t => t.success);
  
  console.log(`\n📈 OVERALL PERFORMANCE:`);
  console.log(`   Success Rate: ${successfulTests.length}/${performanceResults.testSuites.length} (${Math.round((successfulTests.length / performanceResults.testSuites.length) * 100)}%)`);
  
  if (successfulTests.length > 0) {
    const avgResponseTime = successfulTests.reduce((sum, t) => sum + t.duration, 0) / successfulTests.length;
    console.log(`   Average Response Time: ${Math.round(avgResponseTime)}ms`);
    
    const slowTests = successfulTests.filter(t => t.status === 'critical' || t.status === 'warning');
    console.log(`   Performance Issues: ${slowTests.length}/${successfulTests.length} tests`);
  }
  
  // Critical Issues Analysis
  if (performanceResults.criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL PERFORMANCE ISSUES (${performanceResults.criticalIssues.length}):`);
    performanceResults.criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.type}: ${issue.details || issue.error}`);
      if (issue.duration) console.log(`      Duration: ${issue.duration}ms`);
      console.log(`      Severity: ${issue.severity}`);
    });
  }
  
  // Recommendations
  console.log(`\n🎯 PERFORMANCE OPTIMIZATION RECOMMENDATIONS:`);
  
  const slowResponses = successfulTests.filter(t => t.duration > 10000);
  if (slowResponses.length > 0) {
    console.log(`   1. 🐌 Response Time Optimization:`);
    console.log(`      • ${slowResponses.length} responses took >10 seconds`);
    console.log(`      • Switch complex requests to gpt-4o-mini`);
    console.log(`      • Reduce max_tokens for faster responses`);
    console.log(`      • Implement response caching for common queries`);
  }
  
  return performanceResults;
}

// Export for external use
export { runChefAIPerformanceAnalysis, performanceResults };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runChefAIPerformanceAnalysis().catch(console.error);
}