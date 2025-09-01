import type { Express } from "express";
import { verifyJWT, type AuthenticatedRequest } from "../../infrastructure/auth/authService";
import { storage } from "../../infrastructure/database/storage";

// Calculate comprehensive wellness score based on nutrition quality, not just calories
export async function calculateWellnessScore(dayMeals: any[], dayCalories: number): Promise<number> {
  if (dayMeals.length === 0) return 0;
  
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  
  // Calculate total macros from all meals
  for (const meal of dayMeals) {
    const nutrition = await storage.getMealNutrition(meal.id);
    if (nutrition) {
      totalProtein += parseFloat(nutrition.protein || "0");
      totalCarbs += parseFloat(nutrition.carbs || "0");
      totalFat += parseFloat(nutrition.fat || "0");
      totalFiber += parseFloat(nutrition.fiber || "0");
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
  if (dayMeals.length >= 3) score += 20; // 3+ meals
  else if (dayMeals.length >= 2) score += 15; // 2 meals
  else if (dayMeals.length >= 1) score += 10; // 1 meal
  
  // 4. Fiber bonus (10% of total score)
  const fiberTarget = 25; // grams per day
  const fiberRatio = totalFiber / fiberTarget;
  if (fiberRatio >= 1.0) score += 10;
  else if (fiberRatio >= 0.8) score += 8;
  else if (fiberRatio >= 0.5) score += 5;
  else score += 2;
  
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

export async function registerStatsRoutes(app: Express) {
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
}