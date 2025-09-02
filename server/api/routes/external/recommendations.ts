/**
 * Meal Recommendation API Routes
 * Handles personalized meal suggestions and recommendation management
 */

import { Router } from 'express';
import { freemiumMiddleware, type FreemiumRequest } from '../middleware/freemium';
import { generateMealRecommendations, getTrendingRecommendations, type RecommendationInput } from '../meal-recommendation-engine';
import { storage } from '../storage';

const router = Router();

// Get personalized meal recommendations
router.post('/personalized', freemiumMiddleware, async (req: FreemiumRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    const {
      mealType,
      maxCalories,
      excludeIngredients,
      preferredCuisines,
      maxPrepTime,
      currentNutritionToday,
      limit = 5
    } = req.body;

    const input: RecommendationInput = {
      userId,
      mealType,
      maxCalories,
      excludeIngredients,
      preferredCuisines,
      maxPrepTime,
      currentNutritionToday,
      limit: Math.min(limit, 10) // Max 10 recommendations
    };

    const recommendations = await generateMealRecommendations(input);

    res.json({
      success: true,
      recommendations,
      personalized: !!userId,
      count: recommendations.length,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized recommendations',
      message: error.message
    });
  }
});

// Get trending meal recommendations
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    const recommendations = await getTrendingRecommendations(limit);

    res.json({
      success: true,
      recommendations,
      type: 'trending',
      count: recommendations.length,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Trending recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending recommendations',
      message: error.message
    });
  }
});

// Get recommendations for specific meal type
router.get('/for-meal/:mealType', freemiumMiddleware, async (req: FreemiumRequest, res) => {
  try {
    const { mealType } = req.params;
    const userId = req.user?.id || req.user?.claims?.sub;
    
    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid meal type',
        message: 'Meal type must be breakfast, lunch, dinner, or snack'
      });
    }

    const recommendations = await generateMealRecommendations({
      userId,
      mealType,
      limit: 8
    });

    res.json({
      success: true,
      recommendations,
      mealType,
      personalized: !!userId,
      count: recommendations.length
    });

  } catch (error: any) {
    console.error('Meal type recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get meal recommendations',
      message: error.message
    });
  }
});

// Save a recommendation as favorite (authenticated users only)
router.post('/save-favorite', freemiumMiddleware, async (req: FreemiumRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please sign in to save favorite recommendations'
      });
    }

    const { recommendation } = req.body;
    
    if (!recommendation || !recommendation.name) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recommendation data',
        message: 'Recommendation object with name is required'
      });
    }

    await storage.saveMealRecommendation(userId, recommendation);

    res.json({
      success: true,
      message: 'Recommendation saved as favorite',
      recommendation_id: recommendation.id
    });

  } catch (error: any) {
    console.error('Save favorite recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save favorite recommendation',
      message: error.message
    });
  }
});

// Get user's favorite meals (authenticated users only)
router.get('/favorites', freemiumMiddleware, async (req: FreemiumRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please sign in to view favorite recommendations'
      });
    }

    const favoriteMeals = await storage.getUserFavoriteMeals(userId);

    res.json({
      success: true,
      favorites: favoriteMeals,
      count: favoriteMeals.length
    });

  } catch (error: any) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get favorite recommendations',
      message: error.message
    });
  }
});

// Get quick recommendations based on user's nutrition goals
router.get('/quick', freemiumMiddleware, async (req: FreemiumRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    const { calories, protein, carbs, fat } = req.query;

    // Parse current nutrition if provided
    const currentNutritionToday = (calories || protein || carbs || fat) ? {
      calories: parseInt(calories as string) || 0,
      protein: parseInt(protein as string) || 0,
      carbs: parseInt(carbs as string) || 0,
      fat: parseInt(fat as string) || 0
    } : undefined;

    const recommendations = await generateMealRecommendations({
      userId,
      currentNutritionToday,
      limit: 6
    });

    res.json({
      success: true,
      recommendations,
      type: 'quick',
      personalized: !!userId,
      count: recommendations.length
    });

  } catch (error: any) {
    console.error('Quick recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quick recommendations',
      message: error.message
    });
  }
});

// Get recommendations based on specific dietary requirements
router.post('/dietary', freemiumMiddleware, async (req: FreemiumRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    const {
      dietType, // 'keto', 'vegan', 'paleo', 'mediterranean', etc.
      allergens = [],
      maxCalories,
      mealType
    } = req.body;

    if (!dietType) {
      return res.status(400).json({
        success: false,
        error: 'Diet type required',
        message: 'Please specify a diet type (keto, vegan, paleo, etc.)'
      });
    }

    const recommendations = await generateMealRecommendations({
      userId,
      mealType,
      maxCalories,
      excludeIngredients: allergens,
      preferredCuisines: [], // Let AI decide based on diet type
      limit: 8
    });

    // Filter recommendations that match the diet type
    const filteredRecommendations = recommendations.filter(rec =>
      rec.tags.some(tag => tag.toLowerCase().includes(dietType.toLowerCase())) ||
      rec.matchReasons.some(reason => reason.toLowerCase().includes(dietType.toLowerCase()))
    );

    res.json({
      success: true,
      recommendations: filteredRecommendations.slice(0, 6),
      dietType,
      personalized: !!userId,
      count: filteredRecommendations.length
    });

  } catch (error: any) {
    console.error('Dietary recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dietary recommendations',
      message: error.message
    });
  }
});

export { router as recommendationRoutes };