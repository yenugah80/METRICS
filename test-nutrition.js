// Simple test script for nutrition API functionality
import { nutritionService } from './server/nutritionApi.js';

async function testNutritionAPIs() {
  console.log('🧪 Testing Nutrition API Integration...\n');

  try {
    // Test 1: Text Search for Apple
    console.log('📊 Test 1: Text search for "apple"');
    const appleResults = await nutritionService.searchByText('apple');
    console.log(`Found ${appleResults.length} results for apple:`);
    if (appleResults.length > 0) {
      console.log(`- First result: ${appleResults[0].name}`);
      console.log(`- Calories per 100g: ${appleResults[0].nutrition.calories}`);
      console.log(`- API Source: ${appleResults[0].source}`);
      console.log(`- Confidence: ${appleResults[0].confidence}`);
    }
    console.log('✅ Text search test completed\n');

    // Test 2: Barcode Lookup (Nutella)
    console.log('📊 Test 2: Barcode lookup for Nutella (3017620422003)');
    const nutella = await nutritionService.searchByBarcode('3017620422003');
    if (nutella) {
      console.log(`Found: ${nutella.name}`);
      console.log(`Brand: ${nutella.brand || 'N/A'}`);
      console.log(`Calories per 100g: ${nutella.nutrition.calories}`);
      console.log(`API Source: ${nutella.source}`);
    } else {
      console.log('No results found for this barcode');
    }
    console.log('✅ Barcode lookup test completed\n');

    // Test 3: Nutrition Estimation
    console.log('📊 Test 3: Nutrition estimation for "1 medium banana"');
    const banana = await nutritionService.estimateNutrition('banana', 1, 'medium');
    if (banana) {
      console.log(`Estimated nutrition for 1 medium banana:`);
      console.log(`- Calories: ${banana.nutrition.calories}`);
      console.log(`- Protein: ${banana.nutrition.protein}g`);
      console.log(`- Carbs: ${banana.nutrition.carbs}g`);
      console.log(`- API Source: ${banana.source}`);
    } else {
      console.log('Could not estimate nutrition for banana');
    }
    console.log('✅ Nutrition estimation test completed\n');

    // Test 4: Multiple API Fallback
    console.log('📊 Test 4: Testing API fallback with "oatmeal"');
    const oatmealResults = await nutritionService.searchByText('oatmeal');
    console.log(`Found ${oatmealResults.length} results from different APIs:`);
    oatmealResults.slice(0, 3).forEach((result, i) => {
      console.log(`${i + 1}. ${result.name} (${result.source}, confidence: ${result.confidence})`);
    });
    console.log('✅ API fallback test completed\n');

    console.log('🎉 All nutrition API tests completed successfully!');
    console.log('\n📈 Available APIs:');
    console.log('- ✅ Open Food Facts (Free)');
    console.log('- ✅ USDA FoodData Central (Free)');
    console.log('- ⚠️  FatSecret (Requires API Key)');
    console.log('- ⚠️  Edamam (Requires API Key)');
    console.log('- ⚠️  LogMeal (Requires API Key)');
    console.log('- ⚠️  Chompthis (Requires API Key)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNutritionAPIs();