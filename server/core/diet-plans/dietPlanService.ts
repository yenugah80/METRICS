import OpenAI from 'openai';
import { db } from '../../infrastructure/database/db';
import { dietPlans, dietPlanMeals, dietPlanSupplements, dietPlanLifestyle, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

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

      // Calculate nutritional targets based on questionnaire
      const targets = this.calculateNutritionalTargets(questionnaire);
      
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

      // Generate 28-day meal recommendations
      await this.generateMealRecommendations(newPlan.id, questionnaire, targets);
      
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

  // Calculate nutritional targets based on questionnaire
  private calculateNutritionalTargets(questionnaire: DietPlanQuestionnaire) {
    const { personalInfo, healthGoals, physicalActivity } = questionnaire;
    
    // Calculate BMR using Mifflin-St Jeor equation
    let bmr: number;
    if (personalInfo.gender.toLowerCase() === 'male') {
      bmr = (10 * personalInfo.weight) + (6.25 * personalInfo.height) - (5 * personalInfo.age) + 5;
    } else {
      bmr = (10 * personalInfo.weight) + (6.25 * personalInfo.height) - (5 * personalInfo.age) - 161;
    }
    
    // Activity multiplier
    const activityLevel = physicalActivity.includes('high') ? 1.7 : 
                         physicalActivity.includes('moderate') ? 1.5 : 1.3;
    
    let tdee = bmr * activityLevel;
    
    // Adjust based on goals
    if (healthGoals.includes('weight_loss')) {
      tdee *= 0.85; // 15% deficit
    } else if (healthGoals.includes('muscle_gain')) {
      tdee *= 1.1; // 10% surplus
    }
    
    // Macro distribution based on goals and preferences
    let proteinPercent = 25, carbPercent = 45, fatPercent = 30;
    
    if (healthGoals.includes('muscle_gain')) {
      proteinPercent = 30;
      carbPercent = 40;
      fatPercent = 30;
    } else if (healthGoals.includes('diabetes')) {
      proteinPercent = 25;
      carbPercent = 35;
      fatPercent = 40;
    }
    
    return {
      calories: Math.round(tdee),
      protein: Math.round((tdee * proteinPercent / 100) / 4), // 4 cal per gram
      carbs: Math.round((tdee * carbPercent / 100) / 4),
      fat: Math.round((tdee * fatPercent / 100) / 9), // 9 cal per gram
      fiber: Math.max(25, Math.round(tdee / 80)), // 1g per 80 calories minimum
      micronutrients: {
        iron: personalInfo.gender.toLowerCase() === 'female' ? 18 : 8,
        calcium: personalInfo.age > 50 ? 1200 : 1000,
        vitaminD: 20,
        vitaminC: personalInfo.gender.toLowerCase() === 'male' ? 90 : 75,
        potassium: 3500,
        magnesium: personalInfo.gender.toLowerCase() === 'male' ? 400 : 320,
      }
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
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  // Generate 28-day meal recommendations
  private async generateMealRecommendations(planId: string, questionnaire: DietPlanQuestionnaire, targets: any) {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const meals = [];

    for (let day = 1; day <= 28; day++) {
      for (const mealType of mealTypes) {
        // Generate 2 options per meal
        for (let option = 1; option <= 2; option++) {
          const caloriesPerMeal = this.getMealCalories(mealType, targets.calories);
          
          const mealPrompt = `Generate a ${mealType} meal for day ${day} of a diet plan:
          
Goal: ${questionnaire.healthGoals[0]}
Preferences: ${questionnaire.foodPreferences.join(', ')}
Restrictions: ${questionnaire.restrictions.join(', ')}
Target calories for this meal: ${caloriesPerMeal}

Create a practical, delicious meal with quick recipe instructions.
Respond with JSON: {
  "mealName": "appetizing name",
  "description": "brief description",
  "quickRecipe": "simple cooking steps",
  "portionSize": "serving description",
  "healthBenefits": "why this meal supports goals",
  "thingsToAvoid": "preparation tips",
  "nutrition": { "calories": ${caloriesPerMeal}, "protein": number, "carbs": number, "fat": number, "fiber": number }
}`;

          const mealResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: mealPrompt }],
            response_format: { type: "json_object" },
          });

          const mealData = JSON.parse(mealResponse.choices[0].message.content || '{}');
          
          meals.push({
            dietPlanId: planId,
            day,
            mealType,
            option,
            mealName: mealData.mealName,
            description: mealData.description,
            quickRecipe: mealData.quickRecipe,
            portionSize: mealData.portionSize,
            healthBenefits: mealData.healthBenefits,
            thingsToAvoid: mealData.thingsToAvoid,
            calories: mealData.nutrition.calories,
            protein: mealData.nutrition.protein,
            carbs: mealData.nutrition.carbs,
            fat: mealData.nutrition.fat,
            fiber: mealData.nutrition.fiber,
          });
        }
      }
    }

    // Insert meals in batches
    const batchSize = 50;
    for (let i = 0; i < meals.length; i += batchSize) {
      const batch = meals.slice(i, i + batchSize);
      await db.insert(dietPlanMeals).values(batch);
    }
  }

  // Generate supplement recommendations
  private async generateSupplementRecommendations(planId: string, questionnaire: DietPlanQuestionnaire) {
    const supplementPrompt = `Recommend supplements for:
    
Goals: ${questionnaire.healthGoals.join(', ')}
Age: ${questionnaire.personalInfo.age}, Gender: ${questionnaire.personalInfo.gender}
Open to supplements: ${questionnaire.supplements}

Generate 3-5 supplement recommendations with timing and dosage.
Respond with JSON array: [{ "name": "supplement name", "dosage": "amount", "timing": "when to take", "purpose": "why needed", "priority": "essential/recommended/optional", "safetyNotes": "precautions" }]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: supplementPrompt }],
      response_format: { type: "json_object" },
    });

    const supplementData = JSON.parse(response.choices[0].message.content || '{"supplements": []}');
    const supplements = supplementData.supplements || [];

    const supplementInserts = supplements.map((supp: any) => ({
      dietPlanId: planId,
      supplementName: supp.name,
      dosage: supp.dosage,
      timing: supp.timing,
      purpose: supp.purpose,
      priority: supp.priority,
      safetyNotes: supp.safetyNotes,
    }));

    if (supplementInserts.length > 0) {
      await db.insert(dietPlanSupplements).values(supplementInserts);
    }
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
      model: "gpt-4o-mini",
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