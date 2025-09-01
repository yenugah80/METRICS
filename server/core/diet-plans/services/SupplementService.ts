import { db } from '../../../infrastructure/database/db';
import { dietPlanSupplements } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { DietPlanQuestionnaire } from '../dietPlanService';

export interface SupplementRecommendation {
  name: string;
  dosage: string;
  timing: string;
  purpose: string;
  category: string;
  priority: 'essential' | 'recommended' | 'optional';
}

export class SupplementService {
  // Generate supplement recommendations based on questionnaire
  async generateSupplementRecommendations(planId: string, questionnaire: DietPlanQuestionnaire): Promise<void> {
    const recommendations: SupplementRecommendation[] = [];

    // Base recommendations for common deficiencies
    recommendations.push({
      name: "Vitamin D3",
      dosage: "1000-2000 IU daily",
      timing: "with_breakfast",
      purpose: "Bone health and immune function",
      category: "vitamin",
      priority: "essential"
    });

    // Goal-specific supplements
    if (questionnaire.healthGoals.includes('muscle_gain')) {
      recommendations.push({
        name: "Whey Protein",
        dosage: "25g post-workout",
        timing: "post_workout",
        purpose: "Muscle protein synthesis",
        category: "protein",
        priority: "recommended"
      });
    }

    if (questionnaire.healthGoals.includes('weight_loss')) {
      recommendations.push({
        name: "Green Tea Extract",
        dosage: "500mg before meals",
        timing: "before_meals",
        purpose: "Metabolism support",
        category: "metabolism",
        priority: "optional"
      });
    }

    // Gender-specific recommendations
    if (questionnaire.personalInfo.gender === 'female') {
      recommendations.push({
        name: "Iron",
        dosage: "18mg daily",
        timing: "with_vitamin_c",
        purpose: "Prevent iron deficiency",
        category: "mineral",
        priority: "recommended"
      });
    }

    // Activity-specific supplements
    if (questionnaire.physicalActivity.includes('high_intensity') || questionnaire.physicalActivity.includes('strength_training')) {
      recommendations.push({
        name: "Creatine Monohydrate",
        dosage: "5g daily",
        timing: "any_time",
        purpose: "Strength and power performance",
        category: "performance",
        priority: "recommended"
      });
    }

    // Insert into database
    const supplementInserts = recommendations.map(rec => ({
      dietPlanId: planId,
      supplementName: rec.name,
      dosage: rec.dosage,
      timing: rec.timing,
      purpose: rec.purpose,
      priority: rec.priority,
    }));

    await db.insert(dietPlanSupplements).values(supplementInserts);
    console.log(`Generated ${supplementInserts.length} supplement recommendations`);
  }

  // Get supplements for a specific diet plan
  async getSupplements(planId: string) {
    return await db.select()
      .from(dietPlanSupplements)
      .where(eq(dietPlanSupplements.dietPlanId, planId));
  }
}

export const supplementService = new SupplementService();