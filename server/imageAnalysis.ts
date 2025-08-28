import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AnalyzedFood {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
}

export async function analyzeFoodImage(base64Image: string): Promise<AnalyzedFood[]> {
  try {
    // Clean up base64 data - remove data URL prefix if present
    let cleanBase64 = base64Image;
    if (base64Image.includes(',')) {
      cleanBase64 = base64Image.split(',')[1];
    }
    if (base64Image.startsWith('data:')) {
      cleanBase64 = base64Image.split(',')[1];
    }
    
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert analyzing food images. Identify all food items visible in the image with their estimated quantities. 

Return your analysis as JSON in this exact format:
{
  "foods": [
    {
      "name": "food item name (use common names like 'banana', 'grilled chicken breast', 'white rice')",
      "quantity": estimated_amount_as_number,
      "unit": "unit (g, ml, pieces, cups, etc)",
      "confidence": confidence_score_0_to_1
    }
  ]
}

Focus on:
- Common food names that would be found in nutrition databases
- Realistic portion estimates  
- Only include foods you can clearly identify
- Use standard units (grams for solids, ml for liquids, pieces for countable items)`
        },
        {
          role: "user", 
          content: [
            {
              type: "text",
              text: "Analyze this food image and identify all visible food items with their estimated quantities."
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
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"foods": []}');
    return result.foods || [];

  } catch (error) {
    console.error("Error analyzing food image:", error);
    throw new Error("Failed to analyze food image: " + error.message);
  }
}

export async function estimateNutrition(foods: AnalyzedFood[]): Promise<any> {
  // This would integrate with your existing nutrition APIs
  // For now, return a simple estimation
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const food of foods) {
    // Simple estimation - in real app, you'd call your nutrition APIs here
    const estimatedCaloriesPerUnit = getEstimatedCalories(food.name);
    totalCalories += estimatedCaloriesPerUnit * (food.quantity / 100); // per 100g basis
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