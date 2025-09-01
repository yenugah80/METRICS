import OpenAI from 'openai';
import { db } from '../../../infrastructure/database/db';
import { dietPlanMeals, foods, mealItems, meals } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { DietPlanQuestionnaire } from '../dietPlanService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MealGenerationTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface UserPreferences {
  preferredFoods: string[];
  preferredCategories: string[];
  hasLoggingHistory: boolean;
}

export class MealGenerationService {
  // Get user's food preferences from logged meals
  async getUserFoodPreferences(userId: string): Promise<UserPreferences> {
    const loggedFoods = await db.select({
      foodName: foods.name,
      category: foods.category,
    })
    .from(meals)
    .innerJoin(mealItems, eq(meals.id, mealItems.mealId))
    .innerJoin(foods, eq(mealItems.foodId, foods.id))
    .where(eq(meals.userId, userId))
    .limit(20);

    return {
      preferredFoods: loggedFoods.map(f => f.foodName).filter(Boolean),
      preferredCategories: Array.from(new Set(loggedFoods.map(f => f.category).filter(Boolean))),
      hasLoggingHistory: loggedFoods.length > 0
    };
  }

  // Calculate meal-specific calorie distribution
  private getMealCalories(mealType: string, totalCalories: number): number {
    const distribution = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.30,
      snack: 0.10
    };
    return Math.round(totalCalories * (distribution[mealType as keyof typeof distribution] || 0.25));
  }

  // Generate personalized meals using AI
  async generateMealRecommendations(
    planId: string, 
    userId: string, 
    questionnaire: DietPlanQuestionnaire, 
    targets: MealGenerationTargets
  ): Promise<void> {
    console.log('Starting personalized meal generation for plan:', planId);
    
    const userPreferences = await this.getUserFoodPreferences(userId);
    
    // Create personalized AI prompt based on user's actual preferences
    let personalizedPrompt = `Generate 7 days of personalized meals for a ${questionnaire.healthGoals[0]} diet plan:

User Profile:
- ${questionnaire.personalInfo.age}yr ${questionnaire.personalInfo.gender}
- Food preferences: ${questionnaire.foodPreferences.join(', ')}
- Restrictions: ${questionnaire.restrictions.join(', ')}
- Daily calories: ${targets.calories}
- BMR-calculated protein: ${targets.protein}g, carbs: ${targets.carbs}g, fat: ${targets.fat}g`;

    if (userPreferences.hasLoggingHistory) {
      personalizedPrompt += `
- User's favorite foods: ${userPreferences.preferredFoods.slice(0, 10).join(', ')}
- Preferred food categories: ${userPreferences.preferredCategories.join(', ')}
IMPORTANT: Include variations of their favorite foods in meal recommendations.`;
    } else {
      personalizedPrompt += `
- No previous logging history - create diverse, approachable meals`;
    }

    personalizedPrompt += `

Create varied, practical meals. Respond with JSON:
{
  "meals": [
    {
      "day": 1,
      "mealType": "breakfast",
      "mealName": "Protein-Packed Scramble",
      "description": "High-protein breakfast to fuel your day",
      "quickRecipe": "Scramble 3 eggs with spinach and tomatoes. Serve with 1 slice whole grain toast.",
      "calories": ${this.getMealCalories('breakfast', targets.calories)},
      "protein": 25,
      "carbs": 20,
      "fat": 15,
      "fiber": 4
    }
  ]
}

Generate 28 meals total (7 days × 4 meal types): breakfast, lunch, dinner, snack`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: personalizedPrompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 3000,
      });

      const mealData = JSON.parse(response.choices[0].message.content || '{"meals": []}');
      const meals = mealData.meals || [];
      
      console.log(`AI Generated ${meals.length} meals for plan ${planId}`);

      if (meals.length > 0) {
        const mealInserts = meals.map((meal: any) => ({
          dietPlanId: planId,
          day: meal.day,
          mealType: meal.mealType,
          option: 1,
          mealName: meal.mealName,
          description: meal.description,
          quickRecipe: meal.quickRecipe,
          portionSize: '1 serving',
          healthBenefits: `Supports ${questionnaire.healthGoals[0]} goals`,
          thingsToAvoid: 'Follow portion guidelines',
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          fiber: meal.fiber,
        }));

        await db.insert(dietPlanMeals).values(mealInserts);
        console.log(`Successfully inserted ${mealInserts.length} meals into database`);
      } else {
        console.log('AI generated 0 meals, using fallback');
        await this.createFallbackMeals(planId, targets);
      }
    } catch (error) {
      console.error('Error generating meals:', error);
      await this.createFallbackMeals(planId, targets);
    }
  }

  // Fallback meal creation to ensure plans are never empty
  private async createFallbackMeals(planId: string, targets: MealGenerationTargets): Promise<void> {
    const basicMeals = [];
    
    // Create 7 days of meals
    for (let day = 1; day <= 7; day++) {
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      
      for (const mealType of mealTypes) {
        const calories = this.getMealCalories(mealType, targets.calories);
        const protein = Math.round(targets.protein * (calories / targets.calories));
        const carbs = Math.round(targets.carbs * (calories / targets.calories));
        const fat = Math.round(targets.fat * (calories / targets.calories));
        
        basicMeals.push({
          dietPlanId: planId,
          day,
          mealType,
          option: 1,
          mealName: `Healthy ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
          description: `Balanced ${mealType} for your health goals`,
          quickRecipe: `Simple ${mealType} recipe with whole foods`,
          portionSize: '1 serving',
          healthBenefits: 'Supports your health goals',
          thingsToAvoid: 'Follow portion guidelines',
          calories,
          protein,
          carbs,
          fat,
          fiber: Math.round(targets.fiber * (calories / targets.calories)),
        });
      }
    }

    await db.insert(dietPlanMeals).values(basicMeals);
    console.log(`Created ${basicMeals.length} fallback meals`);
  }

  // Generate meal alternatives for variety
  async generateMealAlternatives(planId: string, day: number): Promise<void> {
    const existingMeals = await db.select()
      .from(dietPlanMeals)
      .where(eq(dietPlanMeals.dietPlanId, planId));

    // Generate option 2 for each meal type
    const alternatives = existingMeals
      .filter(meal => meal.day === day && meal.option === 1)
      .map(meal => ({
        ...meal,
        id: undefined, // Will get new ID
        option: 2,
        mealName: `Alternative ${meal.mealName}`,
        description: `Another option for ${meal.mealType}`,
        quickRecipe: `Variation of ${meal.mealName.toLowerCase()}`,
      }));

    if (alternatives.length > 0) {
      await db.insert(dietPlanMeals).values(alternatives as any);
    }
  }
}

export const mealGenerationService = new MealGenerationService();