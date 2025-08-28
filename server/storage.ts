import {
  users,
  userProfiles,
  meals,
  mealItems,
  mealNutrition,
  mealScores,
  dailyAggregates,
  recipes,
  type User,
  type UpsertUser,
  type InsertUser,
  type UserProfile,
  type InsertUserProfile,
  type Meal,
  type InsertMeal,
  type MealItem,
  type InsertMealItem,
  type MealNutrition,
  type InsertMealNutrition,
  type MealScore,
  type InsertMealScore,
  type DailyAggregate,
  type Recipe,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // User profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  
  // Meal operations
  createMeal(meal: InsertMeal): Promise<Meal>;
  getMealById(id: string): Promise<Meal | undefined>;
  getMealsByUserId(userId: string, limit?: number): Promise<Meal[]>;
  getMealsForDate(userId: string, date: Date): Promise<Meal[]>;
  
  // Meal item operations
  createMealItem(item: InsertMealItem): Promise<MealItem>;
  getMealItems(mealId: string): Promise<MealItem[]>;
  
  // Nutrition operations
  createMealNutrition(nutrition: InsertMealNutrition): Promise<MealNutrition>;
  getMealNutrition(mealId: string): Promise<MealNutrition | undefined>;
  
  // Score operations
  createMealScore(score: InsertMealScore): Promise<MealScore>;
  getMealScore(mealId: string): Promise<MealScore | undefined>;
  
  // Daily aggregate operations
  getDailyAggregate(userId: string, date: Date): Promise<DailyAggregate | undefined>;
  upsertDailyAggregate(userId: string, date: Date, data: Partial<DailyAggregate>): Promise<DailyAggregate>;
  
  // Recipe operations
  getRecipes(isPremium: boolean, limit?: number): Promise<Recipe[]>;
  getRecipeById(id: string): Promise<Recipe | undefined>;
  
  // Additional operations for search and meal management
  getTodaysMeal(userId: string): Promise<Meal | undefined>;
  createNutritionData(nutrition: any): Promise<any>;
  
  // Usage tracking for freemium model
  getUserUsageStats(userId: string): Promise<{ recipesGenerated: number } | undefined>;
  incrementUserRecipeUsage(userId: string): Promise<void>;
  
  // Meal recommendation methods
  getUserRecentMeals(userId: string, days: number): Promise<Meal[]>;
  saveMealRecommendation(userId: string, recommendation: any): Promise<void>;
  getUserFavoriteMeals(userId: string): Promise<Meal[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        isPremium: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // User profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(profileData: InsertUserProfile): Promise<UserProfile> {
    const [profile] = await db
      .insert(userProfiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          ...profileData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return profile;
  }

  // Meal operations
  async createMeal(mealData: InsertMeal): Promise<Meal> {
    const [meal] = await db.insert(meals).values(mealData).returning();
    return meal;
  }

  async getMealById(id: string): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, id));
    return meal;
  }

  async getMealsByUserId(userId: string, limit = 20): Promise<Meal[]> {
    return await db
      .select()
      .from(meals)
      .where(eq(meals.userId, userId))
      .orderBy(desc(meals.loggedAt))
      .limit(limit);
  }

  async getMealsForDate(userId: string, date: Date): Promise<Meal[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          gte(meals.loggedAt, startOfDay),
          lt(meals.loggedAt, endOfDay)
        )
      )
      .orderBy(meals.loggedAt);
  }

  // Meal item operations
  async createMealItem(itemData: InsertMealItem): Promise<MealItem> {
    const [item] = await db.insert(mealItems).values(itemData).returning();
    return item;
  }

  async getMealItems(mealId: string): Promise<MealItem[]> {
    return await db.select().from(mealItems).where(eq(mealItems.mealId, mealId));
  }

  // Nutrition operations
  async createMealNutrition(nutritionData: InsertMealNutrition): Promise<MealNutrition> {
    const [nutrition] = await db.insert(mealNutrition).values(nutritionData).returning();
    return nutrition;
  }

  async getMealNutrition(mealId: string): Promise<MealNutrition | undefined> {
    const [nutrition] = await db.select().from(mealNutrition).where(eq(mealNutrition.mealId, mealId));
    return nutrition;
  }

  // Score operations
  async createMealScore(scoreData: InsertMealScore): Promise<MealScore> {
    const [score] = await db.insert(mealScores).values(scoreData).returning();
    return score;
  }

  async getMealScore(mealId: string): Promise<MealScore | undefined> {
    const [score] = await db.select().from(mealScores).where(eq(mealScores.mealId, mealId));
    return score;
  }

  // Daily aggregate operations
  async getDailyAggregate(userId: string, date: Date): Promise<DailyAggregate | undefined> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const [aggregate] = await db
      .select()
      .from(dailyAggregates)
      .where(and(eq(dailyAggregates.userId, userId), eq(dailyAggregates.date, dayStart)));
    
    return aggregate;
  }

  async upsertDailyAggregate(userId: string, date: Date, data: Partial<DailyAggregate>): Promise<DailyAggregate> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const [aggregate] = await db
      .insert(dailyAggregates)
      .values({
        userId,
        date: dayStart,
        ...data,
      })
      .onConflictDoUpdate({
        target: [dailyAggregates.userId, dailyAggregates.date],
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return aggregate;
  }

  // Recipe operations
  async getRecipes(isPremium: boolean, limit = 10): Promise<Recipe[]> {
    if (!isPremium) {
      return await db
        .select()
        .from(recipes)
        .where(eq(recipes.isPremium, false))
        .orderBy(desc(recipes.createdAt))
        .limit(limit);
    }
    
    return await db
      .select()
      .from(recipes)
      .orderBy(desc(recipes.createdAt))
      .limit(limit);
  }

  async getRecipeById(id: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async getTodaysMeal(userId: string): Promise<Meal | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [meal] = await db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          gte(meals.loggedAt, today),
          lt(meals.loggedAt, tomorrow)
        )
      )
      .orderBy(desc(meals.loggedAt))
      .limit(1);
    
    return meal;
  }

  async createNutritionData(nutrition: any): Promise<any> {
    const [result] = await db
      .insert(mealNutrition)
      .values({
        mealId: nutrition.mealItemId, // Using mealId as expected by the schema
        calories: nutrition.calories || 0,
        protein: nutrition.protein?.toString() || "0",
        carbs: nutrition.carbs?.toString() || "0",
        fat: nutrition.fat?.toString() || "0",
        fiber: nutrition.fiber?.toString() || "0",
        sugar: nutrition.sugar?.toString() || "0",
        sodium: nutrition.sodium?.toString() || "0"
      })
      .returning();
    
    return result;
  }

  // Usage tracking for freemium model
  async getUserUsageStats(userId: string): Promise<{ recipesGenerated: number } | undefined> {
    try {
      // For now, we'll track this in user profiles
      const profile = await this.getUserProfile(userId);
      return {
        recipesGenerated: profile?.recipesGenerated || 0
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return { recipesGenerated: 0 };
    }
  }

  async incrementUserRecipeUsage(userId: string): Promise<void> {
    try {
      // First ensure user profile exists
      let profile = await this.getUserProfile(userId);
      if (!profile) {
        profile = await this.upsertUserProfile({
          userId,
          recipesGenerated: 0
        });
      }

      // Increment recipe count
      await db
        .update(userProfiles)
        .set({
          recipesGenerated: (profile.recipesGenerated || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(userProfiles.userId, userId));
    } catch (error) {
      console.error('Error incrementing recipe usage:', error);
    }
  }

  // Meal recommendation methods
  async getUserRecentMeals(userId: string, days: number): Promise<Meal[]> {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);
      
      const recentMeals = await db
        .select()
        .from(meals)
        .where(
          and(
            eq(meals.userId, userId),
            gte(meals.loggedAt, daysAgo)
          )
        )
        .orderBy(desc(meals.loggedAt))
        .limit(50);
      
      return recentMeals;
    } catch (error) {
      console.error('Error getting recent meals:', error);
      return [];
    }
  }

  async saveMealRecommendation(userId: string, recommendation: any): Promise<void> {
    try {
      // For now, we could save this as a special meal entry
      // In the future, we might want a dedicated recommendations table
      await this.createMeal({
        userId,
        name: recommendation.name,
        mealType: recommendation.mealType,
        source: 'recommendation',
        rawText: JSON.stringify(recommendation),
        confidence: "0.95"
      });
    } catch (error) {
      console.error('Error saving meal recommendation:', error);
    }
  }

  async getUserFavoriteMeals(userId: string): Promise<Meal[]> {
    try {
      // Get meals that appear frequently in user's history
      const frequentMeals = await db
        .select()
        .from(meals)
        .where(eq(meals.userId, userId))
        .orderBy(desc(meals.loggedAt))
        .limit(100);
      
      // Simple frequency analysis
      const mealCounts = new Map<string, { meal: Meal; count: number }>();
      
      frequentMeals.forEach(meal => {
        const key = meal.name.toLowerCase();
        if (mealCounts.has(key)) {
          mealCounts.get(key)!.count++;
        } else {
          mealCounts.set(key, { meal, count: 1 });
        }
      });
      
      // Return meals that appear more than once
      return Array.from(mealCounts.values())
        .filter(entry => entry.count > 1)
        .sort((a, b) => b.count - a.count)
        .map(entry => entry.meal)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting favorite meals:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
