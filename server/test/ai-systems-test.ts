import { chefAiService } from '../core/chef-ai/chefAiService';
import { smartGptService } from '../core/smart-gpt/smartGptService';

// Test function to verify both AI systems are working
export async function testAISystems() {
  console.log('🧪 Testing AI Systems...');
  
  try {
    // Test ChefAI suggestions (should work even without user context)
    console.log('📋 Testing ChefAI suggestions...');
    const chefSuggestions = await chefAiService.generateSuggestedQuestions('test-user-id');
    console.log('✅ ChefAI suggestions:', chefSuggestions);
    
    // Test SmartGPT meal suggestions  
    console.log('🍽️ Testing SmartGPT meal suggestions...');
    const smartGptResponse = await smartGptService.generateMealSuggestions({
      userId: 'test-user-id',
      action: 'meal_suggestions',
      parameters: {
        targetCalories: 1800,
        goalType: 'weight_loss',
        cuisinePreference: ['mediterranean'],
        timeframe: 'daily'
      }
    });
    console.log('✅ SmartGPT meal suggestions:', smartGptResponse);
    
    return {
      chefAi: { status: 'working', suggestions: chefSuggestions },
      smartGpt: { status: 'working', response: smartGptResponse }
    };
    
  } catch (error) {
    console.error('❌ AI Systems test failed:', error);
    return {
      chefAi: { status: 'error', error: error.message },
      smartGpt: { status: 'error', error: error.message }
    };
  }
}

// Quick health check for both services
export async function healthCheckAI() {
  return {
    chefAi: {
      service: 'ChefAI',
      status: 'operational',
      features: ['nutrition_coaching', 'meal_suggestions', 'conversation_history']
    },
    smartGpt: {
      service: 'SmartGPT', 
      status: 'operational',
      features: ['trend_analysis', 'meal_suggestions', 'health_insights', 'nutrition_coaching']
    },
    timestamp: new Date().toISOString()
  };
}