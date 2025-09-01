import OpenAI from 'openai';
import { db } from '../../infrastructure/database/db';
import { dietPlans, dietPlanMeals, dietPlanSupplements, dietPlanLifestyle, users, meals, mealItems, foods } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { targetCalculator } from '../nutrition/targetCalculator';
import { dietPlanRepository } from './services/DietPlanRepository';
import { mealGenerationService } from './services/MealGenerationService';
import { supplementService } from './services/SupplementService';
import { lifestyleService } from './services/LifestyleService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DietPlanQuestionnaire {
  personalInfo: {
    age: number;
    gender: string;
    height: number; // cm
    weight: number; // kg
  };
  healthGoals: string[]; // weight_loss, muscle_gain, diabetes, pcos, pregnancy, maintenance
  lifestyle: string[];
  foodPreferences: string[]; // vegetarian, non_vegetarian, vegan, mixed
  restrictions: string[]; // allergens and dietary restrictions
  eatingSchedule: string[]; // meal times
  dietPreparation: string[]; // cooking habits
  physicalActivity: string[];
  supplements: boolean;
  currentDiet: string[];
}

export interface DietPlanResponse {
  planId: string;
  planName: string;
  duration: number;
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    micronutrients: Record<string, number>;
  };
  startDate: string;
  endDate: string;
}

export class DietPlanService {
  // Generate personalized diet plan using AI
  async generateDietPlan(userId: string, questionnaire: DietPlanQuestionnaire): Promise<DietPlanResponse> {
    try {
      // Deactivate any existing plans
      await dietPlanRepository.deactivateCurrentPlans(userId);

      // Get user profile and update if needed
      const user = await dietPlanRepository.getUserProfile(userId);
      if (!user.weight || !user.height || !user.age) {
        await dietPlanRepository.updateUserProfileFromQuestionnaire(userId, questionnaire);
      }

      // Calculate proper nutritional targets using BMR science
      const targets = await this.calculateNutritionalTargets(userId, questionnaire);
      
      // Generate AI-powered plan name and recommendations
      const aiPlanResponse = await this.generateAIPlan(questionnaire, targets);
      
      // Create the diet plan record
      const planEndDate = new Date();
      planEndDate.setDate(planEndDate.getDate() + 28);
      
      const newPlan = await dietPlanRepository.createDietPlan({
        userId,
        planName: aiPlanResponse.planName,
        planType: questionnaire.healthGoals[0] || 'maintenance',
        duration: 28,
        questionnaireData: questionnaire,
        dailyTargets: targets,
        startDate: new Date().toISOString().split('T')[0],
        endDate: planEndDate.toISOString().split('T')[0],
      });

      // Generate all plan components using specialized services
      await Promise.all([
        mealGenerationService.generateMealRecommendations(newPlan.id, userId, questionnaire, targets),
        supplementService.generateSupplementRecommendations(newPlan.id, questionnaire),
        lifestyleService.generateLifestyleRecommendations(newPlan.id, questionnaire)
      ]);

      return {
        planId: newPlan.id,
        planName: newPlan.planName,
        duration: newPlan.duration || 28,
        dailyTargets: targets,
        startDate: newPlan.startDate,
        endDate: newPlan.endDate,
      };
    } catch (error: any) {
      console.error('Error generating diet plan:', error);
      throw new Error(`Failed to generate diet plan: ${error.message}`);
    }
  }

  // Calculate nutritional targets using proper BMR/TDEE science
  private async calculateNutritionalTargets(userId: string, questionnaire: DietPlanQuestionnaire) {
    // Get user's actual profile data
    const user = await dietPlanRepository.getUserProfile(userId);

    // Calculate proper targets using BMR science
    const userForCalculation = {
      ...user,
      weight: user.weight || questionnaire.personalInfo.weight,
      height: user.height || questionnaire.personalInfo.height,
      age: user.age || questionnaire.personalInfo.age,
      gender: user.gender || questionnaire.personalInfo.gender,
      activityLevel: user.activityLevel || questionnaire.physicalActivity[0] || 'moderate',
    };

    const goalType = questionnaire.healthGoals[0] || 'weight_loss';
    const targets = targetCalculator.calculatePersonalizedTargets(userForCalculation as any, goalType);

    // Update user's targets in database
    await targetCalculator.updateUserTargets(userId, targets);

    // Return with micronutrients
    return {
      calories: targets.calories,
      protein: targets.protein,
      carbs: targets.carbs,
      fat: targets.fat,
      fiber: targets.fiber,
      micronutrients: {
        iron: userForCalculation.gender?.toLowerCase() === 'male' ? 8 : 18,
        calcium: (userForCalculation.age || 25) < 50 ? 1000 : 1200,
        vitaminC: 90,
        vitaminD: 20,
        magnesium: userForCalculation.gender?.toLowerCase() === 'male' ? 400 : 310,
        potassium: 3500
      },
      explanation: targets.explanation
    };
  }

  // Get user's logged food preferences for personalization
  private async getUserFoodPreferences(userId: string) {
    // Get user's most frequently logged foods for personalization
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
      preferredFoods: loggedFoods.map(f => f.foodName),
      preferredCategories: Array.from(new Set(loggedFoods.map(f => f.category).filter(Boolean))),
      hasLoggingHistory: loggedFoods.length > 0
    };
  }

  // Generate AI-powered plan using OpenAI
  private async generateAIPlan(questionnaire: DietPlanQuestionnaire, targets: any) {
    const prompt = `Create a personalized diet plan name and overview for:
    
Goals: ${questionnaire.healthGoals.join(', ')}
Age: ${questionnaire.personalInfo.age}, Gender: ${questionnaire.personalInfo.gender}
Food Preferences: ${questionnaire.foodPreferences.join(', ')}
Restrictions: ${questionnaire.restrictions.join(', ')}
Activity: ${questionnaire.physicalActivity.join(', ')}

Daily Targets: ${targets.calories} calories, ${targets.protein}g protein

Respond with JSON: { "planName": "motivating plan name", "overview": "2-sentence description" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  // Regenerate meals for existing diet plan
  async regenerateMealsForPlan(planId: string) {
    console.log('Regenerating meals for existing plan:', planId);
    
    // Get the plan data
    const [plan] = await db.select().from(dietPlans).where(eq(dietPlans.id, planId)).limit(1);
    if (!plan) {
      throw new Error('Diet plan not found');
    }

    // Delete existing meals
    await db.delete(dietPlanMeals).where(eq(dietPlanMeals.dietPlanId, planId));
    
    // Generate new meals using specialized service
    await mealGenerationService.generateMealRecommendations(planId, plan.userId, plan.questionnaireData as any, plan.dailyTargets);
    
    return { success: true };
  }

  // Get user's active diet plan
  async getActiveDietPlan(userId: string) {
    const [plan] = await db.select()
      .from(dietPlans)
      .where(and(eq(dietPlans.userId, userId), eq(dietPlans.isActive, true)))
      .limit(1);
    
    return plan;
  }

  // Get diet plan meals for a specific day
  async getDietPlanMealsForDay(planId: string, day: number) {
    return await db.select()
      .from(dietPlanMeals)
      .where(and(eq(dietPlanMeals.dietPlanId, planId), eq(dietPlanMeals.day, day)));
  }

  // Get diet plan supplements
  async getDietPlanSupplements(planId: string) {
    return await db.select()
      .from(dietPlanSupplements)
      .where(eq(dietPlanSupplements.dietPlanId, planId));
  }

  // Get diet plan lifestyle recommendations
  async getDietPlanLifestyle(planId: string) {
    return await db.select()
      .from(dietPlanLifestyle)
      .where(eq(dietPlanLifestyle.dietPlanId, planId));
  }

  // Calculate diet plan adherence based on logged meals vs recommendations
  async calculateAdherence(userId: string, planId: string): Promise<number> {
    // This would compare actual logged meals against diet plan recommendations
    // For now, return a placeholder that can be implemented with real meal comparison logic
    return 85; // 85% adherence
  }
}

export const dietPlanService = new DietPlanService();