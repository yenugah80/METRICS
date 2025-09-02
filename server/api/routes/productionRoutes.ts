/**
 * Production API Routes
 * Real endpoints with database integration
 */

import type { Express } from "express";
import { Request, Response } from 'express';
import { productionStorage } from '../../infrastructure/database/productionStorage';
import { productionMealService, type MealLoggingRequest } from '../../core/meals/productionMealService';
import { verifyJWT, type AuthenticatedRequest } from '../../infrastructure/auth/authService';

export async function registerProductionRoutes(app: Express): Promise<void> {
  
  // Dashboard overview endpoint
  app.get('/api/dashboard/overview', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const overview = await productionStorage.getDashboardOverview(userId);
      res.json(overview);
      
    } catch (error: any) {
      console.error('Dashboard overview error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });
  
  // System health endpoint
  app.get('/api/system/health', async (req: Request, res: Response) => {
    try {
      const health = await productionStorage.getSystemHealth();
      res.json(health);
      
    } catch (error: any) {
      console.error('System health error:', error);
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  });
  
  // Recent activities endpoint
  app.get('/api/activities/recent', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await productionStorage.getRecentActivities(userId, limit);
      
      // Format activities for frontend
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        type: activity.activityType,
        title: activity.title,
        description: activity.description,
        timestamp: activity.createdAt,
        relatedMealId: activity.relatedMealId,
        relatedRecipeId: activity.relatedRecipeId,
      }));
      
      res.json(formattedActivities);
      
    } catch (error: any) {
      console.error('Recent activities error:', error);
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  });
  
  // Meal logging endpoint
  app.post('/api/meals/log', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { mealType, source, data, name, description } = req.body;
      
      if (!mealType || !source || !data) {
        return res.status(400).json({ error: 'Missing required fields: mealType, source, data' });
      }

      const loggingRequest: MealLoggingRequest = {
        userId,
        mealType,
        source,
        data,
        name,
        description,
      };

      const result = await productionMealService.logMeal(loggingRequest);
      
      res.json({
        success: true,
        meal: result.meal,
        analysis: result.analysis,
      });
      
    } catch (error: any) {
      console.error('Meal logging error:', error);
      res.status(500).json({ error: error.message || 'Failed to log meal' });
    }
  });
  
  // Get user meals
  app.get('/api/meals', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const meals = await productionStorage.getUserMeals(userId, limit);
      
      // Get meal items for each meal
      const mealsWithItems = await Promise.all(
        meals.map(async (meal) => {
          const items = await productionStorage.getMealItems(meal.id);
          return {
            ...meal,
            items,
          };
        })
      );
      
      res.json(mealsWithItems);
      
    } catch (error: any) {
      console.error('Get meals error:', error);
      res.status(500).json({ error: 'Failed to fetch meals' });
    }
  });
  
  // Food search endpoint
  app.get('/api/foods/search', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const foods = await productionStorage.searchFoods(query, limit);
      
      res.json(foods);
      
    } catch (error: any) {
      console.error('Food search error:', error);
      res.status(500).json({ error: 'Failed to search foods' });
    }
  });
  
  // Barcode lookup endpoint
  app.get('/api/foods/barcode/:barcode', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { barcode } = req.params;
      const food = await productionStorage.getFoodByBarcode(barcode);
      
      if (!food) {
        return res.status(404).json({ error: 'Food not found for this barcode' });
      }
      
      res.json(food);
      
    } catch (error: any) {
      console.error('Barcode lookup error:', error);
      res.status(500).json({ error: 'Failed to lookup barcode' });
    }
  });
  
  // User goals endpoints
  app.get('/api/goals', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const goals = await productionStorage.getUserGoals(userId);
      res.json(goals);
      
    } catch (error: any) {
      console.error('Get goals error:', error);
      res.status(500).json({ error: 'Failed to fetch goals' });
    }
  });
  
  app.post('/api/goals', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const goalData = {
        ...req.body,
        userId,
      };

      const goal = await productionStorage.createUserGoal(goalData);
      res.json(goal);
      
    } catch (error: any) {
      console.error('Create goal error:', error);
      res.status(500).json({ error: 'Failed to create goal' });
    }
  });
  
  // Nutrition history endpoint
  app.get('/api/nutrition/history', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const days = parseInt(req.query.days as string) || 30;
      const history = await productionStorage.getUserNutritionHistory(userId, days);
      
      res.json(history);
      
    } catch (error: any) {
      console.error('Nutrition history error:', error);
      res.status(500).json({ error: 'Failed to fetch nutrition history' });
    }
  });
  
  // Recipe endpoints
  app.get('/api/recipes', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const recipes = await productionStorage.getUserRecipes(userId, limit);
      
      res.json(recipes);
      
    } catch (error: any) {
      console.error('Get recipes error:', error);
      res.status(500).json({ error: 'Failed to fetch recipes' });
    }
  });
  
  app.post('/api/recipes', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const recipeData = {
        ...req.body,
        userId,
      };

      const recipe = await productionStorage.createRecipe(recipeData);
      res.json(recipe);
      
    } catch (error: any) {
      console.error('Create recipe error:', error);
      res.status(500).json({ error: 'Failed to create recipe' });
    }
  });
  
  // Public recipes endpoint
  app.get('/api/recipes/public', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const recipes = await productionStorage.getPublicRecipes(limit);
      
      res.json(recipes);
      
    } catch (error: any) {
      console.error('Get public recipes error:', error);
      res.status(500).json({ error: 'Failed to fetch public recipes' });
    }
  });
  
  // System metrics endpoint
  app.get('/api/system/metrics', async (req: Request, res: Response) => {
    try {
      const metricType = req.query.type as string || 'api_response';
      const hours = parseInt(req.query.hours as string) || 24;
      
      const metrics = await productionStorage.getSystemMetrics(metricType, hours);
      
      res.json(metrics);
      
    } catch (error: any) {
      console.error('System metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch system metrics' });
    }
  });
  
  // User profile endpoint
  app.get('/api/profile', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await productionStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive data
      const { ...publicProfile } = user;
      res.json(publicProfile);
      
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });
  
  app.put('/api/profile', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const updates = req.body;
      const user = await productionStorage.updateUser(userId, updates);
      
      res.json(user);
      
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });
}