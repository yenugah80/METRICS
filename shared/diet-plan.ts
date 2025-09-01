import { z } from "zod";

export const MealMacro = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().optional().default(0),
});

export const DietFlags = z.object({
  keto: z.boolean().default(false),
  vegan: z.boolean().default(false),
  vegetarian: z.boolean().default(false),
  glutenFree: z.boolean().default(false),
  dairyFree: z.boolean().default(false),
  lowSodium: z.boolean().default(false),
  diabeticFriendly: z.boolean().default(false),
  heartHealthy: z.boolean().default(false),
  antiInflammatory: z.boolean().default(false),
});

export const PlanMeal = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string(),
  ingredients: z.array(z.string()).default([]),
  instructions: z.array(z.string()).default([]),
  macros: MealMacro,
  notes: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  dietFlags: DietFlags,
  prepTime: z.number().optional(), // minutes
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  costLevel: z.enum(["budget", "moderate", "premium"]).default("moderate"),
  sustainabilityScore: z.number().min(0).max(100).optional(),
});

export const HealthCondition = z.object({
  condition: z.enum([
    "diabetes", "prediabetes", "pcos", "ibs", "crohns", "celiac",
    "hypertension", "heart_disease", "kidney_disease", "liver_disease",
    "thyroid_disorder", "eating_disorder_recovery", "pregnancy", 
    "breastfeeding", "menopause", "sports_performance"
  ]),
  severity: z.enum(["mild", "moderate", "severe"]).default("moderate"),
  medications: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
});

export const ProgressMetrics = z.object({
  adherenceScore: z.number().min(0).max(100), // 0-100%
  calorieAccuracy: z.number().min(0).max(100), // how close to target
  macroBalance: z.object({
    protein: z.number().min(0).max(100),
    carbs: z.number().min(0).max(100),
    fat: z.number().min(0).max(100),
  }),
  streakDays: z.number().nonnegative(),
  weeklyTrend: z.enum(["improving", "stable", "declining"]),
});

export const SmartSuggestion = z.object({
  type: z.enum(["meal_swap", "portion_adjust", "timing_shift", "ingredient_sub"]),
  reason: z.string(),
  originalItem: z.string(),
  suggestedItem: z.string(),
  nutritionalImpact: z.object({
    calorieDelta: z.number(),
    proteinDelta: z.number(),
    macroImprovement: z.boolean(),
  }),
  confidenceScore: z.number().min(0).max(100),
});

export const DietPlanGoal = z.object({
  type: z.enum([
    "weight_loss", "weight_gain", "maintenance", "muscle_gain", 
    "fat_loss", "athletic_performance", "health_condition_management",
    "habit_building", "energy_optimization"
  ]),
  targetValue: z.number().optional(), // weight target, performance metric, etc.
  timeframe: z.number(), // days
  priority: z.enum(["primary", "secondary", "tertiary"]),
  progressTracking: z.object({
    metric: z.string(), // "weight", "body_fat", "energy_level", etc.
    frequency: z.enum(["daily", "weekly", "monthly"]),
    targetRange: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
  }),
});

export const EnhancedDietPlan = z.object({
  id: z.string(),
  userId: z.string(),
  planName: z.string(),
  goals: z.array(DietPlanGoal),
  healthConditions: z.array(HealthCondition).default([]),
  duration: z.number(), // days
  startDate: z.string(),
  endDate: z.string(),
  dailyTargets: MealMacro.extend({
    micronutrients: z.record(z.string(), z.number()).default({}),
  }),
  meals: z.array(PlanMeal),
  currentProgress: ProgressMetrics.optional(),
  smartSuggestions: z.array(SmartSuggestion).default([]),
  adaptiveSettings: z.object({
    autoAdjustPortions: z.boolean().default(true),
    realTimeRebalancing: z.boolean().default(true),
    suggestionFrequency: z.enum(["minimal", "moderate", "high"]).default("moderate"),
    conditionFocusLevel: z.enum(["basic", "comprehensive", "strict"]).default("comprehensive"),
  }),
  engagementFeatures: z.object({
    achievementUnlocks: z.array(z.string()).default([]),
    weeklyThemes: z.array(z.string()).default([]),
    habitChallenges: z.array(z.string()).default([]),
    socialSharing: z.boolean().default(false),
  }),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types
export type MealMacroType = z.infer<typeof MealMacro>;
export type DietFlagsType = z.infer<typeof DietFlags>;
export type PlanMealType = z.infer<typeof PlanMeal>;
export type HealthConditionType = z.infer<typeof HealthCondition>;
export type ProgressMetricsType = z.infer<typeof ProgressMetrics>;
export type SmartSuggestionType = z.infer<typeof SmartSuggestion>;
export type DietPlanGoalType = z.infer<typeof DietPlanGoal>;
export type EnhancedDietPlanType = z.infer<typeof EnhancedDietPlan>;