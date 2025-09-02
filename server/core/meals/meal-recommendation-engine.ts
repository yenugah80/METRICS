/**
 * Personalized Meal Recommendation Engine
 * Provides intelligent meal suggestions based on user preferences, nutrition goals, and meal history
 */

import { storage } from './storage';
import { OpenAIManager } from '../../integrations/openai/openai-manager';
import { calculateNutritionScore } from './nutrition-scoring';

export interface UserPreferences {
  dietPreferences: string[]; // ['keto', 'vegan', 'mediterranean', 'paleo']
  allergens: string[]; // ['nuts', 'dairy', 'gluten', 'shellfish']
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbTarget: number;
  dailyFatTarget: number;
  cuisinePreferences: string[]; // ['italian', 'asian', 'mexican', 'american']
  mealTypes: string[]; // ['breakfast', 'lunch', 'dinner', 'snack']
}

export interface MealRecommendation {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  mealType: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number; // minutes
  servings: number;
  
  // Nutrition information
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  
  // Recommendation scoring
  personalizedScore: number; // 0-100 based on user preferences
  nutritionScore: number; // 0-100 health score
  matchReasons: string[]; // Why this meal was recommended
  
  // Recipe details
  ingredients: Array<{
    name: string;
    amount: string;
    category: string;
  }>;
  instructions: string[];
  tags: string[];
  
  // AI-generated content
  healthBenefits: string[];
  variations: string[];
  pairedWith: string[]; // Suggested accompaniments
}

export interface RecommendationInput {
  userId?: string;
  mealType?: string; // 'breakfast', 'lunch', 'dinner', 'snack'
  maxCalories?: number;
  excludeIngredients?: string[];
  preferredCuisines?: string[];
  maxPrepTime?: number;
  currentNutritionToday?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  limit?: number; // Number of recommendations to return (default: 5)
}

/**
 * Generate personalized meal recommendations
 */
export async function generateMealRecommendations(input: RecommendationInput): Promise<MealRecommendation[]> {
  const startTime = Date.now();
  
  try {
    // Get user preferences if userId provided
    let userPreferences: UserPreferences | null = null;
    let mealHistory: any[] = [];
    
    if (input.userId) {
      const userProfile = await storage.getUserProfile(input.userId);
      const recentMeals = await storage.getUserRecentMeals(input.userId, 30); // Last 30 days
      
      if (userProfile) {
        userPreferences = {
          dietPreferences: userProfile.dietPreferences || [],
          allergens: userProfile.allergens || [],
          dailyCalorieTarget: userProfile.dailyCalorieTarget || 2000,
          dailyProteinTarget: userProfile.dailyProteinTarget || 150,
          dailyCarbTarget: userProfile.dailyCarbTarget || 250,
          dailyFatTarget: userProfile.dailyFatTarget || 80,
          cuisinePreferences: [], // TODO: Add to user profile
          mealTypes: ['breakfast', 'lunch', 'dinner', 'snack']
        };
      }
      
      mealHistory = recentMeals || [];
    }
    
    // Determine remaining nutrition needs for the day
    const remainingNutrition = calculateRemainingNutrition(
      userPreferences,
      input.currentNutritionToday
    );
    
    // Generate AI-powered recommendations
    const recommendations = await generateAIRecommendations({
      userPreferences,
      mealHistory,
      remainingNutrition,
      constraints: {
        mealType: input.mealType,
        maxCalories: input.maxCalories || remainingNutrition.calories,
        excludeIngredients: input.excludeIngredients || [],
        preferredCuisines: input.preferredCuisines || userPreferences?.cuisinePreferences || [],
        maxPrepTime: input.maxPrepTime || 60
      },
      limit: input.limit || 5
    });
    
    // Score and rank recommendations
    const scoredRecommendations = recommendations.map(rec => 
      scoreRecommendation(rec, userPreferences, mealHistory, remainingNutrition)
    );
    
    // Sort by personalized score
    scoredRecommendations.sort((a, b) => b.personalizedScore - a.personalizedScore);
    
    const processingTime = Date.now() - startTime;
    console.log(`Generated ${scoredRecommendations.length} meal recommendations in ${processingTime}ms`);
    
    return scoredRecommendations;
    
  } catch (error) {
    console.error('Meal recommendation generation error:', error);
    throw new Error('Failed to generate meal recommendations');
  }
}

/**
 * Calculate remaining nutrition needs for the day
 */
function calculateRemainingNutrition(
  userPreferences: UserPreferences | null,
  currentNutrition?: { calories: number; protein: number; carbs: number; fat: number }
): { calories: number; protein: number; carbs: number; fat: number } {
  const targets = {
    calories: userPreferences?.dailyCalorieTarget || 2000,
    protein: userPreferences?.dailyProteinTarget || 150,
    carbs: userPreferences?.dailyCarbTarget || 250,
    fat: userPreferences?.dailyFatTarget || 80
  };
  
  if (!currentNutrition) {
    return targets;
  }
  
  return {
    calories: Math.max(0, targets.calories - currentNutrition.calories),
    protein: Math.max(0, targets.protein - currentNutrition.protein),
    carbs: Math.max(0, targets.carbs - currentNutrition.carbs),
    fat: Math.max(0, targets.fat - currentNutrition.fat)
  };
}

/**
 * Generate AI-powered meal recommendations
 */
async function generateAIRecommendations(params: {
  userPreferences: UserPreferences | null;
  mealHistory: any[];
  remainingNutrition: any;
  constraints: any;
  limit: number;
}): Promise<MealRecommendation[]> {
  
  const { userPreferences, mealHistory, remainingNutrition, constraints, limit } = params;
  
  // Create context for AI
  const dietContext = userPreferences?.dietPreferences?.join(', ') || 'balanced';
  const allergenContext = userPreferences?.allergens?.length 
    ? `Must avoid: ${userPreferences.allergens.join(', ')}`
    : 'No specific allergens to avoid';
  
  const recentMealsContext = mealHistory.length > 0
    ? `Recent meals include: ${mealHistory.slice(0, 10).map(m => m.name).join(', ')}`
    : 'No recent meal history available';
  
  const nutritionContext = `Target nutrition: ${remainingNutrition.calories} calories, ${remainingNutrition.protein}g protein, ${remainingNutrition.carbs}g carbs, ${remainingNutrition.fat}g fat`;
  
  const prompt = `Generate ${limit} personalized meal recommendations in JSON format.

Context:
- Diet preferences: ${dietContext}
- Allergens: ${allergenContext}
- Meal type: ${constraints.mealType || 'any'}
- Max prep time: ${constraints.maxPrepTime} minutes
- ${nutritionContext}
- ${recentMealsContext}
- Preferred cuisines: ${constraints.preferredCuisines.join(', ') || 'any'}

CRITICAL: Return ONLY valid JSON array with this exact structure:
[{
  "id": "unique-id",
  "name": "Recipe Name",
  "description": "Brief description",
  "cuisine": "cuisine type",
  "mealType": "${constraints.mealType || 'dinner'}",
  "difficulty": "easy",
  "prepTime": 30,
  "servings": 2,
  "calories": 400,
  "protein": 25,
  "carbs": 35,
  "fat": 15,
  "fiber": 8,
  "sodium": 300,
  "ingredients": [{"name": "ingredient", "amount": "1 cup", "category": "protein"}],
  "instructions": ["Step 1", "Step 2"],
  "tags": ["healthy", "quick"],
  "healthBenefits": ["High protein", "Good source of fiber"],
  "variations": ["Add vegetables", "Use different protein"],
  "pairedWith": ["Side salad", "Brown rice"]
}]

Ensure recipes match dietary preferences, avoid allergens, and fit nutrition targets.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and chef AI. Generate personalized meal recommendations in valid JSON format only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 2000,
      temperature: 0.7 // Some creativity while maintaining consistency
    });

    const content = response.choices[0].message.content || '';
    
    try {
      const recommendations = JSON.parse(content.trim());
      
      // Validate and ensure proper structure
      return Array.isArray(recommendations) 
        ? recommendations.map((rec, index) => ({
            id: rec.id || `rec-${Date.now()}-${index}`,
            name: rec.name || 'Healthy Meal',
            description: rec.description || 'A nutritious meal option',
            cuisine: rec.cuisine || 'international',
            mealType: rec.mealType || constraints.mealType || 'dinner',
            difficulty: rec.difficulty || 'medium',
            prepTime: Number(rec.prepTime) || 30,
            servings: Number(rec.servings) || 2,
            calories: Number(rec.calories) || 400,
            protein: Number(rec.protein) || 20,
            carbs: Number(rec.carbs) || 30,
            fat: Number(rec.fat) || 15,
            fiber: Number(rec.fiber) || 5,
            sodium: Number(rec.sodium) || 200,
            personalizedScore: 0, // Will be calculated later
            nutritionScore: 0, // Will be calculated later
            matchReasons: [], // Will be populated later
            ingredients: Array.isArray(rec.ingredients) ? rec.ingredients : [],
            instructions: Array.isArray(rec.instructions) ? rec.instructions : [],
            tags: Array.isArray(rec.tags) ? rec.tags : [],
            healthBenefits: Array.isArray(rec.healthBenefits) ? rec.healthBenefits : [],
            variations: Array.isArray(rec.variations) ? rec.variations : [],
            pairedWith: Array.isArray(rec.pairedWith) ? rec.pairedWith : []
          }))
        : [];
    } catch (parseError) {
      console.error('Failed to parse AI recommendation response:', parseError);
      return generateFallbackRecommendations(constraints, limit);
    }
  } catch (error) {
    console.error('AI recommendation generation error:', error);
    return generateFallbackRecommendations(constraints, limit);
  }
}

/**
 * Score a recommendation based on user preferences and context
 */
function scoreRecommendation(
  recommendation: MealRecommendation,
  userPreferences: UserPreferences | null,
  mealHistory: any[],
  remainingNutrition: any
): MealRecommendation {
  let score = 50; // Base score
  const matchReasons: string[] = [];
  
  // Diet preference matching (+20 points)
  if (userPreferences?.dietPreferences) {
    const dietMatch = userPreferences.dietPreferences.some(diet => 
      recommendation.tags.some(tag => tag.toLowerCase().includes(diet.toLowerCase()))
    );
    if (dietMatch) {
      score += 20;
      matchReasons.push('Matches your dietary preferences');
    }
  }
  
  // Allergen avoidance (+15 points if safe)
  if (userPreferences?.allergens) {
    const hasAllergens = userPreferences.allergens.some(allergen =>
      recommendation.ingredients.some(ing => 
        ing.name.toLowerCase().includes(allergen.toLowerCase())
      )
    );
    if (!hasAllergens) {
      score += 15;
      matchReasons.push('Safe for your allergen restrictions');
    } else {
      score -= 30; // Heavy penalty for allergens
    }
  }
  
  // Nutrition goal alignment (+15 points)
  const nutritionFit = calculateNutritionFit(recommendation, remainingNutrition);
  score += nutritionFit * 15;
  if (nutritionFit > 0.7) {
    matchReasons.push('Fits your remaining nutrition goals');
  }
  
  // Meal variety (+10 points for different from recent meals)
  const recentMealNames = mealHistory.slice(0, 7).map(m => m.name?.toLowerCase() || '');
  const isDifferent = !recentMealNames.some(name => 
    name.includes(recommendation.name.toLowerCase()) || 
    recommendation.name.toLowerCase().includes(name)
  );
  if (isDifferent && mealHistory.length > 0) {
    score += 10;
    matchReasons.push('Adds variety to your recent meals');
  }
  
  // Cuisine preference (+5 points)
  if (userPreferences?.cuisinePreferences?.includes(recommendation.cuisine)) {
    score += 5;
    matchReasons.push(`Matches your ${recommendation.cuisine} cuisine preference`);
  }
  
  // Calculate nutrition score
  const nutritionScore = calculateNutritionScore({
    protein: recommendation.protein,
    carbs: recommendation.carbs,
    fat: recommendation.fat,
    fiber: recommendation.fiber,
    sodium: recommendation.sodium,
    sugar: 0, // Not provided in recommendation
    saturated_fat: recommendation.fat * 0.3 // Estimate
  });
  
  // Bonus for high nutrition score
  score += (nutritionScore.score / 100) * 10;
  if (nutritionScore.score >= 80) {
    matchReasons.push('Excellent nutritional profile');
  }
  
  return {
    ...recommendation,
    personalizedScore: Math.min(100, Math.max(0, score)),
    nutritionScore: nutritionScore.score,
    matchReasons
  };
}

/**
 * Calculate how well a recommendation fits remaining nutrition needs
 */
function calculateNutritionFit(
  recommendation: MealRecommendation,
  remainingNutrition: any
): number {
  if (remainingNutrition.calories <= 0) return 0;
  
  const caloriesFit = Math.min(1, recommendation.calories / remainingNutrition.calories);
  const proteinFit = remainingNutrition.protein > 0 
    ? Math.min(1, recommendation.protein / remainingNutrition.protein) 
    : 0.5;
  const carbsFit = remainingNutrition.carbs > 0 
    ? Math.min(1, recommendation.carbs / remainingNutrition.carbs) 
    : 0.5;
  const fatFit = remainingNutrition.fat > 0 
    ? Math.min(1, recommendation.fat / remainingNutrition.fat) 
    : 0.5;
  
  // Average fit score with calories weighted more heavily
  return (caloriesFit * 0.4 + proteinFit * 0.2 + carbsFit * 0.2 + fatFit * 0.2);
}

/**
 * Generate fallback recommendations when AI fails
 */
function generateFallbackRecommendations(constraints: any, limit: number): MealRecommendation[] {
  const fallbackMeals = [
    {
      id: 'fallback-1',
      name: 'Grilled Chicken Salad',
      description: 'Fresh mixed greens with grilled chicken breast and vegetables',
      cuisine: 'american',
      mealType: constraints.mealType || 'lunch',
      difficulty: 'easy' as const,
      prepTime: 20,
      servings: 1,
      calories: 320,
      protein: 35,
      carbs: 12,
      fat: 14,
      fiber: 8,
      sodium: 280,
      ingredients: [
        { name: 'Chicken breast', amount: '150g', category: 'protein' },
        { name: 'Mixed greens', amount: '2 cups', category: 'vegetable' },
        { name: 'Cherry tomatoes', amount: '1/2 cup', category: 'vegetable' }
      ],
      instructions: ['Season and grill chicken', 'Prepare salad', 'Combine and serve'],
      tags: ['healthy', 'high-protein', 'gluten-free'],
      healthBenefits: ['High protein content', 'Rich in vitamins'],
      variations: ['Add avocado', 'Use different dressing'],
      pairedWith: ['Whole grain bread', 'Herbal tea']
    },
    {
      id: 'fallback-2',
      name: 'Quinoa Buddha Bowl',
      description: 'Nutritious bowl with quinoa, roasted vegetables, and tahini dressing',
      cuisine: 'mediterranean',
      mealType: constraints.mealType || 'dinner',
      difficulty: 'medium' as const,
      prepTime: 35,
      servings: 2,
      calories: 450,
      protein: 18,
      carbs: 65,
      fat: 16,
      fiber: 12,
      sodium: 320,
      ingredients: [
        { name: 'Quinoa', amount: '1 cup', category: 'grain' },
        { name: 'Roasted vegetables', amount: '2 cups', category: 'vegetable' },
        { name: 'Tahini', amount: '2 tbsp', category: 'fat' }
      ],
      instructions: ['Cook quinoa', 'Roast vegetables', 'Prepare dressing', 'Assemble bowl'],
      tags: ['vegan', 'high-fiber', 'nutrient-dense'],
      healthBenefits: ['Complete protein', 'High in fiber'],
      variations: ['Add chickpeas', 'Use different vegetables'],
      pairedWith: ['Green tea', 'Fresh fruit']
    }
  ];
  
  return fallbackMeals.slice(0, limit).map(meal => ({
    ...meal,
    personalizedScore: 60,
    nutritionScore: 75,
    matchReasons: ['Healthy balanced option']
  }));
}

/**
 * Get trending meal recommendations based on popular choices
 */
export async function getTrendingRecommendations(limit: number = 10): Promise<MealRecommendation[]> {
  // In a real implementation, this would analyze popular meals from all users
  // For now, return a curated list of trending healthy meals
  
  const trendingMeals = [
    'Mediterranean Chicken Bowl',
    'Avocado Toast with Poached Egg',
    'Asian-Style Salmon with Quinoa',
    'Mexican Black Bean Burrito Bowl',
    'Greek Yogurt Parfait with Berries',
    'Keto-Friendly Zucchini Noodles',
    'Protein-Packed Smoothie Bowl',
    'Italian Caprese Salad',
    'Thai-Inspired Lettuce Wraps',
    'Moroccan Spiced Chickpea Curry'
  ];
  
  const recommendations = await Promise.all(
    trendingMeals.slice(0, limit).map(async (mealName, index) => {
      return generateAIRecommendations({
        userPreferences: null,
        mealHistory: [],
        remainingNutrition: { calories: 500, protein: 25, carbs: 50, fat: 20 },
        constraints: { 
          mealType: 'any',
          maxCalories: 600,
          excludeIngredients: [],
          preferredCuisines: [],
          maxPrepTime: 45
        },
        limit: 1
      }).then(recs => recs[0] || generateFallbackRecommendations({}, 1)[0])
    })
  );
  
  return recommendations.filter(Boolean);
}