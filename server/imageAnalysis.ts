import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AnalyzedFood {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
}

// Combined analysis for better performance - analyzes image and calculates nutrition in one call
export async function analyzeFoodImageWithNutrition(base64Image: string): Promise<any> {
  try {
    // Clean up base64 data - remove data URL prefix if present
    let cleanBase64 = base64Image;
    if (base64Image.includes(',')) {
      cleanBase64 = base64Image.split(',')[1];
    }
    if (base64Image.startsWith('data:')) {
      cleanBase64 = base64Image.split(',')[1];
    }
    
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
  },
  "diet_compatibility": {
    "keto": {"compatible": true_or_false, "reason": "explanation"},
    "vegan": {"compatible": true_or_false, "reason": "explanation"},
    "gluten_free": {"compatible": true_or_false, "reason": "explanation"}
  },
  "recommended_apps": {
    "primary": "MyFitnessPal|Cronometer|LoseIt",
    "reason": "Why this specific app is recommended for this meal type"
  }
}

Be accurate with nutrition values using USDA data knowledge.`
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
    
    // Fallback to simple estimation if AI fails
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const food of foods) {
      const estimatedCaloriesPerUnit = getEstimatedCalories(food.name);
      totalCalories += estimatedCaloriesPerUnit * (food.quantity / 100);
      totalProtein += getEstimatedProtein(food.name) * (food.quantity / 100);
      totalCarbs += getEstimatedCarbs(food.name) * (food.quantity / 100);
      totalFat += getEstimatedFat(food.name) * (food.quantity / 100);
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

// Simple estimation functions - in production, you'd use your nutrition APIs
function getEstimatedCalories(foodName: string): number {
  const estimates: { [key: string]: number } = {
    "banana": 89,
    "apple": 52,
    "rice": 130,
    "chicken": 165,
    "bread": 265,
    "egg": 155,
    "milk": 42,
    "cheese": 113,
    "pasta": 131,
    "salmon": 208,
    "broccoli": 34,
    "potato": 77,
    "avocado": 160,
    "yogurt": 59
  };
  
  // Find closest match
  for (const [key, calories] of Object.entries(estimates)) {
    if (foodName.toLowerCase().includes(key)) {
      return calories;
    }
  }
  return 100; // Default estimate
}

function getEstimatedProtein(foodName: string): number {
  const estimates: { [key: string]: number } = {
    "chicken": 31,
    "salmon": 25,
    "egg": 13,
    "milk": 3.4,
    "cheese": 7,
    "yogurt": 10,
    "rice": 2.7,
    "bread": 9,
    "pasta": 5
  };
  
  for (const [key, protein] of Object.entries(estimates)) {
    if (foodName.toLowerCase().includes(key)) {
      return protein;
    }
  }
  return 2; // Default
}

function getEstimatedCarbs(foodName: string): number {
  const estimates: { [key: string]: number } = {
    "banana": 23,
    "apple": 14,
    "rice": 28,
    "bread": 49,
    "pasta": 25,
    "potato": 17,
    "milk": 5
  };
  
  for (const [key, carbs] of Object.entries(estimates)) {
    if (foodName.toLowerCase().includes(key)) {
      return carbs;
    }
  }
  return 5; // Default
}

function getEstimatedFat(foodName: string): number {
  const estimates: { [key: string]: number } = {
    "avocado": 15,
    "salmon": 14,
    "cheese": 9,
    "egg": 11,
    "milk": 1,
    "chicken": 3.6
  };
  
  for (const [key, fat] of Object.entries(estimates)) {
    if (foodName.toLowerCase().includes(key)) {
      return fat;
    }
  }
  return 1; // Default
}