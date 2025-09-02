// ============================================================================
// VALIDATION UTILITIES - Clean Input Validation
// ============================================================================

import { z } from 'zod';

// MEAL VALIDATION
export const mealSchema = z.object({
  name: z.string().min(1, 'Meal name is required'),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional()
});

// USER PROFILE VALIDATION
export const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  calorieGoal: z.number().min(1000).max(5000).optional(),
  proteinGoal: z.number().min(50).max(300).optional(),
  carbGoal: z.number().min(50).max(500).optional(),
  fatGoal: z.number().min(20).max(200).optional()
});

// AI CHAT VALIDATION
export const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().optional()
});

// HELPER FUNCTIONS
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
  }
  
  return result.data;
}

export function sanitizeString(input: string): string {
  return input.trim().slice(0, 1000); // Basic sanitization
}