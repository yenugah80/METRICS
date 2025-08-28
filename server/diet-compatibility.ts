/**
 * Diet Compatibility and Allergen Detection System
 * Canonical ingredient taxonomy with deterministic rule-based checking
 */

export interface DietCompatibilityInput {
  ingredients: string[];
  diet_preferences: string[];
  allergen_restrictions: string[];
}

export interface DietCompatibilityResult {
  diet_match_percentage: number;
  violations: {
    diet: string;
    violating_ingredients: string[];
    severity: 'high' | 'medium' | 'low';
  }[];
  allergen_safety: 'safe' | 'unsafe';
  allergen_details: {
    detected_allergens: string[];
    violating_ingredients: string[];
  };
}

// Canonical ingredient taxonomy - extend as needed
const INGREDIENT_TAXONOMY = {
  // Animal products
  meat: [
    'beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck', 'goose', 'veal',
    'bacon', 'ham', 'sausage', 'salami', 'pepperoni', 'prosciutto',
    'ground beef', 'ground turkey', 'ground chicken', 'steak', 'chops'
  ],
  seafood: [
    'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'lobster', 'crab',
    'scallops', 'mussels', 'clams', 'oysters', 'sardines', 'mackerel',
    'anchovies', 'halibut', 'sea bass', 'trout'
  ],
  dairy: [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream', 'ice cream',
    'whey', 'casein', 'lactose', 'ghee', 'cottage cheese', 'cream cheese',
    'mozzarella', 'cheddar', 'parmesan', 'swiss cheese', 'goat cheese'
  ],
  eggs: ['egg', 'eggs', 'egg white', 'egg yolk', 'mayonnaise'],
  
  // High-carb foods (keto restrictions)
  grains: [
    'wheat', 'rice', 'oats', 'barley', 'quinoa', 'bread', 'pasta', 'flour',
    'cereal', 'crackers', 'bagel', 'muffin', 'pancake', 'waffle', 'noodles',
    'couscous', 'bulgur', 'farro', 'millet', 'buckwheat'
  ],
  starches: [
    'potato', 'sweet potato', 'corn', 'beans', 'lentils', 'chickpeas',
    'black beans', 'kidney beans', 'pinto beans', 'navy beans',
    'lima beans', 'split peas'
  ],
  high_sugar_fruits: [
    'banana', 'grapes', 'mango', 'pineapple', 'dates', 'figs',
    'raisins', 'dried fruit'
  ],
  
  // Allergens
  nuts: [
    'almonds', 'walnuts', 'pecans', 'cashews', 'pistachios', 'hazelnuts',
    'brazil nuts', 'macadamia nuts', 'pine nuts', 'peanuts', 'peanut butter',
    'almond butter', 'walnut oil', 'nut flour'
  ],
  gluten: [
    'wheat', 'barley', 'rye', 'spelt', 'kamut', 'triticale', 'malt',
    'bread', 'pasta', 'flour', 'soy sauce', 'beer', 'cereal',
    'crackers', 'bagel', 'muffin'
  ],
  shellfish: [
    'shrimp', 'lobster', 'crab', 'scallops', 'mussels', 'clams', 'oysters'
  ],
  
  // Safe foods for most diets
  vegetables: [
    'broccoli', 'spinach', 'kale', 'lettuce', 'cabbage', 'cauliflower',
    'carrots', 'bell peppers', 'onions', 'garlic', 'tomatoes', 'cucumber',
    'zucchini', 'asparagus', 'brussels sprouts', 'green beans'
  ],
  low_carb_fruits: [
    'avocado', 'berries', 'strawberries', 'blueberries', 'raspberries',
    'blackberries', 'lemon', 'lime', 'olives'
  ],
  healthy_fats: [
    'olive oil', 'coconut oil', 'avocado oil', 'flaxseed oil', 'hemp oil',
    'chia seeds', 'flax seeds', 'hemp seeds'
  ]
};

// Diet rule definitions
const DIET_RULES = {
  vegan: {
    forbidden_categories: ['meat', 'seafood', 'dairy', 'eggs'],
    weight: 1.0
  },
  vegetarian: {
    forbidden_categories: ['meat', 'seafood'],
    weight: 1.0
  },
  keto: {
    forbidden_categories: ['grains', 'starches', 'high_sugar_fruits'],
    weight: 0.8 // Slightly more flexible
  },
  'gluten-free': {
    forbidden_categories: ['gluten'],
    weight: 1.0
  },
  'dairy-free': {
    forbidden_categories: ['dairy'],
    weight: 1.0
  },
  'nut-free': {
    forbidden_categories: ['nuts'],
    weight: 1.0
  },
  paleo: {
    forbidden_categories: ['grains', 'dairy', 'starches'],
    weight: 0.9
  }
};

function normalizeIngredient(ingredient: string): string {
  return ingredient.toLowerCase().trim().replace(/[^a-z\s]/g, '');
}

function findIngredientCategory(ingredient: string): string[] {
  const normalized = normalizeIngredient(ingredient);
  const categories: string[] = [];
  
  for (const [category, items] of Object.entries(INGREDIENT_TAXONOMY)) {
    if (items.some(item => normalized.includes(item) || item.includes(normalized))) {
      categories.push(category);
    }
  }
  
  return categories;
}

export function checkDietCompatibility(input: DietCompatibilityInput): DietCompatibilityResult {
  const violations: DietCompatibilityResult['violations'] = [];
  const detected_allergens: string[] = [];
  const violating_ingredients: string[] = [];
  
  // Check each diet preference
  for (const diet of input.diet_preferences) {
    const rule = DIET_RULES[diet as keyof typeof DIET_RULES];
    if (!rule) continue;
    
    const dietViolations: string[] = [];
    
    for (const ingredient of input.ingredients) {
      const categories = findIngredientCategory(ingredient);
      const hasForbiddenCategory = categories.some(cat => 
        rule.forbidden_categories.includes(cat)
      );
      
      if (hasForbiddenCategory) {
        dietViolations.push(ingredient);
      }
    }
    
    if (dietViolations.length > 0) {
      violations.push({
        diet,
        violating_ingredients: dietViolations,
        severity: dietViolations.length > input.ingredients.length / 2 ? 'high' : 
                 dietViolations.length > 1 ? 'medium' : 'low'
      });
    }
  }
  
  // Check allergen restrictions
  for (const allergen of input.allergen_restrictions) {
    const allergenCategory = allergen.replace('-free', ''); // Convert 'nut-free' to 'nuts'
    const categoryKey = allergenCategory === 'nuts' ? 'nuts' : 
                       allergenCategory === 'dairy' ? 'dairy' :
                       allergenCategory === 'gluten' ? 'gluten' :
                       allergenCategory === 'shellfish' ? 'shellfish' : null;
    
    if (!categoryKey) continue;
    
    for (const ingredient of input.ingredients) {
      const categories = findIngredientCategory(ingredient);
      if (categories.includes(categoryKey)) {
        detected_allergens.push(allergenCategory);
        violating_ingredients.push(ingredient);
      }
    }
  }
  
  // Calculate diet match percentage
  const totalViolations = violations.reduce((sum, v) => sum + v.violating_ingredients.length, 0);
  const totalIngredients = input.ingredients.length;
  const violationPercentage = totalIngredients > 0 ? (totalViolations / totalIngredients) * 100 : 0;
  const diet_match_percentage = Math.max(0, 100 - violationPercentage);
  
  return {
    diet_match_percentage: Math.round(diet_match_percentage),
    violations,
    allergen_safety: detected_allergens.length > 0 ? 'unsafe' : 'safe',
    allergen_details: {
      detected_allergens: [...new Set(detected_allergens)],
      violating_ingredients: [...new Set(violating_ingredients)]
    }
  };
}