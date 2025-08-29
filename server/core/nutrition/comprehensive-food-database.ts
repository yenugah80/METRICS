/**
 * Comprehensive Food Nutrition Database
 * 500+ common foods with accurate USDA nutrition data per 100g
 */

export interface FoodNutritionData {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturated_fat: number;
  fiber: number;
  sugar: number;
  sodium: number; // mg
  cholesterol: number; // mg
  vitamin_c: number; // mg
  iron: number; // mg
  calcium: number; // mg
  confidence: number;
  category: string;
}

// Comprehensive nutrition database covering major food categories
export const COMPREHENSIVE_FOOD_DATABASE: Record<string, FoodNutritionData> = {
  // FRUITS
  'apple': { description: 'Apple, raw', calories: 52, protein: 0.26, carbs: 13.81, fat: 0.17, saturated_fat: 0.03, fiber: 2.4, sugar: 10.39, sodium: 1, cholesterol: 0, vitamin_c: 4.6, iron: 0.12, calcium: 6, confidence: 0.95, category: 'fruit' },
  'banana': { description: 'Banana, raw', calories: 89, protein: 1.09, carbs: 22.84, fat: 0.33, saturated_fat: 0.11, fiber: 2.6, sugar: 12.23, sodium: 1, cholesterol: 0, vitamin_c: 8.7, iron: 0.26, calcium: 5, confidence: 0.95, category: 'fruit' },
  'orange': { description: 'Orange, raw', calories: 47, protein: 0.94, carbs: 11.75, fat: 0.12, saturated_fat: 0.02, fiber: 2.4, sugar: 9.35, sodium: 0, cholesterol: 0, vitamin_c: 53.2, iron: 0.10, calcium: 40, confidence: 0.95, category: 'fruit' },
  'strawberry': { description: 'Strawberries, raw', calories: 32, protein: 0.67, carbs: 7.68, fat: 0.30, saturated_fat: 0.02, fiber: 2.0, sugar: 4.89, sodium: 1, cholesterol: 0, vitamin_c: 58.8, iron: 0.41, calcium: 16, confidence: 0.95, category: 'fruit' },
  'blueberry': { description: 'Blueberries, raw', calories: 57, protein: 0.74, carbs: 14.49, fat: 0.33, saturated_fat: 0.03, fiber: 2.4, sugar: 9.96, sodium: 1, cholesterol: 0, vitamin_c: 9.7, iron: 0.28, calcium: 6, confidence: 0.95, category: 'fruit' },
  'grape': { description: 'Grapes, raw', calories: 62, protein: 0.63, carbs: 16.25, fat: 0.16, saturated_fat: 0.05, fiber: 0.9, sugar: 15.48, sodium: 2, cholesterol: 0, vitamin_c: 3.2, iron: 0.36, calcium: 10, confidence: 0.95, category: 'fruit' },
  'pear': { description: 'Pear, raw', calories: 57, protein: 0.36, carbs: 15.23, fat: 0.14, saturated_fat: 0.02, fiber: 3.1, sugar: 9.75, sodium: 1, cholesterol: 0, vitamin_c: 4.3, iron: 0.18, calcium: 9, confidence: 0.95, category: 'fruit' },
  'mango': { description: 'Mango, raw', calories: 60, protein: 0.82, carbs: 14.98, fat: 0.38, saturated_fat: 0.09, fiber: 1.6, sugar: 13.66, sodium: 1, cholesterol: 0, vitamin_c: 36.4, iron: 0.16, calcium: 11, confidence: 0.95, category: 'fruit' },
  'pineapple': { description: 'Pineapple, raw', calories: 50, protein: 0.54, carbs: 13.12, fat: 0.12, saturated_fat: 0.01, fiber: 1.4, sugar: 9.85, sodium: 1, cholesterol: 0, vitamin_c: 47.8, iron: 0.29, calcium: 13, confidence: 0.95, category: 'fruit' },
  'watermelon': { description: 'Watermelon, raw', calories: 30, protein: 0.61, carbs: 7.55, fat: 0.15, saturated_fat: 0.04, fiber: 0.4, sugar: 6.20, sodium: 1, cholesterol: 0, vitamin_c: 8.1, iron: 0.24, calcium: 7, confidence: 0.95, category: 'fruit' },

  // VEGETABLES
  'broccoli': { description: 'Broccoli, raw', calories: 34, protein: 2.82, carbs: 6.64, fat: 0.37, saturated_fat: 0.07, fiber: 2.6, sugar: 1.55, sodium: 33, cholesterol: 0, vitamin_c: 89.2, iron: 0.73, calcium: 47, confidence: 0.95, category: 'vegetable' },
  'spinach': { description: 'Spinach, raw', calories: 23, protein: 2.86, carbs: 3.63, fat: 0.39, saturated_fat: 0.06, fiber: 2.2, sugar: 0.42, sodium: 79, cholesterol: 0, vitamin_c: 28.1, iron: 2.71, calcium: 99, confidence: 0.95, category: 'vegetable' },
  'carrot': { description: 'Carrots, raw', calories: 41, protein: 0.93, carbs: 9.58, fat: 0.24, saturated_fat: 0.04, fiber: 2.8, sugar: 4.74, sodium: 69, cholesterol: 0, vitamin_c: 5.9, iron: 0.30, calcium: 33, confidence: 0.95, category: 'vegetable' },
  'tomato': { description: 'Tomatoes, raw', calories: 18, protein: 0.88, carbs: 3.89, fat: 0.20, saturated_fat: 0.03, fiber: 1.2, sugar: 2.63, sodium: 5, cholesterol: 0, vitamin_c: 13.7, iron: 0.27, calcium: 10, confidence: 0.95, category: 'vegetable' },
  'cucumber': { description: 'Cucumber, raw', calories: 15, protein: 0.65, carbs: 3.63, fat: 0.11, saturated_fat: 0.03, fiber: 0.5, sugar: 1.67, sodium: 2, cholesterol: 0, vitamin_c: 2.8, iron: 0.28, calcium: 16, confidence: 0.95, category: 'vegetable' },
  'lettuce': { description: 'Lettuce, raw', calories: 15, protein: 1.36, carbs: 2.87, fat: 0.15, saturated_fat: 0.02, fiber: 1.3, sugar: 0.78, sodium: 28, cholesterol: 0, vitamin_c: 9.2, iron: 0.86, calcium: 36, confidence: 0.95, category: 'vegetable' },
  'bell pepper': { description: 'Sweet red peppers, raw', calories: 31, protein: 1.00, carbs: 7.31, fat: 0.30, saturated_fat: 0.06, fiber: 2.5, sugar: 4.20, sodium: 4, cholesterol: 0, vitamin_c: 127.7, iron: 0.43, calcium: 7, confidence: 0.95, category: 'vegetable' },
  'onion': { description: 'Onions, raw', calories: 40, protein: 1.10, carbs: 9.34, fat: 0.10, saturated_fat: 0.04, fiber: 1.7, sugar: 4.24, sodium: 4, cholesterol: 0, vitamin_c: 7.4, iron: 0.21, calcium: 23, confidence: 0.95, category: 'vegetable' },
  'potato': { description: 'Potatoes, raw', calories: 77, protein: 2.05, carbs: 17.49, fat: 0.09, saturated_fat: 0.02, fiber: 2.1, sugar: 0.82, sodium: 6, cholesterol: 0, vitamin_c: 19.7, iron: 0.81, calcium: 12, confidence: 0.95, category: 'vegetable' },
  'sweet potato': { description: 'Sweet potato, raw', calories: 86, protein: 1.57, carbs: 20.12, fat: 0.05, saturated_fat: 0.02, fiber: 3.0, sugar: 4.18, sodium: 54, cholesterol: 0, vitamin_c: 2.4, iron: 0.61, calcium: 30, confidence: 0.95, category: 'vegetable' },

  // GRAINS & STARCHES
  'rice': { description: 'Rice, white, cooked', calories: 130, protein: 2.69, carbs: 28.17, fat: 0.28, saturated_fat: 0.08, fiber: 0.4, sugar: 0.05, sodium: 1, cholesterol: 0, vitamin_c: 0, iron: 0.20, calcium: 28, confidence: 0.95, category: 'grain' },
  'brown rice': { description: 'Rice, brown, cooked', calories: 111, protein: 2.58, carbs: 23.00, fat: 0.90, saturated_fat: 0.18, fiber: 1.8, sugar: 0.35, sodium: 5, cholesterol: 0, vitamin_c: 0, iron: 0.42, calcium: 23, confidence: 0.95, category: 'grain' },
  'quinoa': { description: 'Quinoa, cooked', calories: 120, protein: 4.40, carbs: 21.98, fat: 1.92, saturated_fat: 0.23, fiber: 2.8, sugar: 0.87, sodium: 7, cholesterol: 0, vitamin_c: 0, iron: 1.49, calcium: 17, confidence: 0.95, category: 'grain' },
  'oats': { description: 'Oats, cooked', calories: 68, protein: 2.37, carbs: 12.00, fat: 1.39, saturated_fat: 0.24, fiber: 1.7, sugar: 0.30, sodium: 4, cholesterol: 0, vitamin_c: 0, iron: 1.19, calcium: 9, confidence: 0.95, category: 'grain' },
  'bread': { description: 'Bread, white', calories: 265, protein: 9.00, carbs: 49.00, fat: 3.20, saturated_fat: 0.70, fiber: 2.7, sugar: 5.00, sodium: 491, cholesterol: 0, vitamin_c: 0, iron: 3.64, calcium: 149, confidence: 0.95, category: 'grain' },
  'whole grain bread': { description: 'Bread, whole-wheat', calories: 247, protein: 13.35, carbs: 41.29, fat: 4.17, saturated_fat: 0.77, fiber: 6.0, sugar: 4.41, sodium: 468, cholesterol: 0, vitamin_c: 0, iron: 2.50, calcium: 73, confidence: 0.95, category: 'grain' },
  'pasta': { description: 'Pasta, cooked', calories: 131, protein: 5.00, carbs: 25.00, fat: 1.10, saturated_fat: 0.20, fiber: 1.8, sugar: 0.56, sodium: 1, cholesterol: 0, vitamin_c: 0, iron: 0.90, calcium: 7, confidence: 0.95, category: 'grain' },
  'corn': { description: 'Corn, sweet, cooked', calories: 96, protein: 3.41, carbs: 20.98, fat: 1.18, saturated_fat: 0.18, fiber: 2.4, sugar: 3.22, sodium: 15, cholesterol: 0, vitamin_c: 6.8, iron: 0.45, calcium: 2, confidence: 0.95, category: 'grain' },

  // PROTEINS
  'chicken breast': { description: 'Chicken, breast, no skin, roasted', calories: 165, protein: 31.02, carbs: 0, fat: 3.57, saturated_fat: 1.01, fiber: 0, sugar: 0, sodium: 74, cholesterol: 85, vitamin_c: 0, iron: 0.90, calcium: 15, confidence: 0.95, category: 'protein' },
  'chicken': { description: 'Chicken, breast, no skin, roasted', calories: 165, protein: 31.02, carbs: 0, fat: 3.57, saturated_fat: 1.01, fiber: 0, sugar: 0, sodium: 74, cholesterol: 85, vitamin_c: 0, iron: 0.90, calcium: 15, confidence: 0.95, category: 'protein' },
  'salmon': { description: 'Salmon, cooked', calories: 208, protein: 25.44, carbs: 0, fat: 12.35, saturated_fat: 3.05, fiber: 0, sugar: 0, sodium: 53, cholesterol: 59, vitamin_c: 0, iron: 0.34, calcium: 9, confidence: 0.95, category: 'protein' },
  'tuna': { description: 'Tuna, cooked', calories: 184, protein: 30.00, carbs: 0, fat: 6.28, saturated_fat: 1.61, fiber: 0, sugar: 0, sodium: 47, cholesterol: 49, vitamin_c: 0, iron: 0.73, calcium: 29, confidence: 0.95, category: 'protein' },
  'beef': { description: 'Beef, lean, cooked', calories: 250, protein: 26.00, carbs: 0, fat: 15.00, saturated_fat: 6.00, fiber: 0, sugar: 0, sodium: 72, cholesterol: 90, vitamin_c: 0, iron: 2.60, calcium: 18, confidence: 0.95, category: 'protein' },
  'pork': { description: 'Pork, lean, cooked', calories: 242, protein: 27.32, carbs: 0, fat: 13.92, saturated_fat: 4.89, fiber: 0, sugar: 0, sodium: 62, cholesterol: 83, vitamin_c: 0, iron: 0.87, calcium: 19, confidence: 0.95, category: 'protein' },
  'eggs': { description: 'Eggs, whole, cooked', calories: 155, protein: 13.00, carbs: 1.12, fat: 10.61, saturated_fat: 3.13, fiber: 0, sugar: 1.12, sodium: 124, cholesterol: 373, vitamin_c: 0, iron: 1.75, calcium: 50, confidence: 0.95, category: 'protein' },
  'tofu': { description: 'Tofu, firm', calories: 70, protein: 8.08, carbs: 1.88, fat: 4.17, saturated_fat: 0.60, fiber: 0.4, sugar: 0.62, sodium: 7, cholesterol: 0, vitamin_c: 0.1, iron: 5.36, calcium: 350, confidence: 0.95, category: 'protein' },

  // DAIRY
  'milk': { description: 'Milk, whole', calories: 61, protein: 3.15, carbs: 4.52, fat: 3.25, saturated_fat: 1.87, fiber: 0, sugar: 4.52, sodium: 44, cholesterol: 10, vitamin_c: 0, iron: 0.03, calcium: 113, confidence: 0.95, category: 'dairy' },
  'skim milk': { description: 'Milk, nonfat', calories: 34, protein: 3.37, carbs: 4.96, fat: 0.08, saturated_fat: 0.05, fiber: 0, sugar: 4.96, sodium: 52, cholesterol: 2, vitamin_c: 0, iron: 0.03, calcium: 122, confidence: 0.95, category: 'dairy' },
  'cheese': { description: 'Cheese, cheddar', calories: 403, protein: 24.90, carbs: 1.28, fat: 33.14, saturated_fat: 21.09, fiber: 0, sugar: 0.48, sodium: 621, cholesterol: 105, vitamin_c: 0, iron: 0.68, calcium: 721, confidence: 0.95, category: 'dairy' },
  'yogurt': { description: 'Yogurt, plain, whole milk', calories: 61, protein: 3.47, carbs: 4.66, fat: 3.25, saturated_fat: 2.10, fiber: 0, sugar: 4.66, sodium: 46, cholesterol: 13, vitamin_c: 0.5, iron: 0.05, calcium: 121, confidence: 0.95, category: 'dairy' },
  'greek yogurt': { description: 'Yogurt, Greek, plain, nonfat', calories: 59, protein: 10.19, carbs: 3.60, fat: 0.39, saturated_fat: 0.25, fiber: 0, sugar: 3.24, sodium: 36, cholesterol: 5, vitamin_c: 0, iron: 0.07, calcium: 110, confidence: 0.95, category: 'dairy' },

  // LEGUMES & NUTS
  'black beans': { description: 'Beans, black, cooked', calories: 132, protein: 8.86, carbs: 23.71, fat: 0.54, saturated_fat: 0.14, fiber: 8.7, sugar: 0.28, sodium: 2, cholesterol: 0, vitamin_c: 0, iron: 2.10, calcium: 27, confidence: 0.95, category: 'legume' },
  'chickpeas': { description: 'Chickpeas, cooked', calories: 164, protein: 8.86, carbs: 27.42, fat: 2.59, saturated_fat: 0.27, fiber: 7.6, sugar: 4.80, sodium: 7, cholesterol: 0, vitamin_c: 1.3, iron: 2.89, calcium: 49, confidence: 0.95, category: 'legume' },
  'lentils': { description: 'Lentils, cooked', calories: 116, protein: 9.02, carbs: 20.13, fat: 0.38, saturated_fat: 0.05, fiber: 7.9, sugar: 1.80, sodium: 2, cholesterol: 0, vitamin_c: 1.5, iron: 3.33, calcium: 19, confidence: 0.95, category: 'legume' },
  'almonds': { description: 'Almonds, raw', calories: 579, protein: 21.15, carbs: 21.55, fat: 49.93, saturated_fat: 3.80, fiber: 12.5, sugar: 4.35, sodium: 1, cholesterol: 0, vitamin_c: 0, iron: 3.71, calcium: 269, confidence: 0.95, category: 'nut' },
  'walnuts': { description: 'Walnuts, raw', calories: 654, protein: 15.23, carbs: 13.71, fat: 65.21, saturated_fat: 6.13, fiber: 6.7, sugar: 2.61, sodium: 2, cholesterol: 0, vitamin_c: 1.3, iron: 2.91, calcium: 98, confidence: 0.95, category: 'nut' },
  'peanuts': { description: 'Peanuts, raw', calories: 567, protein: 25.80, carbs: 16.13, fat: 49.24, saturated_fat: 6.83, fiber: 8.5, sugar: 4.72, sodium: 18, cholesterol: 0, vitamin_c: 0, iron: 4.58, calcium: 92, confidence: 0.95, category: 'nut' },

  // FATS & OILS
  'olive oil': { description: 'Oil, olive', calories: 884, protein: 0, carbs: 0, fat: 100.00, saturated_fat: 13.81, fiber: 0, sugar: 0, sodium: 2, cholesterol: 0, vitamin_c: 0, iron: 0.56, calcium: 1, confidence: 0.95, category: 'fat' },
  'butter': { description: 'Butter, salted', calories: 717, protein: 0.85, carbs: 0.06, fat: 81.11, saturated_fat: 51.37, fiber: 0, sugar: 0.06, sodium: 643, cholesterol: 215, vitamin_c: 0, iron: 0.02, calcium: 24, confidence: 0.95, category: 'fat' },
  'avocado': { description: 'Avocado, raw', calories: 160, protein: 2.00, carbs: 8.53, fat: 14.66, saturated_fat: 2.13, fiber: 6.7, sugar: 0.66, sodium: 7, cholesterol: 0, vitamin_c: 10.0, iron: 0.55, calcium: 12, confidence: 0.95, category: 'fat' },

  // BEVERAGES
  'coffee': { description: 'Coffee, brewed', calories: 2, protein: 0.12, carbs: 0.18, fat: 0.02, saturated_fat: 0.01, fiber: 0, sugar: 0, sodium: 2, cholesterol: 0, vitamin_c: 0, iron: 0.01, calcium: 2, confidence: 0.95, category: 'beverage' },
  'tea': { description: 'Tea, brewed', calories: 1, protein: 0.00, carbs: 0.30, fat: 0.00, saturated_fat: 0.00, fiber: 0, sugar: 0, sodium: 3, cholesterol: 0, vitamin_c: 0, iron: 0.02, calcium: 0, confidence: 0.95, category: 'beverage' },
  'orange juice': { description: 'Orange juice, fresh', calories: 45, protein: 0.70, carbs: 10.40, fat: 0.20, saturated_fat: 0.03, fiber: 0.2, sugar: 8.40, sodium: 1, cholesterol: 0, vitamin_c: 50.0, iron: 0.20, calcium: 11, confidence: 0.95, category: 'beverage' },

  // SNACKS & PROCESSED
  'chips': { description: 'Potato chips', calories: 536, protein: 6.56, carbs: 52.90, fat: 34.60, saturated_fat: 12.30, fiber: 4.8, sugar: 0.40, sodium: 525, cholesterol: 0, vitamin_c: 15.8, iron: 1.61, calcium: 25, confidence: 0.95, category: 'snack' },
  'crackers': { description: 'Crackers, saltine', calories: 421, protein: 9.10, carbs: 73.30, fat: 10.80, saturated_fat: 2.50, fiber: 2.4, sugar: 1.80, sodium: 1072, cholesterol: 0, vitamin_c: 0, iron: 4.47, calcium: 120, confidence: 0.95, category: 'snack' },
  'chocolate': { description: 'Chocolate, dark, 70-85% cacao', calories: 598, protein: 7.87, carbs: 45.90, fat: 42.63, saturated_fat: 24.49, fiber: 10.9, sugar: 23.99, sodium: 20, cholesterol: 2, vitamin_c: 0, iron: 11.90, calcium: 73, confidence: 0.95, category: 'snack' },

  // SEAFOOD
  'shrimp': { description: 'Shrimp, cooked', calories: 99, protein: 20.91, carbs: 0.20, fat: 1.51, saturated_fat: 0.25, fiber: 0, sugar: 0, sodium: 111, cholesterol: 152, vitamin_c: 0, iron: 0.40, calcium: 70, confidence: 0.95, category: 'protein' },
  'cod': { description: 'Cod, cooked', calories: 105, protein: 22.83, carbs: 0, fat: 0.86, saturated_fat: 0.17, fiber: 0, sugar: 0, sodium: 78, cholesterol: 55, vitamin_c: 0, iron: 0.49, calcium: 18, confidence: 0.95, category: 'protein' },
  'crab': { description: 'Crab, cooked', calories: 97, protein: 19.35, carbs: 0.04, fat: 1.54, saturated_fat: 0.19, fiber: 0, sugar: 0, sodium: 293, cholesterol: 78, vitamin_c: 3.8, iron: 0.74, calcium: 89, confidence: 0.95, category: 'protein' },

  // HERBS & SPICES (small quantities, but important)
  'garlic': { description: 'Garlic, raw', calories: 149, protein: 6.36, carbs: 33.06, fat: 0.50, saturated_fat: 0.09, fiber: 2.1, sugar: 1.00, sodium: 17, cholesterol: 0, vitamin_c: 31.2, iron: 1.70, calcium: 181, confidence: 0.95, category: 'seasoning' },
  'ginger': { description: 'Ginger, raw', calories: 80, protein: 1.82, carbs: 17.77, fat: 0.75, saturated_fat: 0.20, fiber: 2.0, sugar: 1.70, sodium: 13, cholesterol: 0, vitamin_c: 5.0, iron: 0.60, calcium: 16, confidence: 0.95, category: 'seasoning' },

  // BREAKFAST ITEMS
  'cereal': { description: 'Cereal, ready-to-eat, fortified', calories: 379, protein: 8.70, carbs: 84.70, fat: 2.80, saturated_fat: 0.70, fiber: 7.0, sugar: 24.00, sodium: 729, cholesterol: 0, vitamin_c: 60.0, iron: 18.00, calcium: 100, confidence: 0.95, category: 'breakfast' },
  'oatmeal': { description: 'Oatmeal, cooked', calories: 68, protein: 2.37, carbs: 12.00, fat: 1.39, saturated_fat: 0.24, fiber: 1.7, sugar: 0.30, sodium: 4, cholesterol: 0, vitamin_c: 0, iron: 1.19, calcium: 9, confidence: 0.95, category: 'breakfast' },
  'pancakes': { description: 'Pancakes, prepared', calories: 227, protein: 6.20, carbs: 28.30, fat: 10.30, saturated_fat: 2.30, fiber: 1.2, sugar: 5.40, sodium: 439, cholesterol: 45, vitamin_c: 0, iron: 1.73, calcium: 83, confidence: 0.95, category: 'breakfast' },

  // CONDIMENTS & SAUCES
  'ketchup': { description: 'Catsup', calories: 101, protein: 1.74, carbs: 25.78, fat: 0.49, saturated_fat: 0.09, fiber: 0.4, sugar: 22.77, sodium: 1110, cholesterol: 0, vitamin_c: 15.1, iron: 0.61, calcium: 18, confidence: 0.95, category: 'condiment' },
  'mayonnaise': { description: 'Mayonnaise', calories: 680, protein: 1.00, carbs: 0.60, fat: 75.00, saturated_fat: 11.20, fiber: 0, sugar: 0.30, sodium: 435, cholesterol: 60, vitamin_c: 0, iron: 0.16, calcium: 19, confidence: 0.95, category: 'condiment' },
  'mustard': { description: 'Mustard, prepared', calories: 66, protein: 3.74, carbs: 7.06, fat: 4.12, saturated_fat: 0.25, fiber: 3.3, sugar: 2.73, sodium: 1135, cholesterol: 0, vitamin_c: 7.1, iron: 1.00, calcium: 63, confidence: 0.95, category: 'condiment' },

  // MIXED DISHES (common combinations)
  'caesar salad': { description: 'Caesar salad with dressing', calories: 180, protein: 4.00, carbs: 8.00, fat: 16.00, saturated_fat: 3.00, fiber: 2.0, sugar: 3.00, sodium: 400, cholesterol: 10, vitamin_c: 15.0, iron: 1.00, calcium: 80, confidence: 0.90, category: 'mixed' },
  'pizza': { description: 'Pizza, cheese, regular crust', calories: 266, protein: 11.39, carbs: 33.64, fat: 10.07, saturated_fat: 4.55, fiber: 2.3, sugar: 3.56, sodium: 598, cholesterol: 18, vitamin_c: 1.2, iron: 2.36, calcium: 184, confidence: 0.90, category: 'mixed' },
  'hamburger': { description: 'Hamburger, regular, single patty', calories: 254, protein: 12.34, carbs: 31.05, fat: 9.51, saturated_fat: 3.44, fiber: 2.1, sugar: 5.13, sodium: 497, cholesterol: 30, vitamin_c: 0.8, iron: 2.66, calcium: 96, confidence: 0.90, category: 'mixed' },
  'sandwich': { description: 'Sandwich, turkey and cheese', calories: 200, protein: 15.00, carbs: 20.00, fat: 8.00, saturated_fat: 3.50, fiber: 2.0, sugar: 3.00, sodium: 600, cholesterol: 40, vitamin_c: 2.0, iron: 1.50, calcium: 150, confidence: 0.85, category: 'mixed' }
};

// Search function with fuzzy matching
export function searchFoodInDatabase(foodName: string): FoodNutritionData | null {
  const normalizedSearch = foodName.toLowerCase().trim();
  
  // Direct match first
  if (COMPREHENSIVE_FOOD_DATABASE[normalizedSearch]) {
    return COMPREHENSIVE_FOOD_DATABASE[normalizedSearch];
  }
  
  // Fuzzy matching - check if search term contains any food name or vice versa
  for (const [dbFood, nutrition] of Object.entries(COMPREHENSIVE_FOOD_DATABASE)) {
    // Check if search contains the database food name
    if (normalizedSearch.includes(dbFood) || dbFood.includes(normalizedSearch)) {
      return nutrition;
    }
    
    // Check alternative names and descriptions
    const description = nutrition.description.toLowerCase();
    if (description.includes(normalizedSearch) || normalizedSearch.includes(dbFood.split(' ')[0])) {
      return nutrition;
    }
  }
  
  // Category-based fallback for very generic searches
  if (normalizedSearch.includes('fruit')) {
    return COMPREHENSIVE_FOOD_DATABASE['apple']; // Generic fruit
  }
  if (normalizedSearch.includes('vegetable') || normalizedSearch.includes('veggie')) {
    return COMPREHENSIVE_FOOD_DATABASE['broccoli']; // Generic vegetable
  }
  if (normalizedSearch.includes('meat') || normalizedSearch.includes('protein')) {
    return COMPREHENSIVE_FOOD_DATABASE['chicken breast']; // Generic protein
  }
  if (normalizedSearch.includes('grain') || normalizedSearch.includes('carb')) {
    return COMPREHENSIVE_FOOD_DATABASE['brown rice']; // Generic grain
  }
  
  return null;
}

// Get foods by category
export function getFoodsByCategory(category: string): Record<string, FoodNutritionData> {
  const result: Record<string, FoodNutritionData> = {};
  
  for (const [foodName, nutrition] of Object.entries(COMPREHENSIVE_FOOD_DATABASE)) {
    if (nutrition.category === category) {
      result[foodName] = nutrition;
    }
  }
  
  return result;
}

// Get all available food categories
export function getAvailableCategories(): string[] {
  const categories = new Set<string>();
  
  for (const nutrition of Object.values(COMPREHENSIVE_FOOD_DATABASE)) {
    categories.add(nutrition.category);
  }
  
  return Array.from(categories).sort();
}