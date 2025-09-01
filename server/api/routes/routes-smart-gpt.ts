import { Router } from 'express';
import { z } from 'zod';
import { verifyJWT, type AuthenticatedRequest } from '../../infrastructure/auth/authService';
import { smartGptService, type SmartGptRequest } from '../../core/smart-gpt/smartGptService';

const router = Router();

// Request validation schemas
const smartGptRequestSchema = z.object({
  action: z.enum(['analyze_trends', 'meal_suggestions', 'health_insights', 'nutrition_coaching', 'recipe_generation']),
  context: z.any().optional(),
  parameters: z.object({
    timeframe: z.enum(['daily', 'weekly', 'monthly']).optional(),
    goalType: z.enum(['weight_loss', 'muscle_gain', 'maintenance', 'performance']).optional(),
    cuisinePreference: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    targetCalories: z.number().optional(),
    targetMacros: z.object({
      protein: z.number(),
      carbs: z.number(),
      fat: z.number()
    }).optional(),
  }).optional(),
});

// Advanced nutrition trend analysis
router.post('/api/smart-gpt/analyze', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedData = smartGptRequestSchema.parse(req.body);
    
    const request: SmartGptRequest = {
      userId,
      ...validatedData
    };

    let response;
    
    switch (validatedData.action) {
      case 'analyze_trends':
        response = await smartGptService.analyzeTrends(request);
        break;
      case 'meal_suggestions':
        response = await smartGptService.generateMealSuggestions(request);
        break;
      case 'health_insights':
        response = await smartGptService.generateHealthInsights(request);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported action type' });
    }
    
    res.json({
      success: true,
      action: validatedData.action,
      ...response
    });

  } catch (error: any) {
    console.error('SmartGPT error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }
    res.status(500).json({
      error: 'SmartGPT analysis temporarily unavailable',
      message: 'Our advanced AI analysis is taking a quick break. Please try again in a moment!'
    });
  }
});

// Real-time meal suggestions with live parameters
router.post('/api/smart-gpt/meals', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { 
      cuisinePreference = ['any'], 
      dietaryRestrictions = [], 
      targetCalories = 2000,
      goalType = 'maintenance' 
    } = req.body;

    const request: SmartGptRequest = {
      userId,
      action: 'meal_suggestions',
      parameters: {
        cuisinePreference,
        dietaryRestrictions,
        targetCalories,
        goalType,
        timeframe: 'daily'
      }
    };

    const response = await smartGptService.generateMealSuggestions(request);
    
    res.json({
      success: true,
      type: 'meal_suggestions',
      ...response,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('SmartGPT meal suggestions error:', error);
    res.status(500).json({
      error: 'Meal suggestions temporarily unavailable'
    });
  }
});

// Advanced health insights with trend analysis
router.post('/api/smart-gpt/insights', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { timeframe = 'weekly' } = req.body;

    const request: SmartGptRequest = {
      userId,
      action: 'health_insights',
      parameters: {
        timeframe: timeframe as 'daily' | 'weekly' | 'monthly'
      }
    };

    const response = await smartGptService.generateHealthInsights(request);
    
    res.json({
      success: true,
      type: 'health_insights',
      timeframe,
      ...response,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('SmartGPT health insights error:', error);
    res.status(500).json({
      error: 'Health insights temporarily unavailable'
    });
  }
});

// Nutrition coaching with personalized parameters
router.post('/api/smart-gpt/coaching', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { 
      goalType = 'maintenance',
      targetMacros,
      focusArea = 'overall_health' 
    } = req.body;

    const request: SmartGptRequest = {
      userId,
      action: 'nutrition_coaching',
      parameters: {
        goalType,
        targetMacros,
        timeframe: 'weekly'
      },
      context: { focusArea }
    };

    const response = await smartGptService.analyzeTrends(request);
    
    res.json({
      success: true,
      type: 'nutrition_coaching',
      ...response,
      coachingFocus: focusArea,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('SmartGPT coaching error:', error);
    res.status(500).json({
      error: 'Nutrition coaching temporarily unavailable'
    });
  }
});

// SmartGPT health check
router.get('/api/smart-gpt/health', (_req, res) => {
  res.json({ 
    ok: true, 
    time: Date.now(),
    service: 'SmartGPT',
    status: 'operational',
    features: ['trend_analysis', 'meal_suggestions', 'health_insights', 'nutrition_coaching']
  });
});

export { router as smartGptRoutes };