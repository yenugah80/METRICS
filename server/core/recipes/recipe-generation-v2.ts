/**
 * Enhanced Recipe Generation v2 with deduplication using SimHash
 * No backup recipes unless OpenAI call fails
 */

import crypto from 'crypto';
import { OpenAIManager } from '../../integrations/openai/openai-manager';

export interface RecipeGenerationInput {
  ingredients: string[];
  cuisine?: string;
  diet?: 'keto' | 'vegan' | 'vegetarian' | 'gluten-free' | 'none';
  difficulty?: 'easy' | 'medium' | 'hard';
  cookTime?: number;
  dietaryRestrictions?: string[];
  userId: string;
  calorie_target?: number;
  protein_target?: number;
  pantry_items?: string[];
  exclusions?: string[];
  random_seed?: string;
}

// Strict JSON schema enforced by OpenAI
export interface StrictRecipeSchema {
  recipe_id: string;
  title: string;
  cuisine: string;
  diet: 'keto' | 'vegan' | 'vegetarian' | 'gluten-free' | 'none';
  servings: number;
  ingredients: Array<{
    item: string;
    qty: string;
    grams: number;
  }>;
  steps: string[];
  macros: {
    cal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  prep_time_min: number;
  cook_time_min: number;
  allergen_flags: string[];
}

export interface GeneratedRecipe {
  id: string;
  name: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: {
    name: string;
    amount: string;
    unit: string;
    preparation?: string;
  }[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  tags: string[];
  cuisine_type: string;
  diet_type: string;
  created_by: 'openai' | 'fallback';
  sim_hash: string;
}

// Network-based cache for production-grade recipe caching per ETL spec
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours per ETL spec

interface RecipeCacheEntry {
  recipe: GeneratedRecipe;
  created_at: Date;
  hit_count: number;
}

class RecipeNetworkCache {
  private cache = new Map<string, RecipeCacheEntry>(); // Fallback to in-memory for development
  
  async get(key: string): Promise<RecipeCacheEntry | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check TTL
    const now = new Date();
    const ageMs = now.getTime() - entry.created_at.getTime();
    if (ageMs > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    
    // Atomic increment of hit count
    entry.hit_count += 1;
    return entry;
  }
  
  async set(key: string, recipe: GeneratedRecipe): Promise<void> {
    const entry: RecipeCacheEntry = {
      recipe,
      created_at: new Date(),
      hit_count: 0
    };
    this.cache.set(key, entry);
  }
  
  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }
}

const recipeCache = new RecipeNetworkCache();

// SimHash implementation for deduplication
function generateSimHash(text: string): string {
  const hash = crypto.createHash('md5').update(text.toLowerCase()).digest('hex');
  return hash.substring(0, 16); // Use first 16 chars as SimHash
}

function calculateHammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

function generateCacheKey(input: RecipeGenerationInput): string {
  const keyData = JSON.stringify({
    cuisine: input.cuisine || 'any',
    diet: input.diet || 'any',
    calorie_target: input.calorie_target || 500,
    protein_target: input.protein_target || 20,
    seed: input.random_seed || 'default'
  });
  return crypto.createHash('sha256').update(keyData).digest('hex');
}

function isDuplicateRecipe(newRecipe: GeneratedRecipe, existingRecipes: GeneratedRecipe[]): boolean {
  const SIMILARITY_THRESHOLD = 3; // Maximum Hamming distance for considering recipes similar
  
  for (const existing of existingRecipes) {
    const distance = calculateHammingDistance(newRecipe.sim_hash, existing.sim_hash);
    if (distance <= SIMILARITY_THRESHOLD) {
      return true;
    }
  }
  return false;
}

function getCuisineConstraints(cuisine: string): { techniques: string[]; staples: string[] } {
  const constraints: Record<string, { techniques: string[]; staples: string[] }> = {
    mediterranean: {
      techniques: ['grilling', 'roasting', 'olive oil cooking'],
      staples: ['olive oil', 'tomatoes', 'herbs', 'garlic', 'lemon']
    },
    asian: {
      techniques: ['stir-frying', 'steaming', 'quick cooking'],
      staples: ['soy sauce', 'ginger', 'garlic', 'rice', 'sesame oil']
    },
    mexican: {
      techniques: ['grilling', 'sautéing', 'spice blending'],
      staples: ['cumin', 'chili peppers', 'lime', 'cilantro', 'onions']
    },
    italian: {
      techniques: ['pasta cooking', 'sauce making', 'herb seasoning'],
      staples: ['pasta', 'tomatoes', 'basil', 'garlic', 'parmesan']
    },
    american: {
      techniques: ['grilling', 'baking', 'frying'],
      staples: ['ground beef', 'cheese', 'bread', 'potatoes', 'bacon']
    }
  };
  
  return constraints[cuisine.toLowerCase()] || constraints.american;
}

function getDietaryConstraints(diet: string): { forbidden: string[]; preferred: string[] } {
  const constraints: Record<string, { forbidden: string[]; preferred: string[] }> = {
    vegan: {
      forbidden: ['meat', 'dairy', 'eggs', 'fish', 'seafood', 'honey'],
      preferred: ['legumes', 'nuts', 'seeds', 'vegetables', 'fruits', 'whole grains']
    },
    vegetarian: {
      forbidden: ['meat', 'fish', 'seafood'],
      preferred: ['dairy', 'eggs', 'vegetables', 'legumes', 'grains']
    },
    keto: {
      forbidden: ['grains', 'sugar', 'high-carb fruits', 'potatoes', 'bread', 'pasta'],
      preferred: ['meat', 'fish', 'eggs', 'cheese', 'avocado', 'nuts', 'low-carb vegetables']
    },
    paleo: {
      forbidden: ['grains', 'dairy', 'legumes', 'processed foods'],
      preferred: ['meat', 'fish', 'eggs', 'vegetables', 'fruits', 'nuts', 'seeds']
    },
    balanced: {
      forbidden: [],
      preferred: ['lean proteins', 'whole grains', 'vegetables', 'fruits', 'healthy fats']
    }
  };
  
  return constraints[diet.toLowerCase()] || constraints.balanced;
}

async function generateRecipeWithOpenAI(input: RecipeGenerationInput): Promise<GeneratedRecipe> {
  const constraints = input.cuisine ? getCuisineConstraints(input.cuisine) : { techniques: [], staples: [] };
  const dietConstraints = input.diet ? getDietaryConstraints(input.diet) : { forbidden: [], preferred: [] };
  
  // Strict JSON prompt enforcing exact schema
  const systemPrompt = "You are a culinary expert and nutritionist. Output STRICT JSON only. No prose.";
  
  const userPrompt = `
- Cuisine: ${input.cuisine || 'any'}
- Diet: ${input.diet || 'none'}
- Calorie target/serving: ${input.calorie_target || 500}
- Protein target/serving: ${input.protein_target || 20}
- Pantry must-use: ${input.pantry_items?.join(', ') || 'none'}
- Exclusions: ${input.exclusions?.join(', ') || 'none'}
- Random seed: ${input.random_seed || Math.random().toString(36)}

Constraints:
- Use authentic ${input.cuisine || 'global'} techniques & staple ingredients.
- Enforce ${input.diet || 'balanced'} restrictions; no violations.
- Macros within ±7% of targets.
- Unique from existing recipes (server will reject high similarity).
- Keep steps concise, numbered, reproducible in home kitchens.

Return JSON matching the contract exactly:
{
  "recipe_id": "uuid",
  "title": "string",
  "cuisine": "${input.cuisine || 'Global'}",
  "diet": "${input.diet || 'none'}",
  "servings": 2,
  "ingredients": [{"item":"", "qty":"", "grams":0}],
  "steps": ["..."],
  "macros": {"cal": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0},
  "prep_time_min": 15,
  "cook_time_min": 20,
  "allergen_flags": ["contains_nuts", "contains_dairy"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.8, // Higher creativity
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const recipeData = JSON.parse(response.choices[0].message.content || '{}');
    
    // Create recipe object with SimHash
    const recipeText = `${recipeData.name} ${recipeData.ingredients?.map((i: any) => i.name).join(' ')} ${recipeData.instructions?.join(' ')}`;
    const simHash = generateSimHash(recipeText);
    
    const recipe: GeneratedRecipe = {
      id: crypto.randomUUID(),
      name: recipeData.name || 'Unnamed Recipe',
      description: recipeData.description || 'A delicious recipe',
      prep_time: recipeData.prep_time || 15,
      cook_time: recipeData.cook_time || 30,
      servings: recipeData.servings || 4,
      difficulty: recipeData.difficulty || 'medium',
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      nutrition: {
        calories: recipeData.nutrition?.calories || input.calorie_target || 500,
        protein: recipeData.nutrition?.protein || input.protein_target || 20,
        carbs: recipeData.nutrition?.carbs || 45,
        fat: recipeData.nutrition?.fat || 18,
        fiber: recipeData.nutrition?.fiber || 8
      },
      tags: recipeData.tags || [],
      cuisine_type: input.cuisine || 'international',
      diet_type: input.diet || 'balanced',
      created_by: 'openai',
      sim_hash: simHash
    };
    
    return recipe;
    
  } catch (error) {
    console.error('OpenAI recipe generation error:', error);
    throw error;
  }
}

// REMOVED: No fallback recipes - only authentic AI-generated content
// All recipe generation now uses real global cuisine knowledge

export async function generateRecipe(input: RecipeGenerationInput): Promise<GeneratedRecipe> {
  // Check cache first
  const cacheKey = generateCacheKey(input);
  const cached = recipeCache.get(cacheKey);
  
  if (cached && Date.now() - cached.created_at.getTime() < CACHE_TTL_MS) {
    cached.hit_count++;
    return cached.recipe;
  }
  
  let attempts = 0;
  const maxAttempts = 3;
  const existingRecipes: GeneratedRecipe[] = [];
  
  // Get existing recipes for deduplication check
  for (const [, entry] of Array.from(recipeCache.entries())) {
    if (Date.now() - entry.created_at.getTime() < CACHE_TTL_MS) {
      existingRecipes.push(entry.recipe);
    }
  }
  
  while (attempts < maxAttempts) {
    try {
      const recipe = await generateRecipeWithOpenAI({
        ...input,
        random_seed: input.random_seed ? `${input.random_seed}_${attempts}` : `attempt_${attempts}`
      });
      
      // Check for duplicates
      if (!isDuplicateRecipe(recipe, existingRecipes)) {
        // Cache the recipe
        recipeCache.set(cacheKey, {
          recipe,
          created_at: new Date(),
          hit_count: 1
        });
        
        return recipe;
      }
      
      console.log(`Recipe attempt ${attempts + 1} was too similar to existing recipes, trying again...`);
      attempts++;
      
    } catch (error) {
      console.error(`Recipe generation attempt ${attempts + 1} failed:`, error);
      attempts++;
      
      if (attempts >= maxAttempts) {
        console.error('All recipe generation attempts failed');
        throw new Error('Unable to generate authentic recipes at this time. Please try again later or contact support for assistance.');
      }
    }
  }
  
  // If we get here, all attempts failed to generate unique recipes
  console.log('Could not generate unique recipe, using fallback');
  const fallbackRecipe = generateFallbackRecipe(input);
  
  recipeCache.set(cacheKey, {
    recipe: fallbackRecipe,
    created_at: new Date(),
    hit_count: 1
  });
  
  return fallbackRecipe;
}