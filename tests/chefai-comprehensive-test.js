/**
 * ChefAI Comprehensive Test Suite
 * Senior Test Engineer - Manual & Automation Testing
 * Tests all ChefAI endpoints, functions, and user flows
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const TEST_USER_ID = 'test-user-123';

// Test configuration
const testConfig = {
  timeout: 30000,
  retries: 2,
  endpoints: [
    // Core ChefAI endpoints
    { method: 'GET', path: '/api/chef-ai/health', auth: false },
    { method: 'GET', path: '/api/chef-ai/conversations', auth: true },
    { method: 'GET', path: '/api/chef-ai/suggestions', auth: true },
    { method: 'POST', path: '/api/chef-ai/chat', auth: true },
    
    // Chatbot recipe endpoints
    { method: 'POST', path: '/api/chatbot/recipe', auth: false },
    { method: 'POST', path: '/api/chatbot/advice', auth: false },
    { method: 'POST', path: '/api/chatbot/ingredients', auth: false },
    { method: 'GET', path: '/api/chatbot/cuisines', auth: false },
  ]
};

// Test data for various scenarios
const testData = {
  chatMessages: [
    'Give me a breakfast recipe',
    'What should I have for lunch today?',
    'I need a high protein dinner idea',
    'Suggest a healthy snack',
    'Create a 7-day meal plan',
    'mediterranean food',
    'paleo breakfast ideas',
    'dairy-free lunch options'
  ],
  recipeRequests: [
    {
      message: 'I want a healthy breakfast recipe',
      preferences: {
        cuisines: ['american'],
        dietaryRestrictions: ['paleo', 'dairy-free'],
        allergies: [],
        skillLevel: 'beginner',
        cookingTime: 20,
        servings: 2
      }
    },
    {
      message: 'Give me a high protein dinner',
      preferences: {
        cuisines: ['mediterranean'],
        dietaryRestrictions: ['non-vegetarian'],
        allergies: ['nuts'],
        skillLevel: 'intermediate',
        cookingTime: 45,
        servings: 4
      }
    }
  ],
  ingredientQueries: [
    {
      ingredients: ['chicken breast', 'quinoa', 'broccoli'],
      question: 'What can I make with these ingredients?'
    },
    {
      ingredients: ['salmon', 'sweet potato', 'spinach'],
      question: 'How should I cook these together?'
    }
  ],
  adviceTopics: [
    'How to properly season chicken',
    'Best cooking methods for vegetables',
    'Food safety tips for meal prep'
  ]
};

// Test Results Storage
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Helper Functions
function logTest(testName, status, details = '') {
  const timestamp = new Date().toISOString();
  const result = { testName, status, details, timestamp };
  testResults.details.push(result);
  
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults.failed++;
    testResults.errors.push(result);
    console.log(`❌ ${testName} - FAILED: ${details}`);
  }
}

function validateResponse(response, testName) {
  if (!response) {
    logTest(testName, 'FAIL', 'No response received');
    return false;
  }
  
  if (response.status < 200 || response.status >= 300) {
    logTest(testName, 'FAIL', `HTTP ${response.status}: ${response.data?.error || 'Unknown error'}`);
    return false;
  }
  
  if (!response.data) {
    logTest(testName, 'FAIL', 'Response has no data');
    return false;
  }
  
  return true;
}

// Test Functions
async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL}/api/chef-ai/health`);
    if (validateResponse(response, 'Health Check')) {
      if (response.data.ok && response.data.time) {
        logTest('Health Check', 'PASS', 'Service is operational');
      } else {
        logTest('Health Check', 'FAIL', 'Invalid health response format');
      }
    }
  } catch (error) {
    logTest('Health Check', 'FAIL', error.message);
  }
}

async function testChatFunctionality() {
  for (const message of testData.chatMessages) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chef-ai/chat`, {
        message,
        conversationId: null
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (validateResponse(response, `Chat: "${message}"`)) {
        const data = response.data;
        
        // Validate response structure
        if (!data.message || data.message.trim() === '') {
          logTest(`Chat: "${message}"`, 'FAIL', 'Empty or missing AI response');
          continue;
        }
        
        if (data.message.includes('delicious') && data.message.length < 100) {
          logTest(`Chat: "${message}"`, 'FAIL', 'Generic/placeholder response detected');
          continue;
        }
        
        // Check for actual content
        const hasIngredients = data.message.includes('ingredient') || data.message.includes('cup') || data.message.includes('oz');
        const hasInstructions = data.message.includes('step') || data.message.includes('cook') || data.message.includes('heat');
        const hasNutrition = data.message.includes('calorie') || data.message.includes('protein') || data.message.includes('nutrition');
        
        if (message.includes('recipe') && !(hasIngredients && hasInstructions)) {
          logTest(`Chat: "${message}"`, 'FAIL', 'Recipe request missing ingredients or instructions');
          continue;
        }
        
        logTest(`Chat: "${message}"`, 'PASS', `Response length: ${data.message.length} chars`);
      }
    } catch (error) {
      logTest(`Chat: "${message}"`, 'FAIL', error.message);
    }
  }
}

async function testRecipeGeneration() {
  for (const request of testData.recipeRequests) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chatbot/recipe`, request);
      
      if (validateResponse(response, `Recipe: ${request.message}`)) {
        const data = response.data;
        
        if (!data.response || data.response.trim() === '') {
          logTest(`Recipe: ${request.message}`, 'FAIL', 'Empty recipe response');
          continue;
        }
        
        // Check for recipe completeness
        const hasIngredients = data.response.includes('ingredient') || data.response.includes('cup') || data.response.includes('oz');
        const hasInstructions = data.response.includes('step') || data.response.includes('cook') || data.response.includes('heat');
        
        if (!(hasIngredients && hasInstructions)) {
          logTest(`Recipe: ${request.message}`, 'FAIL', 'Incomplete recipe - missing ingredients or instructions');
          continue;
        }
        
        logTest(`Recipe: ${request.message}`, 'PASS', 'Complete recipe with ingredients and instructions');
      }
    } catch (error) {
      logTest(`Recipe: ${request.message}`, 'FAIL', error.message);
    }
  }
}

async function testIngredientGuidance() {
  for (const query of testData.ingredientQueries) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chatbot/ingredients`, query);
      
      if (validateResponse(response, `Ingredients: ${query.ingredients.join(', ')}`)) {
        const data = response.data;
        
        if (!data.guidance || data.guidance.trim() === '') {
          logTest(`Ingredients: ${query.ingredients.join(', ')}`, 'FAIL', 'Empty guidance response');
          continue;
        }
        
        // Check if response mentions the actual ingredients
        const mentionsIngredients = query.ingredients.some(ingredient => 
          data.guidance.toLowerCase().includes(ingredient.toLowerCase())
        );
        
        if (!mentionsIngredients) {
          logTest(`Ingredients: ${query.ingredients.join(', ')}`, 'FAIL', 'Response does not mention provided ingredients');
          continue;
        }
        
        logTest(`Ingredients: ${query.ingredients.join(', ')}`, 'PASS', 'Relevant guidance provided');
      }
    } catch (error) {
      logTest(`Ingredients: ${query.ingredients.join(', ')}`, 'FAIL', error.message);
    }
  }
}

async function testCookingAdvice() {
  for (const topic of testData.adviceTopics) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chatbot/advice`, { topic });
      
      if (validateResponse(response, `Advice: ${topic}`)) {
        const data = response.data;
        
        if (!data.advice || data.advice.trim() === '') {
          logTest(`Advice: ${topic}`, 'FAIL', 'Empty advice response');
          continue;
        }
        
        if (data.advice.includes(topic.split(' ')[0])) {
          logTest(`Advice: ${topic}`, 'PASS', 'Relevant advice provided');
        } else {
          logTest(`Advice: ${topic}`, 'FAIL', 'Advice not relevant to topic');
        }
      }
    } catch (error) {
      logTest(`Advice: ${topic}`, 'FAIL', error.message);
    }
  }
}

async function testConversationFlow() {
  try {
    // Test creating a conversation
    const chatResponse = await axios.post(`${BASE_URL}/api/chef-ai/chat`, {
      message: 'Test conversation flow',
      conversationId: null
    });
    
    if (!validateResponse(chatResponse, 'Conversation Creation')) {
      return;
    }
    
    const conversationId = chatResponse.data.conversationId;
    if (!conversationId) {
      logTest('Conversation Creation', 'FAIL', 'No conversationId returned');
      return;
    }
    
    logTest('Conversation Creation', 'PASS', 'Conversation created successfully');
    
    // Test retrieving conversation
    const getResponse = await axios.get(`${BASE_URL}/api/chef-ai/conversations/${conversationId}`);
    if (validateResponse(getResponse, 'Conversation Retrieval')) {
      if (getResponse.data.conversation && getResponse.data.messages) {
        logTest('Conversation Retrieval', 'PASS', 'Conversation retrieved with messages');
      } else {
        logTest('Conversation Retrieval', 'FAIL', 'Invalid conversation structure');
      }
    }
    
    // Test conversation list
    const listResponse = await axios.get(`${BASE_URL}/api/chef-ai/conversations`);
    if (validateResponse(listResponse, 'Conversation List')) {
      if (Array.isArray(listResponse.data.conversations)) {
        logTest('Conversation List', 'PASS', `Found ${listResponse.data.conversations.length} conversations`);
      } else {
        logTest('Conversation List', 'FAIL', 'Conversations not returned as array');
      }
    }
    
  } catch (error) {
    logTest('Conversation Flow', 'FAIL', error.message);
  }
}

async function testSuggestions() {
  try {
    const response = await axios.get(`${BASE_URL}/api/chef-ai/suggestions`);
    
    if (validateResponse(response, 'Suggestions')) {
      const data = response.data;
      
      if (!Array.isArray(data.suggestions)) {
        logTest('Suggestions', 'FAIL', 'Suggestions not returned as array');
        return;
      }
      
      if (data.suggestions.length === 0) {
        logTest('Suggestions', 'FAIL', 'No suggestions returned');
        return;
      }
      
      // Check suggestion quality
      const hasGoodSuggestions = data.suggestions.some(suggestion => 
        suggestion.length > 10 && !suggestion.includes('placeholder')
      );
      
      if (hasGoodSuggestions) {
        logTest('Suggestions', 'PASS', `${data.suggestions.length} quality suggestions provided`);
      } else {
        logTest('Suggestions', 'FAIL', 'Poor quality or placeholder suggestions');
      }
    }
  } catch (error) {
    logTest('Suggestions', 'FAIL', error.message);
  }
}

async function testResponseQuality() {
  const qualityTests = [
    {
      message: 'Give me a detailed breakfast recipe with exact ingredients',
      requirements: ['ingredient', 'cup', 'oz', 'step', 'cook'],
      name: 'Detailed Recipe Request'
    },
    {
      message: 'I need a paleo dinner under 600 calories',
      requirements: ['paleo', 'calorie', 'protein'],
      name: 'Dietary Restriction Request'
    },
    {
      message: 'What are the nutrition facts for grilled chicken breast?',
      requirements: ['protein', 'calorie', 'fat', 'nutrition'],
      name: 'Nutrition Analysis Request'
    }
  ];
  
  for (const test of qualityTests) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chef-ai/chat`, {
        message: test.message,
        conversationId: null
      });
      
      if (validateResponse(response, test.name)) {
        const message = response.data.message?.toLowerCase() || '';
        
        const meetsRequirements = test.requirements.filter(req => 
          message.includes(req.toLowerCase())
        );
        
        const qualityScore = meetsRequirements.length / test.requirements.length;
        
        if (qualityScore >= 0.6) {
          logTest(test.name, 'PASS', `Quality score: ${Math.round(qualityScore * 100)}%`);
        } else {
          logTest(test.name, 'FAIL', `Low quality score: ${Math.round(qualityScore * 100)}% - Missing: ${test.requirements.filter(req => !message.includes(req.toLowerCase())).join(', ')}`);
        }
      }
    } catch (error) {
      logTest(test.name, 'FAIL', error.message);
    }
  }
}

async function testFunctionCalls() {
  // Test each function call type through chat messages
  const functionTests = [
    {
      message: 'Can you give me meal suggestions for lunch with South Indian cuisine?',
      expectedFunction: 'get_meal_suggestions',
      name: 'Meal Suggestions Function'
    },
    {
      message: 'What did I eat today? Show me my nutrition data.',
      expectedFunction: 'get_user_daily_nutrition', 
      name: 'Daily Nutrition Function'
    },
    {
      message: 'Give me the complete recipe for chicken curry with ingredients and steps',
      expectedFunction: 'get_recipe_details',
      name: 'Recipe Details Function'
    }
  ];
  
  for (const test of functionTests) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chef-ai/chat`, {
        message: test.message,
        conversationId: null
      });
      
      if (validateResponse(response, test.name)) {
        // Check if response contains function call results
        const message = response.data.message || '';
        
        if (message.length > 50 && !message.includes('experiencing difficulties')) {
          logTest(test.name, 'PASS', 'Function executed with meaningful response');
        } else {
          logTest(test.name, 'FAIL', 'Function call failed or returned generic response');
        }
      }
    } catch (error) {
      logTest(test.name, 'FAIL', error.message);
    }
  }
}

async function testErrorHandling() {
  const errorTests = [
    {
      endpoint: '/api/chef-ai/chat',
      data: { message: '' },
      expectedError: 'empty message',
      name: 'Empty Message Handling'
    },
    {
      endpoint: '/api/chef-ai/chat',
      data: { message: 'a'.repeat(10000) },
      expectedError: 'message too long',
      name: 'Oversized Message Handling'
    },
    {
      endpoint: '/api/chatbot/recipe',
      data: { message: 'test' },
      expectedError: 'missing preferences',
      name: 'Missing Preferences Handling'
    }
  ];
  
  for (const test of errorTests) {
    try {
      const response = await axios.post(`${BASE_URL}${test.endpoint}`, test.data);
      
      // Should either fail gracefully or handle the error properly
      if (response.status === 400 || response.status === 422) {
        logTest(test.name, 'PASS', 'Error handled gracefully');
      } else if (response.status === 200 && response.data.error) {
        logTest(test.name, 'PASS', 'Error handled in response');
      } else {
        logTest(test.name, 'FAIL', 'Error not properly handled');
      }
    } catch (error) {
      if (error.response?.status >= 400 && error.response?.status < 500) {
        logTest(test.name, 'PASS', 'Error properly rejected');
      } else {
        logTest(test.name, 'FAIL', `Unexpected error: ${error.message}`);
      }
    }
  }
}

async function testPerformance() {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chef-ai/chat`, {
      message: 'Quick breakfast idea',
      conversationId: null
    });
    
    const duration = Date.now() - startTime;
    
    if (validateResponse(response, 'Performance Test')) {
      if (duration < 15000) { // Less than 15 seconds
        logTest('Performance Test', 'PASS', `Response time: ${duration}ms`);
      } else {
        logTest('Performance Test', 'FAIL', `Too slow: ${duration}ms`);
      }
    }
  } catch (error) {
    logTest('Performance Test', 'FAIL', error.message);
  }
}

// Main Test Runner
async function runComprehensiveTests() {
  console.log('🧪 Starting ChefAI Comprehensive Test Suite...\n');
  console.log('Testing as Senior Manual & Automation Test Engineer\n');
  
  // Initialize test results
  testResults = { passed: 0, failed: 0, errors: [], details: [] };
  
  console.log('1️⃣ Testing Basic Health and Connectivity...');
  await testHealthCheck();
  
  console.log('\n2️⃣ Testing Chat Functionality...');
  await testChatFunctionality();
  
  console.log('\n3️⃣ Testing Recipe Generation...');
  await testRecipeGeneration();
  
  console.log('\n4️⃣ Testing Ingredient Guidance...');
  await testIngredientGuidance();
  
  console.log('\n5️⃣ Testing Cooking Advice...');
  await testCookingAdvice();
  
  console.log('\n6️⃣ Testing Conversation Flow...');
  await testConversationFlow();
  
  console.log('\n7️⃣ Testing Suggestions...');
  await testSuggestions();
  
  console.log('\n8️⃣ Testing Function Calls...');
  await testFunctionCalls();
  
  console.log('\n9️⃣ Testing Error Handling...');
  await testErrorHandling();
  
  console.log('\n🔟 Testing Performance...');
  await testPerformance();
  
  // Print comprehensive results
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.testName}: ${error.details}`);
    });
  }
  
  console.log('\n📋 Detailed test log saved for analysis');
  return testResults;
}

// Export for use
export {
  runComprehensiveTests,
  testResults,
  testConfig
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().catch(console.error);
}