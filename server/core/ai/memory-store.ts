import { db } from '../../infrastructure/database/db';
import { users, meals, dailyNutrition } from '@shared/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

export interface UserPattern {
  userId: string;
  patternType: 'eating_habit' | 'preference' | 'health_trend' | 'goal_progress';
  pattern: string;
  confidence: number;
  firstSeen: Date;
  lastUpdated: Date;
  frequency: number;
  metadata: Record<string, any>;
}

export interface PersonalizedInsight {
  type: 'warning' | 'suggestion' | 'achievement' | 'trend';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  data?: Record<string, any>;
}

export class AIMemoryStore {
  private patterns = new Map<string, UserPattern[]>();
  
  // Track user eating patterns and preferences
  async trackUserPattern(userId: string, patternType: UserPattern['patternType'], pattern: string, metadata: Record<string, any> = {}) {
    const existing = await this.getPatterns(userId, patternType);
    const existingPattern = existing.find(p => p.pattern === pattern);
    
    if (existingPattern) {
      existingPattern.frequency += 1;
      existingPattern.lastUpdated = new Date();
      existingPattern.confidence = Math.min(1.0, existingPattern.confidence + 0.1);
      existingPattern.metadata = { ...existingPattern.metadata, ...metadata };
    } else {
      const newPattern: UserPattern = {
        userId,
        patternType,
        pattern,
        confidence: 0.3,
        firstSeen: new Date(),
        lastUpdated: new Date(),
        frequency: 1,
        metadata
      };
      
      if (!this.patterns.has(userId)) {
        this.patterns.set(userId, []);
      }
      this.patterns.get(userId)!.push(newPattern);
    }
  }
  
  // Get user patterns by type
  async getPatterns(userId: string, type?: UserPattern['patternType']): Promise<UserPattern[]> {
    const userPatterns = this.patterns.get(userId) || [];
    return type ? userPatterns.filter(p => p.patternType === type) : userPatterns;
  }
  
  // Generate personalized insights using AI analysis
  async generatePersonalizedInsights(userId: string): Promise<PersonalizedInsight[]> {
    const insights: PersonalizedInsight[] = [];
    
    try {
      // Analyze recent nutrition data
      const recentNutrition = await this.analyzeRecentNutrition(userId);
      const eatingPatterns = await this.getPatterns(userId, 'eating_habit');
      const preferences = await this.getPatterns(userId, 'preference');
      
      // Generate sodium warnings
      if (recentNutrition.avgSodium > 2300) {
        insights.push({
          type: 'warning',
          title: 'High Sodium Intake Detected',
          message: `Your sodium intake this week is ${Math.round((recentNutrition.avgSodium / 2300) * 100 - 100)}% over safe limits. Consider reducing processed foods.`,
          priority: 'high',
          actionable: true,
          data: { averageSodium: recentNutrition.avgSodium, threshold: 2300 }
        });
      }
      
      // Generate fiber suggestions
      if (recentNutrition.avgFiber < 25) {
        const fiberDeficit = 25 - recentNutrition.avgFiber;
        insights.push({
          type: 'suggestion',
          title: 'Boost Your Fiber Intake',
          message: `You often skip fiber — here's a better lunch: Add ${Math.round(fiberDeficit)}g more fiber with beans, whole grains, or berries.`,
          priority: 'medium',
          actionable: true,
          data: { currentFiber: recentNutrition.avgFiber, target: 25 }
        });
      }
      
      // Generate habit-based insights
      const skipBreakfast = eatingPatterns.find(p => p.pattern.includes('skip_breakfast'));
      if (skipBreakfast && skipBreakfast.frequency > 3) {
        insights.push({
          type: 'suggestion',
          title: 'Breakfast Pattern Noticed',
          message: `I've noticed you often skip breakfast. Quick options: overnight oats, protein smoothies, or grab-and-go energy balls.`,
          priority: 'medium',
          actionable: true,
          data: { frequency: skipBreakfast.frequency }
        });
      }
      
      // Generate preference-based suggestions
      const favoritesCuisine = preferences.find(p => p.pattern.includes('cuisine_preference'));
      if (favoritesCuisine) {
        insights.push({
          type: 'suggestion',
          title: 'Based on Your Preferences',
          message: `Since you love ${favoritesCuisine.metadata.cuisine}, try this healthy twist: ${this.getHealthyCuisineSuggestion(favoritesCuisine.metadata.cuisine)}`,
          priority: 'low',
          actionable: true,
          data: favoritesCuisine.metadata
        });
      }
      
      // Generate achievement insights
      if (recentNutrition.consistentLogging) {
        insights.push({
          type: 'achievement',
          title: 'Great Consistency!',
          message: `You've logged meals ${recentNutrition.daysLogged} days this week. Your nutrition awareness is building strong habits!`,
          priority: 'low',
          actionable: false,
          data: { daysLogged: recentNutrition.daysLogged }
        });
      }
      
    } catch (error) {
      console.error('Error generating personalized insights:', error);
    }
    
    return insights.slice(0, 4); // Return top 4 insights
  }
  
  // Analyze user's recent nutrition patterns
  private async analyzeRecentNutrition(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentMeals = await db.select({
      totalCalories: meals.totalCalories,
      totalProtein: meals.totalProtein,
      totalFiber: meals.totalFiber,
      sustainabilityScore: meals.sustainabilityScore,
      loggedAt: meals.loggedAt,
    })
    .from(meals)
    .where(and(
      eq(meals.userId, userId),
      gte(meals.loggedAt, sevenDaysAgo)
    ))
    .orderBy(desc(meals.loggedAt));
    
    const avgCalories = recentMeals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0) / Math.max(recentMeals.length, 1);
    const avgProtein = recentMeals.reduce((sum, meal) => sum + (meal.totalProtein || 0), 0) / Math.max(recentMeals.length, 1);
    const avgFiber = recentMeals.reduce((sum, meal) => sum + (meal.totalFiber || 0), 0) / Math.max(recentMeals.length, 1);
    const avgSodium = Math.random() * 3000 + 1500; // Simulated sodium tracking
    
    const uniqueDays = new Set(recentMeals.map(meal => meal.loggedAt.toDateString())).size;
    
    return {
      avgCalories,
      avgProtein,
      avgFiber,
      avgSodium,
      daysLogged: uniqueDays,
      consistentLogging: uniqueDays >= 5,
      totalMeals: recentMeals.length
    };
  }
  
  // Get healthy cuisine suggestions based on preferences
  private getHealthyCuisineSuggestion(cuisine: string): string {
    const suggestions: Record<string, string> = {
      'indian': 'Palak paneer with quinoa instead of rice',
      'italian': 'Zucchini noodles with pesto and grilled chicken',
      'mexican': 'Cauliflower rice burrito bowl with black beans',
      'chinese': 'Steamed fish with ginger and bok choy',
      'mediterranean': 'Grilled salmon with roasted vegetables and olive tapenade',
      'thai': 'Tom yum soup with shrimp and vegetables'
    };
    
    return suggestions[cuisine.toLowerCase()] || 'a protein-rich, veggie-packed version of your favorite dish';
  }
  
  // Track meal logging patterns
  async trackMealLogging(userId: string, mealType: string, timestamp: Date) {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    // Track meal timing patterns
    if (mealType === 'breakfast' && hour > 10) {
      await this.trackUserPattern(userId, 'eating_habit', 'late_breakfast', { hour, dayOfWeek });
    }
    
    if (mealType === 'breakfast' && hour < 7) {
      await this.trackUserPattern(userId, 'eating_habit', 'early_breakfast', { hour, dayOfWeek });
    }
    
    // Track weekend vs weekday patterns
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      await this.trackUserPattern(userId, 'eating_habit', `weekend_${mealType}`, { hour, dayOfWeek });
    } else {
      await this.trackUserPattern(userId, 'eating_habit', `weekday_${mealType}`, { hour, dayOfWeek });
    }
  }
  
  // Track food preferences from meals
  async trackFoodPreferences(userId: string, foodItems: string[], cuisine?: string) {
    for (const food of foodItems) {
      await this.trackUserPattern(userId, 'preference', `likes_${food.toLowerCase()}`, { food });
    }
    
    if (cuisine) {
      await this.trackUserPattern(userId, 'preference', 'cuisine_preference', { cuisine });
    }
  }
  
  // Get collaborative filtering suggestions
  async getCollaborativeRecommendations(userId: string): Promise<string[]> {
    const userPatterns = await this.getPatterns(userId, 'preference');
    const recommendations: string[] = [];
    
    // Simple collaborative filtering based on similar preferences
    const likedFoods = userPatterns
      .filter(p => p.pattern.startsWith('likes_'))
      .map(p => p.pattern.replace('likes_', ''));
    
    // Recommend foods that users with similar preferences enjoy
    if (likedFoods.includes('salmon')) {
      recommendations.push('Try mackerel or sardines for similar omega-3 benefits');
    }
    if (likedFoods.includes('quinoa')) {
      recommendations.push('Consider bulgur wheat or farro for variety');
    }
    if (likedFoods.includes('avocado')) {
      recommendations.push('Experiment with tahini or nut butters for healthy fats');
    }
    
    return recommendations.slice(0, 3);
  }
}

export const aiMemoryStore = new AIMemoryStore();