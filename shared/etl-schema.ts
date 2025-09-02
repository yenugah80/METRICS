// ETL Schema for Real Nutrition Data Integration
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

// USDA FDC (Food Data Central) Integration
export const usdaFoods = pgTable("usda_foods", {
  id: varchar("id").primaryKey(), // FDC ID from USDA
  description: text("description").notNull(),
  dataType: varchar("data_type").notNull(), // foundation, survey, legacy, etc.
  category: varchar("category"),
  
  // Nutrition per 100g (standardized)
  calories: real("calories"),
  protein: real("protein"),
  carbohydrates: real("carbohydrates"),
  fat: real("fat"),
  fiber: real("fiber"),
  sugars: real("sugars"),
  sodium: real("sodium"),
  
  // Micronutrients
  calcium: real("calcium"),
  iron: real("iron"),
  vitaminC: real("vitamin_c"),
  vitaminA: real("vitamin_a"),
  
  // Data quality
  dataPoints: integer("data_points"), // Number of samples
  publicationDate: date("publication_date"),
  
  // ETL metadata
  lastUpdated: timestamp("last_updated").defaultNow(),
  verified: boolean("verified").default(false),
}, (table) => ({
  descriptionIdx: index("usda_foods_description_idx").on(table.description),
  categoryIdx: index("usda_foods_category_idx").on(table.category),
}));

// Open Food Facts Integration
export const openFoodFacts = pgTable("open_food_facts", {
  id: varchar("id").primaryKey(), // Barcode/product code
  productName: text("product_name").notNull(),
  brands: text("brands"),
  categories: text("categories"),
  
  // Nutrition per 100g
  energyKj: real("energy_kj"),
  energyKcal: real("energy_kcal"),
  proteins: real("proteins"),
  carbohydrates: real("carbohydrates"),
  fat: real("fat"),
  saturatedFat: real("saturated_fat"),
  fiber: real("fiber"),
  sodium: real("sodium"),
  salt: real("salt"),
  sugars: real("sugars"),
  
  // Product metadata
  packaging: text("packaging"),
  countries: text("countries"),
  ingredients: text("ingredients"),
  allergens: text("allergens"),
  
  // Nutrition scores
  novaGroup: integer("nova_group"), // Processing level 1-4
  nutriscoreGrade: varchar("nutriscore_grade"), // A-E
  
  // ETL metadata
  lastModified: timestamp("last_modified"),
  completeness: real("completeness"), // 0-1 data completeness score
  verified: boolean("verified").default(false),
}, (table) => ({
  barcodeIdx: index("off_barcode_idx").on(table.id),
  brandsIdx: index("off_brands_idx").on(table.brands),
  nutriscoreIdx: index("off_nutriscore_idx").on(table.nutriscoreGrade),
}));

// Nutrition Database Mapping (maps our food IDs to external sources)
export const nutritionMapping = pgTable("nutrition_mapping", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  internalFoodId: varchar("internal_food_id").notNull(), // Our foods.id
  
  // External source mappings
  usdaFdcId: varchar("usda_fdc_id"),
  openFoodFactsId: varchar("open_food_facts_id"),
  
  // Mapping metadata
  mappingConfidence: real("mapping_confidence"), // 0-1
  mappingSource: varchar("mapping_source"), // manual, ai, barcode_scan
  
  // ETL processing
  lastValidated: timestamp("last_validated"),
  validationStatus: varchar("validation_status").default('pending'), // pending, validated, rejected
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  internalFoodIdx: index("nutrition_mapping_internal_idx").on(table.internalFoodId),
  usdaIdx: index("nutrition_mapping_usda_idx").on(table.usdaFdcId),
  offIdx: index("nutrition_mapping_off_idx").on(table.openFoodFactsId),
}));

// Body Measurements & Progress Tracking
export const bodyMeasurements = pgTable("body_measurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  
  // Core measurements
  weight: real("weight"), // kg
  bodyFatPercentage: real("body_fat_percentage"),
  muscleMass: real("muscle_mass"), // kg
  
  // Body measurements
  waistCircumference: real("waist_circumference"), // cm
  hipCircumference: real("hip_circumference"), // cm
  chestCircumference: real("chest_circumference"), // cm
  armCircumference: real("arm_circumference"), // cm
  thighCircumference: real("thigh_circumference"), // cm
  
  // Calculated metrics
  bmi: real("bmi"),
  waistToHipRatio: real("waist_to_hip_ratio"),
  
  // Progress tracking
  measurementType: varchar("measurement_type").default('manual'), // manual, smart_scale, photo_analysis
  confidence: real("confidence"), // AI confidence if photo-based
  
  // Notes and context
  notes: text("notes"),
  moodRating: integer("mood_rating"), // 1-5
  energyLevel: integer("energy_level"), // 1-5
  
  measuredAt: timestamp("measured_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("body_measurements_user_id_idx").on(table.userId),
  measuredAtIdx: index("body_measurements_measured_at_idx").on(table.measuredAt),
}));

// Progress Photos
export const progressPhotos = pgTable("progress_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  
  // Photo metadata
  imageUrl: varchar("image_url").notNull(),
  photoType: varchar("photo_type").notNull(), // front, side, back
  bodyPart: varchar("body_part"), // full_body, face, abs, etc.
  
  // AI Analysis
  bodyComposition: jsonb("body_composition").$type<{
    muscle_definition: number,
    body_fat_estimate: number,
    posture_score: number
  }>(),
  
  // Progress tracking
  weightAtPhoto: real("weight_at_photo"),
  bodyFatAtPhoto: real("body_fat_at_photo"),
  
  // User notes
  notes: text("notes"),
  mood: integer("mood"), // 1-5
  
  // Privacy
  isPrivate: boolean("is_private").default(true),
  
  takenAt: timestamp("taken_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("progress_photos_user_id_idx").on(table.userId),
  takenAtIdx: index("progress_photos_taken_at_idx").on(table.takenAt),
  photoTypeIdx: index("progress_photos_type_idx").on(table.photoType),
}));

// Meal Swap Learning System
export const mealSwaps = pgTable("meal_swaps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  
  // Original planned meal
  originalMealId: varchar("original_meal_id"),
  originalMealName: varchar("original_meal_name").notNull(),
  
  // What user actually ate
  actualMealId: varchar("actual_meal_id"),
  actualMealName: varchar("actual_meal_name").notNull(),
  
  // Swap context
  mealType: varchar("meal_type").notNull(), // breakfast, lunch, dinner, snack
  swapReason: varchar("swap_reason"), // preference, availability, mood, health
  
  // Nutrition comparison
  originalNutrition: jsonb("original_nutrition").$type<{
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  }>().notNull(),
  actualNutrition: jsonb("actual_nutrition").$type<{
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  }>().notNull(),
  
  // AI learning metadata
  swapQuality: varchar("swap_quality"), // better, similar, worse
  nutritionImpact: real("nutrition_impact"), // -1 to 1
  userSatisfaction: integer("user_satisfaction"), // 1-5
  
  // Learning frequency
  swapCount: integer("swap_count").default(1), // How many times this swap happened
  
  swappedAt: timestamp("swapped_at").defaultNow(),
  lastSwapAt: timestamp("last_swap_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("meal_swaps_user_id_idx").on(table.userId),
  mealTypeIdx: index("meal_swaps_meal_type_idx").on(table.mealType),
  swapCountIdx: index("meal_swaps_count_idx").on(table.swapCount),
}));

// Diet Plan Progress Tracking
export const dietPlanProgress = pgTable("diet_plan_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  dietPlanId: varchar("diet_plan_id").notNull(),
  
  // Daily tracking
  date: date("date").notNull(),
  dayNumber: integer("day_number").notNull(), // 1-28
  
  // Meal completion status
  breakfastCompleted: boolean("breakfast_completed").default(false),
  lunchCompleted: boolean("lunch_completed").default(false),
  dinnerCompleted: boolean("dinner_completed").default(false),
  snackCompleted: boolean("snack_completed").default(false),
  
  // Actual vs planned nutrition
  plannedCalories: real("planned_calories"),
  actualCalories: real("actual_calories"),
  plannedProtein: real("planned_protein"),
  actualProtein: real("actual_protein"),
  plannedCarbs: real("planned_carbs"),
  actualCarbs: real("actual_carbs"),
  plannedFat: real("planned_fat"),
  actualFat: real("actual_fat"),
  
  // Adherence metrics
  adherenceScore: real("adherence_score"), // 0-100
  nutritionScore: real("nutrition_score"), // 0-100
  
  // User feedback
  satisfactionRating: integer("satisfaction_rating"), // 1-5
  difficultyRating: integer("difficulty_rating"), // 1-5
  hungerLevel: integer("hunger_level"), // 1-5
  energyLevel: integer("energy_level"), // 1-5
  
  // Notes
  notes: text("notes"),
  
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userDateIdx: unique("diet_plan_progress_user_date_idx").on(table.userId, table.date),
  planIdIdx: index("diet_plan_progress_plan_id_idx").on(table.dietPlanId),
  adherenceIdx: index("diet_plan_progress_adherence_idx").on(table.adherenceScore),
}));

// Export types for TypeScript usage
export type UsdaFood = typeof usdaFoods.$inferSelect;
export type InsertUsdaFood = typeof usdaFoods.$inferInsert;

export type OpenFoodFact = typeof openFoodFacts.$inferSelect;
export type InsertOpenFoodFact = typeof openFoodFacts.$inferInsert;

export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type InsertBodyMeasurement = typeof bodyMeasurements.$inferInsert;

export type ProgressPhoto = typeof progressPhotos.$inferSelect;
export type InsertProgressPhoto = typeof progressPhotos.$inferInsert;

export type MealSwap = typeof mealSwaps.$inferSelect;
export type InsertMealSwap = typeof mealSwaps.$inferInsert;

export type DietPlanProgress = typeof dietPlanProgress.$inferSelect;
export type InsertDietPlanProgress = typeof dietPlanProgress.$inferInsert;