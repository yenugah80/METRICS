/**
 * MVP Food Analysis Service
 * Production-ready AI analysis for safety, health, and sustainability
 * "Instant meal analysis: safety alerts, nutrition scores, and environmental impact"
 */

import { OpenAIManager } from '../../integrations/openai/openai-manager';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface FoodAnalysisResult {
  // Core Analysis
  foods: AnalyzedFood[];
  
  // Safety Analysis
  safety: {
    overall_safety: 'safe' | 'caution' | 'warning';
    allergen_alerts: AllergenAlert[];
    food_safety_score: number; // 0-100
    safety_recommendations: string[];
  };
  
  // Health Analysis
  health: {
    nutrition_score: number; // 0-100
    health_grade: 'A' | 'B' | 'C' | 'D' | 'F';
    calories: number;
    macronutrients: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    micronutrients: {
      vitamin_c: number; // mg
      iron: number; // mg
      calcium: number; // mg
      vitamin_d: number; // IU
      potassium: number; // mg
      magnesium: number; // mg
      zinc: number; // mg
      vitamin_b12: number; // mcg
      folate: number; // mcg
      vitamin_a: number; // IU
    };
    health_benefits: string[];
    health_concerns: string[];
    improvement_suggestions: string[];
  };
  
  // Sustainability Analysis
  sustainability: {
    eco_score: number; // 0-100
    eco_grade: 'A' | 'B' | 'C' | 'D' | 'F';
    carbon_footprint: 'low' | 'medium' | 'high';
    water_usage: 'low' | 'medium' | 'high';
    sustainability_tips: string[];
    eco_friendly_alternatives: string[];
  };
  
  // Smart Recommendations
  recommendations: {
    safer_alternatives: FoodSwap[];
    healthier_swaps: FoodSwap[];
    eco_friendly_options: FoodSwap[];
    general_tips: string[];
  };
  
  // Analysis Metadata
  confidence: number;
  analysis_timestamp: string;
}

export interface AnalyzedFood {
  name: string;
  description: string; // Detailed food description
  quantity: number;
  unit: string;
  confidence: number;
  calories_per_serving: number;
  category: string;
  cooking_method?: string;
  preparation_details?: string;
}

export interface AllergenAlert {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  foods_containing: string[];
  description: string;
}

export interface FoodSwap {
  original_food: string;
  alternative: string;
  reason: string;
  benefit_score: number;
}

export class MVPFoodAnalysis {
  
  /**
   * Analyze food image for safety, health, and sustainability with personalized recommendations
   */
  async analyzeFoodImage(imageBase64: string, userProfile?: any): Promise<FoodAnalysisResult> {
    try {
      if (!OpenAIManager.isAvailable()) {
        throw new Error('AI analysis is not available. Please configure OpenAI API key.');
      }

      const openai = await OpenAIManager.getInstance();
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", 
        messages: [
          {
            role: "system",
            content: `You are MyFoodMatrics' elite food scientist and nutrition expert with PhD-level expertise in food analysis, nutrition science, and sustainability assessment.

ADVANCED FOOD DETECTION MISSION: Use cutting-edge visual analysis techniques to achieve 95%+ accuracy in food identification by examining:
🔬 VISUAL DETAILS: Colors, textures, cooking methods (grilled, roasted, fried), doneness levels, seasonings, garnishes
🍽️ PORTION ANALYSIS: Use plate/utensil references for precise serving size estimation
🧪 INGREDIENT BREAKDOWN: Identify herbs, spices, marinades, sauces, and preparation techniques visible
📏 NUTRITIONAL PRECISION: Calculate both macro AND micronutrients based on actual visual food content

PERSONALIZED ANALYSIS: ${userProfile ? `
This user has specific diet preferences and health goals:
- Dietary restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'none'}
- Allergens to avoid: ${userProfile.allergens?.join(', ') || 'none'}
- Preferred cuisines: ${userProfile.cuisinePreferences?.join(', ') || 'any'}
- Daily goals: ${userProfile.dailyCalorieGoal || 2000} calories, ${userProfile.dailyProteinGoal || 150}g protein
- Activity level: ${userProfile.activityLevel || 'moderate'}
- Age: ${userProfile.age || 'unknown'}, Gender: ${userProfile.gender || 'unknown'}

INCLUDE PERSONALIZED HEALTH TIPS that consider their specific diet preferences, allergen warnings for their profile, and recommendations aligned with their goals and restrictions.` : 'Provide general health recommendations as no user profile is available.'}

CRITICAL: Always respond with valid JSON in this exact format:
{
  "foods": [{"name": "string", "description": "detailed visual description", "quantity": number, "unit": "string", "confidence": 0.0-1.0, "calories_per_serving": number, "category": "string", "cooking_method": "string", "preparation_details": "string"}],
  "safety": {
    "overall_safety": "safe|caution|warning",
    "allergen_alerts": [{"allergen": "string", "severity": "mild|moderate|severe", "foods_containing": ["string"], "description": "string"}],
    "food_safety_score": 0-100,
    "safety_recommendations": ["string"]
  },
  "health": {
    "nutrition_score": 0-100,
    "health_grade": "A|B|C|D|F",
    "calories": number,
    "macronutrients": {"protein": number, "carbs": number, "fat": number, "fiber": number},
    "micronutrients": {"vitamin_c": number, "iron": number, "calcium": number, "vitamin_d": number, "potassium": number, "magnesium": number, "zinc": number, "vitamin_b12": number, "folate": number, "vitamin_a": number},
    "health_benefits": ["string"],
    "health_concerns": ["string"],
    "improvement_suggestions": ["string"]
  },
  "sustainability": {
    "eco_score": 0-100,
    "eco_grade": "A|B|C|D|F",
    "carbon_footprint": "low|medium|high",
    "water_usage": "low|medium|high",
    "sustainability_tips": ["string"],
    "eco_friendly_alternatives": ["string"]
  },
  "recommendations": {
    "safer_alternatives": [{"original_food": "string", "alternative": "string", "reason": "string", "benefit_score": 0-100}],
    "healthier_swaps": [{"original_food": "string", "alternative": "string", "reason": "string", "benefit_score": 0-100}],
    "eco_friendly_options": [{"original_food": "string", "alternative": "string", "reason": "string", "benefit_score": 0-100}],
    "general_tips": ["string"]
  },
  "confidence": 0.0-1.0,
  "analysis_timestamp": "ISO string"
}

MARKET-LEADING REQUIREMENTS:
✅ MICRONUTRIENTS: Always include vitamin C, iron, calcium, vitamin D, potassium, magnesium, zinc, B12, folate, vitamin A (in mg/mcg/IU)
✅ VISUAL ACCURACY: Describe exactly what you see - cooking doneness, visible seasonings, garnishes, sauces
✅ PRECISION: Use USDA database knowledge for precise nutritional calculations
✅ PROFESSIONAL INSIGHTS: Provide expert-level health and sustainability recommendations`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `ADVANCED FOOD ANALYSIS PROTOCOL:

🎯 VISUAL INSPECTION CHECKLIST:
• Identify ALL visible foods, ingredients, seasonings, herbs, and garnishes
• Analyze cooking methods (roasted, grilled, fried, steamed, raw)
• Assess doneness levels (rare, medium, well-done) and browning patterns
• Detect visible fats, oils, marinades, and sauce coatings
• Estimate portions using visual cues (plate size, utensil references, food thickness)

🧬 NUTRITIONAL ANALYSIS REQUIREMENTS:
• Calculate precise macronutrients (protein, carbs, fat, fiber) in grams
• Provide comprehensive micronutrients (all 10 vitamins/minerals) in proper units
• Base calculations on actual visual food content and preparation method
• Account for cooking losses and preparation techniques

🔍 MARKET-LEADING ACCURACY STANDARDS:
• Describe each food with professional culinary detail
• Include cooking method, seasoning identification, and preparation notes  
• Provide food-specific health and sustainability insights
• Exceed MyFitnessPal's detection accuracy with superior visual analysis

${userProfile ? `
🎯 PERSONALIZED ANALYSIS FOR THIS USER:
• Dietary restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'none'} - Check compatibility!
• Allergens to avoid: ${userProfile.allergens?.join(', ') || 'none'} - Alert if any detected!
• Cuisine preferences: ${userProfile.cuisinePreferences?.join(', ') || 'any'}
• Daily nutrition goals: ${userProfile.dailyCalorieGoal || 2000} calories, ${userProfile.dailyProteinGoal || 150}g protein
• Profile: ${userProfile.activityLevel || 'moderate'} activity, ${userProfile.age || 'unknown'} years old, ${userProfile.gender || 'unknown'}

PROVIDE SPECIFIC HEALTH TIPS about how this meal fits their goals and suggest personalized improvements based on their preferences and restrictions.
` : ''}

Analyze this meal with PhD-level precision, focusing on what you actually observe in the image.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const analysisContent = response.choices[0]?.message?.content;
      if (!analysisContent) {
        throw new Error('No analysis received from AI');
      }

      const analysis = JSON.parse(analysisContent);
      
      // Enhance with timestamp
      analysis.analysis_timestamp = new Date().toISOString();
      
      // Validate and enhance the analysis
      return this.validateAndEnhanceAnalysis(analysis);
      
    } catch (error) {
      console.error('Error in AI food analysis:', error);
      throw new Error('Failed to analyze food image');
    }
  }

  /**
   * Analyze food by text description with personalized recommendations
   */
  async analyzeFoodByText(foodDescription: string, userProfile?: any): Promise<FoodAnalysisResult> {
    try {
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are MyFoodMatrics' expert food analyst. Analyze food descriptions for safety, health, and sustainability with personalized recommendations.

PERSONALIZED ANALYSIS: ${userProfile ? `
This user has specific diet preferences and health goals:
- Dietary restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'none'}
- Allergens to avoid: ${userProfile.allergens?.join(', ') || 'none'}
- Preferred cuisines: ${userProfile.cuisinePreferences?.join(', ') || 'any'}
- Daily goals: ${userProfile.dailyCalorieGoal || 2000} calories, ${userProfile.dailyProteinGoal || 150}g protein
- Activity level: ${userProfile.activityLevel || 'moderate'}
- Age: ${userProfile.age || 'unknown'}, Gender: ${userProfile.gender || 'unknown'}

INCLUDE PERSONALIZED HEALTH TIPS that consider their specific diet preferences, allergen warnings for their profile, and recommendations aligned with their goals and restrictions.` : 'Provide general health recommendations as no user profile is available.'}

CRITICAL: Always respond with valid JSON in the exact format specified. Analyze the food description thoroughly for:
1. Safety: allergens, food safety concerns with specific warnings for this user's allergens
2. Health: nutritional value, health benefits/concerns personalized to their diet and goals
3. Sustainability: environmental impact, carbon footprint
4. Personalized recommendations based on their dietary restrictions and preferences

Use the same JSON format as image analysis.`
          },
          {
            role: "user",
            content: `Analyze this food: "${foodDescription}". 

${userProfile ? `
PERSONALIZATION REQUIREMENTS:
- Check if this food fits their dietary restrictions (${userProfile.dietaryRestrictions?.join(', ') || 'none'})
- Alert if contains any of their allergens (${userProfile.allergens?.join(', ') || 'none'})
- Provide health tips specific to their activity level (${userProfile.activityLevel || 'moderate'}) and daily goals
- Suggest modifications or alternatives that align with their cuisine preferences (${userProfile.cuisinePreferences?.join(', ') || 'any'})
` : ''}

Provide comprehensive safety, health, and sustainability analysis with specific personalized recommendations.`
          }
        ],
        max_completion_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const analysisContent = response.choices[0]?.message?.content;
      if (!analysisContent) {
        throw new Error('No analysis received from AI');
      }

      const analysis = JSON.parse(analysisContent);
      analysis.analysis_timestamp = new Date().toISOString();
      
      return this.validateAndEnhanceAnalysis(analysis);
      
    } catch (error) {
      console.error('Error in AI text food analysis:', error);
      throw new Error('Failed to analyze food description');
    }
  }

  /**
   * Validate and enhance analysis results
   */
  private validateAndEnhanceAnalysis(analysis: any): FoodAnalysisResult {
    // Ensure required fields exist with defaults
    const result: FoodAnalysisResult = {
      foods: analysis.foods || [],
      safety: {
        overall_safety: analysis.safety?.overall_safety || 'safe',
        allergen_alerts: analysis.safety?.allergen_alerts || [],
        food_safety_score: analysis.safety?.food_safety_score || 85,
        safety_recommendations: analysis.safety?.safety_recommendations || []
      },
      health: {
        nutrition_score: analysis.health?.nutrition_score || 70,
        health_grade: analysis.health?.health_grade || 'B',
        calories: analysis.health?.calories || 0,
        macronutrients: {
          protein: analysis.health?.macronutrients?.protein || 0,
          carbs: analysis.health?.macronutrients?.carbs || 0,
          fat: analysis.health?.macronutrients?.fat || 0,
          fiber: analysis.health?.macronutrients?.fiber || 0
        },
        micronutrients: {
          vitamin_c: analysis.health?.micronutrients?.vitamin_c || 0,
          iron: analysis.health?.micronutrients?.iron || 0,
          calcium: analysis.health?.micronutrients?.calcium || 0,
          vitamin_d: analysis.health?.micronutrients?.vitamin_d || 0,
          potassium: analysis.health?.micronutrients?.potassium || 0,
          magnesium: analysis.health?.micronutrients?.magnesium || 0,
          zinc: analysis.health?.micronutrients?.zinc || 0,
          vitamin_b12: analysis.health?.micronutrients?.vitamin_b12 || 0,
          folate: analysis.health?.micronutrients?.folate || 0,
          vitamin_a: analysis.health?.micronutrients?.vitamin_a || 0
        },
        health_benefits: analysis.health?.health_benefits || [],
        health_concerns: analysis.health?.health_concerns || [],
        improvement_suggestions: analysis.health?.improvement_suggestions || []
      },
      sustainability: {
        eco_score: analysis.sustainability?.eco_score || 60,
        eco_grade: analysis.sustainability?.eco_grade || 'C',
        carbon_footprint: analysis.sustainability?.carbon_footprint || 'medium',
        water_usage: analysis.sustainability?.water_usage || 'medium',
        sustainability_tips: analysis.sustainability?.sustainability_tips || [],
        eco_friendly_alternatives: analysis.sustainability?.eco_friendly_alternatives || []
      },
      recommendations: {
        safer_alternatives: analysis.recommendations?.safer_alternatives || [],
        healthier_swaps: analysis.recommendations?.healthier_swaps || [],
        eco_friendly_options: analysis.recommendations?.eco_friendly_options || [],
        general_tips: analysis.recommendations?.general_tips || []
      },
      confidence: analysis.confidence || 0.8,
      analysis_timestamp: analysis.analysis_timestamp || new Date().toISOString()
    };

    return result;
  }

  /**
   * Get analysis summary for quick display
   */
  getAnalysisSummary(analysis: FoodAnalysisResult): {
    safety_status: string;
    health_status: string;
    sustainability_status: string;
    key_alerts: string[];
    primary_recommendations: string[];
  } {
    const key_alerts = [];
    const primary_recommendations = [];

    // Safety alerts
    if (analysis.safety.overall_safety === 'warning') {
      key_alerts.push('⚠️ Safety concerns detected');
    }
    if (analysis.safety.allergen_alerts.length > 0) {
      key_alerts.push(`🚨 ${analysis.safety.allergen_alerts.length} allergen alert(s)`);
    }

    // Health status
    let health_status = 'Good';
    if (analysis.health.health_grade === 'A') health_status = 'Excellent';
    else if (analysis.health.health_grade === 'D' || analysis.health.health_grade === 'F') health_status = 'Poor';

    // Sustainability status  
    let sustainability_status = 'Moderate';
    if (analysis.sustainability.eco_grade === 'A' || analysis.sustainability.eco_grade === 'B') sustainability_status = 'Excellent';
    else if (analysis.sustainability.eco_grade === 'D' || analysis.sustainability.eco_grade === 'F') sustainability_status = 'Poor';

    // Top recommendations
    if (analysis.recommendations.healthier_swaps.length > 0) {
      primary_recommendations.push(analysis.recommendations.healthier_swaps[0].reason);
    }
    if (analysis.recommendations.eco_friendly_options.length > 0) {
      primary_recommendations.push(analysis.recommendations.eco_friendly_options[0].reason);
    }

    return {
      safety_status: analysis.safety.overall_safety,
      health_status,
      sustainability_status,
      key_alerts,
      primary_recommendations
    };
  }
}

// Export singleton instance
export const mvpFoodAnalysis = new MVPFoodAnalysis();