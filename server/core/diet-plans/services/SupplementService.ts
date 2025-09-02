import OpenAI from 'openai';
import { db } from '../../../infrastructure/database/db';
import { dietPlanSupplements } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { DietPlanQuestionnaire } from '../dietPlanService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SupplementRecommendation {
  name: string;
  dosage: string;
  timing: string;
  purpose: string;
  category: string;
  priority: 'essential' | 'recommended' | 'optional';
}

export class SupplementService {
  // Generate AI-powered supplement recommendations based on comprehensive user profile
  async generateSupplementRecommendations(planId: string, questionnaire: DietPlanQuestionnaire): Promise<void> {
    console.log('Generating AI-powered supplement recommendations for plan:', planId);
    
    // Only generate supplements if user is open to them
    if (!questionnaire.supplements) {
      console.log('User declined supplement recommendations, skipping');
      return;
    }

    try {
      // Create comprehensive AI prompt for personalized supplement recommendations
      const supplementPrompt = `You are a registered dietitian specializing in Flexitarian nutrition. Analyze this client profile and recommend personalized supplements.

CLIENT PROFILE:
- Age: ${questionnaire.personalInfo.age}, Gender: ${questionnaire.personalInfo.gender}
- Weight: ${questionnaire.personalInfo.weight}kg, Height: ${questionnaire.personalInfo.height}cm
- Primary Goals: ${questionnaire.healthGoals.join(', ')}
- Diet Type: ${questionnaire.foodPreferences.join(', ')} (Flexitarian focus)
- Dietary Restrictions: ${questionnaire.restrictions.length > 0 ? questionnaire.restrictions.join(', ') : 'None'}
- Activity Level: ${questionnaire.physicalActivity.join(', ')}
- Current Diet: ${questionnaire.currentDiet?.length > 0 ? questionnaire.currentDiet.join(', ') : 'Standard Western diet'}

FLEXITARIAN NUTRITION CONSIDERATIONS:
- Potential B12 deficiency from reduced meat intake
- Iron absorption concerns with plant-heavy diet
- Omega-3 needs if limiting fish consumption
- Protein quality and amino acid profiles
- Zinc and vitamin D considerations

SUPPLEMENT ASSESSMENT REQUIRED:
Analyze for potential deficiencies and provide evidence-based recommendations. Consider:
1. **Essential gaps** in Flexitarian diets
2. **Goal-specific needs** for ${questionnaire.healthGoals[0]}
3. **Age/gender requirements** for optimal health
4. **Activity-related needs** for ${questionnaire.physicalActivity[0]}
5. **Absorption optimization** (timing, combinations)

Respond with JSON containing 3-6 targeted recommendations:
{
  "supplements": [
    {
      "name": "Vitamin B12 (Methylcobalamin)",
      "dosage": "250mcg daily",
      "timing": "with_breakfast",
      "purpose": "Essential for Flexitarian diets - supports nerve function and energy metabolism",
      "category": "vitamin",
      "priority": "essential",
      "evidence": "Critical for those reducing meat intake - prevents neurological issues",
      "food_sources": "Fortified nutritional yeast, fortified plant milks",
      "cost_estimate": "$8-12/month"
    }
  ]
}

**REQUIREMENTS:**
- Focus on science-backed supplements with proven benefits
- Consider Flexitarian-specific nutritional gaps
- Include proper dosages and optimal timing
- Explain the evidence behind each recommendation
- Suggest food sources when possible
- Prioritize based on actual need vs. marketing hype`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are a registered dietitian with expertise in Flexitarian nutrition and evidence-based supplementation. Provide only necessary, science-backed supplement recommendations." 
          },
          { role: "user", content: supplementPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
        temperature: 0.3, // Lower temperature for more conservative, evidence-based recommendations
      });

      const supplementData = JSON.parse(response.choices[0].message.content || '{"supplements": []}');
      const aiRecommendations = supplementData.supplements || [];
      
      console.log(`AI Generated ${aiRecommendations.length} personalized supplement recommendations`);

      if (aiRecommendations.length > 0) {
        const supplementInserts = aiRecommendations.map((rec: any) => ({
          dietPlanId: planId,
          supplementName: rec.name,
          dosage: rec.dosage,
          timing: rec.timing,
          purpose: rec.purpose,
          priority: rec.priority,
          category: rec.category,
          evidence: rec.evidence || '',
          foodSources: rec.food_sources || '',
          costEstimate: rec.cost_estimate || '',
        }));

        await db.insert(dietPlanSupplements).values(supplementInserts);
        console.log(`Successfully inserted ${supplementInserts.length} AI-generated supplement recommendations`);
      } else {
        // Fallback to basic recommendations
        await this.createBasicSupplementRecommendations(planId, questionnaire);
      }
    } catch (error) {
      console.error('Error generating AI supplement recommendations:', error);
      await this.createBasicSupplementRecommendations(planId, questionnaire);
    }
  }

  // Fallback basic supplement recommendations
  private async createBasicSupplementRecommendations(planId: string, questionnaire: DietPlanQuestionnaire): Promise<void> {
    const basicRecommendations: SupplementRecommendation[] = [];

    // Essential for Flexitarian diets
    basicRecommendations.push({
      name: "Vitamin B12",
      dosage: "250mcg daily",
      timing: "with_breakfast",
      purpose: "Essential for Flexitarian diets - nerve function and energy",
      category: "vitamin",
      priority: "essential"
    });

    basicRecommendations.push({
      name: "Vitamin D3",
      dosage: "1000 IU daily",
      timing: "with_breakfast",
      purpose: "Bone health and immune function",
      category: "vitamin", 
      priority: "essential"
    });

    // Flexitarian-specific nutrients
    if (questionnaire.foodPreferences.includes('flexitarian') || questionnaire.foodPreferences.includes('vegetarian')) {
      basicRecommendations.push({
        name: "Iron + Vitamin C",
        dosage: "18mg iron with 100mg vitamin C",
        timing: "between_meals",
        purpose: "Enhanced iron absorption for plant-based diets",
        category: "mineral",
        priority: "recommended"
      });

      basicRecommendations.push({
        name: "Algae Omega-3",
        dosage: "300mg EPA/DHA daily",
        timing: "with_meals",
        purpose: "Plant-based omega-3 fatty acids for heart and brain health",
        category: "essential_fatty_acid",
        priority: "recommended"
      });
    }

    const supplementInserts = basicRecommendations.map(rec => ({
      dietPlanId: planId,
      supplementName: rec.name,
      dosage: rec.dosage,
      timing: rec.timing,
      purpose: rec.purpose,
      priority: rec.priority,
      category: rec.category,
      evidence: 'Evidence-based recommendations for Flexitarian nutrition',
      foodSources: 'Supplement recommended due to limited food sources',
      costEstimate: '$15-25/month',
    }));

    await db.insert(dietPlanSupplements).values(supplementInserts);
    console.log(`Created ${supplementInserts.length} basic Flexitarian supplement recommendations`);
  }

  // Get supplements for a specific diet plan
  async getSupplements(planId: string) {
    return await db.select()
      .from(dietPlanSupplements)
      .where(eq(dietPlanSupplements.dietPlanId, planId));
  }
}

export const supplementService = new SupplementService();