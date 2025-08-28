import type { Express } from "express";
import { createServer, type Server } from "http";
import { chatbotRoutes } from './routes-chatbot';
import { stripeRoutes } from './routes/stripe';
import Stripe from "stripe";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import * as aiService from "./openai";
import { nutritionService } from "./nutritionApi";
import { etlSystem } from "./etl";
import authRoutes from "./authRoutes";
import { analyzeFoodInput, type FoodAnalysisInput } from "./food-analysis-pipeline";
import { generateRecipe, type RecipeGenerationInput } from "./recipe-generation-v2";
import { calculateNutritionScore, type NutritionInput } from "./nutrition-scoring";
import { checkDietCompatibility, type DietCompatibilityInput } from "./diet-compatibility";
import { freemiumMiddleware, type FreemiumRequest } from "./middleware/freemium";

// Stripe setup
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize ETL system
  try {
    await etlSystem.initialize();
    console.log('ETL system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize ETL system:', error);
  }

  // Add cookie parser middleware for JWT tokens
  app.use(cookieParser());

  // Enhanced authentication routes with multi-provider support
  app.use('/api/auth', authRoutes);

  // Legacy auth middleware (keep for backward compatibility)
  await setupAuth(app);

  // Stripe subscription routes
  app.use('/api/stripe', stripeRoutes);

  // Recipe chatbot routes
  app.use(chatbotRoutes);

  // Object storage routes for meal images
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // User profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileData = { ...req.body, userId };
      const profile = await storage.upsertUserProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error saving profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  // Meal logging routes
  app.post('/api/meals/analyze-image-old', isAuthenticated, async (req: any, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: "Image data required" });
      }

      const analysis = await aiService.analyzeFoodImage(imageBase64);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  app.post('/api/meals/analyze-voice', isAuthenticated, async (req: any, res) => {
    try {
      const { audioText } = req.body;
      if (!audioText) {
        return res.status(400).json({ message: "Audio text required" });
      }

      const analysis = await aiService.parseVoiceFood(audioText);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing voice:", error);
      res.status(500).json({ message: "Failed to analyze voice input" });
    }
  });

  // Enhanced food analysis endpoint with deterministic nutrition scoring and diet compatibility
  app.post("/api/analyze-food", isAuthenticated, async (req: any, res) => {
    try {
      const { type, data, ingredients } = req.body;
      const userId = req.user.id;
      
      if (!type || !data) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: type and data"
        });
      }

      // Get user profile for diet preferences
      const userProfile = await storage.getUserProfile(userId);
      
      // Use new enhanced food analysis pipeline
      const analysisInput: FoodAnalysisInput = {
        type: type as 'image' | 'barcode' | 'text',
        data,
        userId,
        userPreferences: {
          diet_preferences: userProfile?.dietPreferences || [],
          allergen_restrictions: userProfile?.allergens || []
        }
      };
      
      const result = await analyzeFoodInput(analysisInput);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Food analysis error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to analyze food",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Nutrition scoring endpoint for testing and demonstration
  app.post("/api/nutrition/score", isAuthenticated, async (req: any, res) => {
    try {
      const nutritionData = req.body;
      
      // Validate required fields
      if (typeof nutritionData.calories !== 'number') {
        return res.status(400).json({
          success: false,
          message: "Calories is required and must be a number"
        });
      }

      const score = calculateNutritionScore(nutritionData);

      res.json({
        success: true,
        score,
        input: nutritionData
      });
    } catch (error) {
      console.error('Nutrition scoring error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to calculate nutrition score",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Diet compatibility check endpoint
  app.post("/api/nutrition/diet-check", isAuthenticated, async (req: any, res) => {
    try {
      const { foods, dietPreferences } = req.body;
      
      if (!foods || !Array.isArray(foods)) {
        return res.status(400).json({
          success: false,
          message: "Foods array is required"
        });
      }

      const compatibility = await checkDietCompatibility({ 
        ingredients: foods.map((f: any) => f.name || f), 
        diet_preferences: dietPreferences || [],
        allergen_restrictions: []
      });

      res.json({
        success: true,
        compatibility
      });
    } catch (error) {
      console.error('Diet compatibility error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to check diet compatibility",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post('/api/meals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { name, mealType, imageUrl, rawText, source, foods, confidence } = req.body;

      // Create meal
      const meal = await storage.createMeal({
        userId,
        name,
        mealType,
        imageUrl,
        rawText,
        source,
        confidence: confidence?.toString(),
      });

      // Create meal items
      for (const food of foods || []) {
        await storage.createMealItem({
          mealId: meal.id,
          name: food.name,
          quantity: food.quantity.toString(),
          unit: food.unit,
          confidence: food.confidence?.toString(),
        });
      }

      // Get user profile for personalized analysis
      const userProfile = await storage.getUserProfile(userId);

      // Estimate nutrition
      const nutrition = await aiService.estimateNutrition(foods || []);
      await storage.createMealNutrition({
        mealId: meal.id,
        calories: nutrition.calories,
        protein: nutrition.protein.toString(),
        carbs: nutrition.carbs.toString(),
        fat: nutrition.fat.toString(),
        fiber: nutrition.fiber?.toString() || "0",
        iron: nutrition.iron?.toString(),
        vitaminC: nutrition.vitaminC?.toString(),
        magnesium: nutrition.magnesium?.toString(),
        vitaminB12: nutrition.vitaminB12?.toString(),
      });

      // Calculate scores
      const nutritionScore = await aiService.calculateNutritionScore(nutrition, foods || []);
      
      const dietCompatibility = userProfile?.dietPreferences 
        ? await aiService.checkDietCompatibility(foods || [], userProfile.dietPreferences)
        : {};

      const allergenAnalysis = userProfile?.allergens
        ? await aiService.analyzeAllergens(foods || [], userProfile.allergens)
        : { isAllergenFree: true, detectedAllergens: [], severity: 'low' as const, warnings: [] };

      let sustainabilityScore = null;
      if (req.user.isPremium) {
        sustainabilityScore = await aiService.calculateSustainabilityScore(foods || []);
      }

      await storage.createMealScore({
        mealId: meal.id,
        nutritionScore: nutritionScore.score,
        nutritionGrade: nutritionScore.grade,
        dietCompatibility: dietCompatibility as any,
        allergenSafety: allergenAnalysis.isAllergenFree ? 'safe' : 'unsafe',
        allergenDetails: allergenAnalysis as any,
        sustainabilityScore: sustainabilityScore?.score?.toString(),
        sustainabilityDetails: sustainabilityScore as any,
      });

      // Update daily aggregate
      const today = new Date();
      const currentAggregate = await storage.getDailyAggregate(userId, today);
      
      await storage.upsertDailyAggregate(userId, today, {
        totalCalories: (currentAggregate?.totalCalories || 0) + nutrition.calories,
        totalProtein: ((parseFloat(currentAggregate?.totalProtein || "0")) + nutrition.protein).toString(),
        totalCarbs: ((parseFloat(currentAggregate?.totalCarbs || "0")) + nutrition.carbs).toString(),
        totalFat: ((parseFloat(currentAggregate?.totalFat || "0")) + nutrition.fat).toString(),
        totalFiber: ((parseFloat(currentAggregate?.totalFiber || "0")) + (nutrition.fiber || 0)).toString(),
        mealCount: (currentAggregate?.mealCount || 0) + 1,
        averageNutritionScore: nutritionScore.score,
        averageNutritionGrade: nutritionScore.grade,
      });

      res.json({ meal, nutrition, scores: nutritionScore });
    } catch (error) {
      console.error("Error creating meal:", error);
      res.status(500).json({ message: "Failed to create meal" });
    }
  });

  // Handle image upload ACL after meal creation
  app.put("/api/meals/image-acl", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const userId = req.user?.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageUrl,
        {
          owner: userId,
          visibility: "private",
        },
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting image ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get meals routes
  app.get('/api/meals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const meals = await storage.getMealsByUserId(userId, 20);
      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.get('/api/meals/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date();
      const meals = await storage.getMealsForDate(userId, today);
      
      // Get detailed data for each meal
      const mealsWithDetails = await Promise.all(
        meals.map(async (meal) => {
          const nutrition = await storage.getMealNutrition(meal.id);
          const scores = await storage.getMealScore(meal.id);
          const items = await storage.getMealItems(meal.id);
          
          return {
            ...meal,
            nutrition,
            scores,
            items,
          };
        })
      );

      res.json(mealsWithDetails);
    } catch (error) {
      console.error("Error fetching today's meals:", error);
      res.status(500).json({ message: "Failed to fetch today's meals" });
    }
  });

  // Daily stats route
  app.get('/api/stats/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date();
      const aggregate = await storage.getDailyAggregate(userId, today);
      res.json(aggregate);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  // Recipe routes
  app.get('/api/recipes', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      const recipes = await storage.getRecipes(user?.isPremium || false, 10);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  // Professional recipe chatbot routes - handles all recipe generation
  app.use(chatbotRoutes);

  // Legacy recipe generation route (replaced by chatbot)
  app.post('/api/recipes/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { cuisine, dietType, preferences } = req.body;
      const user = await storage.getUser(req.user.id);
      
      // Use OpenAI to generate personalized recipes
      const { generateRecipes } = await import("./openai");
      const recipes = await generateRecipes(cuisine, dietType, preferences, user?.isPremium || false);
      
      res.json(recipes);
    } catch (error) {
      console.error("Error generating recipes:", error);
      res.status(500).json({ message: "Failed to generate recipes" });
    }
  });

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

  // Get today's stats
  app.get('/api/stats/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get today's meals and calculate totals
      const todaysMeals = await storage.getMealsForDate(userId, today);
      
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      
      for (const meal of todaysMeals) {
        const nutrition = await storage.getMealNutrition(meal.id);
        if (nutrition) {
          totalCalories += nutrition.calories || 0;
          totalProtein += parseFloat(nutrition.protein || "0");
          totalCarbs += parseFloat(nutrition.carbs || "0");
          totalFat += parseFloat(nutrition.fat || "0");
        }
      }
      
      res.json({
        totalCalories,
        totalProtein: totalProtein.toString(),
        totalCarbs: totalCarbs.toString(),
        totalFat: totalFat.toString(),
        mealsLogged: todaysMeals.length
      });
    } catch (error) {
      console.error("Error fetching today's stats:", error);
      res.status(500).json({ message: "Failed to fetch today's stats" });
    }
  });

  // Get weekly stats
  app.get('/api/stats/weekly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const weekData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayMeals = await storage.getMealsForDate(userId, date);
        let dayCalories = 0;
        
        for (const meal of dayMeals) {
          const nutrition = await storage.getMealNutrition(meal.id);
          if (nutrition) {
            dayCalories += nutrition.calories || 0;
          }
        }
        
        weekData.push({
          date: date.toISOString().split('T')[0],
          totalCalories: dayCalories,
          targetCalories: 2000,
          mealsLogged: dayMeals.length,
          waterIntake: 8, // Default value
          targetWater: 8,
          wellnessScore: Math.min(100, Math.round((dayCalories / 2000) * 100)),
          achievements: dayCalories >= 2000 ? ["Calorie Goal Met"] : []
        });
      }
      
      res.json(weekData);
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  // Get achievement badges
  app.get('/api/achievements/badges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const allMeals = await storage.getMealsByUserId(userId, 100);
      
      const badges = [
        {
          id: "first_meal",
          name: "First Steps",
          description: "Log your first meal",
          icon: "🍽️",
          unlocked: allMeals.length > 0,
          unlockedDate: allMeals.length > 0 ? allMeals[0]?.loggedAt?.toISOString() : undefined
        },
        {
          id: "week_streak",
          name: "Week Warrior",
          description: "Log meals for 7 consecutive days",
          icon: "🔥",
          unlocked: allMeals.length >= 7,
          unlockedDate: allMeals.length >= 7 ? allMeals[6]?.loggedAt?.toISOString() : undefined
        },
        {
          id: "nutrition_expert",
          name: "Nutrition Expert",
          description: "Log 50 meals",
          icon: "🧠",
          unlocked: allMeals.length >= 50,
          unlockedDate: allMeals.length >= 50 ? allMeals[49]?.loggedAt?.toISOString() : undefined
        }
      ];
      
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // Add food item to meal
  app.post('/api/meals/add-item', isAuthenticated, async (req: any, res) => {
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

  // AI Meal Analysis route - WORKING VERSION WITHOUT AUTH
  app.post("/api/meals/analyze-image", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      console.log("Starting food analysis of meal image...");
      
      // Import and use the combined analysis function for better performance
      const { analyzeFoodImageWithNutrition } = await import("./imageAnalysis");
      
      const nutritionAnalysis = await analyzeFoodImageWithNutrition(imageBase64);
      console.log("Food analysis complete:", nutritionAnalysis);
      
      res.json(nutritionAnalysis);
    } catch (error: any) {
      console.error("Meal analysis error:", error);
      res.status(500).json({ error: "Failed to analyze meal image: " + (error?.message || "Unknown error") });
    }
  });

  // Save analyzed meal to database  
  app.post("/api/meals/save", async (req, res) => {
    try {
      // For demo purposes, use a default user ID
      const userId = "demo-user-123";
      const { name, mealType, imageUrl, foods, nutrition } = req.body;

      if (!name || !foods || !nutrition) {
        return res.status(400).json({ error: "Missing required meal data" });
      }

      // Create meal
      const mealData = {
        userId,
        name,
        mealType: mealType || 'lunch',
        imageUrl,
        source: 'photo',
        confidence: (foods.reduce((sum: number, food: any) => sum + food.confidence, 0) / foods.length || 0.8).toString()
      };

      const meal = await storage.createMeal(mealData);

      // Add meal items
      for (const food of foods) {
        await storage.createMealItem({
          mealId: meal.id,
          name: food.name,
          quantity: food.quantity.toString(),
          unit: food.unit,
          confidence: food.confidence?.toString() || "0.8"
        });
      }

      // Add nutrition data
      await storage.createMealNutrition({
        mealId: meal.id,
        calories: nutrition.total_calories,
        protein: nutrition.total_protein.toString(),
        carbs: nutrition.total_carbs.toString(),
        fat: nutrition.total_fat.toString(),
        fiber: nutrition.detailed_nutrition?.fiber?.toString() || null,
        vitaminC: nutrition.detailed_nutrition?.vitamin_c?.toString() || null
      });

      console.log("Meal saved successfully:", meal.id);
      res.json({ success: true, mealId: meal.id });
    } catch (error) {
      console.error("Error saving meal:", error);
      res.status(500).json({ error: "Failed to save meal" });
    }
  });

  // Get recent meals for the user
  app.get("/api/meals/recent", async (req, res) => {
    try {
      // For demo purposes, use a default user ID  
      const userId = "demo-user-123";
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

  // Enhanced nutrition search endpoints using ETL system
  
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

      const result = await etlSystem.calculateNutrition(
        ingredientId, 
        quantity, 
        unit, 
        context, 
        preparation
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Error calculating nutrition:", error);
      res.status(500).json({ message: "Failed to calculate nutrition: " + error.message });
    }
  });

  // Legacy nutrition estimation for backward compatibility
  app.post('/api/nutrition/estimate', async (req, res) => {
    try {
      const { foodName, quantity, unit } = req.body;
      
      if (!foodName || !quantity || !unit) {
        return res.status(400).json({ 
          message: "foodName, quantity, and unit are required" 
        });
      }

      // Try our ETL system first by searching for the ingredient
      try {
        const searchResults = await nutritionService.searchByText(foodName);
        if (searchResults.length > 0 && 'id' in searchResults[0]) {
          // Use the first result and calculate nutrition
          const result = await etlSystem.calculateNutrition(
            (searchResults[0] as any).id,
            quantity,
            unit
          );
          return res.json(result);
        }
      } catch (error) {
        console.log('ETL nutrition calculation failed, using legacy:', error);
      }

      // Fallback to legacy system
      const result = await nutritionService.estimateNutrition(foodName, quantity, unit);
      
      if (result) {
        // Queue this ingredient for discovery in our ETL system
        await etlSystem.discoverIngredient(foodName, 'nutrition_estimation');
        res.json(result);
      } else {
        res.status(404).json({ message: "Could not estimate nutrition for this food" });
      }
    } catch (error) {
      console.error("Error estimating nutrition:", error);
      res.status(500).json({ message: "Failed to estimate nutrition" });
    }
  });

  // Batch nutrition lookup for multiple foods
  app.post('/api/nutrition/batch', async (req, res) => {
    try {
      const { foods } = req.body;
      
      if (!Array.isArray(foods)) {
        return res.status(400).json({ message: "foods array is required" });
      }

      const results = await Promise.allSettled(
        foods.map(async (food) => {
          if (food.barcode) {
            return await nutritionService.searchByBarcode(food.barcode);
          } else if (food.name) {
            const searchResults = await nutritionService.searchByText(food.name);
            return searchResults[0] || null;
          }
          return null;
        })
      );

      const processedResults = results.map((result, index) => ({
        index,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }));

      res.json(processedResults);
    } catch (error) {
      console.error("Error in batch nutrition lookup:", error);
      res.status(500).json({ message: "Failed to process batch nutrition lookup" });
    }
  });

  // Legacy barcode endpoint for backward compatibility
  app.get('/api/barcode/:barcode', async (req, res) => {
    try {
      const { barcode } = req.params;
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1) {
        const product = data.product;
        res.json({
          name: product.product_name || product.product_name_en,
          brand: product.brands,
          nutrition: product.nutriments,
          ingredients: product.ingredients_text,
          image: product.image_url,
        });
      } else {
        res.status(404).json({ message: "Product not found" });
      }
    } catch (error) {
      console.error("Error looking up barcode:", error);
      res.status(500).json({ message: "Failed to lookup barcode" });
    }
  });

  // Stripe subscription route
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    const user = req.user;

    if (user.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      const latestInvoice = subscription.latest_invoice as any;
      res.send({
        subscriptionId: subscription.id,
        clientSecret: latestInvoice?.payment_intent?.client_secret,
      });
      return;
    }
    
    if (!user.email) {
      throw new Error('No user email on file');
    }

    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID, // Premium subscription price ID
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, customer.id, subscription.id);
  
      const latestInvoice = subscription.latest_invoice as any;
      res.send({
        subscriptionId: subscription.id,
        clientSecret: latestInvoice?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Stripe subscription error:', error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // ETL System Administration Routes (for monitoring)
  app.get('/api/admin/etl/status', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow premium users to access ETL status
      if (!req.user.isPremium) {
        return res.status(403).json({ message: "Premium subscription required" });
      }

      const status = await etlSystem.getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching ETL status:", error);
      res.status(500).json({ message: "Failed to fetch ETL status" });
    }
  });

  app.post('/api/admin/etl/discover', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow premium users to manually trigger discovery
      if (!req.user.isPremium) {
        return res.status(403).json({ message: "Premium subscription required" });
      }

      const { ingredientName } = req.body;
      if (!ingredientName) {
        return res.status(400).json({ message: "ingredientName is required" });
      }

      await etlSystem.discoverIngredient(ingredientName, 'manual_admin');
      res.json({ message: "Ingredient queued for discovery", ingredientName });
    } catch (error) {
      console.error("Error queuing ingredient discovery:", error);
      res.status(500).json({ message: "Failed to queue ingredient discovery" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
