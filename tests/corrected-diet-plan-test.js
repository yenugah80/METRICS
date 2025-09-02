/**
 * CORRECTED DIET PLAN TESTING - Fixed Route Patterns
 * Tests with correct planId from active plan
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testCorrectedDietPlanRoutes() {
  console.log('🔧 CORRECTED DIET PLAN TESTING');
  console.log('Testing with proper route patterns and planId');
  
  let planId = null;
  
  try {
    // 1. Get active plan to get planId
    console.log('\n1️⃣ Getting active plan for planId...');
    const activePlanResponse = await axios.get(`${BASE_URL}/api/diet-plans/active`, {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    if (activePlanResponse.data.hasPlan && activePlanResponse.data.dietPlan) {
      planId = activePlanResponse.data.dietPlan.id;
      console.log(`   ✅ Found active plan: ${planId}`);
    } else {
      console.log('   ❌ No active plan found');
      return;
    }
    
    // 2. Test all endpoints with correct planId
    const endpoints = [
      { path: `/api/diet-plans/${planId}/meals/1`, name: 'Day 1 Meals (Corrected)' },
      { path: `/api/diet-plans/${planId}/meals/7`, name: 'Day 7 Meals (Corrected)' },
      { path: `/api/diet-plans/${planId}/supplements`, name: 'Supplements (Corrected)' },
      { path: `/api/diet-plans/${planId}/lifestyle`, name: 'Lifestyle (Corrected)' },
      { path: `/api/diet-plans/health`, name: 'Health Check' }
    ];
    
    console.log('\n2️⃣ Testing corrected endpoints...');
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
          headers: { 'Authorization': 'Bearer mock-token' },
          timeout: 10000
        });
        
        console.log(`   ✅ ${endpoint.name}: SUCCESS`);
        console.log(`      Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: ERROR ${error.response?.status || 'network'}`);
        console.log(`      Message: ${error.response?.data?.error || error.message}`);
      }
    }
    
    // 3. Test POST endpoints
    console.log('\n3️⃣ Testing POST endpoints...');
    
    const postEndpoints = [
      { 
        path: `/api/diet-plans/${planId}/adherence`, 
        name: 'Adherence Calculation',
        method: 'POST'
      },
      {
        path: '/api/diet-plans/regenerate-meals',
        name: 'Meal Regeneration',
        method: 'POST',
        data: { planId }
      },
      {
        path: '/api/diet-plans/recalculate-targets',
        name: 'Target Recalculation',
        method: 'POST',
        data: { weight: 75, activityLevel: 'high', goalType: 'muscle_gain' }
      }
    ];
    
    for (const endpoint of postEndpoints) {
      try {
        const response = await axios.post(`${BASE_URL}${endpoint.path}`, endpoint.data || {}, {
          headers: { 'Authorization': 'Bearer mock-token' },
          timeout: 30000
        });
        
        console.log(`   ✅ ${endpoint.name}: SUCCESS`);
        console.log(`      Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: ERROR ${error.response?.status || 'network'}`);
        console.log(`      Message: ${error.response?.data?.error || error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Testing failed: ${error.message}`);
  }
}

testCorrectedDietPlanRoutes().catch(console.error);