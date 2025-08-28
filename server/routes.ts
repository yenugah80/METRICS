import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import compression from "compression";
import { chatbotRoutes } from './routes-chatbot';
import { stripeRoutes } from './routes/stripe';
import Stripe from "stripe";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { verifyJWT, type AuthenticatedRequest } from "./authService";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import * as aiService from "./openai";
import { nutritionService } from "./deterministicNutrition";
import { nutritionService as legacyNutritionService } from "./nutritionApi";
import { etlSystem } from "./etl";
import authRoutes from "./authRoutes";
import { analyzeFoodInput, type FoodAnalysisInput } from "./food-analysis-pipeline";
import { generateRecipe, type RecipeGenerationInput } from "./recipe-generation-v2";
import { calculateNutritionScore, type NutritionInput } from "./nutrition-scoring";
import { checkDietCompatibility, type DietCompatibilityInput } from "./diet-compatibility";
import { freemiumMiddleware, type FreemiumRequest } from "./middleware/freemium";
import { db } from "./performance/database";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { recommendationRoutes } from "./routes/recommendations";
import { registerRecipeRoutes } from "./routes-recipes";

// Security and Performance Imports
import { 
  securityHeaders, 
  generalRateLimit, 
  authRateLimit, 
  apiRateLimit, 
  validateRequest,
  validateContentType,
  secureErrorResponse,
  logSecurityEvent 
} from "./security/security";
import { logger, PerformanceMonitor } from "./logging/logger";
import { getCacheHealthStatus } from "./performance/cache";

// Stripe setup
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // SECURITY & PERFORMANCE MIDDLEWARE
  // Configure trust proxy for rate limiting
  app.set('trust proxy', 1);
  
  // Apply compression for better performance
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
  }));

  // Security headers
  app.use(securityHeaders);

  // Request logging with performance monitoring
  app.use(logger.requestLogger());

  // Content type validation for POST/PUT requests
  app.use('/api', validateContentType('application/json'));

  // Rate limiting
  app.use('/api/auth', authRateLimit);
  app.use('/api', apiRateLimit);
  app.use(generalRateLimit);

  // Add cookie parser middleware for JWT tokens
  app.use(cookieParser());

  // Initialize ETL system with proper error handling
  try {
    PerformanceMonitor.start('etl-initialization');
    await etlSystem.initialize();
    PerformanceMonitor.end('etl-initialization');
    logger.info('ETL system initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize ETL system', error);
  }

  // Health monitoring endpoints
  app.get('/health', async (req, res) => {
    const { healthCheck } = await import('./health/monitoring');
    await healthCheck(req, res);
  });
  
  app.get('/health/live', async (req, res) => {
    const { livenessProbe } = await import('./health/monitoring');
    livenessProbe(req, res);
  });
  
  app.get('/health/ready', async (req, res) => {
    const { readinessProbe } = await import('./health/monitoring');
    await readinessProbe(req, res);
  });
  
  app.get('/metrics', async (req, res) => {
    const { metricsEndpoint } = await import('./health/monitoring');
    metricsEndpoint(req, res);
  });

  // Enhanced authentication routes with multi-provider support
  app.use('/api/auth', authRoutes);

  // Stripe subscription routes
  app.use('/api/stripe', stripeRoutes);

  // Recipe chatbot routes with freemium middleware
  app.use('/api/chatbot', freemiumMiddleware);
  app.use(chatbotRoutes);

  // Premium upgrade endpoint
  app.post('/api/upgrade-premium', verifyJWT, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create Stripe checkout session for premium subscription
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'MyFoodMatrics Premium',
                description: 'Unlimited AI recipe generation, advanced nutrition insights, and premium features',
              },
              unit_amount: 699, // $6.99/month
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${req.protocol}://${req.get('host')}/recipes?upgraded=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/recipes?upgrade=cancelled`,
        customer_email: user.email,
        metadata: {
          userId: userId,
        },
      });

      res.json({ checkoutUrl: session.url });
    } catch (error) {
      logger.error('Premium upgrade error', error, req);
      res.status(500).json(secureErrorResponse(error, req));
    }
  });

  // Stripe webhook to handle successful subscriptions
  app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET || 'placeholder');
    } catch (err: any) {
      logger.security('Stripe webhook signature verification failed', { error: err.message }, req);
      return res.status(400).send(`Webhook Error: Invalid signature`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        if (session.metadata?.userId) {
          try {
            // Update user to premium
            await db
              .update(users)
              .set({ 
                isPremium: true,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                updatedAt: new Date()
              })
              .where(eq(users.id, session.metadata.userId));
            
            logger.payment('User upgraded to premium', { userId: session.metadata.userId }, req);
          } catch (error) {
            logger.error('Error upgrading user to premium', error, req);
          }
        }
        break;
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        try {
          // Downgrade user from premium
          await db
            .update(users)
            .set({ 
              isPremium: false,
              updatedAt: new Date()
            })
            .where(eq(users.stripeSubscriptionId, subscription.id));
          
          logger.payment('User downgraded from premium', {}, req);
        } catch (error) {
          logger.error('Error downgrading user from premium', error, req);
        }
        break;
      default:
        logger.warn('Unhandled Stripe event type', { eventType: event.type }, req);
    }

    res.json({received: true});
  });

  // Get current user usage stats endpoint
  app.get('/api/usage-stats', verifyJWT, freemiumMiddleware, async (req: AuthenticatedRequest, res) => {
    res.json({
      usageStats: req.usageStats || {
        recipesGenerated: 0,
        remainingFree: 5,
        isPremium: false
      }
    });
  });

  // Comprehensive recipe system routes
  registerRecipeRoutes(app);

  // Meal recommendation routes
  app.use('/api/recommendations', recommendationRoutes);

  // Object storage routes for meal images
  app.get("/objects/:objectPath(*)", verifyJWT, async (req: AuthenticatedRequest, res) => {
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
      logger.error('Error checking object access', error, req);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", verifyJWT, async (req: AuthenticatedRequest, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // User profile routes
  app.get('/api/profile', verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      logger.error('Error fetching profile', error, req);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileData = { ...req.body, userId };
      const profile = await storage.upsertUserProfile(profileData);
      res.json(profile);
    } catch (error) {
      logger.error('Error saving profile', error, req);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  // PUT route for profile updates (used by ProfileManagement component)
  app.put('/api/profile', verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileData = { ...req.body, userId };
      const profile = await storage.upsertUserProfile(profileData);
      res.json(profile);
    } catch (error) {
      logger.error('Error updating profile', error, req);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Meal logging routes
  app.post('/api/meals/analyze-image-old', verifyJWT, async (req: any, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: "Image data required" });
      }

      // First get food analysis from AI
      const foodAnalysis = await aiService.analyzeFoodImage(imageBase64);
      
      // Then get deterministic nutrition data
      const foods = foodAnalysis.foods || [];
      const nutritionResult = await nutritionService.calculateNutrition(foods);
      const nutritionScore = nutritionService.calculateNutritionScore(nutritionResult.total_nutrition, foods.map(f => f.name));
      const dietCompatibility = nutritionService.checkDietCompatibility(foods.map(f => f.name), nutritionResult.total_nutrition);
      
      // Combine AI analysis with deterministic nutrition
      const result = {
        foods: nutritionResult.foods,
        total_calories: nutritionResult.total_nutrition.calories,
        total_protein: nutritionResult.total_nutrition.protein,
        total_carbs: nutritionResult.total_nutrition.carbs,
        total_fat: nutritionResult.total_nutrition.fat,
        detailed_nutrition: {
          saturated_fat: nutritionResult.total_nutrition.saturatedFat,
          fiber: nutritionResult.total_nutrition.fiber,
          sugar: nutritionResult.total_nutrition.sugar,
          sodium: nutritionResult.total_nutrition.sodium,
          cholesterol: 0,
          vitamin_c: nutritionResult.total_nutrition.vitaminC,
          iron: nutritionResult.total_nutrition.iron,
          calcium: 150,
          magnesium: nutritionResult.total_nutrition.magnesium
        },
        health_suggestions: [
          `Accurate image analysis with ${nutritionResult.data_sources.join(', ')} nutrition data`,
          nutritionScore.explanation
        ],
        nutrition_score: nutritionScore,
        diet_compatibility: dietCompatibility,
        confidence_score: nutritionResult.confidence_score,
        data_sources: nutritionResult.data_sources
      };
      
      res.json(result);
    } catch (error) {
      logger.error('Error analyzing image', error, req);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  app.post('/api/meals/analyze-voice', verifyJWT, async (req: any, res) => {
    try {
      const { audioText } = req.body;
      if (!audioText) {
        return res.status(400).json({ message: "Audio text required" });
      }

      // Check if user has premium access for voice features
      const user = await storage.getUser(req.user.id);
      if (!user?.isPremium) {
        return res.status(403).json({ 
          message: "Voice logging is available for Premium users only. Upgrade to unlock this feature." 
        });
      }

      // First get food analysis from AI  
      const foodAnalysis = await aiService.parseVoiceFood(audioText);
      
      // Then get deterministic nutrition data
      const foods = foodAnalysis.foods || [];
      const nutritionResult = await nutritionService.calculateNutrition(foods);
      const nutritionScore = nutritionService.calculateNutritionScore(nutritionResult.total_nutrition, foods.map(f => f.name));
      const dietCompatibility = nutritionService.checkDietCompatibility(foods.map(f => f.name), nutritionResult.total_nutrition);
      
      // Combine AI analysis with deterministic nutrition
      const result = {
        foods: nutritionResult.foods,
        total_calories: nutritionResult.total_nutrition.calories,
        total_protein: nutritionResult.total_nutrition.protein,
        total_carbs: nutritionResult.total_nutrition.carbs,
        total_fat: nutritionResult.total_nutrition.fat,
        detailed_nutrition: {
          saturated_fat: nutritionResult.total_nutrition.saturatedFat,
          fiber: nutritionResult.total_nutrition.fiber,
          sugar: nutritionResult.total_nutrition.sugar,
          sodium: nutritionResult.total_nutrition.sodium,
          cholesterol: 0,
          vitamin_c: nutritionResult.total_nutrition.vitaminC,
          iron: nutritionResult.total_nutrition.iron,
          calcium: 150,
          magnesium: nutritionResult.total_nutrition.magnesium
        },
        health_suggestions: [
          `Premium voice analysis with ${nutritionResult.data_sources.join(', ')} nutrition data`,
          nutritionScore.explanation
        ],
        nutrition_score: nutritionScore,
        diet_compatibility: dietCompatibility,
        confidence_score: nutritionResult.confidence_score,
        data_sources: nutritionResult.data_sources
      };
      
      res.json(result);
    } catch (error) {
      logger.error('Error analyzing voice', error, req);
      res.status(500).json({ message: "Failed to analyze voice input" });
    }
  });

  // Text analysis endpoint for meal descriptions
  app.post('/api/meals/analyze-text', verifyJWT, async (req: any, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text description required" });
      }

      // First get food analysis from AI
      const foodAnalysis = await aiService.parseVoiceFood(text);
      
      // Then get deterministic nutrition data
      const foods = foodAnalysis.foods || [];
      const nutritionResult = await nutritionService.calculateNutrition(foods);
      const nutritionScore = nutritionService.calculateNutritionScore(nutritionResult.total_nutrition, foods.map(f => f.name));
      const dietCompatibility = nutritionService.checkDietCompatibility(foods.map(f => f.name), nutritionResult.total_nutrition);
      
      // Combine AI analysis with deterministic nutrition
      const result = {
        foods: nutritionResult.foods,
        total_calories: nutritionResult.total_nutrition.calories,
        total_protein: nutritionResult.total_nutrition.protein,
        total_carbs: nutritionResult.total_nutrition.carbs,
        total_fat: nutritionResult.total_nutrition.fat,
        detailed_nutrition: {
          saturated_fat: nutritionResult.total_nutrition.saturatedFat,
          fiber: nutritionResult.total_nutrition.fiber,
          sugar: nutritionResult.total_nutrition.sugar,
          sodium: nutritionResult.total_nutrition.sodium,
          cholesterol: 0,
          vitamin_c: nutritionResult.total_nutrition.vitaminC,
          iron: nutritionResult.total_nutrition.iron,
          calcium: 150,
          magnesium: nutritionResult.total_nutrition.magnesium
        },
        health_suggestions: [
          `High confidence nutrition data from ${nutritionResult.data_sources.join(', ')}`,
          nutritionScore.explanation
        ],
        nutrition_score: nutritionScore,
        diet_compatibility: dietCompatibility,
        confidence_score: nutritionResult.confidence_score,
        data_sources: nutritionResult.data_sources
      };
      
      res.json(result);
    } catch (error) {
      logger.error('Error analyzing text', error, req);
      res.status(500).json({ message: "Failed to analyze text description" });
    }
  });

  // Enhanced food analysis endpoint with deterministic nutrition scoring and diet compatibility
  app.post("/api/analyze-food", verifyJWT, async (req: any, res) => {
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
      logger.error('Food analysis error', error, req);
      res.status(500).json({
        success: false,
        message: "Failed to analyze food",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Nutrition scoring endpoint for testing and demonstration
  app.post("/api/nutrition/score", verifyJWT, async (req: any, res) => {
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
      logger.error('Nutrition scoring error', error, req);
      res.status(500).json({
        success: false,
        message: "Failed to calculate nutrition score",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Diet compatibility check endpoint
  app.post("/api/nutrition/diet-check", verifyJWT, async (req: any, res) => {
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
      logger.error('Diet compatibility error', error, req);
      res.status(500).json({
        success: false,
        message: "Failed to check diet compatibility",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // User profile management endpoints
  app.get('/api/profile', verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getUserProfile(userId);
      
      res.json({
        success: true,
        profile: profile || {
          dietPreferences: [],
          allergens: [],
          dailyCalorieTarget: 2000,
          dailyProteinTarget: 150,
          dailyCarbTarget: 250,
          dailyFatTarget: 80
        }
      });
    } catch (error) {
      logger.error('Error fetching user profile', error, req);
      res.status(500).json({
        success: false,
        message: "Failed to fetch profile"
      });
    }
  });

  app.post('/api/profile', verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { dietPreferences, allergens, dailyCalorieTarget, dailyProteinTarget, dailyCarbTarget, dailyFatTarget } = req.body;
      
      await storage.upsertUserProfile({
        userId,
        dietPreferences: dietPreferences || [],
        allergens: allergens || [],
        dailyCalorieTarget: dailyCalorieTarget || 2000,
        dailyProteinTarget: dailyProteinTarget || 150,
        dailyCarbTarget: dailyCarbTarget || 250,
        dailyFatTarget: dailyFatTarget || 80
      });
      
      res.json({
        success: true,
        message: "Profile updated successfully"
      });
    } catch (error) {
      logger.error('Error updating user profile', error, req);
      res.status(500).json({
        success: false,
        message: "Failed to update profile"
      });
    }
  });

  app.post('/api/meals', verifyJWT, async (req: any, res) => {
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
      logger.error('Error creating meal', error, req);
      res.status(500).json({ message: "Failed to create meal" });
    }
  });

  // Handle image upload ACL after meal creation
  app.put("/api/meals/image-acl", verifyJWT, async (req: any, res) => {
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
      logger.error('Error setting image ACL', error, req);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get meals routes
  app.get('/api/meals', verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const meals = await storage.getMealsByUserId(userId, 20);
      res.json(meals);
    } catch (error) {
      logger.error('Error fetching meals', error, req);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.get('/api/meals/today', verifyJWT, async (req: any, res) => {
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
  app.get('/api/stats/today', verifyJWT, async (req: any, res) => {
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
  app.get('/api/recipes', verifyJWT, async (req: any, res) => {
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
  app.post('/api/recipes/generate', verifyJWT, async (req: any, res) => {
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
  app.get('/api/stats/today-detailed', verifyJWT, async (req: any, res) => {
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

  // Calculate comprehensive wellness score based on nutrition quality, not just calories
  async function calculateWellnessScore(dayMeals: any[], dayCalories: number): Promise<number> {
    if (dayMeals.length === 0) return 0;
    
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    
    // Calculate total macros from all meals
    for (const meal of dayMeals) {
      const nutrition = await storage.getMealNutrition(meal.id);
      if (nutrition) {
        totalProtein += nutrition.protein || 0;
        totalCarbs += nutrition.carbs || 0;
        totalFat += nutrition.fat || 0;
        totalFiber += nutrition.fiber || 0;
      }
    }
    
    let score = 0;
    
    // 1. Calorie balance score (40% of total score)
    const calorieTarget = 2000;
    const calorieRatio = dayCalories / calorieTarget;
    if (calorieRatio >= 0.8 && calorieRatio <= 1.2) {
      score += 40; // Perfect range
    } else if (calorieRatio >= 0.6 && calorieRatio <= 1.4) {
      score += 30; // Good range
    } else if (calorieRatio >= 0.4 && calorieRatio <= 1.6) {
      score += 20; // Acceptable range
    } else {
      score += 10; // Outside healthy range
    }
    
    // 2. Macro balance score (30% of total score)
    const totalMacros = totalProtein + totalCarbs + totalFat;
    if (totalMacros > 0) {
      const proteinPct = (totalProtein * 4) / (dayCalories || 1);
      const carbsPct = (totalCarbs * 4) / (dayCalories || 1);
      const fatPct = (totalFat * 9) / (dayCalories || 1);
      
      // Ideal ranges: Protein 15-25%, Carbs 45-65%, Fat 20-35%
      let macroScore = 0;
      if (proteinPct >= 0.15 && proteinPct <= 0.25) macroScore += 10;
      else if (proteinPct >= 0.10 && proteinPct <= 0.30) macroScore += 7;
      else macroScore += 3;
      
      if (carbsPct >= 0.45 && carbsPct <= 0.65) macroScore += 10;
      else if (carbsPct >= 0.35 && carbsPct <= 0.75) macroScore += 7;
      else macroScore += 3;
      
      if (fatPct >= 0.20 && fatPct <= 0.35) macroScore += 10;
      else if (fatPct >= 0.15 && fatPct <= 0.40) macroScore += 7;
      else macroScore += 3;
      
      score += macroScore;
    }
    
    // 3. Meal frequency score (20% of total score)
    if (dayMeals.length >= 3) {
      score += 20; // 3+ meals is ideal
    } else if (dayMeals.length === 2) {
      score += 15; // 2 meals is good
    } else if (dayMeals.length === 1) {
      score += 10; // 1 meal is okay
    }
    
    // 4. Fiber intake bonus (10% of total score)
    if (totalFiber >= 25) {
      score += 10; // Excellent fiber intake
    } else if (totalFiber >= 18) {
      score += 7; // Good fiber intake
    } else if (totalFiber >= 10) {
      score += 5; // Moderate fiber intake
    } else {
      score += 2; // Low fiber intake
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }
  
  // Generate achievements based on real data
  function generateAchievements(dayCalories: number, mealsLogged: number, wellnessScore: number): string[] {
    const achievements: string[] = [];
    
    if (mealsLogged >= 1) achievements.push("Meal Logger");
    if (mealsLogged >= 3) achievements.push("Three Square Meals");
    if (dayCalories >= 1800 && dayCalories <= 2200) achievements.push("Calorie Balance Master");
    if (wellnessScore >= 80) achievements.push("Wellness Champion");
    else if (wellnessScore >= 60) achievements.push("Health Conscious");
    if (dayCalories > 0 && mealsLogged > 0) achievements.push("Nutrition Tracker");
    
    return achievements;
  }

  // Get weekly stats
  app.get('/api/stats/weekly', verifyJWT, async (req: any, res) => {
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
        
        // Calculate real wellness score based on nutritional quality
        const wellnessScore = await calculateWellnessScore(dayMeals, dayCalories);
        
        weekData.push({
          date: date.toISOString().split('T')[0],
          totalCalories: dayCalories,
          targetCalories: 2000,
          mealsLogged: dayMeals.length,
          waterIntake: 8, // TODO: Track real water intake
          targetWater: 8,
          wellnessScore: wellnessScore,
          achievements: generateAchievements(dayCalories, dayMeals.length, wellnessScore)
        });
      }
      
      res.json(weekData);
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  // Get achievement badges
  app.get('/api/achievements/badges', verifyJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const allMeals = await storage.getMealsByUserId(userId, 100);
      
      // Calculate real stats for badges
      let totalCalories = 0;
      let totalDays = 0;
      let wellnessScores: number[] = [];
      
      // Get recent meals data for calculations
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayMeals = await storage.getMealsForDate(userId, date);
        let dayCalories = 0;
        
        for (const meal of dayMeals) {
          const nutrition = await storage.getMealNutrition(meal.id);
          if (nutrition) {
            dayCalories += nutrition.calories || 0;
          }
        }
        
        if (dayMeals.length > 0) {
          totalDays++;
          totalCalories += dayCalories;
          const dayWellnessScore = await calculateWellnessScore(dayMeals, dayCalories);
          wellnessScores.push(dayWellnessScore);
        }
      }
      
      const avgWellnessScore = wellnessScores.length > 0 ? 
        wellnessScores.reduce((a, b) => a + b, 0) / wellnessScores.length : 0;
      
      const badges = [
        {
          id: "first_meal",
          name: "First Steps",
          description: "Log your first meal",
          icon: "⭐",
          unlocked: allMeals.length > 0,
          unlockedDate: allMeals.length > 0 ? allMeals[0]?.loggedAt?.toISOString().split('T')[0] : undefined
        },
        {
          id: "calorie_tracker",
          name: "Calorie Tracker", 
          description: "Track calories for your health",
          icon: "🏆",
          unlocked: totalCalories > 0,
          unlockedDate: totalCalories > 0 ? new Date().toISOString().split('T')[0] : undefined
        },
        {
          id: "hydration_hero",
          name: "Hydration Hero",
          description: "Meet water intake goal",
          icon: "💧",
          unlocked: false, // Will be true when water tracking is implemented
          unlockedDate: undefined
        },
        {
          id: "nutrition_ninja",
          name: "Nutrition Ninja",
          description: "Analyze food with smart camera",
          icon: "⚡",
          unlocked: allMeals.length >= 3,
          unlockedDate: allMeals.length >= 3 ? allMeals[2]?.loggedAt?.toISOString().split('T')[0] : undefined
        },
        {
          id: "goal_crusher",
          name: "Goal Crusher",
          description: "Meet daily calorie goals",
          icon: "🎯",
          unlocked: avgWellnessScore >= 60,
          unlockedDate: avgWellnessScore >= 60 ? new Date().toISOString().split('T')[0] : undefined
        }
      ];
      
      res.json(badges);
    } catch (error) {
      console.error("Error fetching achievement badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
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

  // AI Meal Analysis route - NOW WITH PROPER USER DIET PREFERENCES
  app.post("/api/meals/analyze-image", verifyJWT, async (req: any, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      console.log("Starting food analysis of meal image...");
      
      // Get user profile to check diet preferences
      const userId = req.user.id;
      const userProfile = await storage.getUserProfile(userId);
      const dietPreferences = userProfile?.dietPreferences || [];
      
      console.log(`User diet preferences: ${dietPreferences.length > 0 ? dietPreferences.join(', ') : 'none set'}`);
      
      // Import and use the combined analysis function with user preferences
      const { analyzeFoodImageWithNutrition } = await import("./imageAnalysis");
      
      const nutritionAnalysis = await analyzeFoodImageWithNutrition(imageBase64, dietPreferences);
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
      // Use authenticated user ID instead of demo user
      const userId = req.user.id;
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

      // Update daily aggregates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get current daily totals
      const todaysMeals = await storage.getMealsForDate(userId, today);
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      
      for (const mealRecord of todaysMeals) {
        const mealNutrition = await storage.getMealNutrition(mealRecord.id);
        if (mealNutrition) {
          totalCalories += mealNutrition.calories || 0;
          totalProtein += parseFloat(mealNutrition.protein || "0");
          totalCarbs += parseFloat(mealNutrition.carbs || "0");
          totalFat += parseFloat(mealNutrition.fat || "0");
        }
      }
      
      // Update daily aggregate
      await storage.upsertDailyAggregate(userId, today, {
        totalCalories,
        totalProtein: totalProtein.toString(),
        totalCarbs: totalCarbs.toString(),
        totalFat: totalFat.toString(),
        mealCount: todaysMeals.length,
        averageNutritionScore: nutrition.nutrition_score?.score || 0,
        averageNutritionGrade: nutrition.nutrition_score?.grade || "C"
      });

      console.log("Meal saved successfully:", meal.id);
      res.json({ success: true, mealId: meal.id });
    } catch (error) {
      console.error("Error saving meal:", error);
      res.status(500).json({ error: "Failed to save meal" });
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
  app.post('/api/create-subscription', verifyJWT, async (req: any, res) => {
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
  app.get('/api/admin/etl/status', verifyJWT, async (req: any, res) => {
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

  app.post('/api/admin/etl/discover', verifyJWT, async (req: any, res) => {
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
