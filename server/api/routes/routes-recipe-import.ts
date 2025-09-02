import { Router } from 'express';
import { z } from 'zod';
import { verifyJWT, type AuthenticatedRequest } from '../../infrastructure/auth/authService';
import { recipeImporter, type WebRecipeData } from '../../core/recipes/recipeImporter';

const router = Router();

// Schema for validating web recipe imports
const webRecipeSchema = z.object({
  title: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  cookTime: z.number().optional(),
  prepTime: z.number().optional(),
  servings: z.number().optional(),
  nutrition: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional(),
  }).optional(),
  url: z.string().optional(),
  cuisine: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

const importRecipesSchema = z.object({
  recipes: z.array(webRecipeSchema),
  trainChefAI: z.boolean().default(true),
});

// Import web recipes and train ChefAI
router.post('/api/recipes/import', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedData = importRecipesSchema.parse(req.body);
    
    console.log(`🍳 Starting import of ${validatedData.recipes.length} recipes...`);
    
    // Process recipes with OpenAI
    const processedRecipes = await recipeImporter.importWebRecipes(validatedData.recipes);
    
    // Save to database
    const savedRecipeIds = await recipeImporter.saveRecipesToDatabase(processedRecipes);
    
    // Train ChefAI with new recipes if requested
    if (validatedData.trainChefAI) {
      await recipeImporter.trainChefAIWithRecipes(savedRecipeIds);
    }
    
    res.json({
      success: true,
      imported: savedRecipeIds.length,
      recipeIds: savedRecipeIds,
      processed: processedRecipes.map(r => ({
        name: r.name,
        calories: r.estimatedCalories,
        cuisine: r.cuisine,
        difficulty: r.difficulty,
        nutritionConfidence: r.nutritionConfidence
      })),
      chefAiTrained: validatedData.trainChefAI,
      message: `Successfully imported ${savedRecipeIds.length} recipes and ${validatedData.trainChefAI ? 'trained ChefAI' : 'saved to database'}`
    });

  } catch (error: any) {
    console.error('Recipe import error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid recipe data format',
        details: error.errors
      });
    }
    res.status(500).json({
      error: 'Recipe import failed',
      message: 'Failed to process recipes. Please check the format and try again.'
    });
  }
});

// Import sample recipes for testing
router.post('/api/recipes/import-samples', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('🎯 Importing sample recipes for testing...');
    
    const savedRecipeIds = await recipeImporter.importSampleRecipes();
    
    res.json({
      success: true,
      imported: savedRecipeIds.length,
      recipeIds: savedRecipeIds,
      message: `Successfully imported ${savedRecipeIds.length} sample recipes and trained ChefAI`,
      samples: [
        'Mediterranean Quinoa Bowl - 380 cal, vegetarian',
        'Asian-Style Salmon with Broccoli - 340 cal, high protein'
      ]
    });

  } catch (error: any) {
    console.error('Sample recipe import error:', error);
    res.status(500).json({
      error: 'Sample import failed',
      message: 'Failed to import sample recipes. Please try again.'
    });
  }
});

// Get import status and statistics
router.get('/api/recipes/import-status', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // This would typically get stats from database
    res.json({
      success: true,
      status: {
        totalRecipes: 'checking...',
        lastImport: 'never',
        chefAiTrainingStatus: 'ready',
        supportedFormats: ['JSON', 'recipe URLs', 'structured data'],
        capabilities: [
          'OpenAI nutrition analysis',
          'Dietary tag detection', 
          'Difficulty assessment',
          'Cuisine classification',
          'ChefAI training integration'
        ]
      }
    });

  } catch (error: any) {
    console.error('Import status error:', error);
    res.status(500).json({
      error: 'Failed to get import status'
    });
  }
});

// Health check for recipe import service
router.get('/api/recipes/import-health', (_req, res) => {
  res.json({ 
    ok: true, 
    service: 'Recipe Importer',
    status: 'operational',
    features: [
      'web_recipe_import',
      'openai_enhancement', 
      'nutrition_analysis',
      'chef_ai_training'
    ],
    timestamp: new Date().toISOString()
  });
});

export { router as recipeImportRoutes };