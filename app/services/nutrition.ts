// ============================================================================
// NUTRITION SERVICE - Core Business Logic
// ============================================================================

import { db } from '../core/database';
import { meals, dailyNutrition } from '../types/schema';
import { eq, and, desc } from 'drizzle-orm';

export class NutritionService {
  // Calculate daily nutrition totals
  async calculateDailyTotals(userId: string, date: string) {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const dayMeals = await db.select()
      .from(meals)
      .where(and(
        eq(meals.userId, userId),
        and(
          new Date(meals.loggedAt) >= startDate,
          new Date(meals.loggedAt) < endDate
        )
      ));

    const totals = dayMeals.reduce((acc, meal) => ({
      calories: acc.calories + Number(meal.calories || 0),
      protein: acc.protein + Number(meal.protein || 0),
      carbs: acc.carbs + Number(meal.carbs || 0),
      fat: acc.fat + Number(meal.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Update daily nutrition record
    await db.insert(dailyNutrition)
      .values({
        userId,
        date,
        totalCalories: totals.calories.toString(),
        totalProtein: totals.protein.toString(),
        totalCarbs: totals.carbs.toString(),
        totalFat: totals.fat.toString()
      })
      .onConflictDoUpdate({
        target: [dailyNutrition.userId, dailyNutrition.date],
        set: {
          totalCalories: totals.calories.toString(),
          totalProtein: totals.protein.toString(),
          totalCarbs: totals.carbs.toString(),
          totalFat: totals.fat.toString(),
          updatedAt: new Date()
        }
      });

    return totals;
  }

  // Get nutrition analysis for goals
  async getNutritionAnalysis(userId: string, date: string) {
    const daily = await db.select()
      .from(dailyNutrition)
      .where(and(
        eq(dailyNutrition.userId, userId),
        eq(dailyNutrition.date, date)
      ));

    if (!daily.length) return null;

    const nutrition = daily[0];
    
    // Basic analysis - in production would include user goals
    return {
      calories: Number(nutrition.totalCalories),
      protein: Number(nutrition.totalProtein),
      carbs: Number(nutrition.totalCarbs),
      fat: Number(nutrition.totalFat),
      analysis: {
        calorieStatus: Number(nutrition.totalCalories) > 2000 ? 'over' : 'under',
        proteinAdequate: Number(nutrition.totalProtein) > 100,
        balanced: true
      }
    };
  }
}

export const nutritionService = new NutritionService();