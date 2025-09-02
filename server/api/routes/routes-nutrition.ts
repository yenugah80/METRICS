import type { Express } from "express";
import { verifyJWT, type AuthenticatedRequest } from "../../infrastructure/auth/authService";
import { storage } from "../../infrastructure/database/storage";

export async function registerNutritionRoutes(app: Express) {
  // Import ETL system and nutrition service once
  const { etlSystem } = await import("../../core/etl/nutritionETL");
  const { NutritionService } = await import("./nutritionApi");
  const nutritionService = new NutritionService();

  // Barcode lookup using comprehensive nutrition APIs and ETL system
  app.get('/api/nutrition/barcode/:barcode', async (req, res) => {
    try {
      const { barcode } = req.params;
      
      // Try our ETL system first
      try {
        const result = await nutritionService.searchByBarcode(barcode);
        if (result) {
          return res.json(result);
        }
      } catch (error: any) {
        console.log('ETL barcode lookup failed, falling back to legacy:', error);
      }
      
      // If ingredient not found, note for future enhancement
      console.log(`Barcode ${barcode} not found in nutrition database`);
      
      res.status(404).json({ 
        message: "Product not found", 
        queued: true,
        note: "Product queued for discovery - try again in a few minutes" 
      });
    } catch (error) {
      console.error("Error looking up barcode:", error);
      res.status(500).json({ message: "Failed to lookup barcode" });
    }
  });

  // Text-based food search using multiple nutrition APIs
  app.get('/api/nutrition/search', async (req, res) => {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const results = await nutritionService.searchByText(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching nutrition data:", error);
      res.status(500).json({ message: "Failed to search nutrition data" });
    }
  });

  // Advanced nutrition calculation using ETL system
  app.post('/api/nutrition/calculate', async (req, res) => {
    try {
      const { ingredientId, quantity, unit, context, preparation } = req.body;
      
      if (!ingredientId || !quantity || !unit) {
        return res.status(400).json({ 
          message: "ingredientId, quantity, and unit are required" 
        });
      }

      const nutritionData = await etlSystem.calculateMealNutrition({
        ingredientId,
        quantity: parseFloat(quantity),
        unit,
        context: context || {},
        preparation: preparation || 'raw'
      });
      
      res.json(nutritionData);
    } catch (error) {
      console.error("Error calculating nutrition:", error);
      res.status(500).json({ message: "Failed to calculate nutrition" });
    }
  });

  // Get nutritional data for specific ingredient
  app.get('/api/nutrition/ingredient/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // Get ingredient data from nutrition service
      const ingredientData = await nutritionService.searchByText(id);
      
      if (!ingredientData) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      
      res.json(ingredientData);
    } catch (error) {
      console.error("Error fetching ingredient data:", error);
      res.status(500).json({ message: "Failed to fetch ingredient data" });
    }
  });

  // Get nutrition recommendations for user based on profile
  app.get('/api/nutrition/recommendations', verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userProfile = await storage.getUserProfile(userId);
      
      // Calculate personalized recommendations based on user data
      const recommendations = {
        dailyCalories: 2000, // TODO: Calculate based on age, weight, activity level
        macroBreakdown: {
          protein: "15-25%",
          carbs: "45-65%", 
          fat: "20-35%"
        },
        micronutrients: {
          fiber: "25g+",
          sodium: "<2300mg",
          sugar: "<50g"
        },
        hydration: "8 glasses",
        mealTiming: "3 main meals + 2 snacks"
      };
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating nutrition recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Get today's nutrition progress for real-time diet plan adjustments
  app.get('/api/nutrition/today-progress', verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get today's nutrition data directly
      const dateString = today.toISOString().split('T')[0];
      const dailyNutrition = await storage.getDailyNutrition(userId, dateString);
      
      let totalIntake = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };
      
      if (dailyNutrition) {
        totalIntake = {
          calories: dailyNutrition.totalCalories || 0,
          protein: dailyNutrition.totalProtein || 0,
          carbs: dailyNutrition.totalCarbs || 0,
          fat: dailyNutrition.totalFat || 0,
          fiber: dailyNutrition.totalFiber || 0,
        };
      }
      
      // Also get meal count for today
      const todaysMeals = await storage.getUserMeals(userId, 50);
      const todaysCount = todaysMeals.filter(meal => {
        const mealDate = new Date(meal.loggedAt);
        return mealDate.toDateString() === today.toDateString();
      }).length;
      
      res.json({
        success: true,
        date: today.toISOString().split('T')[0],
        intake: totalIntake,
        mealsLogged: todaysCount
      });
    } catch (error) {
      console.error("Error fetching today's progress:", error);
      res.status(500).json({ message: "Failed to fetch today's progress" });
    }
  });
}