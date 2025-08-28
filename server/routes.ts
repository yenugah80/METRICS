import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import * as aiService from "./openai";
import { nutritionService } from "./nutritionApi";

// Stripe setup
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes are now handled in the auth module automatically

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
  app.post('/api/meals/analyze-image', isAuthenticated, async (req: any, res) => {
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

  // Enhanced nutrition search endpoints using multiple APIs
  
  // Barcode lookup using comprehensive nutrition APIs
  app.get('/api/nutrition/barcode/:barcode', isAuthenticated, async (req, res) => {
    try {
      const { barcode } = req.params;
      const result = await nutritionService.searchByBarcode(barcode);
      
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ message: "Product not found" });
      }
    } catch (error) {
      console.error("Error looking up barcode:", error);
      res.status(500).json({ message: "Failed to lookup barcode" });
    }
  });

  // Text-based food search using multiple nutrition APIs
  app.get('/api/nutrition/search', isAuthenticated, async (req, res) => {
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

  // Nutrition estimation for foods with quantity and unit
  app.post('/api/nutrition/estimate', isAuthenticated, async (req, res) => {
    try {
      const { foodName, quantity, unit } = req.body;
      
      if (!foodName || !quantity || !unit) {
        return res.status(400).json({ 
          message: "foodName, quantity, and unit are required" 
        });
      }

      const result = await nutritionService.estimateNutrition(foodName, quantity, unit);
      
      if (result) {
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
  app.post('/api/nutrition/batch', isAuthenticated, async (req, res) => {
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
      res.send({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
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
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Stripe subscription error:', error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
