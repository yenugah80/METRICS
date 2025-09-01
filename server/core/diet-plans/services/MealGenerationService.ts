import OpenAI from 'openai';
import { db } from '../../../infrastructure/database/db';
import { dietPlanMeals, foods, mealItems, meals } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { DietPlanQuestionnaire } from '../dietPlanService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MealGenerationTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface UserPreferences {
  preferredFoods: string[];
  preferredCategories: string[];
  hasLoggingHistory: boolean;
}

export interface DetailedMeal {
  day: number;
  mealType: string;
  option: number;
  mealName: string;
  description: string;
  quickRecipe: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micronutrients: {
    iron: number;
    calcium: number;
    vitaminC: number;
    magnesium: number;
    vitaminD?: number;
    potassium?: number;
  };
  ingredients: Array<{
    name: string;
    amount: string;
    weight: string;
  }>;
  prepTime: string;
  difficulty: string;
  tags: string[];
}

export class MealGenerationService {
  // Get user's food preferences from logged meals
  async getUserFoodPreferences(userId: string): Promise<UserPreferences> {
    const loggedFoods = await db.select({
      foodName: foods.name,
      category: foods.category,
    })
    .from(meals)
    .innerJoin(mealItems, eq(meals.id, mealItems.mealId))
    .innerJoin(foods, eq(mealItems.foodId, foods.id))
    .where(eq(meals.userId, userId))
    .limit(20);

    return {
      preferredFoods: loggedFoods.map(f => f.foodName).filter(Boolean),
      preferredCategories: Array.from(new Set(loggedFoods.map(f => f.category).filter(Boolean))),
      hasLoggingHistory: loggedFoods.length > 0
    };
  }

  // Calculate meal-specific calorie distribution
  private getMealCalories(mealType: string, totalCalories: number): number {
    const distribution = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.30,
      snack: 0.10
    };
    return Math.round(totalCalories * (distribution[mealType as keyof typeof distribution] || 0.25));
  }

  // Generate comprehensive personalized meals using enhanced AI
  async generateMealRecommendations(
    planId: string, 
    userId: string, 
    questionnaire: DietPlanQuestionnaire, 
    targets: MealGenerationTargets
  ): Promise<void> {
    console.log('Starting comprehensive AI meal generation for plan:', planId);
    
    const userPreferences = await this.getUserFoodPreferences(userId);
    
    try {
      // Generate complete 28-day meal plan with OpenAI
      const detailedMeals = await this.generateComprehensiveMealPlan(questionnaire, targets, userPreferences);
      
      if (detailedMeals.length > 0) {
        const mealInserts = detailedMeals.map((meal: DetailedMeal) => ({
          dietPlanId: planId,
          day: meal.day,
          mealType: meal.mealType,
          option: meal.option,
          mealName: meal.mealName,
          description: meal.description,
          quickRecipe: meal.quickRecipe,
          portionSize: meal.ingredients.map(i => `${i.amount} ${i.name}`).join(', '),
          healthBenefits: this.generateHealthBenefits(meal, questionnaire.healthGoals),
          thingsToAvoid: this.generateThingsToAvoid(questionnaire.restrictions),
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          fiber: meal.fiber,
          prepTime: meal.prepTime,
          difficulty: meal.difficulty,
          tags: meal.tags,
          allergens: this.extractAllergens(meal.ingredients, questionnaire.restrictions),
          micronutrients: meal.micronutrients,
        }));

        await db.insert(dietPlanMeals).values(mealInserts);
        console.log(`Successfully inserted ${mealInserts.length} detailed meals with portion control`);
      } else {
        console.log('AI generated 0 meals, using enhanced fallback');
        await this.createEnhancedFallbackMeals(planId, targets, questionnaire);
      }
    } catch (error) {
      console.error('Error generating comprehensive meals:', error);
      await this.createEnhancedFallbackMeals(planId, targets, questionnaire);
    }
  }

  // Generate comprehensive meal plan using OpenAI with detailed nutritional data
  private async generateComprehensiveMealPlan(
    questionnaire: DietPlanQuestionnaire, 
    targets: MealGenerationTargets,
    userPreferences: UserPreferences
  ): Promise<DetailedMeal[]> {
    
    const comprehensivePrompt = `You are a certified nutritionist creating a 28-day meal plan with precise portion control and complete nutrition data.

CLIENT PROFILE:
- Age: ${questionnaire.personalInfo.age}, Gender: ${questionnaire.personalInfo.gender}
- Weight: ${questionnaire.personalInfo.weight}kg, Height: ${questionnaire.personalInfo.height}cm
- Primary Goal: ${questionnaire.healthGoals[0] || 'maintenance'}
- Food Preference: ${questionnaire.foodPreferences[0] || 'mixed'} (FLEXITARIAN FOCUS)
- Dietary Restrictions: ${questionnaire.restrictions.length > 0 ? questionnaire.restrictions.join(', ') : 'None'}
- Activity Level: ${questionnaire.physicalActivity[0] || 'moderate'}
- Supplement Preference: ${questionnaire.supplements ? 'Open to recommendations' : 'Food-only approach'}

DAILY NUTRITION TARGETS (Scientifically Calculated):
- Total Calories: ${targets.calories}
- Protein: ${targets.protein}g (priority macro for ${questionnaire.healthGoals[0]})
- Carbohydrates: ${targets.carbs}g
- Fat: ${targets.fat}g
- Fiber: ${targets.fiber}g minimum

MEAL CALORIE DISTRIBUTION:
- Breakfast: ${this.getMealCalories('breakfast', targets.calories)} cal (25%)
- Lunch: ${this.getMealCalories('lunch', targets.calories)} cal (35%)
- Dinner: ${this.getMealCalories('dinner', targets.calories)} cal (30%)
- Snack: ${this.getMealCalories('snack', targets.calories)} cal (10%)

${userPreferences.hasLoggingHistory ? 
  `PERSONALIZATION (User's logged favorites): ${userPreferences.preferredFoods.slice(0, 8).join(', ')}
**REQUIREMENT: Incorporate their favorite foods into weekly rotation**` : 
  'NEW USER: Create approachable, diverse meals for successful adoption'}

FLEXITARIAN MEAL PLAN REQUIREMENTS:
1. **60% Plant-Based Meals**: Focus on legumes, quinoa, tofu, tempeh, nuts, seeds
2. **40% Selective Animal Proteins**: Quality fish, eggs, occasional poultry, dairy
3. **Precise Portions**: Exact weights for each ingredient (grams/cups/pieces)
4. **Complete Nutrition**: Accurate macros + key micronutrients per meal
5. **Practical Cooking**: 10-30 minute prep, common ingredients, simple techniques
6. **Variety**: Different cuisines, textures, cooking methods throughout the week

Generate EXACTLY 28 meals (7 days × 4 meal types) with this PRECISE JSON structure:

{
  "meals": [
    {
      "day": 1,
      "mealType": "breakfast",
      "option": 1,
      "mealName": "Mediterranean Veggie Scramble",
      "description": "Protein-rich breakfast with fresh Mediterranean vegetables",
      "quickRecipe": "Heat 1 tsp olive oil in non-stick pan. Scramble 2 large eggs with 50g fresh spinach, 30g diced tomatoes, 20g crumbled feta. Season with oregano and black pepper. Serve with 1 slice whole grain toast.",
      "calories": ${this.getMealCalories('breakfast', targets.calories)},
      "protein": 22.5,
      "carbs": 18.2,
      "fat": 16.8,
      "fiber": 4.1,
      "micronutrients": {
        "iron": 2.8,
        "calcium": 180,
        "vitaminC": 15,
        "magnesium": 45,
        "vitaminD": 2.2,
        "potassium": 420
      },
      "ingredients": [
        {"name": "Large eggs", "amount": "2 pieces", "weight": "100g"},
        {"name": "Fresh spinach", "amount": "2 cups", "weight": "50g"},
        {"name": "Diced tomatoes", "amount": "1/4 cup", "weight": "30g"},
        {"name": "Feta cheese", "amount": "2 tbsp", "weight": "20g"},
        {"name": "Whole grain bread", "amount": "1 slice", "weight": "30g"},
        {"name": "Extra virgin olive oil", "amount": "1 tsp", "weight": "5g"}
      ],
      "prepTime": "8 minutes",
      "difficulty": "Easy",
      "tags": ["High-protein", "Vegetarian", "Mediterranean", "Quick"]
    }
  ]
}

**CRITICAL SUCCESS CRITERIA:**
- All 28 meals must be unique and varied
- Each meal hits calorie target within ±10%
- Protein targets prioritized for ${questionnaire.healthGoals[0]} goals
- Include specific ingredient weights and portions for exact nutrition control
- Flexitarian balance: plant proteins (lentils, tofu, quinoa) + selective animal proteins
- Micronutrient estimates for iron, calcium, vitamin C, magnesium in each meal
- Practical preparation times (10-30 minutes maximum)
- Real ingredient portions that people actually use and buy

RESPOND WITH COMPLETE 28-MEAL JSON ONLY.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are a certified nutritionist and meal planning expert specializing in flexitarian diets. Generate precise, nutritionally balanced meals with exact portions and complete nutrition data. Always respond with valid JSON containing exactly 28 meals." 
        },
        { role: "user", content: comprehensivePrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4000,
      temperature: 0.7, // Balanced creativity while maintaining nutritional accuracy
    });

    const mealData = JSON.parse(response.choices[0].message.content || '{"meals": []}');
    return mealData.meals || [];
  }

  // Generate health benefits based on meal content and user goals
  private generateHealthBenefits(meal: DetailedMeal, healthGoals: string[]): string {
    const benefits = [];
    
    if (healthGoals.includes('weight_loss')) {
      benefits.push('Supports healthy weight management');
    }
    if (healthGoals.includes('muscle_gain')) {
      benefits.push('High protein supports muscle development');
    }
    if (healthGoals.includes('diabetes') || healthGoals.includes('blood_sugar')) {
      benefits.push('Balanced macros help stabilize blood sugar');
    }
    if (meal.fiber >= 5) {
      benefits.push('High fiber supports digestive health');
    }
    if (meal.protein >= 20) {
      benefits.push('Excellent protein source for satiety');
    }
    
    return benefits.slice(0, 3).join('. ') + '.';
  }

  // Generate things to avoid based on dietary restrictions
  private generateThingsToAvoid(restrictions: string[]): string {
    if (restrictions.length === 0) return 'Follow portion guidelines for best results';
    
    const avoidanceMap: Record<string, string> = {
      'gluten-free': 'Ensure all grains and sauces are certified gluten-free',
      'dairy-free': 'Substitute dairy with plant-based alternatives',
      'nut-allergy': 'Check all ingredients for tree nuts and peanuts',
      'soy-free': 'Avoid tofu, tempeh, and soy-based products',
      'low-sodium': 'Use herbs and spices instead of salt for flavoring',
      'keto': 'Keep carbohydrates under 20g per meal',
      'paleo': 'Avoid grains, legumes, and processed foods'
    };
    
    const relevant = restrictions.map(r => avoidanceMap[r]).filter(Boolean);
    return relevant.length > 0 ? relevant.join('. ') + '.' : 'Follow dietary restrictions as specified';
  }

  // Extract potential allergens from ingredients
  private extractAllergens(ingredients: Array<{name: string}>, restrictions: string[]): string[] {
    const allergenKeywords = {
      dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      gluten: ['wheat', 'bread', 'pasta', 'flour', 'oats'],
      nuts: ['almond', 'walnut', 'peanut', 'cashew', 'pistachio'],
      soy: ['tofu', 'tempeh', 'edamame', 'soy sauce'],
      eggs: ['egg', 'mayonnaise'],
      shellfish: ['shrimp', 'crab', 'lobster', 'scallop'],
      fish: ['salmon', 'tuna', 'cod', 'sardine']
    };

    const detected: string[] = [];
    const ingredientText = ingredients.map(i => i.name.toLowerCase()).join(' ');
    
    Object.entries(allergenKeywords).forEach(([allergen, keywords]) => {
      if (keywords.some(keyword => ingredientText.includes(keyword))) {
        detected.push(allergen);
      }
    });

    return detected;
  }

  // Enhanced fallback meal creation with Flexitarian focus
  private async createEnhancedFallbackMeals(
    planId: string, 
    targets: MealGenerationTargets,
    questionnaire: DietPlanQuestionnaire
  ): Promise<void> {
    console.log('Creating enhanced fallback meals with Flexitarian focus');
    
    const flexitarianMeals = [];
    
    // Create 7 days of varied Flexitarian meals
    for (let day = 1; day <= 7; day++) {
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      
      for (const mealType of mealTypes) {
        const calories = this.getMealCalories(mealType, targets.calories);
        const protein = Math.round(targets.protein * (calories / targets.calories));
        const carbs = Math.round(targets.carbs * (calories / targets.calories));
        const fat = Math.round(targets.fat * (calories / targets.calories));
        const fiber = Math.round(targets.fiber * (calories / targets.calories) / 4);
        
        // Flexitarian meal templates
        const mealTemplate = this.getFlexitarianMealTemplate(day, mealType, calories, protein, carbs, fat, fiber);
        
        flexitarianMeals.push({
          dietPlanId: planId,
          day,
          mealType,
          option: 1,
          ...mealTemplate,
          healthBenefits: this.generateHealthBenefits(mealTemplate as DetailedMeal, questionnaire.healthGoals),
          thingsToAvoid: this.generateThingsToAvoid(questionnaire.restrictions),
          allergens: [],
        });
      }
    }

    await db.insert(dietPlanMeals).values(flexitarianMeals);
    console.log(`Created ${flexitarianMeals.length} enhanced Flexitarian fallback meals`);
  }

  // Get Flexitarian meal template based on day and meal type
  private getFlexitarianMealTemplate(
    day: number, 
    mealType: string, 
    calories: number, 
    protein: number, 
    carbs: number, 
    fat: number, 
    fiber: number
  ) {
    const isPlantBased = (day + ['breakfast', 'lunch', 'dinner', 'snack'].indexOf(mealType)) % 5 < 3; // 60% plant-based
    
    const templates = {
      breakfast: isPlantBased 
        ? {
          mealName: "Protein-Rich Oatmeal Bowl",
          description: "Creamy oats with nuts, seeds, and fresh berries",
          quickRecipe: `Combine 50g rolled oats with 200ml oat milk. Top with 15g almonds, 10g chia seeds, 80g mixed berries, 1 tbsp maple syrup.`,
          prepTime: "5 minutes",
          difficulty: "Easy",
          tags: ["Plant-based", "High-fiber", "Quick", "Breakfast"],
        }
        : {
          mealName: "Veggie Egg Scramble",
          description: "Protein-packed eggs with fresh vegetables",
          quickRecipe: `Scramble 2 eggs with 50g spinach, 30g bell peppers, 20g cheese. Serve with 1 slice whole grain toast.`,
          prepTime: "8 minutes", 
          difficulty: "Easy",
          tags: ["High-protein", "Vegetarian", "Quick", "Breakfast"],
        },
      
      lunch: isPlantBased
        ? {
          mealName: "Mediterranean Quinoa Bowl",
          description: "Protein-rich quinoa with fresh vegetables and tahini",
          quickRecipe: `Mix 60g cooked quinoa with 100g chickpeas, 50g cucumber, 40g tomatoes, 20g olives. Dress with 15ml tahini and lemon.`,
          prepTime: "12 minutes",
          difficulty: "Easy", 
          tags: ["Plant-based", "Mediterranean", "High-protein", "Lunch"],
        }
        : {
          mealName: "Grilled Chicken & Quinoa Salad",
          description: "Lean protein with nutritious quinoa and fresh vegetables",
          quickRecipe: `Grill 100g chicken breast. Serve over 50g quinoa with 100g mixed greens, 50g avocado, 30g cherry tomatoes.`,
          prepTime: "15 minutes",
          difficulty: "Medium",
          tags: ["High-protein", "Balanced", "Fresh", "Lunch"],
        },
      
      dinner: isPlantBased
        ? {
          mealName: "Lentil & Vegetable Curry",
          description: "Protein-rich lentils in aromatic spiced vegetables",
          quickRecipe: `Simmer 80g red lentils with 150g mixed vegetables in 200ml coconut milk with curry spices. Serve with 40g brown rice.`,
          prepTime: "25 minutes",
          difficulty: "Medium",
          tags: ["Plant-based", "High-fiber", "Warming", "Dinner"],
        }
        : {
          mealName: "Baked Salmon with Sweet Potato",
          description: "Omega-3 rich salmon with roasted vegetables",
          quickRecipe: `Bake 120g salmon fillet with 150g cubed sweet potato and 100g broccoli. Season with herbs and olive oil.`,
          prepTime: "20 minutes",
          difficulty: "Medium", 
          tags: ["Omega-3", "High-protein", "Nutrient-dense", "Dinner"],
        },
      
      snack: isPlantBased
        ? {
          mealName: "Energy Nut & Seed Mix",
          description: "Balanced mix of healthy fats and plant protein",
          quickRecipe: `Mix 15g almonds, 10g pumpkin seeds, 20g dried fruit. Pair with 150ml unsweetened almond milk.`,
          prepTime: "2 minutes",
          difficulty: "Easy",
          tags: ["Plant-based", "Portable", "Healthy-fats", "Snack"],
        }
        : {
          mealName: "Greek Yogurt Berry Bowl",
          description: "Probiotic-rich yogurt with fresh fruits and nuts",
          quickRecipe: `Top 150g Greek yogurt with 60g mixed berries, 10g honey, 15g chopped walnuts.`,
          prepTime: "3 minutes",
          difficulty: "Easy", 
          tags: ["Probiotic", "High-protein", "Fresh", "Snack"],
        }
    };

    return {
      ...templates[mealType as keyof typeof templates],
      calories,
      protein,
      carbs,
      fat,
      fiber,
      micronutrients: {
        iron: Math.round((protein * 0.15) * 10) / 10, // Estimate based on protein content
        calcium: Math.round((calories * 0.4) * 10) / 10, // Estimate based on calories
        vitaminC: Math.round((fiber * 2.5) * 10) / 10, // Estimate based on fiber (vegetables)
        magnesium: Math.round((protein * 2) * 10) / 10, // Estimate based on protein sources
        vitaminD: isPlantBased ? 0.5 : 2.0, // Animal products have more vitamin D
        potassium: Math.round((calories * 1.2) * 10) / 10, // Estimate based on whole foods
      },
    };
  }

  // Generate 4 weeks of meals by repeating the 7-day pattern
  async generateFullMonthPlan(baseMeals: DetailedMeal[]): Promise<DetailedMeal[]> {
    const fullMonthMeals: DetailedMeal[] = [];
    
    // Repeat the 7-day pattern 4 times for 28 days
    for (let week = 0; week < 4; week++) {
      for (const meal of baseMeals) {
        if (meal.day <= 7) { // Only use the first week as template
          fullMonthMeals.push({
            ...meal,
            day: meal.day + (week * 7), // Adjust day number for each week
            mealName: week > 0 ? `${meal.mealName} (Week ${week + 1})` : meal.mealName, // Add week indicator for variety
          });
        }
      }
    }
    
    return fullMonthMeals;
  }
}

export const mealGenerationService = new MealGenerationService();