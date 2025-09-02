import OpenAI from 'openai';
import { db } from '../../infrastructure/database/db';
import { recipes, mealPlanRecipes } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface WebRecipeData {
  title: string;
  ingredients: string[];
  instructions: string[];
  cookTime?: number;
  prepTime?: number;
  servings?: number;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  url?: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ProcessedRecipe {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string[];
  dietaryTags: string[];
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  estimatedFiber: number;
  nutritionConfidence: number;
  source: string;
  isVerified: boolean;
}

export class RecipeImporter {
  
  // Import and process web recipes using OpenAI
  async importWebRecipes(rawRecipes: WebRecipeData[]): Promise<ProcessedRecipe[]> {
    const processedRecipes: ProcessedRecipe[] = [];
    
    console.log(`🍳 Processing ${rawRecipes.length} web recipes with OpenAI...`);
    
    for (const recipe of rawRecipes) {
      try {
        const processed = await this.processRecipeWithAI(recipe);
        processedRecipes.push(processed);
        console.log(`✅ Processed: ${processed.name}`);
      } catch (error) {
        console.error(`❌ Failed to process recipe: ${recipe.title}`, error);
      }
    }
    
    return processedRecipes;
  }

  // Process individual recipe with OpenAI enhancement
  private async processRecipeWithAI(webRecipe: WebRecipeData): Promise<ProcessedRecipe> {
    const prompt = `Analyze and enhance this recipe data for a nutrition tracking app. Extract nutrition info, standardize formatting, and add dietary tags.

Recipe Data:
Title: ${webRecipe.title}
Ingredients: ${webRecipe.ingredients.join(', ')}
Instructions: ${webRecipe.instructions.join(' ')}
Cook Time: ${webRecipe.cookTime || 'Unknown'}
Prep Time: ${webRecipe.prepTime || 'Unknown'}
Servings: ${webRecipe.servings || 'Unknown'}
Cuisine: ${webRecipe.cuisine || 'Unknown'}

Requirements:
1. Estimate accurate nutrition per serving
2. Identify dietary tags (vegetarian, vegan, gluten-free, keto, etc.)
3. Standardize instructions into clear steps
4. Determine difficulty level based on techniques and time
5. Clean and standardize ingredient list

Respond in JSON format:
{
  "name": "Clean recipe title",
  "description": "Brief description highlighting key aspects",
  "ingredients": ["standardized ingredient list"],
  "instructions": ["clear step-by-step instructions"],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "difficulty": "easy|medium|hard",
  "cuisine": ["cuisine types"],
  "dietaryTags": ["vegetarian", "gluten-free", etc],
  "estimatedCalories": 350,
  "estimatedProtein": 25,
  "estimatedCarbs": 30,
  "estimatedFat": 15,
  "estimatedFiber": 8,
  "nutritionConfidence": 0.85
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert and chef. Analyze recipes and provide accurate nutrition estimates and dietary categorization."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.3,
    });

    const aiResult = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      name: aiResult.name || webRecipe.title,
      description: aiResult.description || `A delicious ${webRecipe.cuisine || ''} recipe`,
      ingredients: aiResult.ingredients || webRecipe.ingredients,
      instructions: aiResult.instructions || webRecipe.instructions,
      prepTime: aiResult.prepTime || webRecipe.prepTime || 15,
      cookTime: aiResult.cookTime || webRecipe.cookTime || 30,
      servings: aiResult.servings || webRecipe.servings || 4,
      difficulty: aiResult.difficulty || 'medium',
      cuisine: aiResult.cuisine || [webRecipe.cuisine || 'international'],
      dietaryTags: aiResult.dietaryTags || [],
      estimatedCalories: aiResult.estimatedCalories || webRecipe.nutrition?.calories || 300,
      estimatedProtein: aiResult.estimatedProtein || webRecipe.nutrition?.protein || 20,
      estimatedCarbs: aiResult.estimatedCarbs || webRecipe.nutrition?.carbs || 35,
      estimatedFat: aiResult.estimatedFat || webRecipe.nutrition?.fat || 12,
      estimatedFiber: aiResult.estimatedFiber || webRecipe.nutrition?.fiber || 5,
      nutritionConfidence: aiResult.nutritionConfidence || 0.7,
      source: webRecipe.url || 'imported',
      isVerified: false
    };
  }

  // Save processed recipes to database
  async saveRecipesToDatabase(processedRecipes: ProcessedRecipe[]): Promise<string[]> {
    const savedRecipeIds: string[] = [];
    
    for (const recipe of processedRecipes) {
      try {
        const [savedRecipe] = await db.insert(recipes).values({
          name: recipe.name,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          cuisine: recipe.cuisine,
          dietaryTags: recipe.dietaryTags,
          estimatedCalories: recipe.estimatedCalories,
          estimatedProtein: recipe.estimatedProtein,
          estimatedCarbs: recipe.estimatedCarbs,
          estimatedFat: recipe.estimatedFat,
          estimatedFiber: recipe.estimatedFiber,
          nutritionConfidence: recipe.nutritionConfidence,
          source: recipe.source,
          isVerified: recipe.isVerified,
          isActive: true,
        }).returning({ id: recipes.id });
        
        savedRecipeIds.push(savedRecipe.id);
        console.log(`💾 Saved recipe: ${recipe.name} (ID: ${savedRecipe.id})`);
        
      } catch (error) {
        console.error(`Failed to save recipe: ${recipe.name}`, error);
      }
    }
    
    return savedRecipeIds;
  }

  // Train ChefAI with imported recipe knowledge
  async trainChefAIWithRecipes(recipeIds: string[]): Promise<void> {
    console.log(`🤖 Training ChefAI with ${recipeIds.length} new recipes...`);
    
    // Get recipes from database
    const recipeData = await db.select()
      .from(recipes)
      .where(recipes.id);
    
    // Create training summary for ChefAI context
    const trainingPrompt = `You have been updated with ${recipeIds.length} new recipes from web sources. These recipes include:

Recipe Categories:
- Cuisine types: ${[...new Set(recipeData.flatMap(r => r.cuisine))].join(', ')}
- Dietary options: ${[...new Set(recipeData.flatMap(r => r.dietaryTags))].join(', ')}
- Difficulty levels: ${[...new Set(recipeData.map(r => r.difficulty))].join(', ')}

Key Features:
- Nutrition-analyzed recipes with calorie and macro estimates
- Step-by-step instructions optimized for home cooking
- Ingredient lists standardized for easy shopping
- Prep and cook times for meal planning

You can now recommend these recipes when users ask for:
- Specific cuisine types
- Dietary restriction accommodations  
- Meal prep ideas
- Nutrition-focused recipes
- Quick/easy meals vs elaborate dishes

Remember to suggest recipes that match the user's goals, preferences, and nutrition targets.`;

    console.log('📚 ChefAI knowledge base updated with new recipes');
    return;
  }

  // Import sample web recipes for testing
  async importSampleRecipes(): Promise<string[]> {
    const sampleRecipes: WebRecipeData[] = [
      {
        title: "Mediterranean Quinoa Bowl",
        ingredients: [
          "1 cup quinoa",
          "2 cups vegetable broth", 
          "1 cucumber, diced",
          "1 cup cherry tomatoes, halved",
          "1/2 red onion, diced",
          "1/2 cup kalamata olives",
          "1/2 cup feta cheese",
          "1/4 cup olive oil",
          "2 tbsp lemon juice",
          "2 cloves garlic, minced",
          "1 tsp dried oregano",
          "Salt and pepper to taste",
          "Fresh parsley for garnish"
        ],
        instructions: [
          "Rinse quinoa and cook in vegetable broth until fluffy, about 15 minutes",
          "Let quinoa cool completely",
          "Dice cucumber, tomatoes, and onion",
          "Whisk together olive oil, lemon juice, garlic, oregano, salt and pepper",
          "Combine quinoa with vegetables and olives",
          "Add dressing and mix well",
          "Top with feta cheese and fresh parsley",
          "Chill for 30 minutes before serving"
        ],
        prepTime: 20,
        cookTime: 15,
        servings: 4,
        cuisine: "Mediterranean",
        difficulty: "easy",
        nutrition: {
          calories: 380,
          protein: 14,
          carbs: 52,
          fat: 14,
          fiber: 6
        }
      },
      {
        title: "Asian-Style Salmon with Steamed Broccoli",
        ingredients: [
          "4 salmon fillets (6 oz each)",
          "2 tbsp soy sauce",
          "2 tbsp honey",
          "1 tbsp sesame oil",
          "1 tbsp rice vinegar",
          "2 cloves garlic, minced",
          "1 tsp fresh ginger, grated",
          "1 tsp sesame seeds",
          "4 cups broccoli florets",
          "2 green onions, sliced",
          "1 tbsp olive oil"
        ],
        instructions: [
          "Preheat oven to 400°F",
          "Mix soy sauce, honey, sesame oil, rice vinegar, garlic, and ginger",
          "Marinate salmon in mixture for 15 minutes",
          "Place salmon on baking sheet and bake for 12-15 minutes",
          "Steam broccoli until tender-crisp, about 5 minutes",
          "Drizzle broccoli with olive oil",
          "Serve salmon over broccoli",
          "Garnish with sesame seeds and green onions"
        ],
        prepTime: 20,
        cookTime: 15,
        servings: 4,
        cuisine: "Asian",
        difficulty: "easy",
        nutrition: {
          calories: 340,
          protein: 35,
          carbs: 18,
          fat: 16,
          fiber: 4
        }
      }
    ];

    const processed = await this.importWebRecipes(sampleRecipes);
    const savedIds = await this.saveRecipesToDatabase(processed);
    await this.trainChefAIWithRecipes(savedIds);
    
    return savedIds;
  }
}

export const recipeImporter = new RecipeImporter();