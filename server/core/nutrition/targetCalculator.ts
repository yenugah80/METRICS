import { type User } from "@shared/schema";

export interface CalculatedTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  explanation: string;
  bmr: number;
  tdee: number;
}

export class NutritionTargetCalculator {
  
  // Calculate BMR using Mifflin-St Jeor Equation (most accurate)
  private calculateBMR(weight: number, height: number, age: number, gender: string): number {
    if (gender.toLowerCase() === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  }

  // Calculate TDEE (Total Daily Energy Expenditure)
  private calculateTDEE(bmr: number, activityLevel: string): number {
    const activityMultipliers = {
      'sedentary': 1.2,       // Little/no exercise
      'light': 1.375,         // Light exercise 1-3 days/week
      'moderate': 1.55,       // Moderate exercise 3-5 days/week
      'active': 1.725,        // Heavy exercise 6-7 days/week
      'very_active': 1.9      // Very heavy physical work/exercise
    };

    return bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55);
  }

  // Calculate personalized nutrition targets
  calculatePersonalizedTargets(user: User, goalType: string = 'weight_loss'): CalculatedTargets {
    if (!user.weight || !user.height || !user.age) {
      throw new Error('Missing required profile data: weight, height, age needed for accurate calculations');
    }

    const bmr = this.calculateBMR(user.weight, user.height, user.age, user.gender || 'female');
    const tdee = this.calculateTDEE(bmr, user.activityLevel || 'moderate');

    // Goal-based calorie adjustment
    let targetCalories = tdee;
    let explanation = '';

    switch (goalType) {
      case 'weight_loss':
        targetCalories = tdee - 500; // 500 cal deficit = ~1lb/week loss
        explanation = `500-calorie deficit for 1lb/week weight loss. Based on your BMR (${Math.round(bmr)}) and ${user.activityLevel} activity level.`;
        break;
      case 'weight_gain':
        targetCalories = tdee + 300; // 300 cal surplus for lean gains
        explanation = `300-calorie surplus for healthy weight gain. Based on your BMR (${Math.round(bmr)}) and ${user.activityLevel} activity level.`;
        break;
      case 'maintenance':
        targetCalories = tdee;
        explanation = `Maintenance calories to maintain current weight. Based on your BMR (${Math.round(bmr)}) and ${user.activityLevel} activity level.`;
        break;
      case 'muscle_gain':
        targetCalories = tdee + 200; // Slight surplus with high protein
        explanation = `Lean muscle gain calories with high protein. Based on your BMR (${Math.round(bmr)}) and ${user.activityLevel} activity level.`;
        break;
    }

    // Evidence-based macro calculations
    let protein: number, carbs: number, fat: number;

    if (goalType === 'weight_loss') {
      // Higher protein for weight loss (1.6-2.2g/kg body weight)
      protein = Math.round(user.weight * 1.8); // 1.8g per kg
      fat = Math.round(targetCalories * 0.25 / 9); // 25% of calories from fat
      const remainingCalories = targetCalories - (protein * 4) - (fat * 9);
      carbs = Math.round(remainingCalories / 4);
    } else if (goalType === 'muscle_gain') {
      // Very high protein for muscle gain (2.0-2.5g/kg)
      protein = Math.round(user.weight * 2.2); // 2.2g per kg
      fat = Math.round(targetCalories * 0.25 / 9); // 25% of calories
      const remainingCalories = targetCalories - (protein * 4) - (fat * 9);
      carbs = Math.round(remainingCalories / 4);
    } else {
      // Standard macro distribution
      protein = Math.round(user.weight * 1.2); // 1.2g per kg
      carbs = Math.round(targetCalories * 0.45 / 4); // 45% of calories
      fat = Math.round(targetCalories * 0.30 / 9); // 30% of calories
    }

    // Fiber based on calories (14g per 1000 calories - USDA recommendation)
    const fiber = Math.round((targetCalories / 1000) * 14);

    return {
      calories: Math.round(targetCalories),
      protein,
      carbs,
      fat,
      fiber,
      explanation,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee)
    };
  }

  // Update user's daily targets in database
  async updateUserTargets(userId: string, targets: CalculatedTargets) {
    const { db } = await import("../../infrastructure/database/db");
    const { users } = await import("../../../shared/schema");
    const { eq } = await import("drizzle-orm");

    await db.update(users)
      .set({
        dailyCalorieGoal: targets.calories,
        dailyProteinGoal: targets.protein,
        dailyCarbGoal: targets.carbs,
        dailyFatGoal: targets.fat,
        dailyFiberGoal: targets.fiber,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return targets;
  }
}

export const targetCalculator = new NutritionTargetCalculator();