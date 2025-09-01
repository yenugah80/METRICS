import OpenAI from 'openai';
import { db } from '../../infrastructure/database/db';
import { dietPlans, dietPlanMeals, dietPlanSupplements, dietPlanLifestyle, users, meals, mealItems, foods } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { targetCalculator } from '../nutrition/targetCalculator';

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
      // Get user's current profile for context
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user[0]) {
        throw new Error('User not found');
      }

      // Calculate proper nutritional targets using BMR science
      const targets = await this.calculateNutritionalTargets(userId, questionnaire);
      
      // Generate AI-powered plan name and recommendations
      const aiPlanResponse = await this.generateAIPlan(questionnaire, targets);
      
      // Create the diet plan record
      const planEndDate = new Date();
      planEndDate.setDate(planEndDate.getDate() + 28);
      
      const [newPlan] = await db.insert(dietPlans).values({
        userId,
        planName: aiPlanResponse.planName,
        planType: questionnaire.healthGoals[0] || 'maintenance',
        duration: 28,
        questionnaireData: questionnaire,
        dailyTargets: targets,
        startDate: new Date().toISOString().split('T')[0],
        endDate: planEndDate.toISOString().split('T')[0],
        isActive: true,
      }).returning();

      // Generate personalized 28-day meal recommendations
      await this.generateMealRecommendations(newPlan.id, userId, questionnaire, targets);
      
      // Generate supplement recommendations
      await this.generateSupplementRecommendations(newPlan.id, questionnaire);
      
      // Generate lifestyle recommendations
      await this.generateLifestyleRecommendations(newPlan.id, questionnaire);

      return {
        planId: newPlan.id,
        planName: newPlan.planName,
        duration: newPlan.duration,
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
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user profile with questionnaire data if missing
    if (!user.weight || !user.height || !user.age) {
      await db.update(users)
        .set({
          weight: questionnaire.personalInfo.weight,
          height: questionnaire.personalInfo.height,
          age: questionnaire.personalInfo.age,
          gender: questionnaire.personalInfo.gender,
          activityLevel: questionnaire.physicalActivity[0] || 'moderate',
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    // Calculate proper targets using BMR science
    const updatedUser = {
      ...user,
      weight: user.weight || questionnaire.personalInfo.weight,
      height: user.height || questionnaire.personalInfo.height,
      age: user.age || questionnaire.personalInfo.age,
      gender: user.gender || questionnaire.personalInfo.gender,
      activityLevel: user.activityLevel || questionnaire.physicalActivity[0] || 'moderate',
    };

    const goalType = questionnaire.healthGoals[0] || 'weight_loss';
    const targets = targetCalculator.calculatePersonalizedTargets(updatedUser as any, goalType);

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
        iron: updatedUser.gender?.toLowerCase() === 'male' ? 8 : 18,
        calcium: updatedUser.age! < 50 ? 1000 : 1200,
        vitaminC: 90,
        vitaminD: 20,
        magnesium: updatedUser.gender?.toLowerCase() === 'male' ? 400 : 310,
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
      preferredCategories: [...new Set(loggedFoods.map(f => f.category))],
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

  // Generate personalized meals based on user preferences and logged history
  private async generateMealRecommendations(planId: string, userId: string, questionnaire: DietPlanQuestionnaire, targets: any) {
    console.log('Starting personalized meal generation for plan:', planId);
    
    // Get user's food preferences from logged meals
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
        max_completion_tokens: 2000,
      });

      const mealData = JSON.parse(response.choices[0].message.content || '{"meals": []}');
      const meals = mealData.meals || [];
      
      console.log(`AI Generated ${meals.length} meals for plan ${planId}`);
      console.log('AI Response:', response.choices[0].message.content?.substring(0, 200));

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
      // Fallback: create basic meals to avoid empty plan
      await this.createFallbackMeals(planId, targets);
    }
  }

  // Fallback meal creation to ensure plans are never empty
  private async createFallbackMeals(planId: string, targets: any) {
    const basicMeals = [
      {
        dietPlanId: planId, day: 1, mealType: 'breakfast', option: 1,
        mealName: 'Protein Oatmeal Bowl',
        description: 'Nutritious start to your day',
        quickRecipe: 'Cook 1/2 cup oats with protein powder and berries',
        portionSize: '1 bowl', healthBenefits: 'High protein, sustained energy',
        thingsToAvoid: 'Avoid adding extra sugar',
        calories: this.getMealCalories('breakfast', targets.calories),
        protein: 25, carbs: 35, fat: 8, fiber: 6
      },
      {
        dietPlanId: planId, day: 1, mealType: 'lunch', option: 1,
        mealName: 'Grilled Chicken Salad',
        description: 'Fresh, protein-rich lunch',
        quickRecipe: 'Grill chicken breast, serve over mixed greens with olive oil dressing',
        portionSize: '1 large salad', healthBenefits: 'Lean protein, essential vitamins',
        thingsToAvoid: 'Limit high-calorie dressings',
        calories: this.getMealCalories('lunch', targets.calories),
        protein: 35, carbs: 15, fat: 18, fiber: 5
      },
      {
        dietPlanId: planId, day: 1, mealType: 'dinner', option: 1,
        mealName: 'Baked Salmon & Vegetables',
        description: 'Omega-3 rich dinner',
        quickRecipe: 'Bake salmon fillet with roasted broccoli and sweet potato',
        portionSize: '1 fillet with sides', healthBenefits: 'Heart-healthy omega-3s',
        thingsToAvoid: 'Avoid overcooking fish',
        calories: this.getMealCalories('dinner', targets.calories),
        protein: 30, carbs: 25, fat: 20, fiber: 8
      },
      {
        dietPlanId: planId, day: 1, mealType: 'snack', option: 1,
        mealName: 'Greek Yogurt & Berries',
        description: 'Protein-rich snack',
        quickRecipe: 'Mix Greek yogurt with fresh berries and a drizzle of honey',
        portionSize: '1 cup', healthBenefits: 'Probiotics and antioxidants',
        thingsToAvoid: 'Choose plain yogurt to control sugar',
        calories: this.getMealCalories('snack', targets.calories),
        protein: 15, carbs: 20, fat: 5, fiber: 4
      }
    ];

    await db.insert(dietPlanMeals).values(basicMeals);
    console.log('Created fallback meals for day 1');
  }

  // Generate supplement recommendations
  private async generateSupplementRecommendations(planId: string, questionnaire: DietPlanQuestionnaire) {
    if (!questionnaire.supplements) {
      console.log('User declined supplements, skipping supplement generation');
      return;
    }

    try {
      const supplementPrompt = `Recommend supplements for weight loss and digestion goals:
      
Age: ${questionnaire.personalInfo.age}, Gender: ${questionnaire.personalInfo.gender}
Goals: ${questionnaire.healthGoals.join(', ')}

Generate 3-4 essential supplements. Respond with JSON:
{
  "supplements": [
    {
      "name": "Vitamin D3",
      "dosage": "2000 IU",
      "timing": "With breakfast",
      "purpose": "Bone health and immune support",
      "priority": "essential",
      "safetyNotes": "Take with food"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: supplementPrompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const supplementData = JSON.parse(response.choices[0].message.content || '{"supplements": []}');
      const supplements = supplementData.supplements || [];

      if (supplements.length > 0) {
        const supplementInserts = supplements.map((supp: any) => ({
          dietPlanId: planId,
          supplementName: supp.name,
          dosage: supp.dosage,
          timing: supp.timing,
          purpose: supp.purpose,
          priority: supp.priority,
          safetyNotes: supp.safetyNotes,
        }));

        await db.insert(dietPlanSupplements).values(supplementInserts);
        console.log(`Created ${supplements.length} supplement recommendations`);
      }
    } catch (error) {
      console.error('Error generating supplements:', error);
      // Create basic supplement recommendation if AI fails
      await db.insert(dietPlanSupplements).values([{
        dietPlanId: planId,
        supplementName: 'Multivitamin',
        dosage: '1 tablet',
        timing: 'With breakfast',
        purpose: 'Fill nutritional gaps',
        priority: 'recommended',
        safetyNotes: 'Take with food',
      }]);
    }
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
    
    // Generate new meals
    await this.generateMealRecommendations(planId, plan.userId, plan.questionnaireData as any, plan.dailyTargets);
    
    return { success: true };
  }

  // Generate lifestyle recommendations
  private async generateLifestyleRecommendations(planId: string, questionnaire: DietPlanQuestionnaire) {
    const lifestylePrompt = `Create lifestyle recommendations for:
    
Goals: ${questionnaire.healthGoals.join(', ')}
Current lifestyle: ${questionnaire.lifestyle.join(', ')}
Activity level: ${questionnaire.physicalActivity.join(', ')}

Generate 4-6 lifestyle recommendations covering sleep, exercise, hydration, stress management.
Respond with JSON array: [{ "category": "sleep/exercise/hydration/stress/meal_timing", "title": "recommendation title", "description": "detailed guidance", "actionItems": ["specific actions"], "frequency": "daily/weekly", "difficulty": "easy/medium/hard" }]`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: lifestylePrompt }],
      response_format: { type: "json_object" },
    });

    const lifestyleData = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
    const recommendations = lifestyleData.recommendations || [];

    const lifestyleInserts = recommendations.map((rec: any) => ({
      dietPlanId: planId,
      category: rec.category,
      title: rec.title,
      description: rec.description,
      actionItems: rec.actionItems,
      frequency: rec.frequency,
      difficulty: rec.difficulty,
    }));

    if (lifestyleInserts.length > 0) {
      await db.insert(dietPlanLifestyle).values(lifestyleInserts);
    }
  }

  // Helper to calculate calories per meal type
  private getMealCalories(mealType: string, totalCalories: number): number {
    const distribution = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.30,
      snack: 0.10,
    };
    return Math.round(totalCalories * (distribution[mealType as keyof typeof distribution] || 0.25));
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