// ============================================================================
// CLEAN SCHEMA - Production Grade, Essential Tables Only
// ============================================================================

import { pgTable, varchar, integer, timestamp, text, decimal, boolean, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// USERS TABLE
export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  email: varchar('email').notNull().unique(),
  name: varchar('name'),
  avatar: text('avatar'),
  calorieGoal: integer('calorie_goal').default(2000),
  proteinGoal: integer('protein_goal').default(150),
  carbGoal: integer('carb_goal').default(250),
  fatGoal: integer('fat_goal').default(65),
  subscription: varchar('subscription').default('free'),
  createdAt: timestamp('created_at').defaultNow()
});

// MEALS TABLE
export const meals = pgTable('meals', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  name: varchar('name').notNull(),
  calories: decimal('calories', { precision: 8, scale: 2 }),
  protein: decimal('protein', { precision: 8, scale: 2 }),
  carbs: decimal('carbs', { precision: 8, scale: 2 }),
  fat: decimal('fat', { precision: 8, scale: 2 }),
  mealType: varchar('meal_type'), // breakfast, lunch, dinner, snack
  imageUrl: text('image_url'),
  loggedAt: timestamp('logged_at').defaultNow()
});

// DAILY NUTRITION TRACKING
export const dailyNutrition = pgTable('daily_nutrition', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  date: varchar('date').notNull(), // YYYY-MM-DD format
  totalCalories: decimal('total_calories', { precision: 8, scale: 2 }).default('0'),
  totalProtein: decimal('total_protein', { precision: 8, scale: 2 }).default('0'),
  totalCarbs: decimal('total_carbs', { precision: 8, scale: 2 }).default('0'),
  totalFat: decimal('total_fat', { precision: 8, scale: 2 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow()
});

// CHEF AI CONVERSATIONS
export const chefAiConversations = pgTable('chef_ai_conversations', {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  title: varchar('title'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// CHEF AI MESSAGES
export const chefAiMessages = pgTable('chef_ai_messages', {
  id: serial('id').primaryKey(),
  conversationId: varchar('conversation_id').notNull().references(() => chefAiConversations.id),
  role: varchar('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  sentiment: varchar('sentiment'), // 'positive' | 'negative' | 'neutral' | 'frustrated' | 'excited'
  createdAt: timestamp('created_at').defaultNow()
});

// RECIPES (AI GENERATED)
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').references(() => users.id),
  title: varchar('title').notNull(),
  description: text('description'),
  ingredients: text('ingredients').notNull(), // JSON string
  instructions: text('instructions').notNull(),
  prepTime: integer('prep_time'), // minutes
  cookTime: integer('cook_time'), // minutes
  servings: integer('servings').default(1),
  calories: decimal('calories', { precision: 8, scale: 2 }),
  protein: decimal('protein', { precision: 8, scale: 2 }),
  carbs: decimal('carbs', { precision: 8, scale: 2 }),
  fat: decimal('fat', { precision: 8, scale: 2 }),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// ZOD SCHEMAS FOR VALIDATION
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertMealSchema = createInsertSchema(meals).omit({ 
  id: true, 
  loggedAt: true 
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({ 
  id: true, 
  createdAt: true 
});

// TYPES
export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Meal = typeof meals.$inferSelect;
export type NewMeal = z.infer<typeof insertMealSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = z.infer<typeof insertRecipeSchema>;
export type ChefAiConversation = typeof chefAiConversations.$inferSelect;
export type ChefAiMessage = typeof chefAiMessages.$inferSelect;