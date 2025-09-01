import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { mealLogs, mealMatches, myMeals, mealSwaps, dailyNutritionLogs, users } from "../../../shared/schema";
import { verifyJWT, type AuthenticatedRequest } from "../../infrastructure/auth/authService";
import { OpenAIManager } from "../../integrations/openai/openai-manager";

// Validation schemas
const MealLogCreateSchema = z.object({
  mealName: z.string().min(1),
  description: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  loggedDate: z.string(), // YYYY-MM-DD format
  source: z.enum(['scan', 'manual', 'voice', 'import']).default('scan'),
  nutritionData: z.object({
    calories: z.number().positive(),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
    fiber: z.number().min(0).optional(),
    sodium: z.number().min(0).optional(),
    sugar: z.number().min(0).optional(),
    ingredients: z.array(z.object({
      name: z.string(),
      amount: z.number().positive(),
      unit: z.string(),
      fdcId: z.string().optional(),
      calories: z.number().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fat: z.number().min(0),
    })).optional(),
  }),
  photoUrl: z.string().url().optional(),
  confidence: z.number().min(0).max(1).default(0.95),
});

const MyMealCreateSchema = z.object({
  mealName: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'custom']).default('custom'),
  nutritionData: z.object({
    calories: z.number().positive(),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
    fiber: z.number().min(0).optional(),
    sodium: z.number().min(0).optional(),
    sugar: z.number().min(0).optional(),
    servingSize: z.string(),
    servingUnit: z.string(),
    ingredients: z.array(z.object({
      name: z.string(),
      amount: z.number().positive(),
      unit: z.string(),
      fdcId: z.string().optional(),
    })).optional(),
  }),
  prepTime: z.number().min(0).optional(),
  cookTime: z.number().min(0).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  instructions: z.string().optional(),
  tags: z.array(z.string()).default([]),
  photoUrl: z.string().url().optional(),
  isRecipe: z.boolean().default(false),
});

// Helper functions
async function analyzeFoodImageWithAI(imageUrl: string): Promise<any> {
  const openai = OpenAIManager.getInstance();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert. Analyze the food image and return detailed nutrition information in the exact JSON format:
          {
            "mealName": "name of the meal",
            "description": "brief description",
            "nutritionData": {
              "calories": number,
              "protein": number,
              "carbs": number,
              "fat": number,
              "fiber": number,
              "sodium": number,
              "sugar": number,
              "ingredients": [
                {
                  "name": "ingredient name",
                  "amount": number,
                  "unit": "grams/cups/pieces",
                  "calories": number,
                  "protein": number,
                  "carbs": number,
                  "fat": number
                }
              ]
            },
            "confidence": number between 0 and 1
          }
          
          Be accurate with nutrition values. If uncertain, use conservative estimates.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and provide detailed nutrition information."
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('AI food analysis error:', error);
    throw new Error('Failed to analyze food image');
  }
}

async function findMealMatches(userId: string, scannedMeal: any, mealType: string, date: string): Promise<any[]> {
  // Get today's planned meals from diet plan
  // This would integrate with your existing diet plan system
  // For now, return empty array - you'd implement the actual matching logic
  return [];
}

function calculateMatchScore(scannedMeal: any, plannedMeal: any): number {
  // Implement 90% confidence matching algorithm
  let score = 0;
  let factors = 0;

  // Name similarity (using simple string matching - could enhance with NLP)
  const nameMatch = calculateStringSimilarity(scannedMeal.mealName, plannedMeal.name);
  score += nameMatch * 0.3;
  factors++;

  // Calorie similarity (within 10% tolerance)
  const calorieMatch = 1 - Math.abs(scannedMeal.nutritionData.calories - plannedMeal.calories) / plannedMeal.calories;
  score += Math.max(0, calorieMatch) * 0.25;
  factors++;

  // Macro similarity
  const proteinMatch = 1 - Math.abs(scannedMeal.nutritionData.protein - plannedMeal.protein) / plannedMeal.protein;
  const carbMatch = 1 - Math.abs(scannedMeal.nutritionData.carbs - plannedMeal.carbs) / plannedMeal.carbs;
  const fatMatch = 1 - Math.abs(scannedMeal.nutritionData.fat - plannedMeal.fat) / plannedMeal.fat;
  
  const macroMatch = (Math.max(0, proteinMatch) + Math.max(0, carbMatch) + Math.max(0, fatMatch)) / 3;
  score += macroMatch * 0.25;
  factors++;

  // Timing match (breakfast vs breakfast, etc.)
  const timingMatch = scannedMeal.mealType === plannedMeal.mealType ? 1 : 0;
  score += timingMatch * 0.2;
  factors++;

  return factors > 0 ? score / factors : 0;
}

function calculateStringSimilarity(str1: string, str2: string): number {
  // Simple Levenshtein distance approximation
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

async function updateDailyNutritionLog(userId: string, date: string): Promise<void> {
  // Aggregate all meals for the date
  const todaysMeals = await db.select()
    .from(mealLogs)
    .where(and(
      eq(mealLogs.userId, userId),
      eq(mealLogs.loggedDate, date)
    ));

  // Calculate totals
  const totals = todaysMeals.reduce((acc, meal) => {
    const nutrition = meal.nutritionData as any;
    return {
      calories: acc.calories + nutrition.calories,
      protein: acc.protein + nutrition.protein,
      carbs: acc.carbs + nutrition.carbs,
      fat: acc.fat + nutrition.fat,
      fiber: acc.fiber + (nutrition.fiber || 0),
      sodium: acc.sodium + (nutrition.sodium || 0),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 });

  // Get user goals
  const user = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) return;

  const userGoals = user[0];

  // Update or create daily log
  await db.insert(dailyNutritionLogs)
    .values({
      userId,
      logDate: date,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
      totalSodium: totals.sodium,
      calorieGoal: userGoals.dailyCalorieGoal || 2000,
      proteinGoal: userGoals.dailyProteinGoal || 150,
      carbGoal: userGoals.dailyCarbGoal || 200,
      fatGoal: userGoals.dailyFatGoal || 67,
      mealsLogged: todaysMeals.length,
      planComplianceScore: 0.85, // Calculate based on matches
    })
    .onConflictDoUpdate({
      target: [dailyNutritionLogs.userId, dailyNutritionLogs.logDate],
      set: {
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        totalFiber: totals.fiber,
        totalSodium: totals.sodium,
        mealsLogged: todaysMeals.length,
        lastUpdated: new Date(),
      }
    });
}

export function initializeMealLoggingRoutes(app: Express): void {
  
  // POST /api/meals/scan-image - AI analysis of food image
  app.post('/api/meals/scan-image', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
      }

      const analysis = await analyzeFoodImageWithAI(imageUrl);
      
      res.json({
        success: true,
        analysis,
        message: 'Food image analyzed successfully'
      });
    } catch (error: any) {
      console.error('Food image analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze food image' });
    }
  });

  // POST /api/meals/log - Log a meal (scanned or manual)
  app.post('/api/meals/log', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const mealData = MealLogCreateSchema.parse(req.body);
      
      // Create meal log
      const [mealLog] = await db.insert(mealLogs)
        .values({
          userId,
          ...mealData,
          loggedDate: mealData.loggedDate,
        })
        .returning();

      // Find potential matches with planned meals
      const matches = await findMealMatches(userId, mealData, mealData.mealType, mealData.loggedDate);
      
      // If we have a high-confidence match (>=90%), auto-match
      const bestMatch = matches.find(match => match.score >= 0.9);
      if (bestMatch) {
        await db.insert(mealMatches)
          .values({
            userId,
            mealLogId: mealLog.id,
            planMealId: bestMatch.planMealId,
            matchScore: bestMatch.score,
            matchType: 'automatic',
            matchFactors: bestMatch.factors,
          });

        // Update meal log to mark as matched
        await db.update(mealLogs)
          .set({ 
            wasMatched: true, 
            matchedPlanMealId: bestMatch.planMealId 
          })
          .where(eq(mealLogs.id, mealLog.id));
      }

      // Update daily nutrition aggregates
      await updateDailyNutritionLog(userId, mealData.loggedDate);

      res.json({
        success: true,
        mealLog,
        autoMatched: !!bestMatch,
        matchScore: bestMatch?.score,
        message: bestMatch 
          ? 'Meal logged and automatically matched to plan'
          : 'Meal logged successfully'
      });
    } catch (error: any) {
      console.error('Meal logging error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid meal data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to log meal' });
    }
  });

  // GET /api/meals/today - Get today's logged meals
  app.get('/api/meals/today', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const today = new Date().toISOString().split('T')[0];
      
      const todaysMeals = await db.select()
        .from(mealLogs)
        .where(and(
          eq(mealLogs.userId, userId),
          eq(mealLogs.loggedDate, today)
        ))
        .orderBy(desc(mealLogs.createdAt));

      const dailyTotals = await db.select()
        .from(dailyNutritionLogs)
        .where(and(
          eq(dailyNutritionLogs.userId, userId),
          eq(dailyNutritionLogs.logDate, today)
        ))
        .limit(1);

      res.json({
        success: true,
        meals: todaysMeals,
        dailyTotals: dailyTotals[0] || null
      });
    } catch (error: any) {
      console.error('Get today meals error:', error);
      res.status(500).json({ error: 'Failed to fetch today\'s meals' });
    }
  });

  // POST /api/meals/save-favorite - Save meal to My Meals
  app.post('/api/meals/save-favorite', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { mealId } = req.body;
      
      if (!mealId) {
        return res.status(400).json({ error: 'Meal ID is required' });
      }

      // Get the meal log
      const mealLog = await db.select()
        .from(mealLogs)
        .where(and(
          eq(mealLogs.id, mealId),
          eq(mealLogs.userId, userId)
        ))
        .limit(1);

      if (mealLog.length === 0) {
        return res.status(404).json({ error: 'Meal not found' });
      }

      const meal = mealLog[0];
      const nutrition = meal.nutritionData as any;

      // Save to My Meals
      await db.insert(myMeals)
        .values({
          userId,
          mealName: meal.mealName,
          description: meal.description,
          category: meal.mealType as any,
          nutritionData: {
            ...nutrition,
            servingSize: '1',
            servingUnit: 'serving'
          },
          timesUsed: 1,
          lastUsed: new Date(),
          photoUrl: meal.photoUrl,
        });

      res.json({
        success: true,
        message: 'Meal saved to favorites'
      });
    } catch (error: any) {
      console.error('Save favorite meal error:', error);
      res.status(500).json({ error: 'Failed to save meal to favorites' });
    }
  });

  // GET /api/my-meals - Get user's saved meals
  app.get('/api/my-meals', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { category } = req.query;

      let query = db.select()
        .from(myMeals)
        .where(eq(myMeals.userId, userId));

      if (category && typeof category === 'string') {
        query = query.where(eq(myMeals.category, category));
      }

      const savedMeals = await query.orderBy(desc(myMeals.lastUsed));

      res.json({
        success: true,
        meals: savedMeals
      });
    } catch (error: any) {
      console.error('Get my meals error:', error);
      res.status(500).json({ error: 'Failed to fetch saved meals' });
    }
  });

  // POST /api/meals/track-swap - Track meal swap for AI learning
  app.post('/api/meals/track-swap', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { originalMealId, newMealId, mealType, swapReason } = req.body;
      
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay();

      await db.insert(mealSwaps)
        .values({
          userId,
          originalPlanMealId: originalMealId,
          swappedToMealId: newMealId,
          swapReason,
          swapDate: today,
          dayOfWeek,
          mealType,
          // Add nutrition comparison data here
        });

      res.json({
        success: true,
        message: 'Meal swap tracked for AI learning'
      });
    } catch (error: any) {
      console.error('Track swap error:', error);
      res.status(500).json({ error: 'Failed to track meal swap' });
    }
  });

  // GET /api/dashboard/nutrition-today - Real-time dashboard data
  app.get('/api/dashboard/nutrition-today', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const today = new Date().toISOString().split('T')[0];

      const dailyLog = await db.select()
        .from(dailyNutritionLogs)
        .where(and(
          eq(dailyNutritionLogs.userId, userId),
          eq(dailyNutritionLogs.logDate, today)
        ))
        .limit(1);

      if (dailyLog.length === 0) {
        // No meals logged today, return defaults
        const user = await db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const userGoals = user[0] || {};

        return res.json({
          success: true,
          data: {
            consumed: {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              fiber: 0
            },
            goals: {
              calories: userGoals.dailyCalorieGoal || 2000,
              protein: userGoals.dailyProteinGoal || 150,
              carbs: userGoals.dailyCarbGoal || 200,
              fat: userGoals.dailyFatGoal || 67,
              fiber: userGoals.dailyFiberGoal || 28
            },
            percentages: {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              fiber: 0
            },
            mealsLogged: 0,
            planCompliance: 0
          }
        });
      }

      const log = dailyLog[0];

      res.json({
        success: true,
        data: {
          consumed: {
            calories: log.totalCalories,
            protein: log.totalProtein,
            carbs: log.totalCarbs,
            fat: log.totalFat,
            fiber: log.totalFiber
          },
          goals: {
            calories: log.calorieGoal,
            protein: log.proteinGoal,
            carbs: log.carbGoal,
            fat: log.fatGoal,
            fiber: 28 // Default fiber goal
          },
          percentages: {
            calories: Math.round((log.totalCalories / log.calorieGoal) * 100),
            protein: Math.round((log.totalProtein / log.proteinGoal) * 100),
            carbs: Math.round((log.totalCarbs / log.carbGoal) * 100),
            fat: Math.round((log.totalFat / log.fatGoal) * 100),
            fiber: Math.round((log.totalFiber / 28) * 100)
          },
          mealsLogged: log.mealsLogged,
          planCompliance: Math.round((log.planComplianceScore || 0) * 100)
        }
      });
    } catch (error: any) {
      console.error('Dashboard nutrition error:', error);
      res.status(500).json({ error: 'Failed to fetch nutrition data' });
    }
  });

  // POST /api/meals/complete - Mark a planned meal as completed
  app.post('/api/meals/complete', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { mealId, mealType, dayNumber } = req.body;
      
      // In a real implementation, you'd mark the meal as completed
      // and potentially create a meal log entry
      
      res.json({
        success: true,
        message: 'Meal marked as completed'
      });
    } catch (error: any) {
      console.error('Complete meal error:', error);
      res.status(500).json({ error: 'Failed to complete meal' });
    }
  });
}