import { Router } from "express";
import { verifyJWT, type AuthenticatedRequest } from "../../infrastructure/auth/authService";
import { mealRecommendationService, type MealRecommendationRequest } from "../../core/ai/mealRecommendationService";
import { z } from "zod";

const router = Router();

// Validation schemas
const mealRecommendationSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  preferences: z.object({
    prepTime: z.number().min(5).max(180).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    cuisineType: z.string().optional(),
    includedIngredients: z.array(z.string()).optional(),
    excludedIngredients: z.array(z.string()).optional(),
  }).optional(),
});

// Get personalized meal recommendations
router.post('/api/meal-recommendations/generate', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const validatedData = mealRecommendationSchema.parse({
      ...req.body,
      mealType: req.body.mealType || 'lunch' // Default to lunch if not provided
    });
    
    const request: MealRecommendationRequest = {
      userId,
      mealType: validatedData.mealType,
      preferences: validatedData.preferences
    };
    
    const recommendations = await mealRecommendationService.generateMealRecommendations(request);
    
    res.json({
      success: true,
      recommendations,
      totalCount: recommendations.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating meal recommendations:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }
    res.status(500).json({
      error: 'Failed to generate meal recommendations'
    });
  }
});

// Get quick recommendation based on remaining daily macros
router.get('/api/meal-recommendations/quick', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const recommendation = await mealRecommendationService.generateRecipeBasedOnRemainingMacros(userId);
    
    res.json({
      success: true,
      recommendation,
      type: 'quick',
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating quick recommendation:', error);
    res.status(500).json({
      error: 'Failed to generate quick recommendation'
    });
  }
});

// Get recommendation for specific meal type
router.get('/api/meal-recommendations/:mealType', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { mealType } = req.params;
    
    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return res.status(400).json({
        error: 'mealType must be one of: breakfast, lunch, dinner, snack'
      });
    }
    
    const recommendation = await mealRecommendationService.generateQuickRecommendation(
      userId, 
      mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack'
    );
    
    res.json({
      success: true,
      recommendation,
      mealType,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating meal type recommendation:', error);
    res.status(500).json({
      error: 'Failed to generate recommendation for meal type'
    });
  }
});

export { router as mealRecommendationRoutes };