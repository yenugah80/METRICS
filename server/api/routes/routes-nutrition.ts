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
      
      // If ingredient not found, queue it for discovery
      await etlSystem.discoverIngredient(`barcode:${barcode}`, 'barcode_lookup');
      
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

      const nutritionData = await etlSystem.calculateNutrition({
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
      const ingredientData = await etlSystem.getIngredientById(id);
      
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
}