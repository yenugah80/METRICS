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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with traditional auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
]);

// Recipes table
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  servings: integer("servings").default(1),
  ingredients: jsonb("ingredients").notNull(), // [{name, amount, unit}]
  instructions: text("instructions").array().notNull(),
  tags: text("tags").array(), // ['keto', 'vegan', 'quick']
  difficulty: varchar("difficulty").default("medium"), // 'easy', 'medium', 'hard'
  estimatedCalories: integer("estimated_calories"),
  estimatedProtein: decimal("estimated_protein", { precision: 6, scale: 2 }),
  nutritionGrade: varchar("nutrition_grade").default("C"),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  meals: many(meals),
  dailyAggregates: many(dailyAggregates),
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

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
});

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
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
