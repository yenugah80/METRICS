import { db } from '../../../infrastructure/database/db';
import { dietPlans, dietPlanMeals, dietPlanSupplements, dietPlanLifestyle, users } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { DietPlanQuestionnaire } from '../types';

export interface CreateDietPlanData {
  userId: string;
  planName: string;
  planType: string;
  duration: number;
  questionnaireData: DietPlanQuestionnaire;
  dailyTargets: any;
  startDate: string;
  endDate: string;
}

export class DietPlanRepository {
  // Create a new diet plan
  async createDietPlan(data: CreateDietPlanData) {
    const [newPlan] = await db.insert(dietPlans).values({
      ...data,
      isActive: true,
    }).returning();
    
    return newPlan;
  }

  // Get user's active diet plan
  async getActiveDietPlan(userId: string) {
    const activePlans = await db.select()
      .from(dietPlans)
      .where(and(
        eq(dietPlans.userId, userId),
        eq(dietPlans.isActive, true)
      ))
      .orderBy(desc(dietPlans.createdAt))
      .limit(1);

    return activePlans[0] || null;
  }

  // Get diet plan by ID
  async getDietPlanById(planId: string) {
    const [plan] = await db.select()
      .from(dietPlans)
      .where(eq(dietPlans.id, planId))
      .limit(1);

    return plan || null;
  }

  // Get meals for a specific day
  async getDayMeals(planId: string, day: number) {
    const meals = await db.select()
      .from(dietPlanMeals)
      .where(and(
        eq(dietPlanMeals.dietPlanId, planId),
        eq(dietPlanMeals.day, day)
      ));

    // Group by meal type and option
    const groupedMeals: Record<string, any> = {};
    
    meals.forEach(meal => {
      if (!groupedMeals[meal.mealType]) {
        groupedMeals[meal.mealType] = {};
      }
      groupedMeals[meal.mealType][`option${meal.option}`] = meal;
    });

    return groupedMeals;
  }

  // Get all supplements for a diet plan
  async getSupplements(planId: string) {
    return await db.select()
      .from(dietPlanSupplements)
      .where(eq(dietPlanSupplements.dietPlanId, planId));
  }

  // Get lifestyle recommendations for a diet plan
  async getLifestyleRecommendations(planId: string) {
    return await db.select()
      .from(dietPlanLifestyle)
      .where(eq(dietPlanLifestyle.dietPlanId, planId));
  }

  // Update diet plan adherence score
  async updateAdherenceScore(planId: string, score: number) {
    await db.update(dietPlans)
      .set({ 
        adherenceScore: score,
        updatedAt: new Date()
      })
      .where(eq(dietPlans.id, planId));
  }

  // Deactivate current plans when creating a new one
  async deactivateCurrentPlans(userId: string) {
    await db.update(dietPlans)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(dietPlans.userId, userId));
  }

  // Get user profile for plan generation
  async getUserProfile(userId: string) {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      height: users.height,
      weight: users.weight,
      age: users.age,
      gender: users.gender,
      activityLevel: users.activityLevel,
      dietPreferences: users.dietPreferences,
      allergens: users.allergens,
      cuisinePreferences: users.cuisinePreferences,
    }).from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Update user profile with questionnaire data
  async updateUserProfileFromQuestionnaire(userId: string, questionnaire: DietPlanQuestionnaire) {
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
}

export const dietPlanRepository = new DietPlanRepository();