/**
 * Smart Portion Recommendations System
 * Suggests optimal food portions based on remaining macros/micros
 */

import { storage } from '../../infrastructure/database/storage';
import { db } from '../../infrastructure/database/db';
import { eq, and, sql } from 'drizzle-orm';
import { portionRecommendations, foods, dailyNutrition, users } from '../../../shared/schema';

export interface PortionRecommendation {
  foodId: string;
  foodName: string;
  recommendedGrams: number;
  recommendedAmount: string;
  unit: string;
  reasoning: string;
  confidenceScore: number;
  nutritionPreview: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  macroFit: {
    caloriesFit: number; // 0-100%
    proteinFit: number;
    carbsFit: number;
    fatFit: number;
  };
}

export interface RemainingMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export class SmartPortions {

  // Get smart portion recommendation for a specific food
  static async getPortionRecommendation(
    userId: string, 
    foodId: string, 
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): Promise<PortionRecommendation | null> {
    
    try {
      // Get food data
      const food = await db.select().from(foods).where(eq(foods.id, foodId)).limit(1);
      if (food.length === 0) return null;
      
      const foodData = food[0];
      
      // Get user's remaining macros for today
      const remaining = await this.getRemainingMacros(userId);
      
      // Calculate optimal portion size
      const recommendation = await this.calculateOptimalPortion(foodData, remaining, mealType);
      
      // Store recommendation for learning
      await this.storeRecommendation(userId, foodId, mealType, remaining, recommendation);
      
      return recommendation;
      
    } catch (error) {
      console.error('Error generating portion recommendation:', error);
      return null;
    }
  }

  // Get user's remaining macros for today
  private static async getRemainingMacros(userId: string): Promise<RemainingMacros> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's nutrition totals
    const todayNutrition = await storage.getDailyNutrition(userId, today);
    
    // Get user's daily goals
    const user = await storage.getUser(userId);
    const goals = {
      calories: user?.dailyCalorieGoal || 2000,
      protein: user?.dailyProteinGoal || 150,
      carbs: user?.dailyCarbGoal || 250,
      fat: user?.dailyFatGoal || 65,
      fiber: 25, // Default fiber goal
    };
    
    // Calculate remaining macros
    const consumed = {
      calories: todayNutrition?.totalCalories || 0,
      protein: todayNutrition?.totalProtein || 0,
      carbs: todayNutrition?.totalCarbs || 0,
      fat: todayNutrition?.totalFat || 0,
      fiber: todayNutrition?.totalFiber || 0,
    };
    
    return {
      calories: Math.max(0, goals.calories - consumed.calories),
      protein: Math.max(0, goals.protein - consumed.protein),
      carbs: Math.max(0, goals.carbs - consumed.carbs),
      fat: Math.max(0, goals.fat - consumed.fat),
      fiber: Math.max(0, goals.fiber - consumed.fiber),
    };
  }

  // Calculate optimal portion size
  private static async calculateOptimalPortion(
    food: any, 
    remaining: RemainingMacros, 
    mealType: string
  ): Promise<PortionRecommendation> {
    
    // Meal type portion multipliers
    const mealTypeMultipliers = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.35,
      snack: 0.15,
    };
    
    const basePortion = mealTypeMultipliers[mealType] || 0.25;
    
    // Calculate portion based on different macro targets
    const portionOptions = [
      // Calorie-based portion
      this.calculateCaloriePortion(food, remaining.calories * basePortion),
      // Protein-based portion
      this.calculateProteinPortion(food, remaining.protein * basePortion),
      // Carb-based portion (for high-carb foods)
      this.calculateCarbPortion(food, remaining.carbs * basePortion),
      // Fat-based portion (for high-fat foods)
      this.calculateFatPortion(food, remaining.fat * basePortion),
    ].filter(p => p > 0);
    
    // Choose the most conservative portion (smallest)
    const recommendedGrams = Math.min(...portionOptions);
    
    // Ensure reasonable portion size (min 10g, max 500g)
    const finalGrams = Math.max(10, Math.min(500, recommendedGrams));
    
    // Calculate nutrition for recommended portion
    const nutritionPreview = this.calculatePortionNutrition(food, finalGrams);
    
    // Calculate macro fit scores
    const macroFit = this.calculateMacroFit(nutritionPreview, remaining);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(food, finalGrams, remaining, macroFit);
    
    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(macroFit, food);
    
    return {
      foodId: food.id,
      foodName: food.name,
      recommendedGrams: Math.round(finalGrams),
      recommendedAmount: this.formatAmount(finalGrams, food.name),
      unit: 'grams',
      reasoning,
      confidenceScore,
      nutritionPreview,
      macroFit,
    };
  }

  // Calculate portion based on calorie target
  private static calculateCaloriePortion(food: any, targetCalories: number): number {
    if (!food.calories || food.calories <= 0) return 0;
    return (targetCalories / food.calories) * 100; // per 100g
  }

  // Calculate portion based on protein target
  private static calculateProteinPortion(food: any, targetProtein: number): number {
    if (!food.protein || food.protein <= 0) return 0;
    return (targetProtein / food.protein) * 100; // per 100g
  }

  // Calculate portion based on carb target
  private static calculateCarbPortion(food: any, targetCarbs: number): number {
    if (!food.carbohydrates || food.carbohydrates <= 0) return 0;
    return (targetCarbs / food.carbohydrates) * 100; // per 100g
  }

  // Calculate portion based on fat target
  private static calculateFatPortion(food: any, targetFat: number): number {
    if (!food.fat || food.fat <= 0) return 0;
    return (targetFat / food.fat) * 100; // per 100g
  }

  // Calculate nutrition for a specific portion
  private static calculatePortionNutrition(food: any, grams: number): any {
    const multiplier = grams / 100; // Food data is per 100g
    
    return {
      calories: Math.round((food.calories || 0) * multiplier),
      protein: Math.round((food.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((food.carbohydrates || 0) * multiplier * 10) / 10,
      fat: Math.round((food.fat || 0) * multiplier * 10) / 10,
      fiber: Math.round((food.fiber || 0) * multiplier * 10) / 10,
    };
  }

  // Calculate how well this portion fits remaining macros
  private static calculateMacroFit(nutrition: any, remaining: RemainingMacros): any {
    return {
      caloriesFit: remaining.calories > 0 ? Math.min(100, (nutrition.calories / remaining.calories) * 100) : 0,
      proteinFit: remaining.protein > 0 ? Math.min(100, (nutrition.protein / remaining.protein) * 100) : 0,
      carbsFit: remaining.carbs > 0 ? Math.min(100, (nutrition.carbs / remaining.carbs) * 100) : 0,
      fatFit: remaining.fat > 0 ? Math.min(100, (nutrition.fat / remaining.fat) * 100) : 0,
    };
  }

  // Generate human-readable reasoning
  private static generateReasoning(food: any, grams: number, remaining: RemainingMacros, macroFit: any): string {
    const reasons = [];
    
    if (macroFit.proteinFit > 50 && remaining.protein > 20) {
      reasons.push(`Perfect for protein goals (${Math.round(macroFit.proteinFit)}% of remaining)`);
    }
    
    if (macroFit.caloriesFit >= 80 && macroFit.caloriesFit <= 120) {
      reasons.push(`Great calorie balance (${Math.round(macroFit.caloriesFit)}% of remaining)`);
    }
    
    if (macroFit.carbsFit > 30 && food.fiber && food.fiber > 3) {
      reasons.push('Good fiber source for digestive health');
    }
    
    if (remaining.calories < 300) {
      reasons.push('Light portion to stay within calorie goals');
    }
    
    if (reasons.length === 0) {
      reasons.push('Balanced portion based on your daily goals');
    }
    
    return reasons.join('. ') + '.';
  }

  // Calculate confidence score (0-100)
  private static calculateConfidenceScore(macroFit: any, food: any): number {
    let score = 70; // Base confidence
    
    // Boost confidence for balanced macro fit
    const avgFit = (macroFit.caloriesFit + macroFit.proteinFit + macroFit.carbsFit + macroFit.fatFit) / 4;
    if (avgFit >= 60 && avgFit <= 100) score += 20;
    
    // Boost confidence for complete nutrition data
    if (food.protein && food.carbohydrates && food.fat && food.fiber) score += 10;
    
    // Reduce confidence for very low or very high macro fits
    if (avgFit < 20 || avgFit > 150) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }

  // Format amount in user-friendly way
  private static formatAmount(grams: number, foodName: string): string {
    // Convert to common portion sizes
    if (grams <= 30) return `${Math.round(grams)}g (small portion)`;
    if (grams <= 100) return `${Math.round(grams)}g (medium portion)`;
    if (grams <= 200) return `${Math.round(grams)}g (large portion)`;
    return `${Math.round(grams)}g (extra large portion)`;
  }

  // Store recommendation for learning
  private static async storeRecommendation(
    userId: string,
    foodId: string,
    mealType: string,
    remaining: RemainingMacros,
    recommendation: PortionRecommendation
  ): Promise<void> {
    try {
      await db.insert(portionRecommendations).values({
        userId,
        foodId,
        mealType,
        remainingCalories: remaining.calories,
        remainingProtein: remaining.protein,
        remainingCarbs: remaining.carbs,
        remainingFat: remaining.fat,
        recommendedGrams: recommendation.recommendedGrams,
        confidenceScore: recommendation.confidenceScore / 100,
        reasoning: recommendation.reasoning,
      });
    } catch (error) {
      console.error('Error storing portion recommendation:', error);
    }
  }

  // Get multiple food recommendations for a meal type
  static async getMealRecommendations(
    userId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    foodIds: string[]
  ): Promise<PortionRecommendation[]> {
    const recommendations = [];
    
    for (const foodId of foodIds) {
      const rec = await this.getPortionRecommendation(userId, foodId, mealType);
      if (rec) recommendations.push(rec);
    }
    
    return recommendations;
  }

  // Update recommendation based on user feedback
  static async updateRecommendationFeedback(
    userId: string,
    recommendationId: string,
    wasAccepted: boolean,
    actualGramsUsed?: number
  ): Promise<void> {
    try {
      await db
        .update(portionRecommendations)
        .set({
          wasAccepted,
          actualGramsUsed,
        })
        .where(eq(portionRecommendations.id, recommendationId));
    } catch (error) {
      console.error('Error updating recommendation feedback:', error);
    }
  }
}

export { SmartPortions };