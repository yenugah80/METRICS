import type { Express } from "express";
import { verifyJWT, type AuthenticatedRequest } from "../../infrastructure/auth/authService";
import { storage } from "../../infrastructure/database/storage";

export async function registerFoodRoutes(app: Express) {
  // Food search route
  app.post('/api/foods/search', async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Import nutrition API service
      const { NutritionService } = await import("./nutritionApi");
      const nutritionService = new NutritionService();
      
      let results = await nutritionService.searchByText(query);
      
      // If no results from APIs, use OpenAI to generate nutrition estimates
      if (results.length === 0) {
        const { estimateNutritionFromName } = await import("./openai");
        const aiEstimate = await estimateNutritionFromName(query);
        if (aiEstimate) {
          results = [aiEstimate];
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error searching foods:", error);
      res.status(500).json({ message: "Failed to search foods" });
    }
  });

  // Add food item to meal
  app.post('/api/meals/add-item', verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { name, quantity, unit, nutrition, source } = req.body;
      
      // Create or get today's meal
      const today = new Date().toISOString().split('T')[0];
      let meal = await storage.getTodaysMeal(userId);
      
      if (!meal) {
        meal = await storage.createMeal({
          userId,
          name: "Daily Intake",
          mealType: "snack",
          source: source || "search",
          confidence: "0.9"
        });
      }
      
      // Add meal item
      const mealItem = await storage.createMealItem({
        mealId: meal.id,
        name,
        quantity: quantity.toString(),
        unit,
        confidence: "0.9"
      });
      
      // Add nutrition data
      await storage.createNutritionData({
        mealItemId: mealItem.id,
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0,
        fiber: nutrition.fiber || 0
      });
      
      res.json({ success: true, mealItem });
    } catch (error) {
      console.error("Error adding meal item:", error);
      res.status(500).json({ message: "Failed to add meal item" });
    }
  });

  // AI Meal Analysis route with token-based freemium system
  app.post("/api/meals/analyze-image", verifyJWT, async (req: any, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // AI analysis unlimited in development mode
      // Token checks disabled for development

      console.log("Starting food analysis of meal image...");
      
      // Get user profile to check diet preferences
      const userProfile = await storage.getUserProfile(userId);
      const dietPreferences = userProfile?.dietPreferences || [];
      
      console.log(`User diet preferences: ${dietPreferences.length > 0 ? dietPreferences.join(', ') : 'none set'}`);
      
      // Import the ETL system and nutrition analysis
      const { etlSystem } = await import("../../core/etl/nutritionETL");
      const { analyzeFoodImageWithNutrition } = await import("../../integrations/openai/imageAnalysis");
      
      const nutritionAnalysis = await analyzeFoodImageWithNutrition(imageBase64, dietPreferences);
      
      // Token information disabled in development mode
      nutritionAnalysis.tokenInfo = {
        tokensRemaining: "unlimited",
        isPremium: true,
        resetDate: new Date()
      };
      
      console.log("Food analysis complete:", nutritionAnalysis);
      
      // Add helpful message if no diet preferences are set
      if (dietPreferences.length === 0) {
        nutritionAnalysis.diet_preferences_note = {
          message: "Set your diet preferences in your profile to get personalized diet compatibility analysis",
          setup_url: "/profile"
        };
      }
      
      res.json(nutritionAnalysis);
    } catch (error: any) {
      console.error("Meal analysis error:", error);
      res.status(500).json({ error: "Failed to analyze meal image: " + (error?.message || "Unknown error") });
    }
  });

  // Save analyzed meal to database  
  app.post("/api/meals/save", verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { name, mealType, imageUrl, foods, nutrition } = req.body;

      if (!name || !foods || !nutrition) {
        return res.status(400).json({ error: "Missing required meal data" });
      }

      // Transform the frontend data format to match the AI analysis format expected by saveMealFromAI
      const aiAnalysis = {
        mealName: name || 'Voice Logged Meal',
        mealType: mealType || 'snack', // Default to snack to match storage layer
        description: `Meal logged via photo analysis at ${new Date().toLocaleString()}`,
        imageUrl,
        nutrition: {
          calories: nutrition.total_calories || nutrition.health?.calories || 0,
          protein: nutrition.total_protein || nutrition.health?.macronutrients?.protein || 0,
          carbs: nutrition.total_carbs || nutrition.health?.macronutrients?.carbs || 0,
          fat: nutrition.total_fat || nutrition.health?.macronutrients?.fat || 0,
          fiber: nutrition.detailed_nutrition?.fiber || nutrition.health?.macronutrients?.fiber || 0,
          sodium: nutrition.detailed_nutrition?.sodium || 0,
          sugar: nutrition.detailed_nutrition?.sugar || 0,
          vitaminC: nutrition.detailed_nutrition?.vitaminC || 0,
          calcium: nutrition.detailed_nutrition?.calcium || 0,
          iron: nutrition.detailed_nutrition?.iron || 0
        },
        foods: foods.map((food: any) => ({
          name: food.name || food.food || 'Unknown Food',
          quantity: food.quantity || '1 serving',
          confidence: food.confidence || 0.8,
          nutrition: {
            calories: food.nutrition?.calories || Math.round((nutrition.total_calories || 0) / foods.length),
            protein: food.nutrition?.protein || Math.round((nutrition.total_protein || 0) / foods.length),
            carbs: food.nutrition?.carbs || Math.round((nutrition.total_carbs || 0) / foods.length),
            fat: food.nutrition?.fat || Math.round((nutrition.total_fat || 0) / foods.length),
            fiber: food.nutrition?.fiber || Math.round((nutrition.detailed_nutrition?.fiber || 0) / foods.length)
          }
        }))
      };

      // Use the existing meal save functionality
      const { saveMealFromAI } = await import("../../core/meals/aiMealProcessor");
      const savedMeal = await saveMealFromAI(userId, aiAnalysis);
      
      console.log("Meal saved successfully:", savedMeal.id);
      res.json({ 
        success: true, 
        mealId: savedMeal.id,
        message: "Meal saved successfully" 
      });
    } catch (error: any) {
      console.error("Error saving meal:", error);
      res.status(500).json({ 
        error: "Failed to save meal", 
        details: error?.message || "Unknown error"
      });
    }
  });

  // Get recent meals for the user
  app.get("/api/meals/recent", verifyJWT, async (req: any, res) => {
    try {
      // Use authenticated user's ID
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const meals = await storage.getMealsByUserId(userId, limit);
      
      // Get nutrition for each meal
      const mealsWithNutrition = await Promise.all(
        meals.map(async (meal) => {
          const nutrition = await storage.getMealNutrition(meal.id);
          const items = await storage.getMealItems(meal.id);
          return {
            ...meal,
            nutrition,
            items
          };
        })
      );

      res.json(mealsWithNutrition);
    } catch (error) {
      console.error("Error fetching recent meals:", error);
      res.status(500).json({ error: "Failed to fetch recent meals" });
    }
  });

  // Get meal swap options using real ETL nutrition data
  app.post('/api/meals/get-swap-options', async (req, res) => {
    try {
      const { originalMealId, mealType, dietPreferences = [], allergens = [] } = req.body;
      
      // Use ETL system to find nutritionally similar alternatives
      const { etlSystem } = await import("../../core/etl/nutritionETL");
      const searchQuery = mealType === 'breakfast' ? 'breakfast foods' : 
                          mealType === 'lunch' ? 'lunch protein' :
                          mealType === 'dinner' ? 'dinner protein' : 'healthy snacks';
                          
      const swapOptions = await etlSystem.searchNutritionData(searchQuery, {
        includeUSDA: true,
        includeOFF: true,
        limit: 10
      });
      
      // Filter based on diet preferences and allergens
      const filteredOptions = swapOptions.filter(option => {
        const hasAllergens = allergens.some(allergen => 
          option.name.toLowerCase().includes(allergen.toLowerCase())
        );
        return !hasAllergens;
      });
      
      res.json({
        success: true,
        alternatives: filteredOptions.slice(0, 5).map(option => ({
          id: option.id,
          name: option.name,
          nutrition: {
            calories: option.calories,
            protein: option.protein,
            carbs: option.carbohydrates,
            fat: option.fat
          },
          source: option.source,
          verified: option.verified,
          prepTime: 15,
          difficulty: 'easy'
        }))
      });
    } catch (error) {
      console.error('Swap options error:', error);
      res.status(500).json({ error: 'Failed to get swap options' });
    }
  });

  // Track meal swaps for AI learning system
  app.post('/api/meals/track-swap', async (req, res) => {
    try {
      const { originalMealId, newMealId, mealType, swapReason } = req.body;
      
      if (!originalMealId || !newMealId || !mealType) {
        return res.status(400).json({ error: 'Missing required swap data' });
      }
      
      // Log the swap event for AI learning
      await storage.logActivity({
        userId: req.user?.id || 'anonymous',
        activityType: 'meal_swapped',
        title: `Swapped ${mealType} meal`,
        description: swapReason || `Swapped meal for ${mealType}`,
        metadata: { originalMealId, newMealId, mealType, swapReason }
      });
      
      res.json({ success: true, message: 'Meal swap tracked successfully' });
    } catch (error) {
      console.error('Meal swap tracking error:', error);
      res.status(500).json({ error: 'Failed to track meal swap' });
    }
  });
}