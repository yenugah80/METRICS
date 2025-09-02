/**
 * Quick ChefAI Manual Test - Senior Test Engineer Analysis
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function quickTest() {
  console.log('🔍 Senior Test Engineer - Quick ChefAI Analysis\n');
  
  let results = { passed: 0, failed: 0, critical: [] };
  
  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const health = await axios.get(`${BASE_URL}/api/chef-ai/health`);
    if (health.data.ok) {
      console.log('   ✅ Service is running');
      results.passed++;
    } else {
      console.log('   ❌ Service health check failed');
      results.failed++;
      results.critical.push('Health check failed');
    }
  } catch (error) {
    console.log(`   ❌ Health check error: ${error.message}`);
    results.failed++;
    results.critical.push('Health endpoint unreachable');
  }
  
  // Test 2: Chat Response Quality
  console.log('\n2. Testing Chat Response Quality...');
  try {
    const chatResponse = await axios.post(`${BASE_URL}/api/chef-ai/chat`, {
      message: 'Give me a specific breakfast recipe with ingredients',
      conversationId: null
    });
    
    if (chatResponse.data?.message) {
      const response = chatResponse.data.message;
      const hasIngredients = response.includes('ingredient') || response.includes('cup') || response.includes('oz');
      const hasInstructions = response.includes('step') || response.includes('cook') || response.includes('heat');
      const isSpecific = response.length > 100;
      
      if (hasIngredients && hasInstructions && isSpecific) {
        console.log('   ✅ Quality response with ingredients and instructions');
        console.log(`   📏 Response length: ${response.length} chars`);
        results.passed++;
      } else {
        console.log('   ❌ Poor quality response - missing content');
        console.log(`   📏 Response: "${response.substring(0, 100)}..."`);
        results.failed++;
        results.critical.push('Chat responses lack specific content');
      }
    } else {
      console.log('   ❌ No message in chat response');
      results.failed++;
      results.critical.push('Chat endpoint returns empty responses');
    }
  } catch (error) {
    console.log(`   ❌ Chat test error: ${error.message}`);
    results.failed++;
    results.critical.push('Chat endpoint failing');
  }
  
  // Test 3: Function Call Testing
  console.log('\n3. Testing Function Calls...');
  try {
    const functionResponse = await axios.post(`${BASE_URL}/api/chef-ai/chat`, {
      message: 'Can you give me meal suggestions for lunch with Mediterranean cuisine?',
      conversationId: null
    });
    
    if (functionResponse.data?.message) {
      const response = functionResponse.data.message;
      const hasSpecificFoods = response.includes('salmon') || response.includes('chicken') || response.includes('quinoa') || response.includes('olive');
      const hasNutrition = response.includes('calorie') || response.includes('protein');
      
      if (hasSpecificFoods && hasNutrition) {
        console.log('   ✅ Function calls working - specific foods mentioned');
        results.passed++;
      } else {
        console.log('   ❌ Function calls failing - generic response');
        console.log(`   📝 Response: "${response.substring(0, 150)}..."`);
        results.failed++;
        results.critical.push('Function calls not providing specific food recommendations');
      }
    }
  } catch (error) {
    console.log(`   ❌ Function call test error: ${error.message}`);
    results.failed++;
    results.critical.push('Function calls failing');
  }
  
  // Test 4: Recipe Generation
  console.log('\n4. Testing Recipe Generation...');
  try {
    const recipeResponse = await axios.post(`${BASE_URL}/api/chatbot/recipe`, {
      message: 'I want a healthy dinner recipe',
      preferences: {
        cuisines: ['mediterranean'],
        dietaryRestrictions: ['paleo', 'dairy-free'],
        skillLevel: 'beginner',
        cookingTime: 30,
        servings: 2
      }
    });
    
    if (recipeResponse.data?.response) {
      const response = recipeResponse.data.response;
      const hasIngredients = response.includes('ingredient') || response.includes('cup') || response.includes('oz');
      const hasSteps = response.includes('step') || response.includes('cook') || response.includes('heat');
      
      if (hasIngredients && hasSteps) {
        console.log('   ✅ Recipe generation working with ingredients and steps');
        results.passed++;
      } else {
        console.log('   ❌ Recipe missing ingredients or cooking steps');
        results.failed++;
        results.critical.push('Recipe generation incomplete');
      }
    }
  } catch (error) {
    console.log(`   ❌ Recipe test error: ${error.message}`);
    results.failed++;
    results.critical.push('Recipe generation failing');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 QUICK TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${results.passed}`);
  console.log(`❌ Tests Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.critical.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    results.critical.forEach(issue => console.log(`   • ${issue}`));
  }
  
  return results;
}

quickTest().catch(console.error);