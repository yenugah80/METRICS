import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  decimal,
  boolean,
  text,
  uuid,
  real,
  date,
  unique,
  time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Meal Logging & Scanner Integration Tables

// Daily meal logs - stores all scanned/logged meals
export const mealLogs = pgTable("meal_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  loggedDate: date("logged_date").notNull(), // Date the meal was eaten (YYYY-MM-DD)
  mealType: varchar("meal_type", { length: 20 }).notNull(), // breakfast, lunch, dinner, snack
  
  // Meal identification
  mealName: text("meal_name").notNull(),
  description: text("description"),
  source: varchar("source", { length: 20 }).default("scan"), // scan, manual, voice, import
  
  // Structured nutrition data (converted from scan/input)
  nutritionData: jsonb("nutrition_data").$type<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
    ingredients?: Array<{
      name: string;
      amount: number;
      unit: string;
      fdcId?: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  }>().notNull(),
  
  // Photo and metadata
  photoUrl: varchar("photo_url"),
  confidence: real("confidence").default(0.95), // AI confidence in analysis
  
  // Matching and completion status
  isCompleted: boolean("is_completed").default(true),
  wasMatched: boolean("was_matched").default(false), // Matched to planned meal
  matchedPlanMealId: varchar("matched_plan_meal_id"), // Reference to planned meal if matched
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_meal_logs_user_date").on(table.userId, table.loggedDate),
  index("idx_meal_logs_meal_type").on(table.mealType),
]);

// Meal matching history - tracks automatic matching between scanned and planned meals
export const mealMatches = pgTable("meal_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mealLogId: varchar("meal_log_id").notNull().references(() => mealLogs.id, { onDelete: "cascade" }),
  planMealId: varchar("plan_meal_id").notNull(), // Reference to diet plan meal
  
  // Matching algorithm results
  matchScore: real("match_score").notNull(), // 0.0 to 1.0 confidence score
  matchType: varchar("match_type", { length: 20 }).notNull(), // automatic, manual, rejected
  
  // Matching criteria used
  matchFactors: jsonb("match_factors").$type<{
    nameMatch: number;
    calorieMatch: number;
    macroMatch: number;
    timingMatch: number;
    ingredientMatch?: number;
  }>(),
  
  // User feedback
  userConfirmed: boolean("user_confirmed"), // User approved the match
  userFeedback: varchar("user_feedback", { length: 50 }), // correct, wrong_meal, wrong_portion, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_meal_matches_user").on(table.userId),
  index("idx_meal_matches_score").on(table.matchScore),
]);

// My Meals - saved favorite meals for quick reuse
export const myMeals = pgTable("my_meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Meal details
  mealName: text("meal_name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 20 }).default("custom"), // breakfast, lunch, dinner, snack, custom
  
  // Nutrition (standardized per serving)
  nutritionData: jsonb("nutrition_data").$type<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
    servingSize: string;
    servingUnit: string;
    ingredients?: Array<{
      name: string;
      amount: number;
      unit: string;
      fdcId?: string;
    }>;
  }>().notNull(),
  
  // Usage tracking for AI learning
  timesUsed: integer("times_used").default(0),
  lastUsed: timestamp("last_used"),
  avgRating: real("avg_rating"), // User satisfaction 1-5
  
  // Recipe and preparation
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  difficulty: varchar("difficulty", { length: 10 }).default("easy"), // easy, medium, hard
  instructions: text("instructions"),
  
  // Tags and metadata
  tags: jsonb("tags").$type<string[]>().default([]),
  photoUrl: varchar("photo_url"),
  isRecipe: boolean("is_recipe").default(false), // Recipe vs simple meal
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_my_meals_user").on(table.userId),
  index("idx_my_meals_category").on(table.category),
  index("idx_my_meals_usage").on(table.timesUsed),
]);

// Meal swaps tracking - for AI learning and plan adaptation
export const mealSwaps = pgTable("meal_swaps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Original and replacement meals
  originalPlanMealId: varchar("original_plan_meal_id").notNull(), // What was planned
  swappedToMealId: varchar("swapped_to_meal_id"), // What they actually ate (meal_logs.id)
  swappedToMyMealId: varchar("swapped_to_my_meal_id"), // Or a saved "My Meal"
  
  // Swap metadata
  swapReason: varchar("swap_reason", { length: 30 }).notNull(), // preference, unavailable, time, health, etc.
  swapDate: date("swap_date").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 for pattern analysis
  mealType: varchar("meal_type", { length: 20 }).notNull(),
  
  // Nutrition comparison (for AI learning)
  originalNutrition: jsonb("original_nutrition").$type<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>(),
  swappedNutrition: jsonb("swapped_nutrition").$type<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>(),
  
  // User satisfaction tracking
  userRating: integer("user_rating"), // 1-5 stars for the swap
  wouldRepeat: boolean("would_repeat"), // Would make this swap again
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_meal_swaps_user").on(table.userId),
  index("idx_meal_swaps_reason").on(table.swapReason),
  index("idx_meal_swaps_date").on(table.swapDate),
]);

// Daily nutrition aggregates - real-time dashboard data
export const dailyNutritionLogs = pgTable("daily_nutrition_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  
  // Aggregated totals from meal_logs
  totalCalories: integer("total_calories").default(0),
  totalProtein: real("total_protein").default(0),
  totalCarbs: real("total_carbs").default(0),
  totalFat: real("total_fat").default(0),
  totalFiber: real("total_fiber").default(0),
  totalSodium: real("total_sodium").default(0),
  
  // Progress tracking
  calorieGoal: integer("calorie_goal").notNull(),
  proteinGoal: real("protein_goal").notNull(),
  carbGoal: real("carb_goal").notNull(),
  fatGoal: real("fat_goal").notNull(),
  
  // Meal completion tracking
  mealsLogged: integer("meals_logged").default(0),
  mealsPlanned: integer("meals_planned").default(0),
  planComplianceScore: real("plan_compliance_score").default(0), // 0-1
  
  // AI insights
  aiInsights: jsonb("ai_insights").$type<{
    summary: string;
    recommendations: string[];
    alerts: string[];
    macroBalance: "good" | "high_carb" | "high_fat" | "high_protein" | "low_calorie";
  }>(),
  
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => [
  unique("unique_user_date").on(table.userId, table.logDate),
  index("idx_daily_nutrition_user").on(table.userId),
  index("idx_daily_nutrition_date").on(table.logDate),
]);

// Users table with comprehensive profile data
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // For email/password authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  isEmailVerified: boolean("is_email_verified").default(false),
  
  // User preferences and settings - MATHEMATICALLY CONSISTENT
  dailyCalorieGoal: integer("daily_calorie_goal").default(2000),
  dailyProteinGoal: integer("daily_protein_goal").default(150), // 30% of 2000kcal = 600kcal / 4 = 150g
  dailyCarbGoal: integer("daily_carb_goal").default(200),     // 40% of 2000kcal = 800kcal / 4 = 200g
  dailyFatGoal: integer("daily_fat_goal").default(67),       // 30% of 2000kcal = 600kcal / 9 = 67g
  
  // Micronutrient goals (USDA 2020-2025 DRV)
  dailyFiberGoal: integer("daily_fiber_goal").default(28),
  dailySodiumGoal: integer("daily_sodium_goal").default(2300), // mg
  dailySugarGoal: integer("daily_sugar_goal").default(50),    // g added sugars
  dailyIronGoal: real("daily_iron_goal").default(18),         // mg
  dailyCalciumGoal: integer("daily_calcium_goal").default(1000), // mg
  dailyVitaminDGoal: real("daily_vitamin_d_goal").default(20), // mcg
  
  // Macro strategy for consistency
  macroStrategy: varchar("macro_strategy", { length: 20 }).default('percent'), // 'percent' | 'per_kg' | 'absolute'
  macroTargets: jsonb("macro_targets").$type<{protein: number, carb: number, fat: number}>().default({protein: 30, carb: 40, fat: 30}), // percentages
  
  // Dietary preferences - structured for production ETL matching
  dietPreferences: jsonb("diet_preferences").$type<string[]>().default([]), // ["vegetarian","keto","gluten_free"]
  allergens: jsonb("allergens").$type<string[]>().default([]), // ["peanuts","dairy","shellfish"]
  healthGoals: jsonb("health_goals").$type<{primary: string, secondary?: string[]}>().default({primary: "maintenance"}),
  fastingWindow: jsonb("fasting_window").$type<{start: string, end: string}>(), // {start:"20:00",end:"12:00"}
  cuisinePreferences: jsonb("cuisine_preferences").$type<string[]>().default([]),
  
  // Profile data
  height: integer("height"), // in cm
  weight: real("weight"), // in kg
  age: integer("age"),
  gender: varchar("gender", { length: 10 }),
  activityLevel: varchar("activity_level", { length: 20 }).default('moderate'),
  
  // Subscription data
  stripeCustomerId: varchar("stripe_customer_id"),
  subscriptionStatus: varchar("subscription_status"),
  subscriptionId: varchar("subscription_id"),
  
  // Gamification & Usage Tracking
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalMealsLogged: integer("total_meals_logged").default(0),
  recipesGenerated: integer("recipes_generated").default(0),
  freeRecipesUsed: integer("free_recipes_used").default(0),
  badges: jsonb("badges").$type<string[]>().default([]),
  
  // Premium trial
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  isTrialActive: boolean("is_trial_active").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  lastActiveDate: date("last_active_date"),
  
  // AI Learning & Meal Preferences
  mealSwaps: jsonb("meal_swaps").$type<Array<{from: string, to: string, count: number}>>().default([]),
  favoriteFoods: jsonb("favorite_foods").$type<string[]>().default([]),
  preferredProteins: jsonb("preferred_proteins").$type<string[]>().default([]),
  dislikedFoods: jsonb("disliked_foods").$type<string[]>().default([]),
});

// Food database with comprehensive nutrition data
export const foods = pgTable("foods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  brand: varchar("brand"),
  barcode: varchar("barcode"),
  category: varchar("category"),
  
  // Nutrition per 100g
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbohydrates: real("carbohydrates").notNull(),
  fat: real("fat").notNull(),
  fiber: real("fiber"),
  sugar: real("sugar"),
  sodium: real("sodium"),
  saturatedFat: real("saturated_fat"),
  transFat: real("trans_fat"),
  cholesterol: real("cholesterol"),
  
  // Vitamins and minerals (per 100g)
  vitaminA: real("vitamin_a"),
  vitaminC: real("vitamin_c"),
  vitaminD: real("vitamin_d"),
  vitaminE: real("vitamin_e"),
  vitaminK: real("vitamin_k"),
  thiamine: real("thiamine"),
  riboflavin: real("riboflavin"),
  niacin: real("niacin"),
  vitaminB6: real("vitamin_b6"),
  folate: real("folate"),
  vitaminB12: real("vitamin_b12"),
  calcium: real("calcium"),
  iron: real("iron"),
  magnesium: real("magnesium"),
  phosphorus: real("phosphorus"),
  potassium: real("potassium"),
  zinc: real("zinc"),
  
  // Sustainability data
  carbonFootprint: real("carbon_footprint"), // kg CO2 per 100g
  waterFootprint: real("water_footprint"), // liters per 100g
  sustainabilityScore: real("sustainability_score"), // 1-10 scale
  
  // Data source and quality
  dataSource: varchar("data_source").default('usda'),
  verified: boolean("verified").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  barcodeIdx: index("foods_barcode_idx").on(table.barcode),
  nameIdx: index("foods_name_idx").on(table.name),
  categoryIdx: index("foods_category_idx").on(table.category),
}));

// Meals table for meal logging
export const meals = pgTable("meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  name: varchar("name"),
  mealType: varchar("meal_type").notNull(), // breakfast, lunch, dinner, snack
  description: text("description"),
  
  // Meal logging method
  loggedVia: varchar("logged_via").notNull(), // photo, voice, manual, barcode
  imageUrl: varchar("image_url"),
  voiceTranscript: text("voice_transcript"),
  
  // Total nutrition calculated from meal items
  totalCalories: real("total_calories").default(0),
  totalProtein: real("total_protein").default(0),
  totalCarbs: real("total_carbs").default(0),
  totalFat: real("total_fat").default(0),
  totalFiber: real("total_fiber").default(0),
  totalSodium: real("total_sodium").default(0),
  
  // Meal scoring
  nutritionScore: real("nutrition_score"), // 1-100
  sustainabilityScore: real("sustainability_score"), // 1-10
  
  // Metadata
  confidence: real("confidence"), // AI confidence score
  verified: boolean("verified").default(false),
  
  loggedAt: timestamp("logged_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("meals_user_id_idx").on(table.userId),
  loggedAtIdx: index("meals_logged_at_idx").on(table.loggedAt),
  mealTypeIdx: index("meals_meal_type_idx").on(table.mealType),
}));

// Individual food items within meals
export const mealItems = pgTable("meal_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealId: varchar("meal_id").references(() => meals.id, { onDelete: 'cascade' }).notNull(),
  foodId: varchar("food_id").references(() => foods.id),
  
  // Custom food data (if not in database)
  customFoodName: varchar("custom_food_name"),
  
  // Quantity and nutrition
  quantity: real("quantity").notNull(),
  unit: varchar("unit").notNull(), // g, ml, pieces, cups, etc.
  gramsEquivalent: real("grams_equivalent").notNull(),
  
  // Calculated nutrition for this portion
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  fiber: real("fiber"),
  sodium: real("sodium"),
  
  // AI confidence
  confidence: real("confidence"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  mealIdIdx: index("meal_items_meal_id_idx").on(table.mealId),
  foodIdIdx: index("meal_items_food_id_idx").on(table.foodId),
}));

// User goals and targets
export const userGoals = pgTable("user_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  goalType: varchar("goal_type").notNull(), // weight_loss, weight_gain, maintenance, muscle_gain
  targetWeight: real("target_weight"),
  targetDate: date("target_date"),
  
  // Daily targets
  dailyCalories: integer("daily_calories").notNull(),
  dailyProtein: integer("daily_protein").notNull(),
  dailyCarbs: integer("daily_carbs").notNull(),
  dailyFat: integer("daily_fat").notNull(),
  dailyFiber: integer("daily_fiber"),
  dailySodium: integer("daily_sodium"),
  
  // Activity goals
  weeklyWorkouts: integer("weekly_workouts").default(3),
  dailySteps: integer("daily_steps").default(10000),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_goals_user_id_idx").on(table.userId),
  goalTypeIdx: index("user_goals_goal_type_idx").on(table.goalType),
}));

// Daily nutrition tracking
// === ADVANCED TRACKING SYSTEMS FOR PRODUCTION-GRADE DASHBOARD ===

// Daily activity tracking for comprehensive wellness monitoring
export const dailyTracking = pgTable("daily_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  
  // Physical Activity Metrics
  steps: integer("steps").default(0),
  stepsGoal: integer("steps_goal").default(10000),
  activeMinutes: integer("active_minutes").default(0),
  caloriesBurned: integer("calories_burned").default(0),
  
  // Sleep Quality Metrics
  sleepHours: real("sleep_hours"),
  sleepQuality: integer("sleep_quality"), // 1-10 scale
  bedTime: time("bed_time"),
  wakeTime: time("wake_time"),
  
  // Hydration Tracking
  waterIntake: real("water_intake").default(0), // in liters
  waterGoal: real("water_goal").default(2.5), // in liters
  
  // Weight & Measurements
  weight: real("weight"),
  bodyFat: real("body_fat_percentage"),
  muscleMass: real("muscle_mass"),
  
  // Energy & Mood
  energyLevel: integer("energy_level"), // 1-10 scale
  moodScore: integer("mood_score"), // 1-10 scale
  stressLevel: integer("stress_level"), // 1-10 scale
  
  // Achievement Tracking
  dailyStreak: integer("daily_streak").default(0),
  goalsCompleted: integer("goals_completed").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workout tracking for fitness integration
export const workouts = pgTable("workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "cardio", "strength", "flexibility", "sports"
  duration: integer("duration"), // in minutes
  caloriesBurned: integer("calories_burned"),
  difficulty: varchar("difficulty", { length: 20 }), // "easy", "medium", "hard"
  
  // Exercise-specific metrics
  exercises: jsonb("exercises").$type<Array<{
    name: string;
    sets?: number;
    reps?: number;
    weight?: number;
    duration?: number;
    distance?: number;
  }>>(),
  
  // Progress tracking
  completionPercentage: integer("completion_percentage").default(100),
  personalRecord: boolean("personal_record").default(false),
  notes: text("notes"),
  
  // Performance metrics
  heartRateAvg: integer("heart_rate_avg"),
  heartRateMax: integer("heart_rate_max"),
  
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievement system for gamification
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "streak", "milestone", "challenge", "nutrition"
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }), // "fitness", "nutrition", "consistency"
  points: integer("points").default(0),
  level: integer("level").default(1),
  
  // Achievement criteria
  target: jsonb("target").$type<{
    value: number;
    unit: string;
    timeframe?: string;
  }>(),
  
  // Progress tracking
  progress: real("progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  
  // Visual elements
  iconType: varchar("icon_type", { length: 50 }),
  badgeColor: varchar("badge_color", { length: 20 }),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyNutrition = pgTable("daily_nutrition", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  
  // Actual consumption
  totalCalories: real("total_calories").default(0),
  totalProtein: real("total_protein").default(0),
  totalCarbs: real("total_carbs").default(0),
  totalFat: real("total_fat").default(0),
  totalFiber: real("total_fiber").default(0),
  totalSodium: real("total_sodium").default(0),
  
  // Meals count
  mealsLogged: integer("meals_logged").default(0),
  
  // Goals achievement
  calorieGoalAchieved: boolean("calorie_goal_achieved").default(false),
  proteinGoalAchieved: boolean("protein_goal_achieved").default(false),
  carbGoalAchieved: boolean("carb_goal_achieved").default(false),
  fatGoalAchieved: boolean("fat_goal_achieved").default(false),
  
  // Scores
  overallNutritionScore: real("overall_nutrition_score"),
  sustainabilityScore: real("sustainability_score"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userDateIdx: unique("daily_nutrition_user_date_idx").on(table.userId, table.date),
  dateIdx: index("daily_nutrition_date_idx").on(table.date),
}));

// Activity tracking
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  activityType: varchar("activity_type").notNull(), // meal_logged, goal_set, recipe_created, etc.
  title: varchar("title").notNull(),
  description: text("description"),
  
  // Related entities
  relatedMealId: varchar("related_meal_id").references(() => meals.id),
  relatedRecipeId: varchar("related_recipe_id"),
  
  // XP and gamification
  xpAwarded: integer("xp_awarded").default(0),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("activities_user_id_idx").on(table.userId),
  typeIdx: index("activities_type_idx").on(table.activityType),
  createdAtIdx: index("activities_created_at_idx").on(table.createdAt),
}));

// Gamification: Quests System
export const quests = pgTable("quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  questType: varchar("quest_type").notNull(), // daily, weekly, monthly, achievement
  category: varchar("category").notNull(), // nutrition, activity, streak, food_grade
  
  // Quest requirements
  targetValue: integer("target_value").notNull(),
  currentProgress: integer("current_progress").default(0),
  
  // Rewards
  xpReward: integer("xp_reward").notNull(),
  badgeReward: varchar("badge_reward"),
  
  // Quest metadata
  isActive: boolean("is_active").default(true),
  difficulty: varchar("difficulty").default('medium'), // easy, medium, hard
  
  // Timing
  startDate: date("start_date"),
  endDate: date("end_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  typeIdx: index("quests_type_idx").on(table.questType),
  categoryIdx: index("quests_category_idx").on(table.category),
  activeIdx: index("quests_active_idx").on(table.isActive),
}));

// User Quest Progress
export const userQuests = pgTable("user_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  questId: varchar("quest_id").references(() => quests.id).notNull(),
  
  // Progress tracking
  currentProgress: integer("current_progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  
  // Reward claimed
  rewardClaimed: boolean("reward_claimed").default(false),
  claimedAt: timestamp("claimed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userQuestIdx: unique("user_quest_unique").on(table.userId, table.questId),
  userIdIdx: index("user_quests_user_id_idx").on(table.userId),
  questIdIdx: index("user_quests_quest_id_idx").on(table.questId),
  completedIdx: index("user_quests_completed_idx").on(table.isCompleted),
}));

// Event System for Real-time Updates
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  eventType: varchar("event_type").notNull(), // meal.created, meal.updated, activity.synced, sleep.synced
  entityType: varchar("entity_type").notNull(), // meal, activity, sleep, goal
  entityId: varchar("entity_id").notNull(),
  
  // Event data
  eventData: jsonb("event_data"),
  processed: boolean("processed").default(false),
  
  // Event results
  triggeredRecalculation: boolean("triggered_recalculation").default(false),
  xpAwarded: integer("xp_awarded").default(0),
  newBadges: jsonb("new_badges").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
}, (table) => ({
  userIdIdx: index("events_user_id_idx").on(table.userId),
  typeIdx: index("events_type_idx").on(table.eventType),
  processedIdx: index("events_processed_idx").on(table.processed),
  createdAtIdx: index("events_created_at_idx").on(table.createdAt),
}));

// Smart Portions Recommendations
export const portionRecommendations = pgTable("portion_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  foodId: varchar("food_id").references(() => foods.id),
  
  // Recommendation context
  mealType: varchar("meal_type").notNull(), // breakfast, lunch, dinner, snack
  timeOfDay: varchar("time_of_day"),
  
  // Current user status
  remainingCalories: real("remaining_calories"),
  remainingProtein: real("remaining_protein"),
  remainingCarbs: real("remaining_carbs"),
  remainingFat: real("remaining_fat"),
  
  // Recommendation
  recommendedGrams: real("recommended_grams").notNull(),
  confidenceScore: real("confidence_score"), // 0-1
  reasoning: text("reasoning"),
  
  // User interaction
  wasAccepted: boolean("was_accepted"),
  actualGramsUsed: real("actual_grams_used"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("portion_recs_user_id_idx").on(table.userId),
  foodIdIdx: index("portion_recs_food_id_idx").on(table.foodId),
  mealTypeIdx: index("portion_recs_meal_type_idx").on(table.mealType),
}));

// Food Grades
export const foodGrades = pgTable("food_grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealId: varchar("meal_id").references(() => meals.id).notNull(),
  
  // Overall grades
  overallGrade: varchar("overall_grade").notNull(), // A+, A, B+, B, C+, C, D, F
  nutritionGrade: varchar("nutrition_grade").notNull(),
  sustainabilityGrade: varchar("sustainability_grade").notNull(),
  
  // Detailed scores (0-100)
  macroBalance: real("macro_balance"),
  micronutrientDensity: real("micronutrient_density"),
  processingLevel: real("processing_level"),
  carbonFootprint: real("carbon_footprint"),
  waterUsage: real("water_usage"),
  
  // Grade explanation
  strengthsText: text("strengths_text"),
  improvementsText: text("improvements_text"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  mealIdIdx: index("food_grades_meal_id_idx").on(table.mealId),
  overallGradeIdx: index("food_grades_overall_idx").on(table.overallGrade),
}));

// Recipes table
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  
  title: varchar("title").notNull(),
  description: text("description"),
  cuisine: varchar("cuisine"),
  difficulty: varchar("difficulty"), // easy, medium, hard
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  servings: integer("servings").notNull(),
  
  // Recipe content
  ingredients: jsonb("ingredients").$type<Array<{name: string, quantity: number, unit: string}>>().notNull(),
  instructions: jsonb("instructions").$type<string[]>().notNull(),
  
  // Nutrition per serving
  caloriesPerServing: real("calories_per_serving"),
  proteinPerServing: real("protein_per_serving"),
  carbsPerServing: real("carbs_per_serving"),
  fatPerServing: real("fat_per_serving"),
  
  // Recipe metadata
  imageUrl: varchar("image_url"),
  source: varchar("source").default('ai_generated'),
  isPublic: boolean("is_public").default(false),
  isFavorite: boolean("is_favorite").default(false),
  
  // Ratings and usage
  rating: real("rating"),
  timesCooked: integer("times_cooked").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("recipes_user_id_idx").on(table.userId),
  cuisineIdx: index("recipes_cuisine_idx").on(table.cuisine),
  difficultyIdx: index("recipes_difficulty_idx").on(table.difficulty),
}));

// Shopping Lists table
export const shoppingLists = pgTable("shopping_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  name: varchar("name").notNull(),
  description: text("description"),
  
  // Shopping list metadata
  isCompleted: boolean("is_completed").default(false),
  totalItems: integer("total_items").default(0),
  completedItems: integer("completed_items").default(0),
  
  // Organization
  category: varchar("category"), // grocery, recipes, health
  priority: varchar("priority").default('medium'), // high, medium, low
  
  // Sharing and collaboration
  isShared: boolean("is_shared").default(false),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("shopping_lists_user_id_idx").on(table.userId),
  categoryIdx: index("shopping_lists_category_idx").on(table.category),
  priorityIdx: index("shopping_lists_priority_idx").on(table.priority),
}));

// Shopping List Items table
export const shoppingListItems = pgTable("shopping_list_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shoppingListId: varchar("shopping_list_id").references(() => shoppingLists.id, { onDelete: 'cascade' }).notNull(),
  foodId: varchar("food_id").references(() => foods.id),
  
  // Item details
  name: varchar("name").notNull(),
  quantity: real("quantity").notNull(),
  unit: varchar("unit").notNull(),
  
  // Custom details
  brand: varchar("brand"),
  notes: text("notes"),
  estimatedPrice: real("estimated_price"),
  
  // Status
  isCompleted: boolean("is_completed").default(false),
  isPriority: boolean("is_priority").default(false),
  
  // Organization
  category: varchar("category"), // produce, dairy, meat, etc.
  aisle: varchar("aisle"),
  
  // AI-generated metadata
  addedVia: varchar("added_via").default('manual'), // manual, recipe, ai_suggestion
  confidence: real("confidence"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  listIdIdx: index("shopping_list_items_list_id_idx").on(table.shoppingListId),
  foodIdIdx: index("shopping_list_items_food_id_idx").on(table.foodId),
  categoryIdx: index("shopping_list_items_category_idx").on(table.category),
}));

// Gamification: User Points and Achievements
export const userPoints = pgTable("user_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Points tracking
  totalPoints: integer("total_points").default(0),
  currentLevel: integer("current_level").default(1),
  pointsToNextLevel: integer("points_to_next_level").default(100),
  
  // Weekly/Monthly goals
  weeklyPoints: integer("weekly_points").default(0),
  monthlyPoints: integer("monthly_points").default(0),
  
  // Streaks
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  
  // Rankings
  weeklyRank: integer("weekly_rank"),
  overallRank: integer("overall_rank"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_points_user_id_idx").on(table.userId),
  totalPointsIdx: index("user_points_total_idx").on(table.totalPoints),
}));


// User Achievements (junction table)

// System metrics for health monitoring
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  metricType: varchar("metric_type").notNull(), // api_response, database_query, ai_analysis, etc.
  metricName: varchar("metric_name").notNull(),
  value: real("value").notNull(),
  unit: varchar("unit"),
  
  // Additional context
  endpoint: varchar("endpoint"),
  userId: varchar("user_id"),
  duration: real("duration"), // milliseconds
  status: varchar("status"), // success, error, timeout
  
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  typeIdx: index("system_metrics_type_idx").on(table.metricType),
  timestampIdx: index("system_metrics_timestamp_idx").on(table.timestamp),
  endpointIdx: index("system_metrics_endpoint_idx").on(table.endpoint),
}));

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  meals: many(meals),
  goals: many(userGoals),
  dailyNutrition: many(dailyNutrition),
  activities: many(activities),
  recipes: many(recipes),
  shoppingLists: many(shoppingLists),
  points: one(userPoints),
  achievements: many(userAchievements),
}));

export const shoppingListsRelations = relations(shoppingLists, ({ one, many }) => ({
  user: one(users, {
    fields: [shoppingLists.userId],
    references: [users.id],
  }),
  items: many(shoppingListItems),
}));

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
  shoppingList: one(shoppingLists, {
    fields: [shoppingListItems.shoppingListId],
    references: [shoppingLists.id],
  }),
  food: one(foods, {
    fields: [shoppingListItems.foodId],
    references: [foods.id],
  }),
}));

export const userPointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
  items: many(mealItems),
}));

export const mealItemsRelations = relations(mealItems, ({ one }) => ({
  meal: one(meals, {
    fields: [mealItems.mealId],
    references: [meals.id],
  }),
  food: one(foods, {
    fields: [mealItems.foodId],
    references: [foods.id],
  }),
}));

export const userGoalsRelations = relations(userGoals, ({ one }) => ({
  user: one(users, {
    fields: [userGoals.userId],
    references: [users.id],
  }),
}));

export const dailyNutritionRelations = relations(dailyNutrition, ({ one }) => ({
  user: one(users, {
    fields: [dailyNutrition.userId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  meal: one(meals, {
    fields: [activities.relatedMealId],
    references: [meals.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
}));

// PREMIUM FEATURES: Diet Plans System
export const dietPlans = pgTable("diet_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Plan details
  planName: varchar("plan_name").notNull(),
  planType: varchar("plan_type").notNull(), // weight_loss, muscle_gain, diabetes, pcos, pregnancy, maintenance
  duration: integer("duration").default(28), // days
  
  // User questionnaire responses
  questionnaireData: jsonb("questionnaire_data").$type<{
    personalInfo: { age: number, gender: string, height: number, weight: number },
    healthGoals: string[],
    lifestyle: string[],
    foodPreferences: string[],
    restrictions: string[],
    eatingSchedule: string[],
    dietPreparation: string[],
    physicalActivity: string[],
    supplements: boolean,
    currentDiet: string[]
  }>().notNull(),
  
  // Generated plan content
  dailyTargets: jsonb("daily_targets").$type<{
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    fiber: number,
    micronutrients: Record<string, number>
  }>().notNull(),
  
  // Plan status
  isActive: boolean("is_active").default(true),
  adherenceScore: real("adherence_score").default(0), // 0-100
  
  // Plan lifecycle
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("diet_plans_user_id_idx").on(table.userId),
  activeIdx: index("diet_plans_active_idx").on(table.isActive),
  planTypeIdx: index("diet_plans_type_idx").on(table.planType),
}));

// Diet Plan Meals (28-day meal recommendations)
export const dietPlanMeals = pgTable("diet_plan_meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dietPlanId: varchar("diet_plan_id").references(() => dietPlans.id, { onDelete: 'cascade' }).notNull(),
  
  // Meal details
  day: integer("day").notNull(), // 1-28
  mealType: varchar("meal_type").notNull(), // breakfast, lunch, dinner, snack
  option: integer("option").default(1), // 1 or 2 (two options per meal)
  
  // Meal content
  mealName: varchar("meal_name").notNull(),
  description: text("description"),
  quickRecipe: text("quick_recipe"),
  portionSize: varchar("portion_size"),
  healthBenefits: text("health_benefits"),
  thingsToAvoid: text("things_to_avoid"),
  
  // Nutrition breakdown
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  fiber: real("fiber"),
  
  // Usage tracking
  timesSelected: integer("times_selected").default(0),
  userRating: real("user_rating"), // 1-5 stars
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  planIdIdx: index("diet_plan_meals_plan_id_idx").on(table.dietPlanId),
  dayMealIdx: index("diet_plan_meals_day_meal_idx").on(table.day, table.mealType),
}));

// Diet Plan Supplements
export const dietPlanSupplements = pgTable("diet_plan_supplements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dietPlanId: varchar("diet_plan_id").references(() => dietPlans.id, { onDelete: 'cascade' }).notNull(),
  
  // Supplement details
  supplementName: varchar("supplement_name").notNull(),
  dosage: varchar("dosage").notNull(),
  timing: varchar("timing").notNull(), // morning, afternoon, evening, with_meals
  purpose: text("purpose").notNull(),
  
  // Priority and safety
  priority: varchar("priority").default('recommended'), // essential, recommended, optional
  safetyNotes: text("safety_notes"),
  
  // Usage tracking
  isAccepted: boolean("is_accepted").default(false),
  userNotes: text("user_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  planIdIdx: index("diet_plan_supplements_plan_id_idx").on(table.dietPlanId),
  priorityIdx: index("diet_plan_supplements_priority_idx").on(table.priority),
}));

// Diet Plan Lifestyle Recommendations
export const dietPlanLifestyle = pgTable("diet_plan_lifestyle", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dietPlanId: varchar("diet_plan_id").references(() => dietPlans.id, { onDelete: 'cascade' }).notNull(),
  
  // Lifestyle recommendation
  category: varchar("category").notNull(), // sleep, exercise, hydration, stress, meal_timing
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  actionItems: jsonb("action_items").$type<string[]>().notNull(),
  
  // Implementation
  frequency: varchar("frequency"), // daily, weekly, as_needed
  difficulty: varchar("difficulty").default('easy'), // easy, medium, hard
  
  // Tracking
  isImplemented: boolean("is_implemented").default(false),
  userFeedback: text("user_feedback"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  planIdIdx: index("diet_plan_lifestyle_plan_id_idx").on(table.dietPlanId),
  categoryIdx: index("diet_plan_lifestyle_category_idx").on(table.category),
}));

// PREMIUM FEATURES: ChefAI Conversational Coaching
export const chefAiConversations = pgTable("chef_ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Conversation details
  title: varchar("title"), // auto-generated based on first message
  context: varchar("context").default('general'), // meal_analysis, timeline, comparison, tips
  
  // Conversation state
  isActive: boolean("is_active").default(true),
  messageCount: integer("message_count").default(0),
  
  // Usage tracking
  lastInteractionAt: timestamp("last_interaction_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("chef_ai_conversations_user_id_idx").on(table.userId),
  activeIdx: index("chef_ai_conversations_active_idx").on(table.isActive),
  lastInteractionIdx: index("chef_ai_conversations_last_interaction_idx").on(table.lastInteractionAt),
}));

// ChefAI Chat Messages
export const chefAiMessages = pgTable("chef_ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => chefAiConversations.id, { onDelete: 'cascade' }).notNull(),
  
  // Message details
  role: varchar("role").notNull(), // user, assistant
  content: text("content").notNull(),
  messageType: varchar("message_type").default('text'), // text, voice, meal_card, nutrition_insight
  
  // Context and metadata
  relatedMealIds: jsonb("related_meal_ids").$type<string[]>().default([]),
  nutritionContext: jsonb("nutrition_context").$type<{
    timeframe?: string,
    metrics?: string[],
    insights?: string[]
  }>(),
  
  // Voice input
  voiceTranscript: text("voice_transcript"),
  voiceDuration: real("voice_duration"), // seconds
  
  // AI metadata
  tokensUsed: integer("tokens_used"),
  responseTime: real("response_time"), // seconds
  confidence: real("confidence"), // 0-1
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  conversationIdIdx: index("chef_ai_messages_conversation_id_idx").on(table.conversationId),
  roleIdx: index("chef_ai_messages_role_idx").on(table.role),
  createdAtIdx: index("chef_ai_messages_created_at_idx").on(table.createdAt),
}));

// Enhanced Food Categories for Premium Recognition
export const foodCategories = pgTable("food_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Category hierarchy
  name: varchar("name").notNull(),
  parentId: varchar("parent_id").references(() => foodCategories.id),
  level: integer("level").default(0), // 0=main, 1=sub, 2=specific
  
  // Recognition capabilities
  recognitionKeywords: jsonb("recognition_keywords").$type<string[]>().default([]),
  supportedInputMethods: jsonb("supported_input_methods").$type<string[]>().default(['photo', 'text', 'voice', 'barcode']),
  
  // Premium features
  isPremiumOnly: boolean("is_premium_only").default(false),
  
  // Metadata
  description: text("description"),
  exampleFoods: jsonb("example_foods").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  nameIdx: index("food_categories_name_idx").on(table.name),
  parentIdx: index("food_categories_parent_idx").on(table.parentId),
  levelIdx: index("food_categories_level_idx").on(table.level),
  premiumIdx: index("food_categories_premium_idx").on(table.isPremiumOnly),
}));

// Premium Feature Access Tracking
export const featureUsage = pgTable("feature_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Feature tracking
  featureName: varchar("feature_name").notNull(), // voice_logging, chef_ai, diet_plans, eco_tracking
  usageCount: integer("usage_count").default(0),
  
  // Limits and quotas
  dailyLimit: integer("daily_limit"), // null = unlimited
  monthlyLimit: integer("monthly_limit"), // null = unlimited
  dailyUsage: integer("daily_usage").default(0),
  monthlyUsage: integer("monthly_usage").default(0),
  
  // Reset tracking
  lastDailyReset: date("last_daily_reset"),
  lastMonthlyReset: date("last_monthly_reset"),
  
  // Premium access
  requiresPremium: boolean("requires_premium").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userFeatureIdx: unique("feature_usage_user_feature_idx").on(table.userId, table.featureName),
  userIdIdx: index("feature_usage_user_id_idx").on(table.userId),
  featureIdx: index("feature_usage_feature_idx").on(table.featureName),
}));

// Relations for premium features
export const dietPlansRelations = relations(dietPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [dietPlans.userId],
    references: [users.id],
  }),
  meals: many(dietPlanMeals),
  supplements: many(dietPlanSupplements),
  lifestyle: many(dietPlanLifestyle),
}));

export const dietPlanMealsRelations = relations(dietPlanMeals, ({ one }) => ({
  dietPlan: one(dietPlans, {
    fields: [dietPlanMeals.dietPlanId],
    references: [dietPlans.id],
  }),
}));

export const chefAiConversationsRelations = relations(chefAiConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [chefAiConversations.userId],
    references: [users.id],
  }),
  messages: many(chefAiMessages),
}));

export const chefAiMessagesRelations = relations(chefAiMessages, ({ one }) => ({
  conversation: one(chefAiConversations, {
    fields: [chefAiMessages.conversationId],
    references: [chefAiConversations.id],
  }),
}));

export const foodCategoriesRelations = relations(foodCategories, ({ one, many }) => ({
  parent: one(foodCategories, {
    fields: [foodCategories.parentId],
    references: [foodCategories.id],
    relationName: 'parentCategory',
  }),
  children: many(foodCategories, {
    relationName: 'childCategories',
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Food = typeof foods.$inferSelect;
export type InsertFood = typeof foods.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;
export type MealItem = typeof mealItems.$inferSelect;
export type InsertMealItem = typeof mealItems.$inferInsert;
export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = typeof userGoals.$inferInsert;
export type DailyNutrition = typeof dailyNutrition.$inferSelect;
export type InsertDailyNutrition = typeof dailyNutrition.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;
export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = typeof shoppingLists.$inferInsert;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertShoppingListItem = typeof shoppingListItems.$inferInsert;
export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// Premium feature types
export type DietPlan = typeof dietPlans.$inferSelect;
export type InsertDietPlan = typeof dietPlans.$inferInsert;
export type DietPlanMeal = typeof dietPlanMeals.$inferSelect;
export type InsertDietPlanMeal = typeof dietPlanMeals.$inferInsert;
export type DietPlanSupplement = typeof dietPlanSupplements.$inferSelect;
export type InsertDietPlanSupplement = typeof dietPlanSupplements.$inferInsert;
export type DietPlanLifestyle = typeof dietPlanLifestyle.$inferSelect;
export type InsertDietPlanLifestyle = typeof dietPlanLifestyle.$inferInsert;
export type ChefAiConversation = typeof chefAiConversations.$inferSelect;
export type InsertChefAiConversation = typeof chefAiConversations.$inferInsert;
export type ChefAiMessage = typeof chefAiMessages.$inferSelect;
export type InsertChefAiMessage = typeof chefAiMessages.$inferInsert;
export type FoodCategory = typeof foodCategories.$inferSelect;
export type InsertFoodCategory = typeof foodCategories.$inferInsert;
export type FeatureUsage = typeof featureUsage.$inferSelect;
export type InsertFeatureUsage = typeof featureUsage.$inferInsert;