/**
 * MVP Food Analysis Service
 * Production-ready AI analysis for safety, health, and sustainability
 * "Instant meal analysis: safety alerts, nutrition scores, and environmental impact"
 */

import OpenAI from "openai";

// Initialize OpenAI with the API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  quantity: number;
  unit: string;
  confidence: number;
  calories_per_serving: number;
  category: string;
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
   * Analyze food image for safety, health, and sustainability
   */
  async analyzeFoodImage(imageBase64: string): Promise<FoodAnalysisResult> {
    try {
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", 
        messages: [
          {
            role: "system",
            content: `You are an expert food analyst. Analyze food images for safety, health, and sustainability.

CRITICAL: Always respond with valid JSON in this exact format:
{
  "foods": [{"name": "string", "quantity": number, "unit": "string", "confidence": 0.0-1.0, "calories_per_serving": number, "category": "string"}],
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

Focus on actionable insights. Be specific about allergens, health impacts, and environmental effects.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this meal for safety (allergens, food safety), health (nutrition quality), and sustainability (environmental impact). Provide specific, actionable insights and recommendations."
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
        max_tokens: 2000,
        temperature: 0.3,
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
   * Analyze food by text description
   */
  async analyzeFoodByText(foodDescription: string): Promise<FoodAnalysisResult> {
    try {
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are MyFoodMatrics' expert food analyst. Analyze food descriptions for safety, health, and sustainability.

CRITICAL: Always respond with valid JSON in the exact format specified. Analyze the food description thoroughly for:
1. Safety: allergens, food safety concerns
2. Health: nutritional value, health benefits/concerns  
3. Sustainability: environmental impact, carbon footprint

Use the same JSON format as image analysis.`
          },
          {
            role: "user",
            content: `Analyze this food: "${foodDescription}". Provide comprehensive safety, health, and sustainability analysis with specific recommendations.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
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