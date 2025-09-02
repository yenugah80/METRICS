import { db } from '../../../infrastructure/database/db';
import { dietPlanLifestyle } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { DietPlanQuestionnaire } from '../dietPlanService';

export interface LifestyleRecommendation {
  category: string;
  title: string;
  description: string;
  actionItems: string[];
  frequency: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export class LifestyleService {
  // Generate lifestyle recommendations based on questionnaire
  async generateLifestyleRecommendations(planId: string, questionnaire: DietPlanQuestionnaire): Promise<void> {
    const recommendations: LifestyleRecommendation[] = [];

    // Activity-based recommendations
    if (questionnaire.physicalActivity.includes('sedentary')) {
      recommendations.push({
        category: "exercise",
        title: "Post-Meal Walking",
        description: "Helps with digestion and blood sugar control",
        actionItems: ["Take 10-minute walks after each meal", "Use stairs instead of elevators", "Park farther away"],
        frequency: "daily",
        difficulty: "easy"
      });
    }

    // Goal-specific lifestyle changes
    if (questionnaire.healthGoals.includes('weight_loss')) {
      recommendations.push({
        category: "hydration",
        title: "Strategic Hydration",
        description: "Helps with satiety and metabolism",
        actionItems: ["Drink 16oz water before each meal", "Carry a water bottle", "Set hydration reminders"],
        frequency: "daily",
        difficulty: "easy"
      });
    }

    if (questionnaire.healthGoals.includes('muscle_gain')) {
      recommendations.push({
        category: "sleep",
        title: "Recovery Sleep",
        description: "Critical for muscle recovery and growth hormone production",
        actionItems: ["Aim for 7-9 hours nightly", "Create bedtime routine", "Avoid screens 1hr before bed"],
        frequency: "daily",
        difficulty: "medium"
      });
    }

    // Stress management for all users
    recommendations.push({
      category: "stress",
      title: "Daily Stress Management",
      description: "Reduces cortisol and improves overall health",
      actionItems: ["Practice 5 minutes deep breathing", "Take short meditation breaks", "Use stress-relief apps"],
      frequency: "daily",
      difficulty: "easy"
    });

    // Meal timing recommendations
    if (questionnaire.eatingSchedule.includes('irregular')) {
      recommendations.push({
        category: "meal_timing",
        title: "Consistent Meal Schedule",
        description: "Improves metabolism and blood sugar stability",
        actionItems: ["Eat breakfast within 1hr of waking", "Plan meal times in advance", "Set meal reminders"],
        frequency: "daily",
        difficulty: "medium"
      });
    }

    // Insert into database
    const lifestyleInserts = recommendations.map(rec => ({
      dietPlanId: planId,
      category: rec.category,
      title: rec.title,
      description: rec.description,
      actionItems: rec.actionItems,
      frequency: rec.frequency,
      difficulty: rec.difficulty,
    }));

    await db.insert(dietPlanLifestyle).values(lifestyleInserts);
    console.log(`Generated ${lifestyleInserts.length} lifestyle recommendations`);
  }

  // Get lifestyle recommendations for a specific diet plan
  async getLifestyleRecommendations(planId: string) {
    return await db.select()
      .from(dietPlanLifestyle)
      .where(eq(dietPlanLifestyle.dietPlanId, planId));
  }
}

export const lifestyleService = new LifestyleService();