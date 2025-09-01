import { Router } from 'express';
import { z } from 'zod';
import { verifyJWT, type AuthenticatedRequest } from '../../infrastructure/auth/authService';
import { dietPlanService, type DietPlanQuestionnaire } from '../../core/diet-plans/dietPlanService';
import { targetCalculator } from '../../core/nutrition/targetCalculator';

const router = Router();

// Questionnaire schema for validation
const questionnaireSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(13).max(120),
    gender: z.enum(['male', 'female', 'other']),
    height: z.number().min(100).max(250), // cm
    weight: z.number().min(30).max(300), // kg
  }),
  healthGoals: z.array(z.string()).min(1),
  lifestyle: z.array(z.string()),
  foodPreferences: z.array(z.string()).min(1),
  restrictions: z.array(z.string()),
  eatingSchedule: z.array(z.string()).min(1),
  dietPreparation: z.array(z.string()),
  physicalActivity: z.array(z.string()),
  supplements: z.boolean(),
  currentDiet: z.array(z.string()),
});

// Generate new diet plan from questionnaire
router.post('/api/diet-plans/generate', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Diet Plans are now available to all users
    // Premium subscription checks removed for better user experience

    const questionnaire = questionnaireSchema.parse(req.body);
    
    const dietPlan = await dietPlanService.generateDietPlan(userId, questionnaire);
    
    res.json({
      success: true,
      dietPlan,
      message: 'Your personalized 28-day diet plan has been created!'
    });
  } catch (error: any) {
    console.error('Error generating diet plan:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid questionnaire data',
        details: error.errors
      });
    }
    res.status(500).json({
      error: 'Failed to generate diet plan',
      message: 'Something went wrong while creating your plan. Please try again.'
    });
  }
});

// Get user's active diet plan
router.get('/api/diet-plans/active', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const activePlan = await dietPlanService.getActiveDietPlan(userId);
    
    if (!activePlan) {
      return res.json({
        success: true,
        hasPlan: false,
        message: 'No active diet plan found. Create one to get personalized meal recommendations!'
      });
    }

    res.json({
      success: true,
      hasPlan: true,
      dietPlan: activePlan
    });
  } catch (error: any) {
    console.error('Error fetching active diet plan:', error);
    res.status(500).json({
      error: 'Failed to fetch diet plan'
    });
  }
});

// Get diet plan meals for specific day
router.get('/api/diet-plans/:planId/meals/:day', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { planId, day } = req.params;
    const dayNumber = parseInt(day);
    
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 28) {
      return res.status(400).json({ error: 'Invalid day. Must be between 1 and 28.' });
    }

    const meals = await dietPlanService.getDietPlanMealsForDay(planId, dayNumber);
    
    // Group meals by meal type and option
    const groupedMeals = meals.reduce((acc, meal) => {
      const key = meal.mealType;
      if (!acc[key]) acc[key] = {};
      acc[key][`option${meal.option}`] = meal;
      return acc;
    }, {} as Record<string, Record<string, any>>);

    res.json({
      success: true,
      day: dayNumber,
      meals: groupedMeals
    });
  } catch (error: any) {
    console.error('Error fetching diet plan meals:', error);
    res.status(500).json({
      error: 'Failed to fetch meals for day'
    });
  }
});

// Get diet plan supplements
router.get('/api/diet-plans/:planId/supplements', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { planId } = req.params;
    const supplements = await dietPlanService.getDietPlanSupplements(planId);
    
    res.json({
      success: true,
      supplements
    });
  } catch (error: any) {
    console.error('Error fetching diet plan supplements:', error);
    res.status(500).json({
      error: 'Failed to fetch supplements'
    });
  }
});

// Get diet plan lifestyle recommendations
router.get('/api/diet-plans/:planId/lifestyle', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { planId } = req.params;
    const lifestyle = await dietPlanService.getDietPlanLifestyle(planId);
    
    // Group by category
    const groupedLifestyle = lifestyle.reduce((acc, rec) => {
      if (!acc[rec.category]) acc[rec.category] = [];
      acc[rec.category].push(rec);
      return acc;
    }, {} as Record<string, any[]>);

    res.json({
      success: true,
      lifestyle: groupedLifestyle
    });
  } catch (error: any) {
    console.error('Error fetching diet plan lifestyle:', error);
    res.status(500).json({
      error: 'Failed to fetch lifestyle recommendations'
    });
  }
});

// Update diet plan adherence score
router.post('/api/diet-plans/:planId/adherence', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { planId } = req.params;
    const adherence = await dietPlanService.calculateAdherence(userId, planId);
    
    res.json({
      success: true,
      adherenceScore: adherence,
      message: adherence >= 80 ? 'Great job staying on track!' : 'You can do this! Small consistent steps make big changes.'
    });
  } catch (error: any) {
    console.error('Error calculating adherence:', error);
    res.status(500).json({
      error: 'Failed to calculate adherence'
    });
  }
});

// Regenerate meals for existing plan (fix empty plans)
router.post('/api/diet-plans/:planId/regenerate-meals', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { planId } = req.params;
    
    await dietPlanService.regenerateMealsForPlan(planId);
    
    res.json({
      success: true,
      message: 'Meals regenerated successfully!'
    });
  } catch (error: any) {
    console.error('Error regenerating meals:', error);
    res.status(500).json({
      error: 'Failed to regenerate meals',
      message: error.message
    });
  }
});

// Recalculate nutrition targets based on current profile
router.post('/api/nutrition/recalculate-targets', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { goalType = 'weight_loss' } = req.body;
    
    // Get user from database with current profile
    const { db } = await import('../../infrastructure/database/db');
    const { users } = await import('../../../shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.weight || !user.height || !user.age) {
      return res.status(400).json({ 
        error: 'Missing profile data', 
        message: 'Please complete your profile (weight, height, age) to calculate accurate targets.' 
      });
    }
    
    // Calculate new targets
    const targets = targetCalculator.calculatePersonalizedTargets(user, goalType);
    
    // Update user's targets
    await targetCalculator.updateUserTargets(userId, targets);
    
    res.json({
      success: true,
      targets: {
        calories: targets.calories,
        protein: targets.protein,
        carbs: targets.carbs,
        fat: targets.fat,
        fiber: targets.fiber,
        bmr: targets.bmr,
        tdee: targets.tdee,
        explanation: targets.explanation
      },
      message: 'Nutrition targets recalculated based on your current profile!'
    });
  } catch (error: any) {
    console.error('Error recalculating targets:', error);
    res.status(500).json({
      error: 'Failed to recalculate targets',
      message: error.message
    });
  }
});

export default router;