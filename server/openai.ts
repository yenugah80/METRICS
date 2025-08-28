import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing required OpenAI API key: OPENAI_API_KEY");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface FoodAnalysisResult {
  foods: Array<{
    name: string;
    quantity: number;
    unit: string;
    confidence: number;
  }>;
  mealType: string;
  confidence: number;
}

export interface NutritionEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron?: number;
  vitaminC?: number;
  magnesium?: number;
  vitaminB12?: number;
}

export interface NutritionScore {
  score: number; // 0-100
  grade: string; // A-E
  macroScore: number;
  fiberScore: number;
  microScore: number;
  processingPenalty: number;
}

export interface DietCompatibility {
  [diet: string]: number; // percentage compatibility
}

export interface AllergenAnalysis {
  isAllergenFree: boolean;
  detectedAllergens: string[];
  severity: 'low' | 'medium' | 'high';
  warnings: string[];
}

export interface SustainabilityScore {
  score: number; // 0-10
  co2Impact: number;
  waterUsage: number;
  recommendations: string[];
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert that analyzes food images. Identify all visible foods, estimate quantities, and determine meal type. Be precise but realistic with quantities. Return JSON in this format:
          {
            "foods": [
              {
                "name": "food name",
                "quantity": number,
                "unit": "g/oz/cup/piece/slice",
                "confidence": 0-1
              }
            ],
            "mealType": "breakfast/lunch/dinner/snack",
            "confidence": 0-1
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and identify all visible foods with quantities."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error analyzing food image:', error);
    throw new Error('Failed to analyze food image');
  }
}

export async function generateRecipes(cuisine: string, dietType: string, preferences: string[], isPremium: boolean): Promise<any[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional chef and nutritionist. Generate ${isPremium ? 3 : 2} unique, delicious recipes based on the given preferences. Return JSON array of recipes in this format:
          {
            "recipes": [
              {
                "id": "unique_id",
                "name": "Recipe Name",
                "description": "Brief appetizing description",
                "prepTime": minutes_as_number,
                "servings": servings_as_number,
                "difficulty": "Easy|Medium|Hard",
                "ingredients": ["list", "of", "ingredients"],
                "instructions": ["step", "by", "step", "instructions"],
                "nutrition": {
                  "calories": calories_per_serving,
                  "protein": protein_grams,
                  "carbs": carbs_grams,
                  "fat": fat_grams
                },
                "tags": ["array", "of", "relevant", "tags"]
              }
            ]
          }
          Make recipes practical, nutritious, and tailored to the specified cuisine and diet type.`
        },
        {
          role: "user",
          content: `Generate recipes with: Cuisine: ${cuisine || 'any'}, Diet: ${dietType || 'any'}, Preferences: ${preferences.join(', ') || 'none'}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"recipes":[]}');
    return result.recipes || [];
  } catch (error) {
    console.error('Error generating recipes:', error);
    throw new Error('Failed to generate recipes');
  }
}

export async function estimateNutritionFromName(foodName: string): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert. Estimate nutrition information for the given food name. Return JSON in this format:
          {
            "name": "food name",
            "quantity": 100,
            "unit": "g",
            "nutrition": {
              "calories": number,
              "protein": number,
              "carbs": number,
              "fat": number,
              "fiber": number,
              "sodium": number,
              "sugar": number
            },
            "confidence": 0.8,
            "source": "AI Estimate"
          }
          Use standard serving sizes and USDA nutrition data knowledge.`
        },
        {
          role: "user",
          content: `Estimate nutrition for: ${foodName}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error estimating nutrition:', error);
    return null;
  }
}

export async function parseVoiceFood(audioText: string): Promise<FoodAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert that parses spoken food descriptions. Extract food items and quantities from natural language. Return JSON in this format:
          {
            "foods": [
              {
                "name": "food name",
                "quantity": number,
                "unit": "g/oz/cup/piece/slice",
                "confidence": 0-1
              }
            ],
            "mealType": "breakfast/lunch/dinner/snack",
            "confidence": 0-1
          }`
        },
        {
          role: "user",
          content: `Parse this food description: "${audioText}"`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error parsing voice food:', error);
    throw new Error('Failed to parse voice food description');
  }
}

export async function estimateNutrition(foods: FoodAnalysisResult['foods']): Promise<NutritionEstimate> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a nutrition database expert. Calculate total nutrition values for the given foods. Use USDA nutrition data knowledge. Return JSON in this format:
          {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number,
            "iron": number,
            "vitaminC": number,
            "magnesium": number,
            "vitaminB12": number
          }`
        },
        {
          role: "user",
          content: `Calculate nutrition for: ${JSON.stringify(foods)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error estimating nutrition:', error);
    throw new Error('Failed to estimate nutrition');
  }
}

export async function calculateNutritionScore(
  nutrition: NutritionEstimate,
  foods: FoodAnalysisResult['foods']
): Promise<NutritionScore> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a nutrition scoring expert. Score this meal 0-100 and assign grade A-E based on:
          - Macro balance (50 points): protein adequacy, carb quality, healthy fats
          - Fiber density (20 points): fiber per 100 calories
          - Micronutrient sufficiency (20 points): vitamin/mineral content
          - Processing penalty (-10 to -20): deduct for highly processed foods
          
          Return JSON:
          {
            "score": 0-100,
            "grade": "A/B/C/D/E",
            "macroScore": number,
            "fiberScore": number,
            "microScore": number,
            "processingPenalty": number
          }`
        },
        {
          role: "user",
          content: `Score this meal: Nutrition: ${JSON.stringify(nutrition)}, Foods: ${JSON.stringify(foods)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error calculating nutrition score:', error);
    throw new Error('Failed to calculate nutrition score');
  }
}

export async function checkDietCompatibility(
  foods: FoodAnalysisResult['foods'],
  dietPreferences: string[]
): Promise<DietCompatibility> {
  if (!dietPreferences.length) return {};

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a diet compatibility expert. Check how well these foods align with the specified diets. Return percentage compatibility (0-100) for each diet. Return JSON:
          {
            "keto": number,
            "vegan": number,
            "vegetarian": number,
            "gluten-free": number,
            "paleo": number,
            "mediterranean": number
          }`
        },
        {
          role: "user",
          content: `Check diet compatibility for: Foods: ${JSON.stringify(foods)}, Diets: ${JSON.stringify(dietPreferences)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error checking diet compatibility:', error);
    return {};
  }
}

export async function analyzeAllergens(
  foods: FoodAnalysisResult['foods'],
  userAllergens: string[]
): Promise<AllergenAnalysis> {
  if (!userAllergens.length) {
    return {
      isAllergenFree: true,
      detectedAllergens: [],
      severity: 'low',
      warnings: []
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an allergen safety expert. Check if these foods contain any of the specified allergens. Consider cross-contamination risks. Return JSON:
          {
            "isAllergenFree": boolean,
            "detectedAllergens": ["allergen1"],
            "severity": "low/medium/high",
            "warnings": ["warning text"]
          }`
        },
        {
          role: "user",
          content: `Check allergens: Foods: ${JSON.stringify(foods)}, User allergens: ${JSON.stringify(userAllergens)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error analyzing allergens:', error);
    return {
      isAllergenFree: false,
      detectedAllergens: [],
      severity: 'medium',
      warnings: ['Unable to analyze allergens - please review manually']
    };
  }
}

export async function calculateSustainabilityScore(
  foods: FoodAnalysisResult['foods']
): Promise<SustainabilityScore> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a sustainability expert. Score these foods 0-10 based on environmental impact:
          - CO2 emissions (beef=high, legumes=low)
          - Water usage (almonds=high, grains=low)
          - Local/seasonal availability
          - Packaging/processing impact
          
          Return JSON:
          {
            "score": 0-10,
            "co2Impact": number,
            "waterUsage": number,
            "recommendations": ["suggestion text"]
          }`
        },
        {
          role: "user",
          content: `Calculate sustainability score for: ${JSON.stringify(foods)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error calculating sustainability score:', error);
    return {
      score: 5,
      co2Impact: 0,
      waterUsage: 0,
      recommendations: ['Unable to calculate sustainability impact']
    };
  }
}

export async function generateMealInsights(
  nutrition: NutritionEstimate,
  score: NutritionScore,
  userProfile: any
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a nutrition coach. Generate 2-3 personalized insights about this meal. Be encouraging but honest. Focus on actionable advice. Return JSON:
          {
            "insights": ["insight text"]
          }`
        },
        {
          role: "user",
          content: `Generate insights for: Nutrition: ${JSON.stringify(nutrition)}, Score: ${JSON.stringify(score)}, Profile: ${JSON.stringify(userProfile)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.insights || [];
  } catch (error) {
    console.error('Error generating insights:', error);
    return ['Great job logging your meal! Keep tracking to see your progress.'];
  }
}
