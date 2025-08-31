import OpenAI from "openai";
import { db } from "../../db";
import { users, dailyNutrition, userGoals } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI API key: OPENAI_API_KEY');
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MealRecommendationRequest {
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timeOfDay?: string;
  preferences?: {
    prepTime?: number; // max prep time in minutes
    difficulty?: 'easy' | 'medium' | 'hard';
    cuisineType?: string;
    includedIngredients?: string[];
    excludedIngredients?: string[];
  };
}

export interface MealRecommendation {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  
  // Nutrition per serving
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  
  // Goal alignment
  goalAlignment: {
    calorieMatch: number; // percentage of daily goal
    proteinMatch: number;
    carbMatch: number;
    fatMatch: number;
    overallScore: number; // 0-100
  };
  
  // Recipe details
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  instructions: string[];
  
  // Dietary info
  dietCompatibility: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    lowSodium: boolean;
    keto: boolean;
  };
  
  // Sustainability
  sustainabilityScore: number; // 1-10
  sustainabilityNotes: string;
  
  // AI metadata
  confidence: number;
  reasoning: string;
}

export class MealRecommendationService {
  
  async getUserNutritionalContext(userId: string) {
    // Get user profile and goals
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get user's active goals
    const [userGoal] = await db
      .select()
      .from(userGoals)
      .where(and(eq(userGoals.userId, userId), eq(userGoals.isActive, true)))
      .orderBy(desc(userGoals.createdAt));
    
    // Get today's nutrition progress
    const today = new Date().toISOString().split('T')[0];
    const [todayNutrition] = await db
      .select()
      .from(dailyNutrition)
      .where(and(eq(dailyNutrition.userId, userId), eq(dailyNutrition.date, today)));
    
    return {
      user,
      userGoal,
      todayNutrition,
      remainingCalories: (userGoal?.dailyCalories || user.dailyCalorieGoal || 2000) - (todayNutrition?.totalCalories || 0),
      remainingProtein: (userGoal?.dailyProtein || user.dailyProteinGoal || 150) - (todayNutrition?.totalProtein || 0),
      remainingCarbs: (userGoal?.dailyCarbs || user.dailyCarbGoal || 200) - (todayNutrition?.totalCarbs || 0),
      remainingFat: (userGoal?.dailyFat || user.dailyFatGoal || 67) - (todayNutrition?.totalFat || 0),
    };
  }
  
  async generateMealRecommendations(request: MealRecommendationRequest): Promise<MealRecommendation[]> {
    const context = await this.getUserNutritionalContext(request.userId);
    
    const systemPrompt = `You are a professional nutritionist and chef specializing in personalized meal recommendations. 

USER PROFILE:
- Age: ${context.user.age || 'unknown'}, Gender: ${context.user.gender || 'unknown'}
- Activity Level: ${context.user.activityLevel}
- Weight: ${context.user.weight || 'unknown'}kg, Height: ${context.user.height || 'unknown'}cm
- Goal Type: ${context.userGoal?.goalType || 'maintenance'}

DAILY NUTRITIONAL TARGETS:
- Calories: ${context.userGoal?.dailyCalories || context.user.dailyCalorieGoal}
- Protein: ${context.userGoal?.dailyProtein || context.user.dailyProteinGoal}g
- Carbs: ${context.userGoal?.dailyCarbs || context.user.dailyCarbGoal}g
- Fat: ${context.userGoal?.dailyFat || context.user.dailyFatGoal}g

REMAINING FOR TODAY:
- Calories: ${Math.round(context.remainingCalories)}
- Protein: ${Math.round(context.remainingProtein)}g
- Carbs: ${Math.round(context.remainingCarbs)}g
- Fat: ${Math.round(context.remainingFat)}g

DIETARY RESTRICTIONS: ${context.user.dietaryRestrictions && context.user.dietaryRestrictions.length > 0 ? context.user.dietaryRestrictions.join(', ') : 'None'}
ALLERGENS TO AVOID: ${context.user.allergens && context.user.allergens.length > 0 ? context.user.allergens.join(', ') : 'None'}
CUISINE PREFERENCES: ${context.user.cuisinePreferences && context.user.cuisinePreferences.length > 0 ? context.user.cuisinePreferences.join(', ') : 'Any'}

Generate 3 personalized meal recommendations for ${request.mealType}. Each recommendation should:
1. Fit within remaining daily nutritional goals
2. Respect all dietary restrictions and allergens
3. Consider cuisine preferences
4. Be appropriate for the meal type and time
5. Include sustainability considerations

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "name": "Meal Name",
      "description": "Brief appetizing description",
      "cuisine": "cuisine type",
      "difficulty": "easy|medium|hard",
      "prepTime": 15,
      "cookTime": 20,
      "servings": 2,
      "nutrition": {
        "calories": 450,
        "protein": 25,
        "carbs": 35,
        "fat": 18,
        "fiber": 8,
        "sodium": 600
      },
      "goalAlignment": {
        "calorieMatch": 22.5,
        "proteinMatch": 16.7,
        "carbMatch": 17.5,
        "fatMatch": 26.9,
        "overallScore": 85
      },
      "ingredients": [
        {"name": "ingredient", "quantity": 150, "unit": "g"},
        {"name": "ingredient", "quantity": 1, "unit": "tbsp"}
      ],
      "instructions": [
        "Step 1: Detailed instruction",
        "Step 2: Another step"
      ],
      "dietCompatibility": {
        "vegetarian": true,
        "vegan": false,
        "glutenFree": true,
        "dairyFree": false,
        "lowSodium": true,
        "keto": false
      },
      "sustainabilityScore": 7.5,
      "sustainabilityNotes": "Uses local, seasonal ingredients with low carbon footprint",
      "confidence": 0.92,
      "reasoning": "This meal provides balanced macros while staying within your remaining daily goals"
    }
  ]
}`;

    const userPrompt = `Generate 3 ${request.mealType} recommendations${request.preferences?.prepTime ? ` with max ${request.preferences.prepTime} minutes prep time` : ''}${request.preferences?.difficulty ? ` at ${request.preferences.difficulty} difficulty level` : ''}${request.preferences?.cuisineType ? ` focusing on ${request.preferences.cuisineType} cuisine` : ''}.

Additional preferences:
${request.preferences?.includedIngredients ? `Must include: ${request.preferences.includedIngredients.join(', ')}` : ''}
${request.preferences?.excludedIngredients ? `Must avoid: ${request.preferences.excludedIngredients.join(', ')}` : ''}

Focus on meals that help achieve nutritional goals while respecting all dietary restrictions.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      // Add unique IDs and enhance recommendations
      const recommendations: MealRecommendation[] = result.recommendations.map((rec: any, index: number) => ({
        id: `rec_${Date.now()}_${index}`,
        ...rec
      }));
      
      return recommendations;
      
    } catch (error: any) {
      console.error('Error generating meal recommendations:', error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }
  
  async generateQuickRecommendation(userId: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): Promise<MealRecommendation> {
    const recommendations = await this.generateMealRecommendations({
      userId,
      mealType,
      preferences: {
        prepTime: 30, // Quick meals under 30 minutes
        difficulty: 'easy'
      }
    });
    
    // Return the highest-scoring recommendation
    return recommendations.sort((a, b) => b.goalAlignment.overallScore - a.goalAlignment.overallScore)[0];
  }
  
  async generateRecipeBasedOnRemainingMacros(userId: string): Promise<MealRecommendation> {
    const context = await this.getUserNutritionalContext(userId);
    
    // Determine meal type based on remaining calories
    let recommendedMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    if (context.remainingCalories > 600) {
      recommendedMealType = 'dinner';
    } else if (context.remainingCalories > 300) {
      recommendedMealType = 'lunch';
    } else if (context.remainingCalories > 150) {
      recommendedMealType = 'snack';
    } else {
      recommendedMealType = 'snack'; // Light snack
    }
    
    return this.generateQuickRecommendation(userId, recommendedMealType);
  }
}

export const mealRecommendationService = new MealRecommendationService();