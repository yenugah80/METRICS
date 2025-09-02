import { OpenAIManager } from './openai-manager';

export interface AnalyzedFood {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
}

// Combined analysis for better performance - analyzes image and calculates nutrition in one call
export async function analyzeFoodImageWithNutrition(base64Image: string, userDietPreferences: string[] = []): Promise<any> {
  try {
    // Clean up base64 data - remove data URL prefix if present
    let cleanBase64 = base64Image;
    if (base64Image.includes(',')) {
      cleanBase64 = base64Image.split(',')[1];
    }
    if (base64Image.startsWith('data:')) {
      cleanBase64 = base64Image.split(',')[1];
    }
    
    // Build diet compatibility section based on user preferences
    let dietCompatibilitySection = '';
    if (userDietPreferences && userDietPreferences.length > 0) {
      const dietEntries = userDietPreferences.map(diet => 
        `    "${diet}": {"compatible": true_or_false, "reason": "explanation"}`
      ).join(',\n');
      dietCompatibilitySection = `  "diet_compatibility": {
${dietEntries}
  },`;
    } else {
      // Skip diet compatibility if no preferences are set - better UX
      dietCompatibilitySection = '';
    }

    if (!OpenAIManager.isAvailable()) {
      throw new Error('AI analysis is not available. Please configure OpenAI API key.');
    }

    const openai = await OpenAIManager.getInstance();
    // Single API call for both food identification AND nutrition calculation
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert analyzing food images. Identify all food items AND calculate comprehensive nutrition in ONE response.

Return your analysis as JSON in this exact format:
{
  "foods": [
    {
      "name": "food item name",
      "quantity": estimated_amount_as_number,
      "unit": "unit (g, ml, pieces, cups, etc)",
      "confidence": confidence_score_0_to_1
    }
  ],
  "total_calories": total_calories_as_number,
  "total_protein": total_protein_grams_as_number,
  "total_carbs": total_carbs_grams_as_number,
  "total_fat": total_fat_grams_as_number,
  "detailed_nutrition": {
    "saturated_fat": saturated_fat_grams_as_number,
    "fiber": fiber_grams_as_number,
    "sugar": sugar_grams_as_number,
    "sodium": sodium_mg_as_number,
    "cholesterol": cholesterol_mg_as_number,
    "vitamin_c": vitamin_c_mg_as_number,
    "iron": iron_mg_as_number,
    "calcium": calcium_mg_as_number
  },
  "health_suggestions": [
    "Array of 3-5 specific health insights based on this meal"
  ],
  "nutrition_score": {
    "score": score_1_to_100,
    "grade": "A|B|C|D|F",
    "explanation": "Detailed explanation of why this score was given, what's good/bad about the meal"
  },${dietCompatibilitySection ? '\n' + dietCompatibilitySection : ''}
  "recommended_apps": {
    "primary": "MyFitnessPal|Cronometer|LoseIt",
    "reason": "Why this specific app is recommended for this meal type"
  }
}

Be accurate with nutrition values using USDA data knowledge.${userDietPreferences.length === 0 ? ' Note: User has not set diet preferences, so skip diet compatibility analysis entirely.' : ''}`
        },
        {
          role: "user", 
          content: [
            {
              type: "text",
              text: "Analyze this food image - identify all foods AND calculate complete nutrition analysis with explanations."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${cleanBase64}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // If no diet preferences, ensure diet_compatibility is not included in response
    if (!userDietPreferences || userDietPreferences.length === 0) {
      delete result.diet_compatibility;
    }
    
    return result;

  } catch (error: any) {
    console.error("Error analyzing food image:", error);
    throw new Error("Failed to analyze food image: " + (error?.message || "Unknown error"));
  }
}

// Keep the original function for backward compatibility
export async function analyzeFoodImage(base64Image: string): Promise<AnalyzedFood[]> {
  const result = await analyzeFoodImageWithNutrition(base64Image);
  return result.foods || [];
}

export async function estimateNutrition(foods: AnalyzedFood[]): Promise<any> {
  if (foods.length === 0) {
    return {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      foods: []
    };
  }

  try {
    const openai = await OpenAIManager.getInstance();
    // Use GPT-4o mini for comprehensive nutrition analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert and health advisor. Calculate comprehensive nutrition and provide health insights for the given foods.

Return your analysis as JSON in this exact format:
{
  "total_calories": total_calories_as_number,
  "total_protein": total_protein_grams_as_number,
  "total_carbs": total_carbs_grams_as_number,
  "total_fat": total_fat_grams_as_number,
  "detailed_nutrition": {
    "saturated_fat": saturated_fat_grams_as_number,
    "fiber": fiber_grams_as_number,
    "sugar": sugar_grams_as_number,
    "sodium": sodium_mg_as_number,
    "cholesterol": cholesterol_mg_as_number,
    "vitamin_c": vitamin_c_mg_as_number,
    "iron": iron_mg_as_number,
    "calcium": calcium_mg_as_number
  },
  "health_suggestions": [
    "Array of 3-5 specific health insights and suggestions based on this meal",
    "Focus on nutritional benefits, potential concerns, and optimization tips"
  ],
  "tracking_integration": {
    "summary": "Brief summary of how this meal fits into health tracking goals",
    "compatible_apps": ["Specialized apps recommended based on meal complexity and tracking needs"],
    "export_data": {
      "meal_type": "breakfast|lunch|dinner|snack",
      "health_score": score_1_to_10,
      "diet_compatibility": ["keto", "low-carb", "mediterranean", "etc"]
    }
  },
  "foods": foods_array_unchanged
}

Base estimates on USDA nutrition data. Be realistic and helpful with health insights.`
        },
        {
          role: "user",
          content: `Analyze comprehensive nutrition and provide health insights for these foods: ${JSON.stringify(foods)}`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      total_calories: result.total_calories || 0,
      total_protein: result.total_protein || 0,
      total_carbs: result.total_carbs || 0,
      total_fat: result.total_fat || 0,
      detailed_nutrition: result.detailed_nutrition || {},
      health_suggestions: result.health_suggestions || [],
      tracking_integration: result.tracking_integration || {},
      foods: foods
    };

  } catch (error) {
    console.error("Error estimating nutrition:", error);
    
    // Fallback to nutrition API lookup for real data instead of mock estimates
    const { NutritionService } = await import('./nutritionApi');
    const nutritionService = new NutritionService();
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    try {
      for (const food of foods) {
        const nutritionData = await nutritionService.estimateNutrition(food.name, food.quantity, food.unit);
        if (nutritionData?.nutrition) {
          const nutrition = nutritionData.nutrition;
          totalCalories += nutrition.calories || 0;
          totalProtein += nutrition.protein || 0;
          totalCarbs += nutrition.carbs || 0;
          totalFat += nutrition.fat || 0;
        }
      }
    } catch (nutritionError) {
      console.error("Error with nutrition API fallback:", nutritionError);
      // Return explicit error rather than fabricated data
      throw new Error("Unable to analyze nutrition data. Please try again or ensure the food items are clearly visible.");
    }

    return {
      total_calories: Math.round(totalCalories),
      total_protein: Math.round(totalProtein * 10) / 10,
      total_carbs: Math.round(totalCarbs * 10) / 10,
      total_fat: Math.round(totalFat * 10) / 10,
      foods: foods
    };
  }
}

// These mock estimation functions have been removed.
// The system now uses real nutrition APIs (USDA, OpenFoodFacts) for accurate data.
// See nutritionApi.ts for the actual nutrition database integrations.