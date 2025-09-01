import OpenAI from 'openai';
import { db } from '../../infrastructure/database/db';
import { meals, users, dailyNutrition } from '@shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SmartGptRequest {
  userId: string;
  action: 'analyze_trends' | 'meal_suggestions' | 'health_insights' | 'nutrition_coaching' | 'recipe_generation';
  context?: any;
  parameters?: {
    timeframe?: 'daily' | 'weekly' | 'monthly';
    goalType?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'performance';
    cuisinePreference?: string[];
    dietaryRestrictions?: string[];
    targetCalories?: number;
    targetMacros?: { protein: number; carbs: number; fat: number };
  };
}

export interface SmartGptResponse {
  analysis: any;
  recommendations: string[];
  actionItems: string[];
  insights: string[];
  visualData?: any;
  confidence: number;
  responseTime: number;
}

export class SmartGptService {

  // Advanced nutrition trend analysis
  async analyzeTrends(request: SmartGptRequest): Promise<SmartGptResponse> {
    const startTime = Date.now();
    
    try {
      // Get comprehensive user data
      const userData = await this.getUserNutritionData(request.userId, request.parameters?.timeframe || 'weekly');
      
      const analysisPrompt = `You are an advanced nutrition analytics AI. Analyze the following user nutrition data and provide comprehensive insights.

## User Data Analysis:
${JSON.stringify(userData, null, 2)}

## Analysis Requirements:
- Identify nutrition trends and patterns
- Spot potential deficiencies or excesses
- Evaluate progress toward goals
- Provide personalized recommendations
- Rate overall nutrition quality (1-10)

Respond in JSON format:
{
  "analysis": {
    "nutritionScore": 8.5,
    "trendDirection": "improving",
    "keyPatterns": ["Pattern description"],
    "concernAreas": ["Area that needs attention"],
    "strengths": ["What they're doing well"]
  },
  "recommendations": ["Specific actionable advice"],
  "actionItems": ["Immediate next steps"],
  "insights": ["Key insights about their nutrition"],
  "confidence": 0.9
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert nutrition analyst with access to comprehensive dietary data." },
          { role: "user", content: analysisPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
        temperature: 0.3,
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        analysis: response.analysis,
        recommendations: response.recommendations || [],
        actionItems: response.actionItems || [],
        insights: response.insights || [],
        confidence: response.confidence || 0.8,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error in analyzeTrends:', error);
      return this.getFallbackResponse(startTime);
    }
  }

  // Intelligent meal suggestions with live parameters
  async generateMealSuggestions(request: SmartGptRequest): Promise<SmartGptResponse> {
    const startTime = Date.now();
    
    try {
      const userData = await this.getUserNutritionData(request.userId, 'daily');
      const { targetCalories, targetMacros, cuisinePreference, dietaryRestrictions } = request.parameters || {};
      
      const suggestionPrompt = `Generate personalized meal suggestions for a user based on their current nutrition status and preferences.

## Current Status:
- Today's intake: ${userData.todaysNutrition?.totalCalories || 0} calories
- Remaining for goals: ${(targetCalories || 2000) - (userData.todaysNutrition?.totalCalories || 0)} calories
- Protein goal: ${targetMacros?.protein || 150}g
- Recent meals: ${userData.recentMeals.length} logged this week

## Preferences:
- Cuisine: ${cuisinePreference?.join(', ') || 'any'}
- Dietary restrictions: ${dietaryRestrictions?.join(', ') || 'none'}
- Goal type: ${request.parameters?.goalType || 'maintenance'}

Generate 3-5 specific meal suggestions with:
- Exact calorie and macro estimates
- Preparation time
- Specific ingredients
- Why this meal fits their goals

Respond in JSON format:
{
  "analysis": {
    "remainingCalories": 1200,
    "proteinNeeded": "45g",
    "recommendedMealType": "lunch"
  },
  "recommendations": [
    {
      "mealName": "Grilled Chicken Power Bowl",
      "calories": 520,
      "protein": 45,
      "carbs": 35,
      "fat": 18,
      "prepTime": "15 minutes",
      "ingredients": ["chicken breast", "quinoa", "vegetables"],
      "reasoning": "High protein to meet your daily goals"
    }
  ],
  "actionItems": ["Shop for ingredients", "Prep proteins for the week"],
  "insights": ["You're 45g short on protein today"],
  "confidence": 0.95
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a expert nutritionist and meal planning specialist." },
          { role: "user", content: suggestionPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.5,
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        analysis: response.analysis,
        recommendations: response.recommendations || [],
        actionItems: response.actionItems || [],
        insights: response.insights || [],
        confidence: response.confidence || 0.9,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error in generateMealSuggestions:', error);
      return this.getFallbackResponse(startTime);
    }
  }

  // Live health insights with real-time analysis
  async generateHealthInsights(request: SmartGptRequest): Promise<SmartGptResponse> {
    const startTime = Date.now();
    
    try {
      const userData = await this.getUserNutritionData(request.userId, 'monthly');
      
      const insightsPrompt = `Provide comprehensive health insights based on long-term nutrition data and trends.

## User Profile & Data:
${JSON.stringify(userData, null, 2)}

## Analysis Focus:
- Long-term nutrition patterns
- Health risk assessment
- Positive lifestyle changes
- Areas for improvement
- Goal progress evaluation

Provide insights in JSON format:
{
  "analysis": {
    "overallHealthScore": 8.2,
    "riskFactors": ["High sodium intake patterns"],
    "improvements": ["Consistent protein intake"],
    "trends": {
      "caloric": "stable",
      "macros": "well-balanced",
      "micronutrients": "needs attention"
    }
  },
  "recommendations": ["Specific health recommendations"],
  "actionItems": ["Concrete steps to take"],
  "insights": ["Key health insights"],
  "confidence": 0.88
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a nutrition and health analysis expert with deep knowledge of dietary patterns and health outcomes." },
          { role: "user", content: insightsPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
        temperature: 0.2,
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        analysis: response.analysis,
        recommendations: response.recommendations || [],
        actionItems: response.actionItems || [],
        insights: response.insights || [],
        confidence: response.confidence || 0.8,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error in generateHealthInsights:', error);
      return this.getFallbackResponse(startTime);
    }
  }

  // Get comprehensive user nutrition data
  private async getUserNutritionData(userId: string, timeframe: string) {
    const daysBack = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : 30;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    // Get recent meals
    const recentMeals = await db.select()
      .from(meals)
      .where(and(
        eq(meals.userId, userId),
        gte(meals.loggedAt, dateThreshold)
      ))
      .orderBy(desc(meals.loggedAt))
      .limit(50);

    // Get today's nutrition
    const today = new Date().toISOString().split('T')[0];
    const [todaysNutrition] = await db.select()
      .from(dailyNutrition)
      .where(and(
        eq(dailyNutrition.userId, userId),
        eq(dailyNutrition.date, today)
      ))
      .limit(1);

    // Get user profile
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      recentMeals,
      todaysNutrition,
      user,
      timeframe,
      totalMealsAnalyzed: recentMeals.length
    };
  }

  private getFallbackResponse(startTime: number): SmartGptResponse {
    return {
      analysis: { error: "Analysis temporarily unavailable" },
      recommendations: ["Continue logging your meals for better insights"],
      actionItems: ["Keep tracking your nutrition consistently"],
      insights: ["Regular meal logging improves recommendation accuracy"],
      confidence: 0.5,
      responseTime: Date.now() - startTime
    };
  }
}

export const smartGptService = new SmartGptService();