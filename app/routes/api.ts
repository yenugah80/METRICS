import { Router } from 'express';
import { db } from '../core/database';
import { users, meals, dailyNutrition } from '../types/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

const router = Router();

// ============================================================================
// CORE API ROUTES - Production Grade, No Bloat
// ============================================================================

// MEAL LOGGING
router.post('/meals', async (req, res) => {
  try {
    const { userId, name, calories, protein, carbs, fat, mealType } = req.body;
    
    const meal = await db.insert(meals).values({
      userId,
      name,
      calories,
      protein,
      carbs,
      fat,
      mealType,
      loggedAt: new Date()
    }).returning();

    res.json({ success: true, meal: meal[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log meal' });
  }
});

router.get('/meals', async (req, res) => {
  try {
    const { userId, date } = req.query;
    const startDate = new Date(date as string);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const userMeals = await db.select()
      .from(meals)
      .where(and(
        eq(meals.userId, userId as string),
        gte(meals.loggedAt, startDate),
        lte(meals.loggedAt, endDate)
      ))
      .orderBy(desc(meals.loggedAt));

    res.json({ success: true, meals: userMeals });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch meals' });
  }
});

// NUTRITION TRACKING
router.get('/nutrition/daily/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    const nutrition = await db.select()
      .from(dailyNutrition)
      .where(and(
        eq(dailyNutrition.userId, userId),
        eq(dailyNutrition.date, date)
      ));

    res.json({ success: true, nutrition: nutrition[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch nutrition' });
  }
});

// FOOD SEARCH
router.get('/food/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    // Simple food search - production apps would use external API
    const mockResults = [
      { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      { name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
      { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 }
    ].filter(food => food.name.toLowerCase().includes((query as string).toLowerCase()));

    res.json({ success: true, foods: mockResults });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// USER PROFILE
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: user[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const updatedUser = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    res.json({ success: true, user: updatedUser[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

export default router;