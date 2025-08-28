import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with multi-provider auth support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Optional for OAuth/SSO users
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  recipesGeneratedThisMonth: integer("recipes_generated_this_month").default(0),
  lastRecipeResetDate: timestamp("last_recipe_reset_date").defaultNow(),
  isEmailVerified: boolean("is_email_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Authentication providers table for multi-provider support
export const authProviders = pgTable("auth_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider").notNull(), // 'email', 'google', 'replit', 'passkey'
  providerId: varchar("provider_id").notNull(), // External provider user ID
  providerData: jsonb("provider_data"), // Additional provider-specific data
  accessToken: text("access_token"), // Encrypted access token
  refreshToken: text("refresh_token"), // Encrypted refresh token
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("auth_providers_user_id_idx").on(table.userId),
  index("auth_providers_provider_idx").on(table.provider),
  index("auth_providers_provider_id_idx").on(table.providerId),
]);

// Passkeys/WebAuthn credentials table
export const passkeys = pgTable("passkeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").unique().notNull(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").default(0),
  deviceName: varchar("device_name"),
  aaguid: varchar("aaguid"), // Authenticator AAGUID
  transports: text("transports").array(), // ['usb', 'nfc', 'ble', 'internal']
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("passkeys_user_id_idx").on(table.userId),
  index("passkeys_credential_id_idx").on(table.credentialId),
]);

// JWT refresh tokens table
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").unique().notNull(),
  family: varchar("family").notNull(), // Token family for rotation
  deviceInfo: jsonb("device_info"), // User agent, IP, etc.
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("refresh_tokens_user_id_idx").on(table.userId),
  index("refresh_tokens_token_idx").on(table.token),
  index("refresh_tokens_family_idx").on(table.family),
  index("refresh_tokens_expires_at_idx").on(table.expiresAt),
]);

// User profiles for diet preferences and allergens
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dietPreferences: text("diet_preferences").array(), // ['keto', 'vegan', 'gluten-free']
  allergens: text("allergens").array(), // ['nuts', 'dairy', 'shellfish']
  dailyCalorieTarget: integer("daily_calorie_target").default(2000),
  dailyProteinTarget: integer("daily_protein_target").default(150),
  dailyCarbTarget: integer("daily_carb_target").default(250),
  dailyFatTarget: integer("daily_fat_target").default(80),
  recipesGenerated: integer("recipes_generated").default(0), // Track usage for freemium model
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meals table
export const meals = pgTable("meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  mealType: varchar("meal_type").notNull(), // 'breakfast', 'lunch', 'dinner', 'snack'
  imageUrl: varchar("image_url"),
  rawText: text("raw_text"), // Original input from user
  source: varchar("source").notNull(), // 'photo', 'barcode', 'voice', 'manual'
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // AI confidence 0-1
  loggedAt: timestamp("logged_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meal items (foods within a meal)
export const mealItems = pgTable("meal_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealId: varchar("meal_id").notNull().references(() => meals.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  quantity: decimal("quantity", { precision: 8, scale: 2 }).notNull(),
  unit: varchar("unit").notNull(), // 'g', 'oz', 'cup', 'piece'
  barcodeData: jsonb("barcode_data"), // OpenFoodFacts data
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Nutrition data per meal
export const mealNutrition = pgTable("meal_nutrition", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealId: varchar("meal_id").notNull().references(() => meals.id, { onDelete: "cascade" }),
  calories: integer("calories").notNull(),
  protein: decimal("protein", { precision: 6, scale: 2 }).notNull(),
  carbs: decimal("carbs", { precision: 6, scale: 2 }).notNull(),
  fat: decimal("fat", { precision: 6, scale: 2 }).notNull(),
  fiber: decimal("fiber", { precision: 6, scale: 2 }),
  iron: decimal("iron", { precision: 6, scale: 2 }),
  vitaminC: decimal("vitamin_c", { precision: 6, scale: 2 }),
  magnesium: decimal("magnesium", { precision: 6, scale: 2 }),
  vitaminB12: decimal("vitamin_b12", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scores for meals
export const mealScores = pgTable("meal_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealId: varchar("meal_id").notNull().references(() => meals.id, { onDelete: "cascade" }),
  nutritionScore: integer("nutrition_score").notNull(), // 0-100
  nutritionGrade: varchar("nutrition_grade").notNull(), // A-E
  dietCompatibility: jsonb("diet_compatibility"), // {keto: 95, vegan: 0}
  allergenSafety: varchar("allergen_safety").notNull(), // 'safe', 'unsafe'
  allergenDetails: jsonb("allergen_details"), // {detected: ['nuts'], severity: 'high'}
  sustainabilityScore: decimal("sustainability_score", { precision: 3, scale: 1 }), // 0-10
  sustainabilityDetails: jsonb("sustainability_details"), // {co2: 2.5, water: 1.2}
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily aggregates for quick dashboard display
export const dailyAggregates = pgTable("daily_aggregates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  totalCalories: integer("total_calories").default(0),
  totalProtein: decimal("total_protein", { precision: 6, scale: 2 }).default("0"),
  totalCarbs: decimal("total_carbs", { precision: 6, scale: 2 }).default("0"),
  totalFat: decimal("total_fat", { precision: 6, scale: 2 }).default("0"),
  totalFiber: decimal("total_fiber", { precision: 6, scale: 2 }).default("0"),
  averageNutritionScore: integer("average_nutrition_score").default(0),
  averageNutritionGrade: varchar("average_nutrition_grade").default("C"),
  mealCount: integer("meal_count").default(0),
  wellnessScore: integer("wellness_score").default(0), // Overall daily score
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("daily_aggregates_user_date_idx").on(table.userId, table.date),
  // Add unique constraint for userId and date combination to allow upserts
  uniqueIndex("daily_aggregates_user_date_unique").on(table.userId, table.date),
]);

// Nutrition profile for each meal with deterministic scoring
export const nutritionProfile = pgTable("nutrition_profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealId: varchar("meal_id").references(() => meals.id, { onDelete: "cascade" }).notNull(),
  
  // Raw nutrition data (per 100g normalized)
  sugarG: decimal("sugar_g", { precision: 8, scale: 3 }),
  sodiumMg: decimal("sodium_mg", { precision: 8, scale: 3 }),
  saturatedFatG: decimal("saturated_fat_g", { precision: 8, scale: 3 }),
  fiberG: decimal("fiber_g", { precision: 8, scale: 3 }),
  proteinG: decimal("protein_g", { precision: 8, scale: 3 }),
  micronutrientsDV: jsonb("micronutrients_dv"), // Array of %DV values
  
  // Deterministic scoring results
  nutritionScore: integer("nutrition_score").notNull(), // 0-100
  nutritionGrade: varchar("nutrition_grade", { length: 1 }).notNull(), // A-D
  scoreBreakdown: jsonb("score_breakdown"), // Penalty/bonus details
  
  // Diet compatibility results
  dietMatchPercentage: integer("diet_match_percentage"),
  dietViolations: jsonb("diet_violations"),
  allergenSafety: varchar("allergen_safety", { length: 10 }),
  allergenDetails: jsonb("allergen_details"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("nutrition_profile_meal_idx").on(table.mealId),
  index("nutrition_profile_score_idx").on(table.nutritionScore),
  index("nutrition_profile_grade_idx").on(table.nutritionGrade),
]);

// Recipes table
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  totalTime: integer("total_time"), // computed: prep + cook
  servings: integer("servings").default(1),
  ingredients: jsonb("ingredients").notNull(), // [{name, amount, unit}]
  instructions: text("instructions").array().notNull(),
  tags: text("tags").array(), // ['keto', 'vegan', 'quick']
  difficulty: varchar("difficulty").default("medium"), // 'easy', 'medium', 'hard'
  category: varchar("category"), // 'breakfast', 'lunch', 'dinner', 'dessert', 'snack'
  cuisine: varchar("cuisine"), // 'italian', 'mexican', 'asian', etc.
  estimatedCalories: integer("estimated_calories"),
  estimatedProtein: decimal("estimated_protein", { precision: 6, scale: 2 }),
  estimatedCarbs: decimal("estimated_carbs", { precision: 6, scale: 2 }),
  estimatedFat: decimal("estimated_fat", { precision: 6, scale: 2 }),
  nutritionGrade: varchar("nutrition_grade").default("C"),
  isPremium: boolean("is_premium").default(false),
  isPublic: boolean("is_public").default(false),
  createdBy: varchar("created_by"), // User ID who created this recipe
  sourceUrl: varchar("source_url"), // If imported from external source
  equipment: text("equipment").array(), // ['oven', 'mixer', 'grill']
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("recipes_category_idx").on(table.category),
  index("recipes_cuisine_idx").on(table.cuisine),
  index("recipes_difficulty_idx").on(table.difficulty),
  index("recipes_created_by_idx").on(table.createdBy),
  index("recipes_is_public_idx").on(table.isPublic),
]);

// User saved recipes (favorites)
export const userSavedRecipes = pgTable("user_saved_recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  notes: text("notes"), // User's personal notes about this recipe
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("user_saved_recipes_user_idx").on(table.userId),
  index("user_saved_recipes_recipe_idx").on(table.recipeId),
]);

// Recipe collections (user-organized groups)
export const recipeCollections = pgTable("recipe_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("recipe_collections_user_idx").on(table.userId),
]);

// Many-to-many relationship between collections and recipes
export const collectionRecipes = pgTable("collection_recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").notNull().references(() => recipeCollections.id, { onDelete: "cascade" }),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("collection_recipes_collection_idx").on(table.collectionId),
  index("collection_recipes_recipe_idx").on(table.recipeId),
]);

// Recipe ratings and reviews
export const recipeRatings = pgTable("recipe_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  wouldMakeAgain: boolean("would_make_again"),
  difficultyRating: varchar("difficulty_rating"), // User's perception vs recipe difficulty
  cookingNotes: text("cooking_notes"), // User's cooking experience/tips
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("recipe_ratings_recipe_idx").on(table.recipeId),
  index("recipe_ratings_user_idx").on(table.userId),
  index("recipe_ratings_rating_idx").on(table.rating),
]);

// Recipe comments (separate from ratings)
export const recipeComments = pgTable("recipe_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentCommentId: varchar("parent_comment_id"), // For threaded comments
  content: text("content").notNull(),
  isHelpful: boolean("is_helpful").default(false), // Moderator flag
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("recipe_comments_recipe_idx").on(table.recipeId),
  index("recipe_comments_user_idx").on(table.userId),
  index("recipe_comments_parent_idx").on(table.parentCommentId),
]);

// Recipe photos (user-submitted)
export const recipePhotos = pgTable("recipe_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  imageUrl: varchar("image_url").notNull(),
  caption: text("caption"),
  cookingStep: integer("cooking_step"), // Which step this photo represents
  isMainPhoto: boolean("is_main_photo").default(false),
  isApproved: boolean("is_approved").default(false), // Moderation
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("recipe_photos_recipe_idx").on(table.recipeId),
  index("recipe_photos_user_idx").on(table.userId),
]);

// Recipe modifications (user customizations)
export const recipeModifications = pgTable("recipe_modifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalRecipeId: varchar("original_recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  modifiedRecipeId: varchar("modified_recipe_id").references(() => recipes.id), // If they save as new recipe
  name: varchar("name").notNull(), // Name for this modification
  ingredientChanges: jsonb("ingredient_changes"), // What ingredients were changed
  instructionChanges: jsonb("instruction_changes"), // What instructions were modified
  scalingFactor: decimal("scaling_factor", { precision: 4, scale: 2 }).default("1.00"), // 0.5 = half recipe, 2.0 = double
  notes: text("notes"), // Why they made these changes
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("recipe_modifications_original_idx").on(table.originalRecipeId),
  index("recipe_modifications_user_idx").on(table.userId),
]);

// Ingredient substitutions database
export const ingredientSubstitutions = pgTable("ingredient_substitutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalIngredient: varchar("original_ingredient").notNull(),
  substituteIngredient: varchar("substitute_ingredient").notNull(),
  ratio: decimal("ratio", { precision: 4, scale: 2 }).default("1.00"), // How much substitute per original
  category: varchar("category"), // 'dairy', 'gluten', 'vegan', etc.
  notes: text("notes"), // Usage notes and tips
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // How good this substitution is
  context: text("context").array(), // ['baking', 'cooking', 'sauce'] - where it works
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("substitutions_original_idx").on(table.originalIngredient),
  index("substitutions_category_idx").on(table.category),
]);

// Shopping lists
export const shoppingLists = pgTable("shopping_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  isDefault: boolean("is_default").default(false), // User's default shopping list
  store: varchar("store"), // Target store for organization
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("shopping_lists_user_idx").on(table.userId),
]);

// Shopping list items
export const shoppingListItems = pgTable("shopping_list_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shoppingListId: varchar("shopping_list_id").notNull().references(() => shoppingLists.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  quantity: decimal("quantity", { precision: 8, scale: 2 }),
  unit: varchar("unit"),
  category: varchar("category"), // 'produce', 'dairy', 'meat', etc.
  isChecked: boolean("is_checked").default(false),
  recipeId: varchar("recipe_id").references(() => recipes.id), // Which recipe this is for
  notes: text("notes"),
  estimatedPrice: decimal("estimated_price", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("shopping_list_items_list_idx").on(table.shoppingListId),
  index("shopping_list_items_recipe_idx").on(table.recipeId),
  index("shopping_list_items_category_idx").on(table.category),
]);

// Meal planning
export const mealPlans = pgTable("meal_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // 'Week of Jan 15', 'Date Night Dinners'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isTemplate: boolean("is_template").default(false), // Reusable template
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("meal_plans_user_idx").on(table.userId),
  index("meal_plans_dates_idx").on(table.startDate, table.endDate),
]);

// Planned meals within meal plans
export const plannedMeals = pgTable("planned_meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealPlanId: varchar("meal_plan_id").notNull().references(() => mealPlans.id, { onDelete: "cascade" }),
  recipeId: varchar("recipe_id").references(() => recipes.id),
  customMealName: varchar("custom_meal_name"), // For non-recipe meals
  mealType: varchar("meal_type").notNull(), // 'breakfast', 'lunch', 'dinner', 'snack'
  plannedDate: timestamp("planned_date").notNull(),
  servings: integer("servings").default(1),
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false), // Did they actually make it?
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("planned_meals_plan_idx").on(table.mealPlanId),
  index("planned_meals_recipe_idx").on(table.recipeId),
  index("planned_meals_date_idx").on(table.plannedDate),
]);

// Cooking timers
export const cookingTimers = pgTable("cooking_timers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipeId: varchar("recipe_id").references(() => recipes.id),
  name: varchar("name").notNull(), // 'Bake cookies', 'Simmer sauce'
  duration: integer("duration").notNull(), // seconds
  step: integer("step"), // Which recipe step this timer is for
  isActive: boolean("is_active").default(false),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("cooking_timers_user_idx").on(table.userId),
  index("cooking_timers_recipe_idx").on(table.recipeId),
  index("cooking_timers_active_idx").on(table.isActive),
]);

// Recipe sharing (when users share recipes with others)
export const recipeShares = pgTable("recipe_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  sharedBy: varchar("shared_by").notNull().references(() => users.id),
  sharedWith: varchar("shared_with").references(() => users.id), // null if shared publicly
  shareType: varchar("share_type").notNull(), // 'direct', 'link', 'email'
  permissions: varchar("permissions").default("view"), // 'view', 'modify', 'copy'
  accessToken: varchar("access_token"), // For anonymous access
  expiresAt: timestamp("expires_at"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("recipe_shares_recipe_idx").on(table.recipeId),
  index("recipe_shares_shared_by_idx").on(table.sharedBy),
  index("recipe_shares_token_idx").on(table.accessToken),
]);

// Recipe history (track what users have viewed/cooked)
export const userRecipeHistory = pgTable("user_recipe_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  action: varchar("action").notNull(), // 'viewed', 'cooked', 'saved', 'shared'
  actionData: jsonb("action_data"), // Additional context for the action
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("recipe_history_user_idx").on(table.userId),
  index("recipe_history_recipe_idx").on(table.recipeId),
  index("recipe_history_action_idx").on(table.action),
  index("recipe_history_created_idx").on(table.createdAt),
]);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  meals: many(meals),
  dailyAggregates: many(dailyAggregates),
  authProviders: many(authProviders),
  passkeys: many(passkeys),
  refreshTokens: many(refreshTokens),
  savedRecipes: many(userSavedRecipes),
  recipeCollections: many(recipeCollections),
  recipeRatings: many(recipeRatings),
  recipeComments: many(recipeComments),
  recipePhotos: many(recipePhotos),
  recipeModifications: many(recipeModifications),
  shoppingLists: many(shoppingLists),
  mealPlans: many(mealPlans),
  cookingTimers: many(cookingTimers),
  recipeShares: many(recipeShares),
  recipeHistory: many(userRecipeHistory),
}));

export const authProvidersRelations = relations(authProviders, ({ one }) => ({
  user: one(users, {
    fields: [authProviders.userId],
    references: [users.id],
  }),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, {
    fields: [passkeys.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
  items: many(mealItems),
  nutrition: one(mealNutrition),
  scores: one(mealScores),
  nutritionProfile: one(nutritionProfile),
}));

export const mealItemsRelations = relations(mealItems, ({ one }) => ({
  meal: one(meals, {
    fields: [mealItems.mealId],
    references: [meals.id],
  }),
}));

export const mealNutritionRelations = relations(mealNutrition, ({ one }) => ({
  meal: one(meals, {
    fields: [mealNutrition.mealId],
    references: [meals.id],
  }),
}));

export const mealScoresRelations = relations(mealScores, ({ one }) => ({
  meal: one(meals, {
    fields: [mealScores.mealId],
    references: [meals.id],
  }),
}));

export const dailyAggregatesRelations = relations(dailyAggregates, ({ one }) => ({
  user: one(users, {
    fields: [dailyAggregates.userId],
    references: [users.id],
  }),
}));

export const nutritionProfileRelations = relations(nutritionProfile, ({ one }) => ({
  meal: one(meals, {
    fields: [nutritionProfile.mealId],
    references: [meals.id],
  }),
}));

// Recipe relations
export const recipesRelations = relations(recipes, ({ many }) => ({
  savedByUsers: many(userSavedRecipes),
  collections: many(collectionRecipes),
  ratings: many(recipeRatings),
  comments: many(recipeComments),
  photos: many(recipePhotos),
  modifications: many(recipeModifications),
  shoppingListItems: many(shoppingListItems),
  plannedMeals: many(plannedMeals),
  timers: many(cookingTimers),
  shares: many(recipeShares),
  history: many(userRecipeHistory),
}));

export const userSavedRecipesRelations = relations(userSavedRecipes, ({ one }) => ({
  user: one(users, {
    fields: [userSavedRecipes.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [userSavedRecipes.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeCollectionsRelations = relations(recipeCollections, ({ one, many }) => ({
  user: one(users, {
    fields: [recipeCollections.userId],
    references: [users.id],
  }),
  recipes: many(collectionRecipes),
}));

export const collectionRecipesRelations = relations(collectionRecipes, ({ one }) => ({
  collection: one(recipeCollections, {
    fields: [collectionRecipes.collectionId],
    references: [recipeCollections.id],
  }),
  recipe: one(recipes, {
    fields: [collectionRecipes.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeRatingsRelations = relations(recipeRatings, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeRatings.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeRatings.userId],
    references: [users.id],
  }),
}));

export const recipeCommentsRelations = relations(recipeComments, ({ one, many }) => ({
  recipe: one(recipes, {
    fields: [recipeComments.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeComments.userId],
    references: [users.id],
  }),
  parentComment: one(recipeComments, {
    fields: [recipeComments.parentCommentId],
    references: [recipeComments.id],
  }),
  replies: many(recipeComments),
}));

export const recipePhotosRelations = relations(recipePhotos, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipePhotos.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipePhotos.userId],
    references: [users.id],
  }),
}));

export const recipeModificationsRelations = relations(recipeModifications, ({ one }) => ({
  originalRecipe: one(recipes, {
    fields: [recipeModifications.originalRecipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeModifications.userId],
    references: [users.id],
  }),
  modifiedRecipe: one(recipes, {
    fields: [recipeModifications.modifiedRecipeId],
    references: [recipes.id],
  }),
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
  recipe: one(recipes, {
    fields: [shoppingListItems.recipeId],
    references: [recipes.id],
  }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
  plannedMeals: many(plannedMeals),
}));

export const plannedMealsRelations = relations(plannedMeals, ({ one }) => ({
  mealPlan: one(mealPlans, {
    fields: [plannedMeals.mealPlanId],
    references: [mealPlans.id],
  }),
  recipe: one(recipes, {
    fields: [plannedMeals.recipeId],
    references: [recipes.id],
  }),
}));

export const cookingTimersRelations = relations(cookingTimers, ({ one }) => ({
  user: one(users, {
    fields: [cookingTimers.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [cookingTimers.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeSharesRelations = relations(recipeShares, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeShares.recipeId],
    references: [recipes.id],
  }),
  sharedByUser: one(users, {
    fields: [recipeShares.sharedBy],
    references: [users.id],
  }),
  sharedWithUser: one(users, {
    fields: [recipeShares.sharedWith],
    references: [users.id],
  }),
}));

export const userRecipeHistoryRelations = relations(userRecipeHistory, ({ one }) => ({
  user: one(users, {
    fields: [userRecipeHistory.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [userRecipeHistory.recipeId],
    references: [recipes.id],
  }),
}));

// Insert schemas for authentication tables
export const insertAuthProviderSchema = createInsertSchema(authProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPasskeySchema = createInsertSchema(passkeys).omit({
  id: true,
  createdAt: true,
});

export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({
  id: true,
  createdAt: true,
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  createdAt: true,
});

export const insertMealItemSchema = createInsertSchema(mealItems).omit({
  id: true,
  createdAt: true,
});

export const insertMealNutritionSchema = createInsertSchema(mealNutrition).omit({
  id: true,
  createdAt: true,
});

export const insertMealScoreSchema = createInsertSchema(mealScores).omit({
  id: true,
  createdAt: true,
});

// Types for authentication
export type AuthProvider = typeof authProviders.$inferSelect;
export type InsertAuthProvider = z.infer<typeof insertAuthProviderSchema>;
export type Passkey = typeof passkeys.$inferSelect;
export type InsertPasskey = z.infer<typeof insertPasskeySchema>;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type MealItem = typeof mealItems.$inferSelect;
export type InsertMealItem = z.infer<typeof insertMealItemSchema>;
export type MealNutrition = typeof mealNutrition.$inferSelect;
export type InsertMealNutrition = z.infer<typeof insertMealNutritionSchema>;
export type MealScore = typeof mealScores.$inferSelect;
export type InsertMealScore = z.infer<typeof insertMealScoreSchema>;
export type DailyAggregate = typeof dailyAggregates.$inferSelect;

// New types for enhanced nutrition system - types can be done earlier

// Moved to bottom after all table definitions

// ==== COMPREHENSIVE NUTRITION DATA ENGINEERING SYSTEM ====

// Core ingredient database from USDA FDC and Open Food Facts
export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(), // 'usda_fdc' | 'open_food_facts'
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  barcode: varchar("barcode", { length: 50 }),
  brandName: varchar("brand_name", { length: 255 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  dataQuality: decimal("data_quality", { precision: 3, scale: 2 }), // 0.00-1.00
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("ingredients_external_id_idx").on(table.externalId),
  index("ingredients_source_idx").on(table.source),
  index("ingredients_barcode_idx").on(table.barcode),
]);

// Normalized nutrition data per 100g
export const nutritionData = pgTable("nutrition_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingredientId: varchar("ingredient_id").references(() => ingredients.id).notNull(),
  
  // Macronutrients (per 100g)
  calories: decimal("calories", { precision: 8, scale: 2 }),
  protein: decimal("protein", { precision: 8, scale: 3 }),
  totalFat: decimal("total_fat", { precision: 8, scale: 3 }),
  saturatedFat: decimal("saturated_fat", { precision: 8, scale: 3 }),
  transFat: decimal("trans_fat", { precision: 8, scale: 3 }),
  carbohydrates: decimal("carbohydrates", { precision: 8, scale: 3 }),
  fiber: decimal("fiber", { precision: 8, scale: 3 }),
  sugar: decimal("sugar", { precision: 8, scale: 3 }),
  addedSugar: decimal("added_sugar", { precision: 8, scale: 3 }),
  
  // Micronutrients (per 100g)
  sodium: decimal("sodium", { precision: 8, scale: 3 }),
  potassium: decimal("potassium", { precision: 8, scale: 3 }),
  cholesterol: decimal("cholesterol", { precision: 8, scale: 3 }),
  vitaminA: decimal("vitamin_a", { precision: 8, scale: 3 }),
  vitaminC: decimal("vitamin_c", { precision: 8, scale: 3 }),
  vitaminD: decimal("vitamin_d", { precision: 8, scale: 3 }),
  calcium: decimal("calcium", { precision: 8, scale: 3 }),
  iron: decimal("iron", { precision: 8, scale: 3 }),
  magnesium: decimal("magnesium", { precision: 8, scale: 3 }),
  
  // Data quality and provenance
  dataSource: varchar("data_source", { length: 100 }),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  lastVerified: timestamp("last_verified").defaultNow(),
}, (table) => [
  index("nutrition_ingredient_idx").on(table.ingredientId),
]);

// Enhanced recipe ingredients with nutrition data engineering
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").references(() => recipes.id).notNull(),
  ingredientId: varchar("ingredient_id").references(() => ingredients.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  preparation: varchar("preparation", { length: 255 }), // "chopped", "diced", etc.
}, (table) => [
  index("recipe_ingredients_recipe_idx").on(table.recipeId),
  index("recipe_ingredients_ingredient_idx").on(table.ingredientId),
]);

// Unit conversion system
export const unitConversions = pgTable("unit_conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUnit: varchar("from_unit", { length: 50 }).notNull(),
  toUnit: varchar("to_unit", { length: 50 }).notNull(),
  factor: decimal("factor", { precision: 15, scale: 8 }).notNull(),
  ingredientId: varchar("ingredient_id").references(() => ingredients.id), // Ingredient-specific conversions
  category: varchar("category", { length: 100 }), // Category-specific conversions
  isGeneral: boolean("is_general").default(false), // Universal conversions (ml to l, etc.)
}, (table) => [
  index("unit_conversions_from_idx").on(table.fromUnit),
  index("unit_conversions_to_idx").on(table.toUnit),
  index("unit_conversions_ingredient_idx").on(table.ingredientId),
]);

// Density data for volume to weight conversions
export const densityData = pgTable("density_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingredientId: varchar("ingredient_id").references(() => ingredients.id),
  category: varchar("category", { length: 100 }), // For category-based density
  densityGMl: decimal("density_g_ml", { precision: 6, scale: 4 }).notNull(), // grams per ml
  temperature: integer("temperature"), // Celsius, for temperature-dependent densities
  state: varchar("state", { length: 50 }), // "liquid", "solid", "powder", etc.
  source: varchar("source", { length: 100 }),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
}, (table) => [
  index("density_ingredient_idx").on(table.ingredientId),
  index("density_category_idx").on(table.category),
]);

// Context overrides for specific use cases
export const contextOverrides = pgTable("context_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingredientId: varchar("ingredient_id").references(() => ingredients.id).notNull(),
  context: varchar("context", { length: 255 }).notNull(), // "raw", "cooked", "baked", etc.
  preparation: varchar("preparation", { length: 255 }), // "chopped", "sliced", etc.
  
  // Override values (if null, use base ingredient data)
  calorieMultiplier: decimal("calorie_multiplier", { precision: 4, scale: 3 }),
  weightMultiplier: decimal("weight_multiplier", { precision: 4, scale: 3 }),
  densityOverride: decimal("density_override", { precision: 6, scale: 4 }),
  
  // Nutritional changes due to preparation
  nutritionChanges: jsonb("nutrition_changes"), // Object with percentage changes
  
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("context_ingredient_context_idx").on(table.ingredientId, table.context),
]);

// ETL Pipeline Tracking and Observability
export const etlJobs = pgTable("etl_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobType: varchar("job_type", { length: 100 }).notNull(), // "usda_fetch", "off_fetch", "discovery", etc.
  status: varchar("status", { length: 50 }).notNull(), // "running", "completed", "failed", "pending"
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  recordsProcessed: integer("records_processed").default(0),
  recordsSucceeded: integer("records_succeeded").default(0),
  recordsFailed: integer("records_failed").default(0),
  errorLog: jsonb("error_log"),
  metadata: jsonb("metadata"), // Job-specific configuration and results
}, (table) => [
  index("etl_jobs_type_idx").on(table.jobType),
  index("etl_jobs_status_idx").on(table.status),
  index("etl_jobs_started_idx").on(table.startedAt),
]);

// Data quality metrics and monitoring
export const dataQualityMetrics = pgTable("data_quality_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: varchar("metric_type", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // "ingredient", "recipe", "nutrition"
  entityId: varchar("entity_id"),
  score: decimal("score", { precision: 5, scale: 4 }).notNull(), // 0.0000 to 1.0000
  details: jsonb("details"), // Specific quality issues or validations
  measuredAt: timestamp("measured_at").defaultNow(),
}, (table) => [
  index("quality_metric_type_idx").on(table.metricType),
  index("quality_entity_type_idx").on(table.entityType),
  index("quality_entity_id_idx").on(table.entityId),
  index("quality_measured_at_idx").on(table.measuredAt),
]);

// Discovery service tracking - for finding new ingredients
export const discoveryQueue = pgTable("discovery_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingredientName: text("ingredient_name").notNull(),
  source: varchar("source", { length: 50 }), // Where the name was discovered
  priority: integer("priority").default(5), // 1-10, higher = more urgent
  status: varchar("status", { length: 50 }).default("pending"), // "pending", "processing", "completed", "failed"
  attempts: integer("attempts").default(0),
  lastAttempt: timestamp("last_attempt"),
  discoveredAt: timestamp("discovered_at").defaultNow(),
  metadata: jsonb("metadata"), // Context about where/how it was discovered
}, (table) => [
  index("discovery_status_idx").on(table.status),
  index("discovery_priority_idx").on(table.priority),
  index("discovery_name_idx").on(table.ingredientName),
]);

// Fast food analysis cache for OCR/barcode/API responses
export const analysisCache = pgTable("analysis_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cacheKey: varchar("cache_key", { length: 64 }).unique().notNull(), // SHA256 hash
  inputType: varchar("input_type", { length: 50 }).notNull(), // 'image', 'barcode', 'text'
  inputHash: varchar("input_hash", { length: 64 }).notNull(), // SHA256 of normalized input
  analysisResult: jsonb("analysis_result").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  source: varchar("source", { length: 100 }), // 'usda', 'off', 'openai', 'hybrid'
  hitCount: integer("hit_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessed: timestamp("last_accessed").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // TTL 7 days
}, (table) => [
  index("analysis_cache_key_idx").on(table.cacheKey),
  index("analysis_cache_type_idx").on(table.inputType),
  index("analysis_cache_expires_idx").on(table.expiresAt),
]);

// Recipe generation cache and deduplication
export const recipeCache = pgTable("recipe_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cacheKey: varchar("cache_key", { length: 128 }).unique().notNull(),
  cuisine: varchar("cuisine", { length: 50 }),
  dietType: varchar("diet_type", { length: 50 }),
  calorieTarget: integer("calorie_target"),
  proteinTarget: integer("protein_target"),
  randomSeed: varchar("random_seed", { length: 32 }),
  simHash: varchar("sim_hash", { length: 16 }), // For deduplication
  recipeData: jsonb("recipe_data").notNull(),
  createdBy: varchar("created_by", { length: 50 }).default("openai"), // 'openai' or 'fallback'
  hitCount: integer("hit_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessed: timestamp("last_accessed").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // TTL 24h
}, (table) => [
  index("recipe_cache_key_idx").on(table.cacheKey),
  index("recipe_cache_sim_hash_idx").on(table.simHash),
  index("recipe_cache_expires_idx").on(table.expiresAt),
]);

// ==== RELATIONS FOR NUTRITION DATA ENGINEERING ====

export const ingredientsRelations = relations(ingredients, ({ many, one }) => ({
  nutritionData: many(nutritionData),
  recipeIngredients: many(recipeIngredients),
  unitConversions: many(unitConversions),
  densityData: many(densityData),
  contextOverrides: many(contextOverrides),
}));

export const nutritionDataRelations = relations(nutritionData, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [nutritionData.ingredientId],
    references: [ingredients.id],
  }),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const unitConversionsRelations = relations(unitConversions, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [unitConversions.ingredientId],
    references: [ingredients.id],
  }),
}));

export const densityDataRelations = relations(densityData, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [densityData.ingredientId],
    references: [ingredients.id],
  }),
}));

export const contextOverridesRelations = relations(contextOverrides, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [contextOverrides.ingredientId],
    references: [ingredients.id],
  }),
}));

// ==== INSERT SCHEMAS FOR RECIPES AND MEAL PLANNING ====

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSavedRecipeSchema = createInsertSchema(userSavedRecipes).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeCollectionSchema = createInsertSchema(recipeCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCollectionRecipeSchema = createInsertSchema(collectionRecipes).omit({
  id: true,
  addedAt: true,
});

export const insertRecipeRatingSchema = createInsertSchema(recipeRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipeCommentSchema = createInsertSchema(recipeComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipePhotoSchema = createInsertSchema(recipePhotos).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeModificationSchema = createInsertSchema(recipeModifications).omit({
  id: true,
  createdAt: true,
});

export const insertIngredientSubstitutionSchema = createInsertSchema(ingredientSubstitutions).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingListSchema = createInsertSchema(shoppingLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShoppingListItemSchema = createInsertSchema(shoppingListItems).omit({
  id: true,
  createdAt: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlannedMealSchema = createInsertSchema(plannedMeals).omit({
  id: true,
  createdAt: true,
});

export const insertCookingTimerSchema = createInsertSchema(cookingTimers).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeShareSchema = createInsertSchema(recipeShares).omit({
  id: true,
  createdAt: true,
});

export const insertUserRecipeHistorySchema = createInsertSchema(userRecipeHistory).omit({
  id: true,
  createdAt: true,
});

// ==== INSERT SCHEMAS FOR NUTRITION DATA ENGINEERING ====

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  lastUpdated: true,
});

export const insertNutritionDataSchema = createInsertSchema(nutritionData).omit({
  id: true,
  lastVerified: true,
});

export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({
  id: true,
});

export const insertUnitConversionSchema = createInsertSchema(unitConversions).omit({
  id: true,
});

export const insertDensityDataSchema = createInsertSchema(densityData).omit({
  id: true,
});

export const insertContextOverrideSchema = createInsertSchema(contextOverrides).omit({
  id: true,
});

export const insertEtlJobSchema = createInsertSchema(etlJobs).omit({
  id: true,
  startedAt: true,
});

export const insertDataQualityMetricSchema = createInsertSchema(dataQualityMetrics).omit({
  id: true,
  measuredAt: true,
});

export const insertDiscoveryQueueItemSchema = createInsertSchema(discoveryQueue).omit({
  id: true,
  discoveredAt: true,
});

// ==== TYPES FOR NUTRITION DATA ENGINEERING ====

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

export type NutritionData = typeof nutritionData.$inferSelect;
export type InsertNutritionData = z.infer<typeof insertNutritionDataSchema>;

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;

export type UnitConversion = typeof unitConversions.$inferSelect;
export type InsertUnitConversion = z.infer<typeof insertUnitConversionSchema>;

export type DensityData = typeof densityData.$inferSelect;
export type InsertDensityData = z.infer<typeof insertDensityDataSchema>;

export type ContextOverride = typeof contextOverrides.$inferSelect;
export type InsertContextOverride = z.infer<typeof insertContextOverrideSchema>;

export type EtlJob = typeof etlJobs.$inferSelect;
export type InsertEtlJob = z.infer<typeof insertEtlJobSchema>;

export type DataQualityMetric = typeof dataQualityMetrics.$inferSelect;
export type InsertDataQualityMetric = z.infer<typeof insertDataQualityMetricSchema>;

export type DiscoveryQueueItem = typeof discoveryQueue.$inferSelect;
export type InsertDiscoveryQueueItem = z.infer<typeof insertDiscoveryQueueItemSchema>;

// ==== ENHANCED NUTRITION SYSTEM SCHEMAS ====
// These are defined here at the very end after ALL table definitions to avoid hoisting issues

export const insertNutritionProfileSchema = createInsertSchema(nutritionProfile).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalysisCacheSchema = createInsertSchema(analysisCache).omit({
  id: true,
  createdAt: true,
  lastAccessed: true,
});

export const insertRecipeCacheSchema = createInsertSchema(recipeCache).omit({
  id: true,
  createdAt: true,
  lastAccessed: true,
});

// Enhanced nutrition system types  
export type AnalysisCache = typeof analysisCache.$inferSelect;
export type RecipeCache = typeof recipeCache.$inferSelect;
export type NutritionProfile = typeof nutritionProfile.$inferSelect;
export type InsertNutritionProfile = z.infer<typeof insertNutritionProfileSchema>;

// ==== RECIPE SYSTEM TYPES ====

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type UserSavedRecipe = typeof userSavedRecipes.$inferSelect;
export type InsertUserSavedRecipe = z.infer<typeof insertUserSavedRecipeSchema>;

export type RecipeCollection = typeof recipeCollections.$inferSelect;
export type InsertRecipeCollection = z.infer<typeof insertRecipeCollectionSchema>;

export type CollectionRecipe = typeof collectionRecipes.$inferSelect;
export type InsertCollectionRecipe = z.infer<typeof insertCollectionRecipeSchema>;

export type RecipeRating = typeof recipeRatings.$inferSelect;
export type InsertRecipeRating = z.infer<typeof insertRecipeRatingSchema>;

export type RecipeComment = typeof recipeComments.$inferSelect;
export type InsertRecipeComment = z.infer<typeof insertRecipeCommentSchema>;

export type RecipePhoto = typeof recipePhotos.$inferSelect;
export type InsertRecipePhoto = z.infer<typeof insertRecipePhotoSchema>;

export type RecipeModification = typeof recipeModifications.$inferSelect;
export type InsertRecipeModification = z.infer<typeof insertRecipeModificationSchema>;

export type IngredientSubstitution = typeof ingredientSubstitutions.$inferSelect;
export type InsertIngredientSubstitution = z.infer<typeof insertIngredientSubstitutionSchema>;

export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = z.infer<typeof insertShoppingListSchema>;

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;

export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;

export type PlannedMeal = typeof plannedMeals.$inferSelect;
export type InsertPlannedMeal = z.infer<typeof insertPlannedMealSchema>;

export type CookingTimer = typeof cookingTimers.$inferSelect;
export type InsertCookingTimer = z.infer<typeof insertCookingTimerSchema>;

export type RecipeShare = typeof recipeShares.$inferSelect;
export type InsertRecipeShare = z.infer<typeof insertRecipeShareSchema>;

export type UserRecipeHistory = typeof userRecipeHistory.$inferSelect;
export type InsertUserRecipeHistory = z.infer<typeof insertUserRecipeHistorySchema>;
