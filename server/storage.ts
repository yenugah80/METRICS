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
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    let query = db.select().from(recipes);
    
    if (!isPremium) {
      query = query.where(eq(recipes.isPremium, false));
    }
    
    return await query.orderBy(desc(recipes.createdAt)).limit(limit);
  }

  async getRecipeById(id: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }
}

export const storage = new DatabaseStorage();
