import OpenAI from "openai";

// Lazy initialization - only create OpenAI client when needed
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is required for AI-powered food analysis. Please set OPENAI_API_KEY environment variable.");
    }
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15000, // 15 second timeout
      maxRetries: 2
    });
  }
  return openai;
}

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
  severity: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  allergen_details: Array<{
    allergen: string;
    found_in: string[];
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    specific_ingredients: string[];
    reaction_type: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
  }>;
  cross_contamination_risk: 'low' | 'medium' | 'high';
  safe_alternatives: string[];
}

export interface SustainabilityScore {
  overall_score: number; // 1-10
  grade: string; // A+, A, B+, B, C+, C, D+, D, F
  co2_impact: 'low' | 'medium' | 'high';
  water_usage: 'low' | 'medium' | 'high';
  seasonal_score: number; // 1-10
  processing_score: number; // 1-10
  local_score: number; // 1-10
  sustainability_badges: string[]; // ['Plant-Based', 'Local', 'Seasonal', etc.]
  environmental_impact: {
    carbon_footprint_kg: number;
    water_footprint_liters: number;
    land_use_m2: number;
  };
  recommendations: string[];
  seasonal_alternatives: string[];
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysisResult> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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
      max_completion_tokens: 1000,
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
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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
      max_completion_tokens: 2000,
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
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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
      max_completion_tokens: 500,
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
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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
      max_completion_tokens: 800,
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
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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
      max_completion_tokens: 500,
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
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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
      max_completion_tokens: 400,
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
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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
      max_completion_tokens: 300,
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
      warnings: [],
      allergen_details: [],
      cross_contamination_risk: 'low',
      safe_alternatives: []
    };
  }

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a comprehensive food allergen safety expert with knowledge of FDA regulations, cross-contamination risks, and hidden allergens. Analyze these foods for ALL specified allergens with extreme accuracy.

          **Top 9 Allergens to Consider:**
          - Milk (dairy, casein, whey, lactose)
          - Eggs (albumin, lecithin, lysozyme)  
          - Fish (anchovies, fish sauce, omega-3)
          - Shellfish (crustaceans, mollusks)
          - Tree nuts (all varieties + derivatives)
          - Peanuts (groundnuts, arachis oil)
          - Wheat (gluten, spelt, kamut, semolina)
          - Soybeans (soy lecithin, miso, tempeh)
          - Sesame (tahini, halva, za'atar)

          **Analysis Requirements:**
          1. Check EACH food item for direct allergen presence
          2. Identify hidden/derivative allergens (e.g., "natural flavors" may contain milk)
          3. Assess cross-contamination risks from manufacturing/preparation
          4. Consider severity levels: mild reaction vs anaphylaxis risk
          5. Provide specific ingredient-level warnings
          6. Suggest safe alternatives when allergens detected

          **Cross-Contamination Risks:**
          - Shared equipment (high risk for nuts, gluten)
          - Shared fryers (medium-high risk)
          - Shared preparation surfaces (medium risk)  
          - Same facility warnings (low-medium risk)

          Return detailed JSON:
          {
            "isAllergenFree": boolean,
            "detectedAllergens": ["specific allergen names"],
            "severity": "low/medium/high/critical",
            "warnings": ["specific safety warnings"],
            "allergen_details": [
              {
                "allergen": "allergen name",
                "found_in": ["food item 1", "food item 2"],
                "risk_level": "low/medium/high/critical", 
                "specific_ingredients": ["exact ingredient containing allergen"],
                "reaction_type": "mild/moderate/severe/anaphylaxis"
              }
            ],
            "cross_contamination_risk": "low/medium/high",
            "safe_alternatives": ["suggested alternatives for flagged items"]
          }`
        },
        {
          role: "user",
          content: `Analyze for allergens: Foods: ${JSON.stringify(foods)}, User allergens: ${JSON.stringify(userAllergens)}`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Ensure proper fallback structure
    return {
      isAllergenFree: result.isAllergenFree ?? false,
      detectedAllergens: result.detectedAllergens || [],
      severity: result.severity || 'medium',
      warnings: result.warnings || [],
      allergen_details: result.allergen_details || [],
      cross_contamination_risk: result.cross_contamination_risk || 'medium',
      safe_alternatives: result.safe_alternatives || []
    };
  } catch (error) {
    console.error('Error analyzing allergens:', error);
    return {
      isAllergenFree: false,
      detectedAllergens: [],
      severity: 'high',
      warnings: ['Unable to analyze allergens - please consult with a healthcare provider before consuming'],
      allergen_details: [],
      cross_contamination_risk: 'high',
      safe_alternatives: []
    };
  }
}

export async function calculateSustainabilityScore(
  foods: FoodAnalysisResult['foods']
): Promise<SustainabilityScore> {
  try {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a comprehensive sustainability expert specializing in food environmental impact assessment. Analyze these foods using multiple criteria:

          **Scoring Criteria (0-10 scale):**
          - CO2 Emissions: beef/lamb=1-3, pork/dairy=4-6, poultry/fish=6-7, plants/legumes=8-10
          - Water Usage: nuts/avocados=3-5, rice=5-6, vegetables=7-8, legumes/grains=8-10  
          - Seasonality: out-of-season imports=2-4, greenhouse grown=5-6, seasonal local=8-10
          - Processing Level: ultra-processed=2-4, processed=5-6, minimally processed=7-8, whole foods=9-10
          - Packaging Impact: plastic/individual wrapping=2-4, recyclable=6-7, minimal/compostable=8-10
          - Food Miles: international=2-4, national=5-6, regional=7-8, local=9-10

          **Current Context:** It's ${currentMonth} - consider seasonal availability.

          Return detailed JSON:
          {
            "overall_score": 1-10,
            "grade": "A+/A/B+/B/C+/C/D+/D/F",
            "co2_impact": "low/medium/high",
            "water_usage": "low/medium/high", 
            "seasonal_score": 1-10,
            "processing_score": 1-10,
            "local_score": 1-10,
            "sustainability_badges": ["Plant-Based", "Local", "Seasonal", "Low-Carbon", "Water-Efficient"],
            "environmental_impact": {
              "carbon_footprint_kg": estimated_kg_co2_per_meal,
              "water_footprint_liters": estimated_liters_per_meal,
              "land_use_m2": estimated_m2_per_meal
            },
            "recommendations": [
              "Specific actionable suggestions for improvement"
            ],
            "seasonal_alternatives": [
              "Current season alternatives if applicable"
            ]
          }`
        },
        {
          role: "user",
          content: `Analyze sustainability for these foods: ${JSON.stringify(foods)}`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Ensure proper fallback structure
    return {
      overall_score: result.overall_score || 5,
      grade: result.grade || 'C',
      co2_impact: result.co2_impact || 'medium',
      water_usage: result.water_usage || 'medium',
      seasonal_score: result.seasonal_score || 5,
      processing_score: result.processing_score || 5,
      local_score: result.local_score || 5,
      sustainability_badges: result.sustainability_badges || [],
      environmental_impact: result.environmental_impact || {
        carbon_footprint_kg: 0,
        water_footprint_liters: 0,
        land_use_m2: 0
      },
      recommendations: result.recommendations || ['Consider more plant-based options for better sustainability'],
      seasonal_alternatives: result.seasonal_alternatives || []
    };
  } catch (error) {
    console.error('Error calculating sustainability score:', error);
    return {
      overall_score: 5,
      grade: 'C',
      co2_impact: 'medium',
      water_usage: 'medium',
      seasonal_score: 5,
      processing_score: 5,
      local_score: 5,
      sustainability_badges: [],
      environmental_impact: {
        carbon_footprint_kg: 0,
        water_footprint_liters: 0,
        land_use_m2: 0
      },
      recommendations: ['Unable to calculate sustainability impact - please try again'],
      seasonal_alternatives: []
    };
  }
}

export async function generateMealInsights(
  nutrition: NutritionEstimate,
  score: NutritionScore,
  userProfile: any
): Promise<string[]> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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
      max_completion_tokens: 600,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.insights || [];
  } catch (error) {
    console.error('Error generating insights:', error);
    return ['Great job logging your meal! Keep tracking to see your progress.'];
  }
}
