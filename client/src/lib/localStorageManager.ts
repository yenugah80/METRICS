/**
 * Complete Local Storage Management System
 * Replaces all JWT/server dependencies with local browser storage
 * Provides full app functionality without authentication
 */

export interface LocalUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profileImageUrl?: string;
  isPremium: boolean;
  createdAt: string;
  
  // Preferences
  dietPreferences: string[];
  allergens: string[];
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyCarbGoal: number;
  dailyFatGoal: number;
  activityLevel: string;
  
  // Notifications
  notifications: {
    email: boolean;
    push: boolean;
    meal_reminders: boolean;
    goal_achievements: boolean;
  };
}

export interface LocalMeal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  createdAt: string;
  
  // Nutrition
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  
  // Analysis
  nutritionScore?: number;
  sustainabilityScore?: number;
  ingredients?: any[];
  allergens?: string[];
  dietCompatibility?: string[];
}

export interface LocalRecipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  ingredients: any[];
  instructions: any[];
  tags?: string[];
  difficulty?: string;
  category?: string;
  cuisine?: string;
  estimatedCalories?: number;
  estimatedProtein?: number;
  estimatedCarbs?: number;
  estimatedFat?: number;
  nutritionGrade?: string;
  isPremium: boolean;
  isPublic: boolean;
  isSaved: boolean;
  createdAt: string;
}

export interface LocalGamification {
  userId: string;
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    unlockedAt: string;
  }>;
  stats: {
    totalMealsLogged: number;
    recipesGenerated: number;
    avgNutritionScore: number;
    voiceInputsUsed: number;
  };
}

export interface LocalProgress {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealsLogged: number;
  nutritionScore: number;
  xpEarned: number;
}

class LocalStorageManager {
  private static instance: LocalStorageManager;
  private readonly STORAGE_KEYS = {
    USER: 'nutrition_app_user',
    MEALS: 'nutrition_app_meals',
    RECIPES: 'nutrition_app_recipes',
    SAVED_RECIPES: 'nutrition_app_saved_recipes',
    GAMIFICATION: 'nutrition_app_gamification',
    DAILY_PROGRESS: 'nutrition_app_daily_progress',
    SETTINGS: 'nutrition_app_settings'
  };

  static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  // ===========================
  // USER MANAGEMENT (No Auth Required)
  // ===========================
  
  initializeGuestUser(): LocalUser {
    const existingUser = this.getUser();
    if (existingUser) return existingUser;
    
    const guestUser: LocalUser = {
      id: `guest_${Date.now()}`,
      firstName: 'Guest',
      lastName: 'User',
      isPremium: false,
      createdAt: new Date().toISOString(),
      dietPreferences: [],
      allergens: [],
      dailyCalorieGoal: 2000,
      dailyProteinGoal: 150,
      dailyCarbGoal: 250,
      dailyFatGoal: 65,
      activityLevel: 'moderate',
      notifications: {
        email: false,
        push: true,
        meal_reminders: true,
        goal_achievements: true
      }
    };
    
    this.setUser(guestUser);
    this.initializeGamification(guestUser.id);
    return guestUser;
  }

  getUser(): LocalUser | null {
    const userData = localStorage.getItem(this.STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  }

  setUser(user: LocalUser): void {
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
  }

  updateUser(updates: Partial<LocalUser>): LocalUser {
    const currentUser = this.getUser();
    if (!currentUser) throw new Error('No user found');
    
    const updatedUser = { ...currentUser, ...updates };
    this.setUser(updatedUser);
    return updatedUser;
  }

  // ===========================
  // MEAL TRACKING
  // ===========================
  
  getMeals(): LocalMeal[] {
    const mealsData = localStorage.getItem(this.STORAGE_KEYS.MEALS);
    return mealsData ? JSON.parse(mealsData) : [];
  }

  addMeal(meal: Omit<LocalMeal, 'id' | 'userId' | 'createdAt'>): LocalMeal {
    const user = this.getUser();
    if (!user) throw new Error('User required');
    
    const newMeal: LocalMeal = {
      ...meal,
      id: `meal_${Date.now()}`,
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    
    const meals = this.getMeals();
    meals.push(newMeal);
    localStorage.setItem(this.STORAGE_KEYS.MEALS, JSON.stringify(meals));
    
    // Update daily progress
    this.updateDailyProgress(newMeal);
    
    // Award XP for logging meal
    this.awardXP(25, 'meal_logged');
    
    return newMeal;
  }

  getTodaysMeals(): LocalMeal[] {
    const today = new Date().toDateString();
    return this.getMeals().filter(meal => 
      new Date(meal.createdAt).toDateString() === today
    );
  }

  // ===========================
  // RECIPE MANAGEMENT
  // ===========================
  
  getRecipes(): LocalRecipe[] {
    const recipesData = localStorage.getItem(this.STORAGE_KEYS.RECIPES);
    return recipesData ? JSON.parse(recipesData) : [];
  }

  addRecipe(recipe: Omit<LocalRecipe, 'id' | 'createdAt' | 'isSaved'>): LocalRecipe {
    const newRecipe: LocalRecipe = {
      ...recipe,
      id: `recipe_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isSaved: false
    };
    
    const recipes = this.getRecipes();
    recipes.push(newRecipe);
    localStorage.setItem(this.STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    
    // Award XP for generating recipe
    this.awardXP(50, 'recipe_generated');
    
    return newRecipe;
  }

  getSavedRecipes(): string[] {
    const savedData = localStorage.getItem(this.STORAGE_KEYS.SAVED_RECIPES);
    return savedData ? JSON.parse(savedData) : [];
  }

  toggleRecipeSave(recipeId: string): boolean {
    const savedRecipes = this.getSavedRecipes();
    const isSaved = savedRecipes.includes(recipeId);
    
    if (isSaved) {
      const index = savedRecipes.indexOf(recipeId);
      savedRecipes.splice(index, 1);
    } else {
      savedRecipes.push(recipeId);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(savedRecipes));
    return !isSaved;
  }

  // ===========================
  // GAMIFICATION SYSTEM
  // ===========================
  
  initializeGamification(userId: string): LocalGamification {
    const gamification: LocalGamification = {
      userId,
      totalXP: 0,
      currentLevel: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastLoginDate: new Date().toDateString(),
      badges: [],
      stats: {
        totalMealsLogged: 0,
        recipesGenerated: 0,
        avgNutritionScore: 0,
        voiceInputsUsed: 0
      }
    };
    
    localStorage.setItem(this.STORAGE_KEYS.GAMIFICATION, JSON.stringify(gamification));
    return gamification;
  }

  getGamification(): LocalGamification | null {
    const gamificationData = localStorage.getItem(this.STORAGE_KEYS.GAMIFICATION);
    return gamificationData ? JSON.parse(gamificationData) : null;
  }

  awardXP(amount: number, reason: string): LocalGamification {
    let gamification = this.getGamification();
    if (!gamification) {
      const user = this.getUser();
      if (!user) throw new Error('User required');
      gamification = this.initializeGamification(user.id);
    }
    
    gamification.totalXP += amount;
    
    // Calculate level (100 XP per level)
    const newLevel = Math.floor(gamification.totalXP / 100) + 1;
    if (newLevel > gamification.currentLevel) {
      gamification.currentLevel = newLevel;
      // Award level up badge if applicable
      this.checkAndAwardBadges(gamification);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.GAMIFICATION, JSON.stringify(gamification));
    return gamification;
  }

  private checkAndAwardBadges(gamification: LocalGamification): void {
    const meals = this.getMeals();
    const totalMeals = meals.length;
    
    // Award badges based on achievements
    const badges = [
      { id: 'first_meal', threshold: 1, name: 'First Bite', description: 'Log your first meal', icon: '🍽️', tier: 'bronze' as const },
      { id: 'meals_10', threshold: 10, name: 'Getting Started', description: 'Log 10 meals', icon: '📝', tier: 'bronze' as const },
      { id: 'meals_50', threshold: 50, name: 'Consistent Logger', description: 'Log 50 meals', icon: '📊', tier: 'silver' as const },
      { id: 'level_5', threshold: 5, name: 'Rising Star', description: 'Reach level 5', icon: '⭐', tier: 'silver' as const, checkLevel: true },
    ];
    
    badges.forEach(badge => {
      const alreadyAwarded = gamification.badges.some(b => b.id === badge.id);
      if (alreadyAwarded) return;
      
      const threshold = badge.checkLevel ? gamification.currentLevel : totalMeals;
      if (threshold >= badge.threshold) {
        gamification.badges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          tier: badge.tier,
          unlockedAt: new Date().toISOString()
        });
      }
    });
  }

  // ===========================
  // DAILY PROGRESS TRACKING
  // ===========================
  
  getDailyProgress(): LocalProgress[] {
    const progressData = localStorage.getItem(this.STORAGE_KEYS.DAILY_PROGRESS);
    return progressData ? JSON.parse(progressData) : [];
  }

  getTodaysProgress(): LocalProgress {
    const today = new Date().toDateString();
    const progressArray = this.getDailyProgress();
    
    let todaysProgress = progressArray.find(p => p.date === today);
    if (!todaysProgress) {
      todaysProgress = {
        date: today,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        mealsLogged: 0,
        nutritionScore: 0,
        xpEarned: 0
      };
      progressArray.push(todaysProgress);
      localStorage.setItem(this.STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(progressArray));
    }
    
    return todaysProgress;
  }

  private updateDailyProgress(meal: LocalMeal): void {
    const progress = this.getTodaysProgress();
    
    progress.calories += meal.calories;
    progress.protein += meal.protein;
    progress.carbs += meal.carbs;
    progress.fat += meal.fat;
    progress.mealsLogged += 1;
    
    // Calculate nutrition score (simplified)
    const calorieRatio = Math.min(progress.calories / 2000, 1);
    const proteinRatio = Math.min(progress.protein / 150, 1);
    const balanceScore = (calorieRatio + proteinRatio) / 2;
    progress.nutritionScore = Math.round(balanceScore * 100);
    
    const progressArray = this.getDailyProgress();
    const index = progressArray.findIndex(p => p.date === progress.date);
    if (index >= 0) {
      progressArray[index] = progress;
    } else {
      progressArray.push(progress);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(progressArray));
  }

  // ===========================
  // FITNESS DASHBOARD DATA
  // ===========================
  
  getFitnessDashboardData() {
    const user = this.getUser();
    const todaysProgress = this.getTodaysProgress();
    const gamification = this.getGamification();
    
    return {
      todayStats: {
        calories: todaysProgress.calories,
        calorieGoal: user?.dailyCalorieGoal || 2000,
        protein: todaysProgress.protein,
        proteinGoal: user?.dailyProteinGoal || 150,
        carbs: todaysProgress.carbs,
        carbGoal: user?.dailyCarbGoal || 250,
        fat: todaysProgress.fat,
        fatGoal: user?.dailyFatGoal || 65,
        nutritionScore: todaysProgress.nutritionScore
      },
      gamification: gamification || this.initializeGamification(user?.id || 'guest'),
      weeklyProgress: this.getWeeklyProgress(),
      achievements: gamification?.badges || []
    };
  }

  private getWeeklyProgress() {
    const progressArray = this.getDailyProgress();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const progress = progressArray.find(p => p.date === dateStr);
      last7Days.push({
        date: dateStr,
        calories: progress?.calories || 0,
        nutritionScore: progress?.nutritionScore || 0,
        mealsLogged: progress?.mealsLogged || 0
      });
    }
    
    return last7Days;
  }

  // ===========================
  // UTILITY METHODS
  // ===========================
  
  exportData(): string {
    const data = {
      user: this.getUser(),
      meals: this.getMeals(),
      recipes: this.getRecipes(),
      savedRecipes: this.getSavedRecipes(),
      gamification: this.getGamification(),
      dailyProgress: this.getDailyProgress(),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.user) localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(data.user));
      if (data.meals) localStorage.setItem(this.STORAGE_KEYS.MEALS, JSON.stringify(data.meals));
      if (data.recipes) localStorage.setItem(this.STORAGE_KEYS.RECIPES, JSON.stringify(data.recipes));
      if (data.savedRecipes) localStorage.setItem(this.STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(data.savedRecipes));
      if (data.gamification) localStorage.setItem(this.STORAGE_KEYS.GAMIFICATION, JSON.stringify(data.gamification));
      if (data.dailyProgress) localStorage.setItem(this.STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(data.dailyProgress));
      
    } catch (error) {
      throw new Error('Invalid data format');
    }
  }

  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const localStorageManager = LocalStorageManager.getInstance();