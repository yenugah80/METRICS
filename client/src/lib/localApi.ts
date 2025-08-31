/**
 * Local API System - Replaces all server API calls
 * Provides same interface as server API but uses localStorage
 */

import { localStorageManager } from './localStorageManager';
import { queryClient } from './queryClient';

// Mock API response structure for compatibility
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class LocalAPI {
  // ===========================
  // DASHBOARD API
  // ===========================
  
  static getDashboardFitness(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawData = localStorageManager.getFitnessDashboardData();
        
        // Map local data structure to expected dashboard format
        const mappedData = {
          todayStats: {
            calories: rawData.todayStats?.calories || 0,
            caloriesGoal: rawData.todayStats?.calorieGoal || 2000,
            protein: rawData.todayStats?.protein || 0,
            proteinGoal: rawData.todayStats?.proteinGoal || 150,
            carbs: rawData.todayStats?.carbs || 0,
            carbsGoal: rawData.todayStats?.carbGoal || 250,
            fat: rawData.todayStats?.fat || 0,
            fatGoal: rawData.todayStats?.fatGoal || 65,
            fiber: 0,
            fiberGoal: 25,
            nutritionScore: rawData.todayStats?.nutritionScore || 0
          },
          gamification: {
            level: rawData.gamification?.currentLevel || 1,
            currentXP: rawData.gamification?.totalXP || 0,
            xpForNextLevel: Math.max(0, (rawData.gamification?.currentLevel || 1) * 100 - (rawData.gamification?.totalXP || 0)),
            totalXPNeeded: (rawData.gamification?.currentLevel || 1) * 100,
            currentStreak: rawData.gamification?.currentStreak || 0,
            longestStreak: rawData.gamification?.longestStreak || 0,
            badges: rawData.gamification?.badges?.map(b => b.id) || [],
            recentXP: []
          },
          recentMeals: [],
          remaining: {
            calories: Math.max(0, (rawData.todayStats?.calorieGoal || 2000) - (rawData.todayStats?.calories || 0)),
            protein: Math.max(0, (rawData.todayStats?.proteinGoal || 150) - (rawData.todayStats?.protein || 0)),
            carbs: Math.max(0, (rawData.todayStats?.carbGoal || 250) - (rawData.todayStats?.carbs || 0)),
            fat: Math.max(0, (rawData.todayStats?.fatGoal || 65) - (rawData.todayStats?.fat || 0))
          }
        };
        
        resolve(mappedData);
      }, 100);
    });
  }

  // ===========================
  // GAMIFICATION API
  // ===========================
  
  static getGamificationStatus(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawGamification = localStorageManager.getGamification();
        const gamification = rawGamification || localStorageManager.initializeGamification('guest');
        
        // Map to expected format
        const mappedStatus = {
          level: gamification.currentLevel || 1,
          currentXP: gamification.totalXP || 0,
          xpForNextLevel: Math.max(0, (gamification.currentLevel || 1) * 100 - (gamification.totalXP || 0)),
          totalXPNeeded: (gamification.currentLevel || 1) * 100,
          currentStreak: gamification.currentStreak || 0,
          longestStreak: gamification.longestStreak || 0,
          badges: gamification.badges || [],
          recentXP: []
        };
        
        resolve({
          success: true,
          status: mappedStatus
        });
      }, 50);
    });
  }

  static awardXP(eventType: string, xpAmount: number, reason: string): Promise<ApiResponse<any>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedGamification = localStorageManager.awardXP(xpAmount, reason);
        
        // Invalidate relevant queries to update UI immediately
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['gamification'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        
        resolve({
          success: true,
          data: { xpAwarded: xpAmount },
          message: `+${xpAmount} XP earned!`
        });
      }, 50);
    });
  }

  // ===========================
  // SMART PORTIONS API
  // ===========================
  
  static getRemainingMacros(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = localStorageManager.getUser();
        const todaysProgress = localStorageManager.getTodaysProgress();
        
        if (!user) {
          resolve({
            success: false,
            message: 'User not found'
          });
          return;
        }

        const remaining = {
          calories: Math.max(0, user.dailyCalorieGoal - todaysProgress.calories),
          protein: Math.max(0, user.dailyProteinGoal - todaysProgress.protein),
          carbs: Math.max(0, (user.dailyCarbGoal || 200) - todaysProgress.carbs),
          fat: Math.max(0, user.dailyFatGoal - todaysProgress.fat)
        };

        resolve({
          success: true,
          goals: {
            dailyCalorieGoal: user.dailyCalorieGoal,
            dailyProteinGoal: user.dailyProteinGoal,
            dailyCarbGoal: user.dailyCarbGoal,
            dailyFatGoal: user.dailyFatGoal
          },
          consumed: {
            calories: todaysProgress.calories,
            protein: todaysProgress.protein,
            carbs: todaysProgress.carbs,
            fat: todaysProgress.fat
          },
          remaining
        });
      }, 50);
    });
  }

  // ===========================
  // PROFILE API
  // ===========================
  
  static getProfile(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = localStorageManager.getUser();
        if (!user) {
          resolve(null);
          return;
        }

        // Map to expected profile format
        const profile = {
          id: user.id,
          userId: user.id,
          email: user.email || '',
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          isPremium: user.isPremium,
          dietPreferences: user.dietPreferences,
          allergens: user.allergens,
          dailyCalorieTarget: user.dailyCalorieGoal,
          dailyProteinTarget: user.dailyProteinGoal,
          dailyCarbTarget: user.dailyCarbGoal,
          dailyFatTarget: user.dailyFatGoal,
          activityLevel: user.activityLevel,
          recipesGenerated: localStorageManager.getRecipes().length,
          notifications: user.notifications
        };

        resolve(profile);
      }, 50);
    });
  }

  static updateProfile(updates: any): Promise<ApiResponse<any>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // Map front-end field names to local storage field names
          const mappedUpdates = {
            firstName: updates.firstName,
            lastName: updates.lastName,
            email: updates.email,
            dietPreferences: updates.dietaryPreferences || updates.dietPreferences,
            allergens: updates.allergies || updates.allergens,
            dailyCalorieGoal: updates.dailyCalorieTarget || updates.dailyCalorieGoal,
            dailyProteinGoal: updates.dailyProteinTarget || updates.dailyProteinGoal,
            dailyCarbGoal: updates.dailyCarbTarget || updates.dailyCarbGoal,
            dailyFatGoal: updates.dailyFatTarget || updates.dailyFatGoal,
            activityLevel: updates.activityLevel,
            notifications: updates.notifications
          };

          // Remove undefined values
          Object.keys(mappedUpdates).forEach(key => {
            if ((mappedUpdates as any)[key] === undefined) {
              delete (mappedUpdates as any)[key];
            }
          });

          localStorageManager.updateUser(mappedUpdates);
          
          resolve({
            success: true,
            message: 'Profile updated successfully'
          });
        } catch (error) {
          resolve({
            success: false,
            message: 'Failed to update profile'
          });
        }
      }, 100);
    });
  }

  // ===========================
  // RECIPES API
  // ===========================
  
  static getRecipes(): Promise<any[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const recipes = localStorageManager.getRecipes();
        const savedRecipes = localStorageManager.getSavedRecipes();
        
        // Mark saved recipes
        const recipesWithSavedStatus = recipes.map(recipe => ({
          ...recipe,
          isSaved: savedRecipes.includes(recipe.id)
        }));
        
        resolve(recipesWithSavedStatus);
      }, 100);
    });
  }

  static saveRecipe(recipeId: string, action: 'save' | 'unsave'): Promise<ApiResponse<any>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isSaved = localStorageManager.toggleRecipeSave(recipeId);
        
        resolve({
          success: true,
          message: isSaved ? 'Recipe saved!' : 'Recipe removed from saved list',
          data: { isSaved }
        });
      }, 50);
    });
  }

  static generateRecipe(prompt: string): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a mock recipe for demonstration
        const recipes = [
          {
            title: "AI-Generated Healthy Bowl",
            description: "A nutritious bowl packed with fresh ingredients",
            prepTime: 15,
            cookTime: 20,
            servings: 2,
            ingredients: [
              { name: "Quinoa", amount: "1 cup", unit: "cup" },
              { name: "Mixed vegetables", amount: "2 cups", unit: "cup" },
              { name: "Olive oil", amount: "2 tbsp", unit: "tbsp" }
            ],
            instructions: [
              { step: 1, description: "Cook quinoa according to package instructions" },
              { step: 2, description: "Sauté vegetables in olive oil" },
              { step: 3, description: "Combine and serve hot" }
            ],
            estimatedCalories: 420,
            estimatedProtein: 18,
            estimatedCarbs: 65,
            estimatedFat: 12,
            cuisine: "Global Fusion",
            difficulty: "Easy",
            isPremium: false,
            isPublic: true
          }
        ];

        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        const newRecipe = localStorageManager.addRecipe(randomRecipe);
        
        resolve(newRecipe);
      }, 1000); // Simulate AI generation time
    });
  }

  // ===========================
  // MEALS API
  // ===========================
  
  static logMeal(mealData: any): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const meal = localStorageManager.addMeal({
          name: mealData.name || 'Logged Meal',
          description: mealData.description,
          mealType: mealData.mealType || 'lunch',
          calories: mealData.calories || 300,
          protein: mealData.protein || 20,
          carbs: mealData.carbs || 40,
          fat: mealData.fat || 10,
          nutritionScore: mealData.nutritionScore || 75
        });
        
        // Invalidate queries to update UI after meal logging
        queryClient.invalidateQueries({ queryKey: ['meals'] });
        queryClient.invalidateQueries({ queryKey: ['daily-progress'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        
        resolve(meal);
      }, 100);
    });
  }

  static getTodaysMeals(): Promise<any[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const meals = localStorageManager.getTodaysMeals();
        resolve(meals);
      }, 50);
    });
  }

  // ===========================
  // UTILITY METHODS
  // ===========================
  
  static testXP(): Promise<ApiResponse<any>> {
    return this.awardXP('test', 25, 'Test XP button clicked!');
  }

  static syncProgress(): Promise<ApiResponse<any>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate sync success since everything is already local
        resolve({
          success: true,
          message: 'Progress synced locally! All data is saved in your browser.'
        });
      }, 500);
    });
  }
}

// Export for compatibility with existing code
export const localApi = LocalAPI;