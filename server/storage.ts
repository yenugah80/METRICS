import {
  users,
  userProfiles,
  meals,
  mealItems,
  mealNutrition,
  mealScores,
  dailyAggregates,
  recipes,
  userSavedRecipes,
  recipeCollections,
  collectionRecipes,
  recipeRatings,
  recipeComments,
  recipePhotos,
  recipeModifications,
  ingredientSubstitutions,
  shoppingLists,
  shoppingListItems,
  mealPlans,
  plannedMeals,
  cookingTimers,
  recipeShares,
  userRecipeHistory,
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
  type InsertRecipe,
  type UserSavedRecipe,
  type InsertUserSavedRecipe,
  type RecipeCollection,
  type InsertRecipeCollection,
  type CollectionRecipe,
  type InsertCollectionRecipe,
  type RecipeRating,
  type InsertRecipeRating,
  type RecipeComment,
  type InsertRecipeComment,
  type RecipePhoto,
  type InsertRecipePhoto,
  type RecipeModification,
  type InsertRecipeModification,
  type IngredientSubstitution,
  type InsertIngredientSubstitution,
  type ShoppingList,
  type InsertShoppingList,
  type ShoppingListItem,
  type InsertShoppingListItem,
  type MealPlan,
  type InsertMealPlan,
  type PlannedMeal,
  type InsertPlannedMeal,
  type CookingTimer,
  type InsertCookingTimer,
  type RecipeShare,
  type InsertRecipeShare,
  type UserRecipeHistory,
  type InsertUserRecipeHistory,
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
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe>;
  deleteRecipe(id: string): Promise<void>;
  searchRecipes(query: string, filters?: any): Promise<Recipe[]>;
  getRecipesByCategory(category: string): Promise<Recipe[]>;
  getRecipesByCuisine(cuisine: string): Promise<Recipe[]>;
  getRecipesByDifficulty(difficulty: string): Promise<Recipe[]>;
  
  // Recipe favorites/saved recipes
  saveRecipe(userId: string, recipeId: string, notes?: string): Promise<UserSavedRecipe>;
  unsaveRecipe(userId: string, recipeId: string): Promise<void>;
  getUserSavedRecipes(userId: string): Promise<UserSavedRecipe[]>;
  isRecipeSaved(userId: string, recipeId: string): Promise<boolean>;
  
  // Recipe collections
  createRecipeCollection(collection: InsertRecipeCollection): Promise<RecipeCollection>;
  updateRecipeCollection(id: string, collection: Partial<InsertRecipeCollection>): Promise<RecipeCollection>;
  deleteRecipeCollection(id: string): Promise<void>;
  getUserRecipeCollections(userId: string): Promise<RecipeCollection[]>;
  addRecipeToCollection(collectionId: string, recipeId: string): Promise<CollectionRecipe>;
  removeRecipeFromCollection(collectionId: string, recipeId: string): Promise<void>;
  getRecipesInCollection(collectionId: string): Promise<Recipe[]>;
  
  // Recipe ratings and reviews
  createRecipeRating(rating: InsertRecipeRating): Promise<RecipeRating>;
  updateRecipeRating(id: string, rating: Partial<InsertRecipeRating>): Promise<RecipeRating>;
  deleteRecipeRating(id: string): Promise<void>;
  getRecipeRatings(recipeId: string): Promise<RecipeRating[]>;
  getUserRecipeRating(userId: string, recipeId: string): Promise<RecipeRating | undefined>;
  getRecipeAverageRating(recipeId: string): Promise<{ average: number; count: number }>;
  
  // Recipe comments
  createRecipeComment(comment: InsertRecipeComment): Promise<RecipeComment>;
  updateRecipeComment(id: string, comment: Partial<InsertRecipeComment>): Promise<RecipeComment>;
  deleteRecipeComment(id: string): Promise<void>;
  getRecipeComments(recipeId: string): Promise<RecipeComment[]>;
  
  // Recipe photos
  createRecipePhoto(photo: InsertRecipePhoto): Promise<RecipePhoto>;
  deleteRecipePhoto(id: string): Promise<void>;
  getRecipePhotos(recipeId: string): Promise<RecipePhoto[]>;
  setMainRecipePhoto(recipeId: string, photoId: string): Promise<void>;
  
  // Recipe modifications
  createRecipeModification(modification: InsertRecipeModification): Promise<RecipeModification>;
  getUserRecipeModifications(userId: string): Promise<RecipeModification[]>;
  getRecipeModifications(originalRecipeId: string): Promise<RecipeModification[]>;
  
  // Ingredient substitutions
  getIngredientSubstitutions(ingredient: string): Promise<IngredientSubstitution[]>;
  createIngredientSubstitution(substitution: InsertIngredientSubstitution): Promise<IngredientSubstitution>;
  
  // Shopping lists
  createShoppingList(shoppingList: InsertShoppingList): Promise<ShoppingList>;
  updateShoppingList(id: string, shoppingList: Partial<InsertShoppingList>): Promise<ShoppingList>;
  deleteShoppingList(id: string): Promise<void>;
  getUserShoppingLists(userId: string): Promise<ShoppingList[]>;
  getUserDefaultShoppingList(userId: string): Promise<ShoppingList | undefined>;
  
  // Shopping list items
  createShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem>;
  updateShoppingListItem(id: string, item: Partial<InsertShoppingListItem>): Promise<ShoppingListItem>;
  deleteShoppingListItem(id: string): Promise<void>;
  getShoppingListItems(shoppingListId: string): Promise<ShoppingListItem[]>;
  addRecipeToShoppingList(shoppingListId: string, recipeId: string): Promise<ShoppingListItem[]>;
  
  // Meal planning
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: string, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan>;
  deleteMealPlan(id: string): Promise<void>;
  getUserMealPlans(userId: string): Promise<MealPlan[]>;
  
  // Planned meals
  createPlannedMeal(plannedMeal: InsertPlannedMeal): Promise<PlannedMeal>;
  updatePlannedMeal(id: string, plannedMeal: Partial<InsertPlannedMeal>): Promise<PlannedMeal>;
  deletePlannedMeal(id: string): Promise<void>;
  getMealPlanMeals(mealPlanId: string): Promise<PlannedMeal[]>;
  getPlannedMealsForDate(userId: string, date: Date): Promise<PlannedMeal[]>;
  
  // Cooking timers
  createCookingTimer(timer: InsertCookingTimer): Promise<CookingTimer>;
  updateCookingTimer(id: string, timer: Partial<InsertCookingTimer>): Promise<CookingTimer>;
  deleteCookingTimer(id: string): Promise<void>;
  getUserActiveTimers(userId: string): Promise<CookingTimer[]>;
  
  // Recipe sharing
  createRecipeShare(share: InsertRecipeShare): Promise<RecipeShare>;
  getRecipeShares(recipeId: string): Promise<RecipeShare[]>;
  getUserRecipeShares(userId: string): Promise<RecipeShare[]>;
  
  // Recipe history
  recordRecipeAction(history: InsertUserRecipeHistory): Promise<UserRecipeHistory>;
  getUserRecipeHistory(userId: string, limit?: number): Promise<UserRecipeHistory[]>;
  getRecentlyViewedRecipes(userId: string, limit?: number): Promise<Recipe[]>;
  getRecentlyCookedRecipes(userId: string, limit?: number): Promise<Recipe[]>;
  
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
        mealId: nutrition.mealId, // Using mealId as expected by the schema
        calories: nutrition.calories || 0,
        protein: nutrition.protein?.toString() || "0",
        carbs: nutrition.carbs?.toString() || "0",
        fat: nutrition.fat?.toString() || "0",
        fiber: nutrition.fiber?.toString() || "0",
        iron: nutrition.iron?.toString() || "0",
        vitaminC: nutrition.vitaminC?.toString() || "0",
        magnesium: nutrition.magnesium?.toString() || "0",
        vitaminB12: nutrition.vitaminB12?.toString() || "0"
      })
      .returning();
    
    return result;
  }

  // Usage tracking for freemium model
  async getUserUsageStats(userId: string): Promise<{ recipesGenerated: number } | undefined> {
    try {
      // Get user to check monthly reset
      const user = await this.getUserById(userId);
      if (!user) return { recipesGenerated: 0 };
      
      // Check if we need to reset monthly count
      const now = new Date();
      const lastReset = user.lastRecipeResetDate ? new Date(user.lastRecipeResetDate) : new Date();
      const shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
      
      if (shouldReset) {
        // Reset monthly count
        await db
          .update(users)
          .set({
            recipesGeneratedThisMonth: 0,
            lastRecipeResetDate: now
          })
          .where(eq(users.id, userId));
        
        return { recipesGenerated: 0 };
      }
      
      return {
        recipesGenerated: user.recipesGeneratedThisMonth || 0
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return { recipesGenerated: 0 };
    }
  }

  async incrementUserRecipeUsage(userId: string): Promise<void> {
    try {
      // Get current user and increment monthly count
      const user = await this.getUserById(userId);
      if (!user) return;

      await db
        .update(users)
        .set({
          recipesGeneratedThisMonth: (user.recipesGeneratedThisMonth || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
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

  // ==== COMPREHENSIVE RECIPE SYSTEM IMPLEMENTATIONS ====

  // Recipe CRUD operations
  async createRecipe(recipeData: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values(recipeData).returning();
    return recipe;
  }

  async updateRecipe(id: string, recipeData: Partial<InsertRecipe>): Promise<Recipe> {
    const [recipe] = await db
      .update(recipes)
      .set({ ...recipeData, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return recipe;
  }

  async deleteRecipe(id: string): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  async searchRecipes(query: string, filters?: any): Promise<Recipe[]> {
    // Basic text search implementation - can be enhanced with full-text search
    const searchResults = await db
      .select()
      .from(recipes)
      .where(
        and(
          // Add search conditions based on query
          filters?.category ? eq(recipes.category, filters.category) : undefined,
          filters?.cuisine ? eq(recipes.cuisine, filters.cuisine) : undefined,
          filters?.difficulty ? eq(recipes.difficulty, filters.difficulty) : undefined,
          filters?.isPremium !== undefined ? eq(recipes.isPremium, filters.isPremium) : undefined
        )
      )
      .orderBy(desc(recipes.createdAt))
      .limit(50);
    return searchResults;
  }

  async getRecipesByCategory(category: string): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .where(eq(recipes.category, category))
      .orderBy(desc(recipes.createdAt));
  }

  async getRecipesByCuisine(cuisine: string): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .where(eq(recipes.cuisine, cuisine))
      .orderBy(desc(recipes.createdAt));
  }

  async getRecipesByDifficulty(difficulty: string): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .where(eq(recipes.difficulty, difficulty))
      .orderBy(desc(recipes.createdAt));
  }

  // Recipe favorites/saved recipes
  async saveRecipe(userId: string, recipeId: string, notes?: string): Promise<UserSavedRecipe> {
    const [savedRecipe] = await db
      .insert(userSavedRecipes)
      .values({ userId, recipeId, notes })
      .returning();
    return savedRecipe;
  }

  async unsaveRecipe(userId: string, recipeId: string): Promise<void> {
    await db
      .delete(userSavedRecipes)
      .where(
        and(
          eq(userSavedRecipes.userId, userId),
          eq(userSavedRecipes.recipeId, recipeId)
        )
      );
  }

  async getUserSavedRecipes(userId: string): Promise<UserSavedRecipe[]> {
    return await db
      .select()
      .from(userSavedRecipes)
      .where(eq(userSavedRecipes.userId, userId))
      .orderBy(desc(userSavedRecipes.createdAt));
  }

  async isRecipeSaved(userId: string, recipeId: string): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(userSavedRecipes)
      .where(
        and(
          eq(userSavedRecipes.userId, userId),
          eq(userSavedRecipes.recipeId, recipeId)
        )
      )
      .limit(1);
    return !!saved;
  }

  // Recipe collections
  async createRecipeCollection(collectionData: InsertRecipeCollection): Promise<RecipeCollection> {
    const [collection] = await db
      .insert(recipeCollections)
      .values(collectionData)
      .returning();
    return collection;
  }

  async updateRecipeCollection(id: string, collectionData: Partial<InsertRecipeCollection>): Promise<RecipeCollection> {
    const [collection] = await db
      .update(recipeCollections)
      .set({ ...collectionData, updatedAt: new Date() })
      .where(eq(recipeCollections.id, id))
      .returning();
    return collection;
  }

  async deleteRecipeCollection(id: string): Promise<void> {
    await db.delete(recipeCollections).where(eq(recipeCollections.id, id));
  }

  async getUserRecipeCollections(userId: string): Promise<RecipeCollection[]> {
    return await db
      .select()
      .from(recipeCollections)
      .where(eq(recipeCollections.userId, userId))
      .orderBy(desc(recipeCollections.createdAt));
  }

  async addRecipeToCollection(collectionId: string, recipeId: string): Promise<CollectionRecipe> {
    const [collectionRecipe] = await db
      .insert(collectionRecipes)
      .values({ collectionId, recipeId })
      .returning();
    return collectionRecipe;
  }

  async removeRecipeFromCollection(collectionId: string, recipeId: string): Promise<void> {
    await db
      .delete(collectionRecipes)
      .where(
        and(
          eq(collectionRecipes.collectionId, collectionId),
          eq(collectionRecipes.recipeId, recipeId)
        )
      );
  }

  async getRecipesInCollection(collectionId: string): Promise<Recipe[]> {
    const results = await db
      .select({
        id: recipes.id,
        title: recipes.title,
        description: recipes.description,
        imageUrl: recipes.imageUrl,
        prepTime: recipes.prepTime,
        cookTime: recipes.cookTime,
        totalTime: recipes.totalTime,
        servings: recipes.servings,
        ingredients: recipes.ingredients,
        instructions: recipes.instructions,
        tags: recipes.tags,
        difficulty: recipes.difficulty,
        category: recipes.category,
        cuisine: recipes.cuisine,
        estimatedCalories: recipes.estimatedCalories,
        estimatedProtein: recipes.estimatedProtein,
        estimatedCarbs: recipes.estimatedCarbs,
        estimatedFat: recipes.estimatedFat,
        nutritionGrade: recipes.nutritionGrade,
        isPremium: recipes.isPremium,
        isPublic: recipes.isPublic,
        createdBy: recipes.createdBy,
        sourceUrl: recipes.sourceUrl,
        equipment: recipes.equipment,
        notes: recipes.notes,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
      })
      .from(recipes)
      .innerJoin(collectionRecipes, eq(recipes.id, collectionRecipes.recipeId))
      .where(eq(collectionRecipes.collectionId, collectionId))
      .orderBy(desc(collectionRecipes.addedAt));
    return results;
  }

  // Recipe ratings and reviews
  async createRecipeRating(ratingData: InsertRecipeRating): Promise<RecipeRating> {
    const [rating] = await db
      .insert(recipeRatings)
      .values(ratingData)
      .returning();
    return rating;
  }

  async updateRecipeRating(id: string, ratingData: Partial<InsertRecipeRating>): Promise<RecipeRating> {
    const [rating] = await db
      .update(recipeRatings)
      .set({ ...ratingData, updatedAt: new Date() })
      .where(eq(recipeRatings.id, id))
      .returning();
    return rating;
  }

  async deleteRecipeRating(id: string): Promise<void> {
    await db.delete(recipeRatings).where(eq(recipeRatings.id, id));
  }

  async getRecipeRatings(recipeId: string): Promise<RecipeRating[]> {
    return await db
      .select()
      .from(recipeRatings)
      .where(eq(recipeRatings.recipeId, recipeId))
      .orderBy(desc(recipeRatings.createdAt));
  }

  async getUserRecipeRating(userId: string, recipeId: string): Promise<RecipeRating | undefined> {
    const [rating] = await db
      .select()
      .from(recipeRatings)
      .where(
        and(
          eq(recipeRatings.userId, userId),
          eq(recipeRatings.recipeId, recipeId)
        )
      )
      .limit(1);
    return rating;
  }

  async getRecipeAverageRating(recipeId: string): Promise<{ average: number; count: number }> {
    const ratings = await db
      .select()
      .from(recipeRatings)
      .where(eq(recipeRatings.recipeId, recipeId));
    
    if (ratings.length === 0) {
      return { average: 0, count: 0 };
    }
    
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return {
      average: sum / ratings.length,
      count: ratings.length
    };
  }

  // Recipe comments
  async createRecipeComment(commentData: InsertRecipeComment): Promise<RecipeComment> {
    const [comment] = await db
      .insert(recipeComments)
      .values(commentData)
      .returning();
    return comment;
  }

  async updateRecipeComment(id: string, commentData: Partial<InsertRecipeComment>): Promise<RecipeComment> {
    const [comment] = await db
      .update(recipeComments)
      .set({ ...commentData, updatedAt: new Date() })
      .where(eq(recipeComments.id, id))
      .returning();
    return comment;
  }

  async deleteRecipeComment(id: string): Promise<void> {
    await db.delete(recipeComments).where(eq(recipeComments.id, id));
  }

  async getRecipeComments(recipeId: string): Promise<RecipeComment[]> {
    return await db
      .select()
      .from(recipeComments)
      .where(eq(recipeComments.recipeId, recipeId))
      .orderBy(desc(recipeComments.createdAt));
  }

  // Recipe photos
  async createRecipePhoto(photoData: InsertRecipePhoto): Promise<RecipePhoto> {
    const [photo] = await db
      .insert(recipePhotos)
      .values(photoData)
      .returning();
    return photo;
  }

  async deleteRecipePhoto(id: string): Promise<void> {
    await db.delete(recipePhotos).where(eq(recipePhotos.id, id));
  }

  async getRecipePhotos(recipeId: string): Promise<RecipePhoto[]> {
    return await db
      .select()
      .from(recipePhotos)
      .where(eq(recipePhotos.recipeId, recipeId))
      .orderBy(desc(recipePhotos.createdAt));
  }

  async setMainRecipePhoto(recipeId: string, photoId: string): Promise<void> {
    // First, unset all main photos for this recipe
    await db
      .update(recipePhotos)
      .set({ isMainPhoto: false })
      .where(eq(recipePhotos.recipeId, recipeId));
    
    // Then set the specified photo as main
    await db
      .update(recipePhotos)
      .set({ isMainPhoto: true })
      .where(eq(recipePhotos.id, photoId));
  }

  // Recipe modifications
  async createRecipeModification(modificationData: InsertRecipeModification): Promise<RecipeModification> {
    const [modification] = await db
      .insert(recipeModifications)
      .values(modificationData)
      .returning();
    return modification;
  }

  async getUserRecipeModifications(userId: string): Promise<RecipeModification[]> {
    return await db
      .select()
      .from(recipeModifications)
      .where(eq(recipeModifications.userId, userId))
      .orderBy(desc(recipeModifications.createdAt));
  }

  async getRecipeModifications(originalRecipeId: string): Promise<RecipeModification[]> {
    return await db
      .select()
      .from(recipeModifications)
      .where(eq(recipeModifications.originalRecipeId, originalRecipeId))
      .orderBy(desc(recipeModifications.createdAt));
  }

  // Ingredient substitutions
  async getIngredientSubstitutions(ingredient: string): Promise<IngredientSubstitution[]> {
    return await db
      .select()
      .from(ingredientSubstitutions)
      .where(eq(ingredientSubstitutions.originalIngredient, ingredient))
      .orderBy(desc(ingredientSubstitutions.confidence));
  }

  async createIngredientSubstitution(substitutionData: InsertIngredientSubstitution): Promise<IngredientSubstitution> {
    const [substitution] = await db
      .insert(ingredientSubstitutions)
      .values(substitutionData)
      .returning();
    return substitution;
  }

  // Shopping lists
  async createShoppingList(shoppingListData: InsertShoppingList): Promise<ShoppingList> {
    const [shoppingList] = await db
      .insert(shoppingLists)
      .values(shoppingListData)
      .returning();
    return shoppingList;
  }

  async updateShoppingList(id: string, shoppingListData: Partial<InsertShoppingList>): Promise<ShoppingList> {
    const [shoppingList] = await db
      .update(shoppingLists)
      .set({ ...shoppingListData, updatedAt: new Date() })
      .where(eq(shoppingLists.id, id))
      .returning();
    return shoppingList;
  }

  async deleteShoppingList(id: string): Promise<void> {
    await db.delete(shoppingLists).where(eq(shoppingLists.id, id));
  }

  async getUserShoppingLists(userId: string): Promise<ShoppingList[]> {
    return await db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.userId, userId))
      .orderBy(desc(shoppingLists.createdAt));
  }

  async getUserDefaultShoppingList(userId: string): Promise<ShoppingList | undefined> {
    const [defaultList] = await db
      .select()
      .from(shoppingLists)
      .where(
        and(
          eq(shoppingLists.userId, userId),
          eq(shoppingLists.isDefault, true)
        )
      )
      .limit(1);
    return defaultList;
  }

  // Shopping list items
  async createShoppingListItem(itemData: InsertShoppingListItem): Promise<ShoppingListItem> {
    const [item] = await db
      .insert(shoppingListItems)
      .values(itemData)
      .returning();
    return item;
  }

  async updateShoppingListItem(id: string, itemData: Partial<InsertShoppingListItem>): Promise<ShoppingListItem> {
    const [item] = await db
      .update(shoppingListItems)
      .set(itemData)
      .where(eq(shoppingListItems.id, id))
      .returning();
    return item;
  }

  async deleteShoppingListItem(id: string): Promise<void> {
    await db.delete(shoppingListItems).where(eq(shoppingListItems.id, id));
  }

  async getShoppingListItems(shoppingListId: string): Promise<ShoppingListItem[]> {
    return await db
      .select()
      .from(shoppingListItems)
      .where(eq(shoppingListItems.shoppingListId, shoppingListId))
      .orderBy(shoppingListItems.category, shoppingListItems.name);
  }

  async addRecipeToShoppingList(shoppingListId: string, recipeId: string): Promise<ShoppingListItem[]> {
    // Get recipe ingredients
    const recipe = await this.getRecipeById(recipeId);
    if (!recipe) throw new Error('Recipe not found');

    const ingredients = recipe.ingredients as any[];
    const itemsToCreate = ingredients.map(ingredient => ({
      shoppingListId,
      name: ingredient.name,
      quantity: ingredient.amount,
      unit: ingredient.unit,
      recipeId,
      category: 'ingredients'
    }));

    const results = [];
    for (const item of itemsToCreate) {
      const created = await this.createShoppingListItem(item);
      results.push(created);
    }
    return results;
  }

  // Meal planning
  async createMealPlan(mealPlanData: InsertMealPlan): Promise<MealPlan> {
    const [mealPlan] = await db
      .insert(mealPlans)
      .values(mealPlanData)
      .returning();
    return mealPlan;
  }

  async updateMealPlan(id: string, mealPlanData: Partial<InsertMealPlan>): Promise<MealPlan> {
    const [mealPlan] = await db
      .update(mealPlans)
      .set({ ...mealPlanData, updatedAt: new Date() })
      .where(eq(mealPlans.id, id))
      .returning();
    return mealPlan;
  }

  async deleteMealPlan(id: string): Promise<void> {
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
  }

  async getUserMealPlans(userId: string): Promise<MealPlan[]> {
    return await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, userId))
      .orderBy(desc(mealPlans.startDate));
  }

  // Planned meals
  async createPlannedMeal(plannedMealData: InsertPlannedMeal): Promise<PlannedMeal> {
    const [plannedMeal] = await db
      .insert(plannedMeals)
      .values(plannedMealData)
      .returning();
    return plannedMeal;
  }

  async updatePlannedMeal(id: string, plannedMealData: Partial<InsertPlannedMeal>): Promise<PlannedMeal> {
    const [plannedMeal] = await db
      .update(plannedMeals)
      .set(plannedMealData)
      .where(eq(plannedMeals.id, id))
      .returning();
    return plannedMeal;
  }

  async deletePlannedMeal(id: string): Promise<void> {
    await db.delete(plannedMeals).where(eq(plannedMeals.id, id));
  }

  async getMealPlanMeals(mealPlanId: string): Promise<PlannedMeal[]> {
    return await db
      .select()
      .from(plannedMeals)
      .where(eq(plannedMeals.mealPlanId, mealPlanId))
      .orderBy(plannedMeals.plannedDate, plannedMeals.mealType);
  }

  async getPlannedMealsForDate(userId: string, date: Date): Promise<PlannedMeal[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select({
        id: plannedMeals.id,
        mealPlanId: plannedMeals.mealPlanId,
        recipeId: plannedMeals.recipeId,
        customMealName: plannedMeals.customMealName,
        mealType: plannedMeals.mealType,
        plannedDate: plannedMeals.plannedDate,
        servings: plannedMeals.servings,
        notes: plannedMeals.notes,
        isCompleted: plannedMeals.isCompleted,
        createdAt: plannedMeals.createdAt,
      })
      .from(plannedMeals)
      .innerJoin(mealPlans, eq(plannedMeals.mealPlanId, mealPlans.id))
      .where(
        and(
          eq(mealPlans.userId, userId),
          gte(plannedMeals.plannedDate, startOfDay),
          lt(plannedMeals.plannedDate, endOfDay)
        )
      )
      .orderBy(plannedMeals.mealType);
  }

  // Cooking timers
  async createCookingTimer(timerData: InsertCookingTimer): Promise<CookingTimer> {
    const [timer] = await db
      .insert(cookingTimers)
      .values(timerData)
      .returning();
    return timer;
  }

  async updateCookingTimer(id: string, timerData: Partial<InsertCookingTimer>): Promise<CookingTimer> {
    const [timer] = await db
      .update(cookingTimers)
      .set(timerData)
      .where(eq(cookingTimers.id, id))
      .returning();
    return timer;
  }

  async deleteCookingTimer(id: string): Promise<void> {
    await db.delete(cookingTimers).where(eq(cookingTimers.id, id));
  }

  async getUserActiveTimers(userId: string): Promise<CookingTimer[]> {
    return await db
      .select()
      .from(cookingTimers)
      .where(
        and(
          eq(cookingTimers.userId, userId),
          eq(cookingTimers.isActive, true)
        )
      )
      .orderBy(cookingTimers.startedAt);
  }

  // Recipe sharing
  async createRecipeShare(shareData: InsertRecipeShare): Promise<RecipeShare> {
    const [share] = await db
      .insert(recipeShares)
      .values(shareData)
      .returning();
    return share;
  }

  async getRecipeShares(recipeId: string): Promise<RecipeShare[]> {
    return await db
      .select()
      .from(recipeShares)
      .where(eq(recipeShares.recipeId, recipeId))
      .orderBy(desc(recipeShares.createdAt));
  }

  async getUserRecipeShares(userId: string): Promise<RecipeShare[]> {
    return await db
      .select()
      .from(recipeShares)
      .where(eq(recipeShares.sharedBy, userId))
      .orderBy(desc(recipeShares.createdAt));
  }

  // Recipe history
  async recordRecipeAction(historyData: InsertUserRecipeHistory): Promise<UserRecipeHistory> {
    const [history] = await db
      .insert(userRecipeHistory)
      .values(historyData)
      .returning();
    return history;
  }

  async getUserRecipeHistory(userId: string, limit: number = 50): Promise<UserRecipeHistory[]> {
    return await db
      .select()
      .from(userRecipeHistory)
      .where(eq(userRecipeHistory.userId, userId))
      .orderBy(desc(userRecipeHistory.createdAt))
      .limit(limit);
  }

  async getRecentlyViewedRecipes(userId: string, limit: number = 10): Promise<Recipe[]> {
    const historyEntries = await db
      .select({
        recipeId: userRecipeHistory.recipeId,
        createdAt: userRecipeHistory.createdAt,
      })
      .from(userRecipeHistory)
      .where(
        and(
          eq(userRecipeHistory.userId, userId),
          eq(userRecipeHistory.action, 'viewed')
        )
      )
      .orderBy(desc(userRecipeHistory.createdAt))
      .limit(limit);
    
    const recipeIds = historyEntries.map(entry => entry.recipeId);
    if (recipeIds.length === 0) return [];
    
    const recipeResults = [];
    for (const recipeId of recipeIds) {
      const recipe = await this.getRecipeById(recipeId);
      if (recipe) recipeResults.push(recipe);
    }
    return recipeResults;
  }

  async getRecentlyCookedRecipes(userId: string, limit: number = 10): Promise<Recipe[]> {
    const historyEntries = await db
      .select({
        recipeId: userRecipeHistory.recipeId,
        createdAt: userRecipeHistory.createdAt,
      })
      .from(userRecipeHistory)
      .where(
        and(
          eq(userRecipeHistory.userId, userId),
          eq(userRecipeHistory.action, 'cooked')
        )
      )
      .orderBy(desc(userRecipeHistory.createdAt))
      .limit(limit);
    
    const recipeIds = historyEntries.map(entry => entry.recipeId);
    if (recipeIds.length === 0) return [];
    
    const recipeResults = [];
    for (const recipeId of recipeIds) {
      const recipe = await this.getRecipeById(recipeId);
      if (recipe) recipeResults.push(recipe);
    }
    return recipeResults;
  }
}

export const storage = new DatabaseStorage();
