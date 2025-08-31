/**
 * Smart Portions API Routes
 * AI-powered portion recommendations based on remaining macros
 */

import { Router } from 'express';
import { verifyJWT, type AuthenticatedRequest } from '../../infrastructure/auth/authService';
import { SmartPortions } from '../../core/nutrition/smart-portions';

const router = Router();

// Get portion recommendation for a specific food
router.post('/api/smart-portions/recommend', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { foodId, mealType } = req.body;
    
    if (!foodId || !mealType) {
      return res.status(400).json({
        error: 'foodId and mealType are required'
      });
    }

    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return res.status(400).json({
        error: 'mealType must be one of: breakfast, lunch, dinner, snack'
      });
    }

    const recommendation = await SmartPortions.getPortionRecommendation(userId, foodId, mealType);
    
    if (!recommendation) {
      return res.status(404).json({
        error: 'Food not found or unable to generate recommendation'
      });
    }

    res.json({
      success: true,
      recommendation
    });
  } catch (error) {
    console.error('Error generating portion recommendation:', error);
    res.status(500).json({
      error: 'Failed to generate portion recommendation'
    });
  }
});

// Get multiple recommendations for a meal
router.post('/api/smart-portions/meal-recommendations', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { foodIds, mealType } = req.body;
    
    if (!Array.isArray(foodIds) || !mealType) {
      return res.status(400).json({
        error: 'foodIds (array) and mealType are required'
      });
    }

    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return res.status(400).json({
        error: 'mealType must be one of: breakfast, lunch, dinner, snack'
      });
    }

    const recommendations = await SmartPortions.getMealRecommendations(userId, mealType, foodIds);
    
    res.json({
      success: true,
      recommendations,
      totalRecommendations: recommendations.length
    });
  } catch (error) {
    console.error('Error generating meal recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate meal recommendations'
    });
  }
});

// Provide feedback on a recommendation
router.post('/api/smart-portions/feedback', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const { recommendationId, wasAccepted, actualGramsUsed } = req.body;
    
    if (!recommendationId || typeof wasAccepted !== 'boolean') {
      return res.status(400).json({
        error: 'recommendationId and wasAccepted (boolean) are required'
      });
    }

    await SmartPortions.updateRecommendationFeedback(
      req.user.id,
      recommendationId,
      wasAccepted,
      actualGramsUsed
    );
    
    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Error recording recommendation feedback:', error);
    res.status(500).json({
      error: 'Failed to record feedback'
    });
  }
});

// Get user's remaining macros for smart recommendations
router.get('/api/smart-portions/remaining-macros', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    
    // This is a private method, so we'll recreate the logic here
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's nutrition totals
    const todayNutrition = await SmartPortions.storage.getDailyNutrition(userId, today);
    
    // Get user's daily goals
    const user = await SmartPortions.storage.getUser(userId);
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
    
    const remaining = {
      calories: Math.max(0, goals.calories - consumed.calories),
      protein: Math.max(0, goals.protein - consumed.protein),
      carbs: Math.max(0, goals.carbs - consumed.carbs),
      fat: Math.max(0, goals.fat - consumed.fat),
      fiber: Math.max(0, goals.fiber - consumed.fiber),
    };
    
    res.json({
      success: true,
      goals,
      consumed,
      remaining,
      percentageConsumed: {
        calories: goals.calories > 0 ? Math.round((consumed.calories / goals.calories) * 100) : 0,
        protein: goals.protein > 0 ? Math.round((consumed.protein / goals.protein) * 100) : 0,
        carbs: goals.carbs > 0 ? Math.round((consumed.carbs / goals.carbs) * 100) : 0,
        fat: goals.fat > 0 ? Math.round((consumed.fat / goals.fat) * 100) : 0,
        fiber: 25 > 0 ? Math.round((consumed.fiber / 25) * 100) : 0,
      }
    });
  } catch (error) {
    console.error('Error fetching remaining macros:', error);
    res.status(500).json({
      error: 'Failed to fetch remaining macros'
    });
  }
});

export { router as smartPortionsRoutes };