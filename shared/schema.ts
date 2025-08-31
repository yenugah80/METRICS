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

// Achievements table
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"),
  category: varchar("category"), // nutrition, consistency, exploration, social
  
  // Requirements
  pointsRequired: integer("points_required"),
  conditionType: varchar("condition_type"), // streak, meals_logged, recipes_tried
  conditionValue: integer("condition_value"),
  
  // Rewards
  pointsReward: integer("points_reward").default(0),
  badgeColor: varchar("badge_color").default('blue'),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("achievements_category_idx").on(table.category),
  conditionIdx: index("achievements_condition_idx").on(table.conditionType),
}));

// User Achievements (junction table)
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: varchar("achievement_id").references(() => achievements.id).notNull(),
  
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  isDisplayed: boolean("is_displayed").default(true),
}, (table) => ({
  userIdIdx: index("user_achievements_user_id_idx").on(table.userId),
  achievementIdIdx: index("user_achievements_achievement_id_idx").on(table.achievementId),
  unlockedIdx: index("user_achievements_unlocked_idx").on(table.unlockedAt),
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
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
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
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;