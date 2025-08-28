/**
 * Nutrition API Integration Service
 * Integrates multiple food/nutrition databases for comprehensive food data lookup
 */

export interface NutritionData {
  calories?: number;
  protein?: number; // grams
  carbs?: number; // grams
  fat?: number; // grams
  fiber?: number; // grams
  iron?: number; // mg
  vitaminC?: number; // mg
  magnesium?: number; // mg
  vitaminB12?: number; // mcg
  sodium?: number; // mg
  sugar?: number; // grams
  saturatedFat?: number; // grams
}

export interface FoodItem {
  name: string;
  barcode?: string;
  quantity: number;
  unit: string;
  nutrition: NutritionData;
  confidence: number;
  source: string;
  brand?: string;
  ingredients?: string[];
}

// Open Food Facts API (Free)
export class OpenFoodFactsAPI {
  private baseUrl = 'https://world.openfoodfacts.org/api/v2';

  async searchByBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};
        
        return {
          name: product.product_name || 'Unknown Product',
          barcode,
          quantity: 100, // Default to 100g
          unit: 'g',
          brand: product.brands,
          ingredients: product.ingredients_text ? [product.ingredients_text] : undefined,
          nutrition: {
            calories: nutriments.energy_kcal_100g,
            protein: nutriments.proteins_100g,
            carbs: nutriments.carbohydrates_100g,
            fat: nutriments.fat_100g,
            fiber: nutriments.fiber_100g,
            sodium: nutriments.sodium_100g,
            sugar: nutriments.sugars_100g,
            saturatedFat: nutriments['saturated-fat_100g'],
          },
          confidence: 0.8,
          source: 'Open Food Facts'
        };
      }
      return null;
    } catch (error) {
      console.error('OpenFoodFacts API error:', error);
      return null;
    }
  }

  async searchByText(query: string): Promise<FoodItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?search_terms=${encodeURIComponent(query)}&json=1&page_size=5`);
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        return data.products.map((product: any) => {
          const nutriments = product.nutriments || {};
          return {
            name: product.product_name || 'Unknown Product',
            barcode: product.code,
            quantity: 100,
            unit: 'g',
            brand: product.brands,
            nutrition: {
              calories: nutriments.energy_kcal_100g,
              protein: nutriments.proteins_100g,
              carbs: nutriments.carbohydrates_100g,
              fat: nutriments.fat_100g,
              fiber: nutriments.fiber_100g,
              sodium: nutriments.sodium_100g,
              sugar: nutriments.sugars_100g,
              saturatedFat: nutriments['saturated-fat_100g'],
            },
            confidence: 0.7,
            source: 'Open Food Facts'
          };
        }).filter((item: FoodItem) => item.nutrition.calories !== undefined);
      }
      return [];
    } catch (error) {
      console.error('OpenFoodFacts search error:', error);
      return [];
    }
  }
}

// USDA FoodData Central API (Free)
export class USDAFoodDataAPI {
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchByText(query: string): Promise<FoodItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/foods/search?query=${encodeURIComponent(query)}&api_key=${this.apiKey}&pageSize=5`);
      const data = await response.json();
      
      if (data.foods && data.foods.length > 0) {
        return data.foods.map((food: any) => {
          const nutrients = this.extractNutrients(food.foodNutrients || []);
          return {
            name: food.description || 'Unknown Food',
            quantity: 100,
            unit: 'g',
            nutrition: nutrients,
            confidence: 0.9,
            source: 'USDA FoodData'
          };
        });
      }
      return [];
    } catch (error) {
      console.error('USDA API error:', error);
      return [];
    }
  }

  private extractNutrients(foodNutrients: any[]): NutritionData {
    const nutrients: NutritionData = {};
    
    foodNutrients.forEach((nutrient: any) => {
      const name = nutrient.nutrientName?.toLowerCase() || '';
      const value = nutrient.value;
      
      if (name.includes('energy') || name.includes('calorie')) {
        nutrients.calories = value;
      } else if (name.includes('protein')) {
        nutrients.protein = value;
      } else if (name.includes('carbohydrate')) {
        nutrients.carbs = value;
      } else if (name.includes('total lipid') || name.includes('fat')) {
        nutrients.fat = value;
      } else if (name.includes('fiber')) {
        nutrients.fiber = value;
      } else if (name.includes('iron')) {
        nutrients.iron = value;
      } else if (name.includes('vitamin c')) {
        nutrients.vitaminC = value;
      } else if (name.includes('magnesium')) {
        nutrients.magnesium = value;
      } else if (name.includes('vitamin b-12')) {
        nutrients.vitaminB12 = value;
      } else if (name.includes('sodium')) {
        nutrients.sodium = value;
      } else if (name.includes('sugar')) {
        nutrients.sugar = value;
      }
    });
    
    return nutrients;
  }
}

// Edamam Food Database API (Requires API key)
export class EdamamAPI {
  private baseUrl = 'https://api.edamam.com/api/food-database/v2';
  private appId: string;
  private appKey: string;

  constructor(appId: string, appKey: string) {
    this.appId = appId;
    this.appKey = appKey;
  }

  async searchByText(query: string): Promise<FoodItem[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/parser?app_id=${this.appId}&app_key=${this.appKey}&ingr=${encodeURIComponent(query)}&nutrition-type=cooking`
      );
      const data = await response.json();
      
      if (data.hints && data.hints.length > 0) {
        return data.hints.slice(0, 5).map((hint: any) => {
          const food = hint.food;
          const nutrients = food.nutrients || {};
          
          return {
            name: food.label || 'Unknown Food',
            quantity: 100,
            unit: 'g',
            nutrition: {
              calories: nutrients.ENERC_KCAL,
              protein: nutrients.PROCNT,
              carbs: nutrients.CHOCDF,
              fat: nutrients.FAT,
              fiber: nutrients.FIBTG,
              iron: nutrients.FE,
              vitaminC: nutrients.VITC,
              magnesium: nutrients.MG,
              vitaminB12: nutrients.VITB12A,
              sodium: nutrients.NA,
              sugar: nutrients.SUGAR,
            },
            confidence: 0.85,
            source: 'Edamam'
          };
        });
      }
      return [];
    } catch (error) {
      console.error('Edamam API error:', error);
      return [];
    }
  }
}

// FatSecret API (Requires OAuth)
export class FatSecretAPI {
  private baseUrl = 'https://platform.fatsecret.com/rest/server.api';
  private consumerKey: string;
  private consumerSecret: string;

  constructor(consumerKey: string, consumerSecret: string) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  // Note: FatSecret requires OAuth 1.0 authentication which is complex
  // This is a simplified version - in production you'd need proper OAuth implementation
  async searchByText(query: string): Promise<FoodItem[]> {
    try {
      // This would require proper OAuth 1.0 signature generation
      // For now, returning empty array as placeholder
      console.log('FatSecret API would search for:', query);
      return [];
    } catch (error) {
      console.error('FatSecret API error:', error);
      return [];
    }
  }
}

// Main Nutrition Service that aggregates all APIs
export class NutritionService {
  private openFoodFacts: OpenFoodFactsAPI;
  private usdaAPI?: USDAFoodDataAPI;
  private edamamAPI?: EdamamAPI;
  private fatSecretAPI?: FatSecretAPI;

  constructor() {
    this.openFoodFacts = new OpenFoodFactsAPI();
    
    // Initialize APIs if keys are available
    if (process.env.USDA_API_KEY) {
      this.usdaAPI = new USDAFoodDataAPI(process.env.USDA_API_KEY);
    }
    
    if (process.env.EDAMAM_APP_ID && process.env.EDAMAM_APP_KEY) {
      this.edamamAPI = new EdamamAPI(process.env.EDAMAM_APP_ID, process.env.EDAMAM_APP_KEY);
    }
    
    if (process.env.FATSECRET_CONSUMER_KEY && process.env.FATSECRET_CONSUMER_SECRET) {
      this.fatSecretAPI = new FatSecretAPI(
        process.env.FATSECRET_CONSUMER_KEY,
        process.env.FATSECRET_CONSUMER_SECRET
      );
    }
  }

  async searchByBarcode(barcode: string): Promise<FoodItem | null> {
    // First try Open Food Facts (free and reliable for barcodes)
    const result = await this.openFoodFacts.searchByBarcode(barcode);
    if (result) return result;

    // Could add other barcode APIs here
    return null;
  }

  async searchByText(query: string): Promise<FoodItem[]> {
    const allResults: FoodItem[] = [];

    // Search all available APIs in parallel for better coverage
    const promises: Promise<FoodItem[]>[] = [
      this.openFoodFacts.searchByText(query)
    ];

    if (this.usdaAPI) {
      promises.push(this.usdaAPI.searchByText(query));
    }

    if (this.edamamAPI) {
      promises.push(this.edamamAPI.searchByText(query));
    }

    try {
      const results = await Promise.allSettled(promises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allResults.push(...result.value);
        }
      });

      // Sort by confidence and remove duplicates
      const uniqueResults = this.deduplicateResults(allResults);
      return uniqueResults.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
    } catch (error) {
      console.error('Error searching nutrition APIs:', error);
      return allResults;
    }
  }

  private deduplicateResults(results: FoodItem[]): FoodItem[] {
    const seen = new Set<string>();
    return results.filter((item) => {
      const key = item.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Helper method to estimate nutrition for foods without exact matches
  async estimateNutrition(foodName: string, quantity: number, unit: string): Promise<FoodItem | null> {
    const searchResults = await this.searchByText(foodName);
    if (searchResults.length > 0) {
      const bestMatch = searchResults[0];
      
      // Scale nutrition based on quantity
      const scaleFactor = this.calculateScaleFactor(quantity, unit, bestMatch.quantity, bestMatch.unit);
      
      return {
        ...bestMatch,
        quantity,
        unit,
        nutrition: this.scaleNutrition(bestMatch.nutrition, scaleFactor),
        confidence: bestMatch.confidence * 0.8 // Reduce confidence for estimates
      };
    }
    
    return null;
  }

  private calculateScaleFactor(targetQuantity: number, targetUnit: string, baseQuantity: number, baseUnit: string): number {
    // Simple unit conversion and scaling
    // In a real implementation, you'd want more sophisticated unit conversion
    if (targetUnit === baseUnit) {
      return targetQuantity / baseQuantity;
    }
    
    // Basic conversions (extend as needed)
    const grams = this.convertToGrams(targetQuantity, targetUnit);
    const baseGrams = this.convertToGrams(baseQuantity, baseUnit);
    
    return grams / baseGrams;
  }

  private convertToGrams(quantity: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'g': case 'gram': case 'grams':
        return quantity;
      case 'kg': case 'kilogram': case 'kilograms':
        return quantity * 1000;
      case 'oz': case 'ounce': case 'ounces':
        return quantity * 28.35;
      case 'lb': case 'pound': case 'pounds':
        return quantity * 453.59;
      case 'cup': case 'cups':
        return quantity * 240; // Approximate for liquids
      case 'tbsp': case 'tablespoon': case 'tablespoons':
        return quantity * 15;
      case 'tsp': case 'teaspoon': case 'teaspoons':
        return quantity * 5;
      default:
        return quantity; // Assume grams if unknown
    }
  }

  private scaleNutrition(nutrition: NutritionData, scaleFactor: number): NutritionData {
    const scaled: NutritionData = {};
    
    Object.entries(nutrition).forEach(([key, value]) => {
      if (typeof value === 'number') {
        scaled[key as keyof NutritionData] = value * scaleFactor;
      }
    });
    
    return scaled;
  }
}

export const nutritionService = new NutritionService();