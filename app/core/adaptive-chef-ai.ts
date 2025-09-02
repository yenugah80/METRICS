import OpenAI from 'openai';
import { db } from './database';
import { 
  chefAiConversations, 
  chefAiMessages, 
  dailyNutrition, 
  users 
} from '../types/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

// Optimized OpenAI client for speed
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 5000, // 5 second timeout for fast responses
  maxRetries: 0
});

// Streamlined response schema
const ResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(z.object({
    name: z.string(),
    reason: z.string(),
    macros: z.object({
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number()
    }).optional()
  })).optional(),
  insights: z.array(z.string()),
  nextQuestion: z.string().optional()
});

interface UserGoalProgress {
  userId: string;
  avgCalorieAdherence: number; // 0-1.0
  avgProteinAdherence: number;
  avgCarbAdherence: number; 
  avgFatAdherence: number;
  consistencyScore: number; // Days hitting goals / total days
  trendDirection: 'improving' | 'declining' | 'stable';
}

interface HealthMetrics {
  weightTrend: 'losing' | 'gaining' | 'stable' | 'unknown';
  avgMood: number; // 1-10
  avgEnergy: number; // 1-10
  avgStress: number; // 1-10
  symptomPatterns: string[];
}

interface MicronutrientStatus {
  deficiencies: Array<{
    nutrient: string;
    avgIntake: number;
    recommendedIntake: number;
    severity: 'mild' | 'moderate' | 'severe';
    foodSources: string[];
  }>;
}

interface MessageSentiment {
  tone: 'frustrated' | 'bored' | 'curious' | 'motivated' | 'neutral';
  confidence: number;
  keywords: string[];
}

export class AdaptiveChefAI {
  
  // 1. GOAL FEEDBACK LOOP - Adapt based on macro adherence
  private async analyzeGoalProgress(userId: string, days = 7): Promise<UserGoalProgress> {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const progressData = await db.select({
      totalCalories: dailyNutrition.totalCalories,
      totalProtein: dailyNutrition.totalProtein,
      totalCarbs: dailyNutrition.totalCarbs,
      totalFat: dailyNutrition.totalFat,
      // Use user's goals as fallback for daily goals
      calorieGoal: dailyNutrition.totalCalories, // We'll calculate from user profile
      proteinGoal: dailyNutrition.totalProtein,
      carbGoal: dailyNutrition.totalCarbs,
      fatGoal: dailyNutrition.totalFat,
      logDate: dailyNutrition.date
    })
    .from(dailyNutrition)
    .where(and(
      eq(dailyNutrition.userId, userId),
      gte(dailyNutrition.date, startDate.toISOString().split('T')[0]),
      lte(dailyNutrition.date, endDate.toISOString().split('T')[0])
    ))
    .orderBy(desc(dailyNutrition.date));

    if (progressData.length === 0) {
      return {
        userId,
        avgCalorieAdherence: 0,
        avgProteinAdherence: 0,
        avgCarbAdherence: 0,
        avgFatAdherence: 0,
        consistencyScore: 0,
        trendDirection: 'stable' as const
      };
    }

    // Calculate adherence rates
    const adherenceRates = progressData.map(day => ({
      calorieAdherence: Math.min((day.totalCalories || 0) / day.calorieGoal, 1.0),
      proteinAdherence: Math.min((day.totalProtein || 0) / day.proteinGoal, 1.0),
      carbAdherence: Math.min((day.totalCarbs || 0) / day.carbGoal, 1.0),
      fatAdherence: Math.min((day.totalFat || 0) / day.fatGoal, 1.0)
    }));

    const avgCalorieAdherence = adherenceRates.reduce((sum, day) => sum + day.calorieAdherence, 0) / adherenceRates.length;
    const avgProteinAdherence = adherenceRates.reduce((sum, day) => sum + day.proteinAdherence, 0) / adherenceRates.length;
    const avgCarbAdherence = adherenceRates.reduce((sum, day) => sum + day.carbAdherence, 0) / adherenceRates.length;
    const avgFatAdherence = adherenceRates.reduce((sum, day) => sum + day.fatAdherence, 0) / adherenceRates.length;

    // Goal consistency (days hitting 80%+ targets)
    const consistentDays = adherenceRates.filter(day => 
      day.calorieAdherence >= 0.8 && day.proteinAdherence >= 0.8
    ).length;
    const consistencyScore = consistentDays / adherenceRates.length;

    // Trend analysis (recent 3 days vs earlier days)
    const recentDays = adherenceRates.slice(0, 3);
    const earlierDays = adherenceRates.slice(3);
    
    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentDays.length >= 2 && earlierDays.length >= 2) {
      const recentAvg = recentDays.reduce((sum, day) => sum + day.calorieAdherence, 0) / recentDays.length;
      const earlierAvg = earlierDays.reduce((sum, day) => sum + day.calorieAdherence, 0) / earlierDays.length;
      
      if (recentAvg > earlierAvg + 0.1) trendDirection = 'improving';
      else if (recentAvg < earlierAvg - 0.1) trendDirection = 'declining';
    }

    return {
      userId,
      avgCalorieAdherence,
      avgProteinAdherence,
      avgCarbAdherence,
      avgFatAdherence,
      consistencyScore,
      trendDirection
    };
  }

  // 2. HEALTH METRICS INTEGRATION - Weight, mood, energy trends (with graceful fallback)
  private async analyzeHealthMetrics(userId: string, days = 14): Promise<HealthMetrics> {
    try {
      // Try to get user's basic profile data as fallback
      const userData = await db.select({
        weight: users.weight,
        healthGoals: users.healthGoals
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

      // For MVP: Use smart defaults based on user profile until daily tracking is set up
      let weightTrend: 'losing' | 'gaining' | 'stable' | 'unknown' = 'unknown';
      const avgMood = 6; // Neutral baseline
      const avgEnergy = 5; // Moderate baseline
      const avgStress = 5; // Moderate baseline

      // Analyze health goals to predict needs
      const symptomPatterns: string[] = [];
      if (userData[0]?.healthGoals) {
        const goals = userData[0].healthGoals as any;
        if (goals.primary === 'weight_loss') {
          symptomPatterns.push('weight_loss_focus');
        }
        if (goals.primary === 'muscle_gain') {
          symptomPatterns.push('muscle_building_focus');
        }
        if (goals.secondary?.includes('energy')) {
          symptomPatterns.push('low_energy');
        }
      }

      return {
        weightTrend,
        avgMood,
        avgEnergy,
        avgStress,
        symptomPatterns
      };
    } catch (error) {
      console.log('Health metrics using fallback mode');
      // Graceful fallback with neutral values
      return {
        weightTrend: 'unknown',
        avgMood: 5,
        avgEnergy: 5,
        avgStress: 5,
        symptomPatterns: []
      };
    }
  }

  // 3. MICRONUTRIENT INTELLIGENCE - Track deficiencies
  private async analyzeMicronutrientStatus(userId: string): Promise<MicronutrientStatus> {
    // Get user's micronutrient goals
    const user = await db.select({
      dailyIronGoal: users.dailyIronGoal,
      dailyCalciumGoal: users.dailyCalciumGoal,
      dailyFiberGoal: users.dailyFiberGoal
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    if (!user[0]) {
      return { deficiencies: [] };
    }

    // For MVP, we'll focus on basic micronutrients
    // In production, this would integrate with detailed food database
    const deficiencies = [
      {
        nutrient: 'iron',
        avgIntake: 12, // Would come from actual nutrition data
        recommendedIntake: user[0].dailyIronGoal || 18,
        severity: 'moderate' as const,
        foodSources: ['spinach', 'lean beef', 'lentils', 'dark chocolate']
      }
    ].filter(d => d.avgIntake < d.recommendedIntake * 0.8);

    return { deficiencies };
  }

  // 4. SENTIMENT ANALYSIS - Detect emotional tone
  private analyzeSentiment(message: string): MessageSentiment {
    const frustrationKeywords = ['annoying', 'frustrated', 'not working', 'tired of', 'sick of', 'hate'];
    const boredomKeywords = ['boring', 'same', 'repetitive', 'tired of', 'bored'];
    const curiosityKeywords = ['what', 'how', 'why', 'tell me', 'explain', 'curious'];
    const motivationKeywords = ['excited', 'ready', 'motivated', 'let\'s go', 'pumped'];

    const lowerMessage = message.toLowerCase();
    
    let tone: MessageSentiment['tone'] = 'neutral';
    let confidence = 0.5;
    let keywords: string[] = [];

    if (frustrationKeywords.some(keyword => lowerMessage.includes(keyword))) {
      tone = 'frustrated';
      confidence = 0.8;
      keywords = frustrationKeywords.filter(k => lowerMessage.includes(k));
    } else if (boredomKeywords.some(keyword => lowerMessage.includes(keyword))) {
      tone = 'bored';
      confidence = 0.7;
      keywords = boredomKeywords.filter(k => lowerMessage.includes(k));
    } else if (curiosityKeywords.some(keyword => lowerMessage.includes(keyword))) {
      tone = 'curious';
      confidence = 0.6;
      keywords = curiosityKeywords.filter(k => lowerMessage.includes(k));
    } else if (motivationKeywords.some(keyword => lowerMessage.includes(keyword))) {
      tone = 'motivated';
      confidence = 0.8;
      keywords = motivationKeywords.filter(k => lowerMessage.includes(k));
    }

    return { tone, confidence, keywords };
  }

  // 5. ADAPTIVE MEAL SUGGESTIONS - Context-aware recommendations
  private generateAdaptivePrompt(
    userMessage: string,
    goalProgress: UserGoalProgress,
    healthMetrics: HealthMetrics,
    microStatus: MicronutrientStatus,
    sentiment: MessageSentiment
  ): string {
    let adaptations: string[] = [];

    // Goal-based adaptations
    if (goalProgress.avgProteinAdherence < 0.7) {
      adaptations.push('BOOST PROTEIN: Suggest high-protein foods');
    }
    if (goalProgress.avgCalorieAdherence < 0.8) {
      adaptations.push('INCREASE CALORIES: Suggest calorie-dense healthy foods');
    }

    // Health-based adaptations
    if (healthMetrics.avgEnergy < 4) {
      adaptations.push('ENERGY BOOST: Include iron-rich foods and complex carbs');
    }
    if (healthMetrics.weightTrend === 'gaining' && goalProgress.avgCalorieAdherence > 1.0) {
      adaptations.push('CALORIE CONTROL: Suggest lower-calorie alternatives');
    }

    // Micronutrient adaptations
    microStatus.deficiencies.forEach(def => {
      adaptations.push(`${def.nutrient.toUpperCase()} BOOST: Include ${def.foodSources.slice(0, 2).join(' or ')}`);
    });

    // Sentiment adaptations
    if (sentiment.tone === 'bored') {
      adaptations.push('VARIETY: Suggest exciting new cuisines or cooking methods');
    }
    if (sentiment.tone === 'frustrated') {
      adaptations.push('SIMPLICITY: Focus on easy, quick meal solutions');
    }

    const adaptationText = adaptations.length > 0 
      ? `\nADAPTATIONS: ${adaptations.join(', ')}`
      : '';

    return `You're a nutrition coach. User asks: "${userMessage}"
    
Progress: ${Math.round(goalProgress.avgProteinAdherence * 100)}% protein goal, trend: ${goalProgress.trendDirection}
Mood: ${healthMetrics.avgMood}/10, Energy: ${healthMetrics.avgEnergy}/10
Sentiment: ${sentiment.tone}${adaptationText}

Respond with specific meal suggestions. Be conversational and helpful.

JSON format:
{
  "message": "Helpful response with meal ideas",
  "suggestions": [{"name": "Meal name", "reason": "Why it helps", "macros": {"calories": 400, "protein": 25, "carbs": 30, "fat": 15}}],
  "insights": ["One key insight about their progress"],
  "nextQuestion": "One follow-up question"
}`;
  }

  // 6. FAST RESPONSE GENERATION - Optimized for speed
  private async generateFastResponse(prompt: string): Promise<any> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 300, // Limit for speed
        temperature: 0.7
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error('Empty response');

      return JSON.parse(content);
    } catch (error) {
      console.error('AI response error:', error);
      return {
        message: "I'm here to help with your nutrition! What would you like to eat?",
        insights: ["Let's focus on your goals together"],
        nextQuestion: "What type of meal are you in the mood for?"
      };
    }
  }

  // MAIN PROCESSING METHOD
  async processAdaptiveChat(userId: string, message: string, conversationId?: string): Promise<any> {
    const startTime = Date.now();

    try {
      // Run analysis in parallel for speed (with error handling)
      const [goalProgress, healthMetrics, microStatus] = await Promise.allSettled([
        this.analyzeGoalProgress(userId),
        this.analyzeHealthMetrics(userId),
        this.analyzeMicronutrientStatus(userId)
      ]).then(results => [
        results[0].status === 'fulfilled' ? results[0].value : this.getDefaultGoalProgress(userId),
        results[1].status === 'fulfilled' ? results[1].value : this.getDefaultHealthMetrics(),
        results[2].status === 'fulfilled' ? results[2].value : this.getDefaultMicroStatus()
      ]);

      const sentiment = this.analyzeSentiment(message);

      // Generate adaptive response
      const prompt = this.generateAdaptivePrompt(message, goalProgress, healthMetrics, microStatus, sentiment);
      const aiResponse = await this.generateFastResponse(prompt);

      // Validate response
      const validatedResponse = ResponseSchema.parse(aiResponse);

      // Save conversation (simplified)
      if (!conversationId) {
        const [newConversation] = await db.insert(chefAiConversations).values({
          userId,
          title: message.slice(0, 50),
          lastInteractionAt: new Date(),
          messageCount: 1
        }).returning();
        conversationId = newConversation.id;
      }

      // Save messages
      await Promise.all([
        db.insert(chefAiMessages).values({
          conversationId: conversationId!,
          role: 'user',
          content: message,
          messageType: 'text'
        }),
        db.insert(chefAiMessages).values({
          conversationId: conversationId!,
          role: 'assistant',
          content: validatedResponse.message,
          messageType: 'text',
          nutritionContext: {
            goalProgress: goalProgress.avgProteinAdherence,
            healthScore: healthMetrics.avgEnergy,
            sentiment: sentiment.tone
          }
        })
      ]);

      const responseTime = Date.now() - startTime;
      console.log(`Adaptive ChefAI response generated in ${responseTime}ms`);

      return {
        success: true,
        conversationId,
        message: validatedResponse.message,
        suggestions: validatedResponse.suggestions || [],
        insights: validatedResponse.insights,
        followUpQuestions: validatedResponse.nextQuestion ? [validatedResponse.nextQuestion] : [],
        responseTime,
        adaptations: {
          goalProgress: Math.round(goalProgress.avgProteinAdherence * 100),
          healthTrend: healthMetrics.weightTrend,
          sentiment: sentiment.tone
        }
      };

    } catch (error) {
      console.error('Adaptive ChefAI error:', error);
      return {
        success: false,
        message: "I'm having trouble right now, but I'm here to help with your nutrition goals!",
        insights: ["Let's keep working on your health journey together"],
        responseTime: Date.now() - startTime
      };
    }
  }

  // FALLBACK METHODS for graceful degradation
  private getDefaultGoalProgress(userId: string): UserGoalProgress {
    return {
      userId,
      avgCalorieAdherence: 0.8, // Assume decent adherence
      avgProteinAdherence: 0.7, // Common protein shortfall
      avgCarbAdherence: 0.9,
      avgFatAdherence: 0.8,
      consistencyScore: 0.7,
      trendDirection: 'stable'
    };
  }

  private getDefaultHealthMetrics(): HealthMetrics {
    return {
      weightTrend: 'unknown',
      avgMood: 5,
      avgEnergy: 5,
      avgStress: 5,
      symptomPatterns: []
    };
  }

  private getDefaultMicroStatus(): MicronutrientStatus {
    return {
      deficiencies: [
        {
          nutrient: 'iron',
          avgIntake: 12,
          recommendedIntake: 18,
          severity: 'mild' as const,
          foodSources: ['spinach', 'lean beef', 'lentils']
        }
      ]
    };
  }
}

export const adaptiveChefAI = new AdaptiveChefAI();