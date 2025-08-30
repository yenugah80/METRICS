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
  
  // User preferences and settings
  dailyCalorieGoal: integer("daily_calorie_goal").default(2000),
  dailyProteinGoal: integer("daily_protein_goal").default(150),
  dailyCarbGoal: integer("daily_carb_goal").default(250),
  dailyFatGoal: integer("daily_fat_goal").default(65),
  
  // Dietary preferences
  dietaryRestrictions: jsonb("dietary_restrictions").$type<string[]>().default([]),
  allergens: jsonb("allergens").$type<string[]>().default([]),
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
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
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
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("activities_user_id_idx").on(table.userId),
  typeIdx: index("activities_type_idx").on(table.activityType),
  createdAtIdx: index("activities_created_at_idx").on(table.createdAt),
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
export const usersRelations = relations(users, ({ many }) => ({
  meals: many(meals),
  goals: many(userGoals),
  dailyNutrition: many(dailyNutrition),
  activities: many(activities),
  recipes: many(recipes),
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