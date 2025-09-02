/**
 * SENIOR TEST ENGINEER - Deep Diet Plan Testing & Debugging
 * Comprehensive unit and performance testing for 500 error identification
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const TEST_USER_ID = 'test-user-diet-plan';

// Comprehensive test data for different scenarios
const testQuestionnaires = {
  basic: {
    personalInfo: { age: 30, gender: 'female', height: 165, weight: 60 },
    healthGoals: ['weight_loss'],
    lifestyle: ['busy_professional'],
    foodPreferences: ['mixed'],
    restrictions: [],
    eatingSchedule: ['three_meals'],
    dietPreparation: ['quick_meals'],
    physicalActivity: ['moderate'],
    supplements: false,
    currentDiet: ['standard']
  },
  complex: {
    personalInfo: { age: 45, gender: 'male', height: 180, weight: 85 },
    healthGoals: ['muscle_gain', 'diabetes'],
    lifestyle: ['active_lifestyle'],
    foodPreferences: ['non_vegetarian', 'paleo'],
    restrictions: ['dairy-free', 'gluten-free'],
    eatingSchedule: ['intermittent_fasting'],
    dietPreparation: ['meal_prep'],
    physicalActivity: ['high'],
    supplements: true,
    currentDiet: ['paleo', 'low_carb']
  },
  problematic: {
    personalInfo: { age: 25, gender: 'other', height: 170, weight: 70 },
    healthGoals: ['pcos', 'pregnancy'],
    lifestyle: ['stressed', 'irregular_schedule'],
    foodPreferences: ['vegan'],
    restrictions: ['nut-allergy', 'soy-free', 'low-sodium'],
    eatingSchedule: ['grazing'],
    dietPreparation: ['no_cooking'],
    physicalActivity: ['low'],
    supplements: true,
    currentDiet: []
  }
};

let testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  criticalErrors: [],
  performanceIssues: [],
  errorDetails: []
};

// Performance tracker for response times
function trackPerformance(testName, startTime) {
  const duration = Date.now() - startTime;
  if (duration > 30000) {
    testResults.performanceIssues.push({
      test: testName,
      duration: `${duration}ms`,
      severity: 'critical'
    });
  } else if (duration > 10000) {
    testResults.performanceIssues.push({
      test: testName,
      duration: `${duration}ms`,
      severity: 'warning'
    });
  }
  return duration;
}

// Enhanced error analysis
function analyzeError(error, testName) {
  const errorInfo = {
    test: testName,
    status: error.response?.status || 'network_error',
    message: error.response?.data?.error || error.message,
    details: error.response?.data?.details || null,
    stack: error.response?.data?.stack ? 'Stack trace available' : 'No stack trace'
  };
  
  testResults.errorDetails.push(errorInfo);
  
  if (error.response?.status === 500) {
    testResults.criticalErrors.push({
      test: testName,
      error: errorInfo.message,
      details: errorInfo.details
    });
  }
  
  return errorInfo;
}

async function testDietPlanGeneration() {
  console.log('\n🧪 TESTING DIET PLAN GENERATION (Multiple Scenarios)');
  
  for (const [scenario, questionnaire] of Object.entries(testQuestionnaires)) {
    console.log(`\n📋 Testing ${scenario} questionnaire...`);
    testResults.totalTests++;
    
    const startTime = Date.now();
    
    try {
      const response = await axios.post(`${BASE_URL}/api/diet-plans/generate`, questionnaire, {
        timeout: 60000,
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      
      const duration = trackPerformance(`diet-plan-generation-${scenario}`, startTime);
      
      if (response.data.success && response.data.dietPlan) {
        console.log(`   ✅ ${scenario} - PASSED (${duration}ms)`);
        console.log(`      Plan: ${response.data.dietPlan.planName}`);
        console.log(`      Targets: ${response.data.dietPlan.dailyTargets.calories} cal`);
        testResults.passed++;
      } else {
        console.log(`   ❌ ${scenario} - FAILED: Invalid response structure`);
        testResults.failed++;
        testResults.criticalErrors.push({
          test: `diet-plan-generation-${scenario}`,
          error: 'Invalid response structure',
          details: response.data
        });
      }
    } catch (error) {
      const duration = trackPerformance(`diet-plan-generation-${scenario}`, startTime);
      const errorInfo = analyzeError(error, `diet-plan-generation-${scenario}`);
      
      console.log(`   ❌ ${scenario} - ERROR (${duration}ms)`);
      console.log(`      Status: ${errorInfo.status}`);
      console.log(`      Message: ${errorInfo.message}`);
      testResults.failed++;
    }
  }
}

async function testDietPlanRetrieval() {
  console.log('\n📖 TESTING DIET PLAN RETRIEVAL');
  
  const endpoints = [
    { path: '/api/diet-plans/active', name: 'Active Plan' },
    { path: '/api/diet-plans/meals/1', name: 'Day 1 Meals' },
    { path: '/api/diet-plans/meals/7', name: 'Day 7 Meals' },
    { path: '/api/diet-plans/supplements', name: 'Supplements' },
    { path: '/api/diet-plans/lifestyle', name: 'Lifestyle' },
    { path: '/api/diet-plans/adherence', name: 'Adherence' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing ${endpoint.name}...`);
    testResults.totalTests++;
    
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
        timeout: 15000,
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      
      const duration = trackPerformance(`retrieval-${endpoint.name}`, startTime);
      
      if (response.data && (response.data.success !== false)) {
        console.log(`   ✅ ${endpoint.name} - PASSED (${duration}ms)`);
        testResults.passed++;
      } else {
        console.log(`   ❌ ${endpoint.name} - FAILED: Invalid response`);
        testResults.failed++;
      }
    } catch (error) {
      const duration = trackPerformance(`retrieval-${endpoint.name}`, startTime);
      const errorInfo = analyzeError(error, `retrieval-${endpoint.name}`);
      
      console.log(`   ❌ ${endpoint.name} - ERROR (${duration}ms)`);
      console.log(`      Status: ${errorInfo.status}`);
      console.log(`      Message: ${errorInfo.message}`);
      testResults.failed++;
    }
  }
}

async function testDietPlanMealRegeneration() {
  console.log('\n🔄 TESTING MEAL REGENERATION');
  testResults.totalTests++;
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${BASE_URL}/api/diet-plans/regenerate-meals`, {
      planId: 'test-plan-123'
    }, {
      timeout: 90000, // Extended timeout for AI generation
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    const duration = trackPerformance('meal-regeneration', startTime);
    
    if (response.data.success) {
      console.log(`   ✅ Meal Regeneration - PASSED (${duration}ms)`);
      testResults.passed++;
    } else {
      console.log(`   ❌ Meal Regeneration - FAILED: ${response.data.error}`);
      testResults.failed++;
    }
  } catch (error) {
    const duration = trackPerformance('meal-regeneration', startTime);
    const errorInfo = analyzeError(error, 'meal-regeneration');
    
    console.log(`   ❌ Meal Regeneration - ERROR (${duration}ms)`);
    console.log(`      Status: ${errorInfo.status}`);
    console.log(`      Message: ${errorInfo.message}`);
    testResults.failed++;
  }
}

async function testTargetRecalculation() {
  console.log('\n🎯 TESTING TARGET RECALCULATION');
  testResults.totalTests++;
  
  const updateData = {
    weight: 75,
    activityLevel: 'high',
    goalType: 'muscle_gain'
  };
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${BASE_URL}/api/diet-plans/recalculate-targets`, updateData, {
      timeout: 10000,
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    const duration = trackPerformance('target-recalculation', startTime);
    
    if (response.data.success && response.data.newTargets) {
      console.log(`   ✅ Target Recalculation - PASSED (${duration}ms)`);
      console.log(`      New Calories: ${response.data.newTargets.calories}`);
      testResults.passed++;
    } else {
      console.log(`   ❌ Target Recalculation - FAILED: Invalid response`);
      testResults.failed++;
    }
  } catch (error) {
    const duration = trackPerformance('target-recalculation', startTime);
    const errorInfo = analyzeError(error, 'target-recalculation');
    
    console.log(`   ❌ Target Recalculation - ERROR (${duration}ms)`);
    console.log(`      Status: ${errorInfo.status}`);
    console.log(`      Message: ${errorInfo.message}`);
    testResults.failed++;
  }
}

async function testWeeklyProgress() {
  console.log('\n📊 TESTING WEEKLY PROGRESS');
  testResults.totalTests++;
  
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}/api/diet-plans/weekly-progress`, {
      timeout: 10000,
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    const duration = trackPerformance('weekly-progress', startTime);
    
    if (response.data && response.data.weeklyData) {
      console.log(`   ✅ Weekly Progress - PASSED (${duration}ms)`);
      testResults.passed++;
    } else {
      console.log(`   ❌ Weekly Progress - FAILED: Missing data`);
      testResults.failed++;
    }
  } catch (error) {
    const duration = trackPerformance('weekly-progress', startTime);
    const errorInfo = analyzeError(error, 'weekly-progress');
    
    console.log(`   ❌ Weekly Progress - ERROR (${duration}ms)`);
    console.log(`      Status: ${errorInfo.status}`);
    console.log(`      Message: ${errorInfo.message}`);
    testResults.failed++;
  }
}

// Edge case testing for potential breaking scenarios
async function testEdgeCases() {
  console.log('\n⚠️  TESTING EDGE CASES');
  
  const edgeCases = [
    {
      name: 'Invalid Questionnaire Data',
      data: { invalid: 'data' },
      expectedStatus: 400
    },
    {
      name: 'Missing Required Fields',
      data: { personalInfo: { age: 25 } }, // Missing required fields
      expectedStatus: 400
    },
    {
      name: 'Extreme Values',
      data: {
        personalInfo: { age: 150, gender: 'invalid', height: 500, weight: 1000 },
        healthGoals: ['nonexistent_goal'],
        lifestyle: [],
        foodPreferences: [],
        restrictions: ['unknown_restriction'],
        eatingSchedule: [],
        dietPreparation: [],
        physicalActivity: [],
        supplements: false,
        currentDiet: []
      },
      expectedStatus: 400
    }
  ];
  
  for (const edgeCase of edgeCases) {
    console.log(`\n🧪 Testing ${edgeCase.name}...`);
    testResults.totalTests++;
    
    const startTime = Date.now();
    
    try {
      const response = await axios.post(`${BASE_URL}/api/diet-plans/generate`, edgeCase.data, {
        timeout: 10000,
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      
      console.log(`   ❌ ${edgeCase.name} - UNEXPECTED SUCCESS (should have failed)`);
      testResults.failed++;
      testResults.criticalErrors.push({
        test: edgeCase.name,
        error: 'Validation should have failed but request succeeded',
        details: response.data
      });
    } catch (error) {
      const duration = trackPerformance(`edge-case-${edgeCase.name}`, startTime);
      
      if (error.response?.status === edgeCase.expectedStatus) {
        console.log(`   ✅ ${edgeCase.name} - PASSED (proper validation, ${duration}ms)`);
        testResults.passed++;
      } else {
        const errorInfo = analyzeError(error, `edge-case-${edgeCase.name}`);
        console.log(`   ❌ ${edgeCase.name} - UNEXPECTED ERROR (${duration}ms)`);
        console.log(`      Expected: ${edgeCase.expectedStatus}, Got: ${errorInfo.status}`);
        console.log(`      Message: ${errorInfo.message}`);
        testResults.failed++;
      }
    }
  }
}

// Database stress testing
async function testDatabaseStress() {
  console.log('\n💽 TESTING DATABASE STRESS & CONCURRENCY');
  
  // Test concurrent diet plan generations
  console.log('\n🔄 Testing concurrent plan generation...');
  testResults.totalTests += 3;
  
  const concurrentPromises = [];
  const startTime = Date.now();
  
  for (let i = 0; i < 3; i++) {
    const promise = axios.post(`${BASE_URL}/api/diet-plans/generate`, {
      ...testQuestionnaires.basic,
      personalInfo: { ...testQuestionnaires.basic.personalInfo, age: 30 + i }
    }, {
      timeout: 60000,
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    concurrentPromises.push(promise);
  }
  
  try {
    const results = await Promise.allSettled(concurrentPromises);
    const duration = trackPerformance('concurrent-generation', startTime);
    
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`   ✅ Concurrent Request ${index + 1} - SUCCESS`);
        successCount++;
        testResults.passed++;
      } else {
        console.log(`   ❌ Concurrent Request ${index + 1} - FAILED: ${result.reason.message}`);
        testResults.failed++;
        analyzeError(result.reason, `concurrent-generation-${index + 1}`);
      }
    });
    
    console.log(`   📊 Concurrent Test Summary: ${successCount}/3 succeeded (${duration}ms total)`);
  } catch (error) {
    console.log(`   ❌ Concurrent Testing - SYSTEM ERROR: ${error.message}`);
    testResults.failed += 3;
  }
}

// Memory and resource testing
async function testResourceUsage() {
  console.log('\n💾 TESTING RESOURCE USAGE');
  
  // Test memory usage during plan generation
  const startMemory = process.memoryUsage();
  console.log(`   📏 Starting Memory: ${Math.round(startMemory.heapUsed / 1024 / 1024)}MB`);
  
  testResults.totalTests++;
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${BASE_URL}/api/diet-plans/generate`, testQuestionnaires.complex, {
      timeout: 120000, // Extended timeout for resource testing
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    const duration = trackPerformance('resource-usage', startTime);
    const endMemory = process.memoryUsage();
    const memoryIncrease = Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024);
    
    console.log(`   📊 Resource Usage Results:`);
    console.log(`      Duration: ${duration}ms`);
    console.log(`      Memory Increase: ${memoryIncrease}MB`);
    console.log(`      Final Memory: ${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`);
    
    if (memoryIncrease > 100) {
      testResults.performanceIssues.push({
        test: 'resource-usage',
        issue: `High memory usage: ${memoryIncrease}MB increase`,
        severity: 'warning'
      });
    }
    
    testResults.passed++;
  } catch (error) {
    const duration = trackPerformance('resource-usage', startTime);
    const errorInfo = analyzeError(error, 'resource-usage');
    
    console.log(`   ❌ Resource Usage - ERROR (${duration}ms)`);
    console.log(`      Status: ${errorInfo.status}`);
    console.log(`      Message: ${errorInfo.message}`);
    testResults.failed++;
  }
}

// Comprehensive health check
async function testSystemHealth() {
  console.log('\n🏥 TESTING SYSTEM HEALTH');
  testResults.totalTests++;
  
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}/api/diet-plans/health`, {
      timeout: 5000
    });
    
    const duration = trackPerformance('system-health', startTime);
    
    if (response.data.ok) {
      console.log(`   ✅ System Health - PASSED (${duration}ms)`);
      testResults.passed++;
    } else {
      console.log(`   ❌ System Health - FAILED: Service not healthy`);
      testResults.failed++;
    }
  } catch (error) {
    const duration = trackPerformance('system-health', startTime);
    const errorInfo = analyzeError(error, 'system-health');
    
    console.log(`   ❌ System Health - ERROR (${duration}ms)`);
    console.log(`      Status: ${errorInfo.status}`);
    console.log(`      Message: ${errorInfo.message}`);
    testResults.failed++;
  }
}

// Main testing function
async function runDietPlanDeepTesting() {
  console.log('🔬 SENIOR TEST ENGINEER - DEEP DIET PLAN ANALYSIS');
  console.log('='.repeat(60));
  console.log('Testing all diet plan endpoints for 500 errors and performance issues\n');
  
  // Reset results
  testResults = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    criticalErrors: [],
    performanceIssues: [],
    errorDetails: []
  };
  
  await testSystemHealth();
  await testDietPlanGeneration();
  await testDietPlanRetrieval();
  await testDietPlanMealRegeneration();
  await testTargetRecalculation();
  await testWeeklyProgress();
  await testEdgeCases();
  await testDatabaseStress();
  await testResourceUsage();
  
  // COMPREHENSIVE ANALYSIS REPORT
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEEP TESTING ANALYSIS REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${testResults.totalTests}`);
  console.log(`   Passed: ${testResults.passed}`);
  console.log(`   Failed: ${testResults.failed}`);
  console.log(`   Success Rate: ${Math.round((testResults.passed / testResults.totalTests) * 100)}%`);
  
  if (testResults.criticalErrors.length > 0) {
    console.log(`\n🚨 CRITICAL 500 ERRORS (${testResults.criticalErrors.length}):`);
    testResults.criticalErrors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
      if (error.details) console.log(`      Details: ${JSON.stringify(error.details)}`);
    });
  }
  
  if (testResults.performanceIssues.length > 0) {
    console.log(`\n⏱️  PERFORMANCE ISSUES (${testResults.performanceIssues.length}):`);
    testResults.performanceIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.test}: ${issue.duration} (${issue.severity})`);
    });
  }
  
  if (testResults.errorDetails.length > 0) {
    console.log(`\n🔍 DETAILED ERROR ANALYSIS:`);
    const errorsByStatus = {};
    testResults.errorDetails.forEach(error => {
      if (!errorsByStatus[error.status]) errorsByStatus[error.status] = [];
      errorsByStatus[error.status].push(error);
    });
    
    Object.entries(errorsByStatus).forEach(([status, errors]) => {
      console.log(`   ${status} Errors (${errors.length}):`);
      errors.forEach(error => {
        console.log(`     • ${error.test}: ${error.message}`);
      });
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 RECOMMENDED FIXES:');
  
  if (testResults.criticalErrors.some(e => e.error.includes('timeout'))) {
    console.log('   1. Add OpenAI API timeout optimizations');
  }
  if (testResults.criticalErrors.some(e => e.error.includes('database'))) {
    console.log('   2. Implement database transaction error handling');
  }
  if (testResults.performanceIssues.some(p => p.severity === 'critical')) {
    console.log('   3. Optimize AI prompt length and model selection');
  }
  if (testResults.criticalErrors.some(e => e.error.includes('User not found'))) {
    console.log('   4. Fix user authentication and profile handling');
  }
  
  return testResults;
}

// Export for external use
export { runDietPlanDeepTesting, testResults };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDietPlanDeepTesting().catch(console.error);
}