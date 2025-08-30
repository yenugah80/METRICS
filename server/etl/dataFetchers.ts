import { db } from "../db";
import { eq, and } from "drizzle-orm";

interface USDAFoodItem {
  fdcId: number;
  description: string;
  dataType: string;
  brandName?: string;
  brandOwner?: string;
  gtinUpc?: string;
  foodNutrients: {
    nutrientId: number;
    value: number;
    unitName: string;
  }[];
  foodCategory?: {
    description: string;
  };
}

interface OFFFoodItem {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  nutriments: {
    [key: string]: number;
  };
  nutrition_grades?: string;
  data_quality_tags?: string[];
}

// USDA FoodData Central API Fetcher
export class USDAFetcher {
  private apiKey: string;
  private baseUrl = "https://api.nal.usda.gov/fdc/v1";

  constructor() {
    this.apiKey = process.env.USDA_API_KEY || '';
    if (!this.apiKey) {
      console.warn("USDA_API_KEY not configured - USDA fetcher disabled");
    }
  }

  async fetchByFdcId(fdcId: number): Promise<USDAFoodItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/food/${fdcId}?api_key=${this.apiKey}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(`Error fetching USDA food ${fdcId}:`, error);
      return null;
    }
  }

  async searchFoods(query: string, pageSize: number = 25): Promise<USDAFoodItem[]> {
    try {
      const searchParams = new URLSearchParams({
        query,
        dataType: 'Foundation,SR Legacy,Survey',
        pageSize: pageSize.toString(),
        api_key: this.apiKey
      });

      const response = await fetch(`${this.baseUrl}/foods/search?${searchParams}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.foods || [];
    } catch (error) {
      console.error(`Error searching USDA foods for "${query}":`, error);
      return [];
    }
  }

  // Transform USDA nutrition data to our normalized format (per 100g)
  transformNutritionData(foodNutrients: USDAFoodItem['foodNutrients']) {
    const nutrientMap: { [key: number]: string } = {
      1008: 'calories',     // Energy (kcal)
      1003: 'protein',      // Protein
      1004: 'totalFat',     // Total lipid (fat)
      1258: 'saturatedFat', // Fatty acids, total saturated
      1257: 'transFat',     // Fatty acids, total trans
      1005: 'carbohydrates', // Carbohydrate, by difference
      1079: 'fiber',        // Fiber, total dietary
      2000: 'sugar',        // Sugars, total including NLEA
      1093: 'sodium',       // Sodium, Na
      1162: 'vitaminC',     // Vitamin C, total ascorbic acid
      1087: 'calcium',      // Calcium, Ca
      1089: 'iron',         // Iron, Fe
      1090: 'magnesium',    // Magnesium, Mg
    };

    const nutrition: any = {};
    
    for (const nutrient of foodNutrients) {
      const fieldName = nutrientMap[nutrient.nutrientId];
      if (fieldName && nutrient.value !== undefined) {
        // Convert to per 100g if needed (USDA data is typically per 100g already)
        nutrition[fieldName] = nutrient.value.toString();
      }
    }

    return nutrition;
  }
}

// Open Food Facts API Fetcher
export class OpenFoodFactsFetcher {
  private baseUrl = "https://world.openfoodfacts.org/api/v2";

  async fetchByBarcode(barcode: string): Promise<OFFFoodItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/product/${barcode}.json`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.status === 1 ? data.product : null;
    } catch (error) {
      console.error(`Error fetching OFF product ${barcode}:`, error);
      return null;
    }
  }

  async searchProducts(query: string, pageSize: number = 25): Promise<OFFFoodItem[]> {
    try {
      const searchParams = new URLSearchParams({
        search_terms: query,
        search_simple: '1',
        action: 'process',
        page_size: pageSize.toString(),
        json: '1'
      });

      const response = await fetch(`${this.baseUrl}/search?${searchParams}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error(`Error searching OFF products for "${query}":`, error);
      return [];
    }
  }

  // Transform OFF nutrition data to our normalized format (per 100g)
  transformNutritionData(nutriments: OFFFoodItem['nutriments']) {
    const nutrientMap: { [key: string]: string } = {
      'energy-kcal_100g': 'calories',
      'proteins_100g': 'protein',
      'fat_100g': 'totalFat',
      'saturated-fat_100g': 'saturatedFat',
      'trans-fat_100g': 'transFat',
      'carbohydrates_100g': 'carbohydrates',
      'fiber_100g': 'fiber',
      'sugars_100g': 'sugar',
      'salt_100g': 'sodium', // Note: OFF has salt, we convert to sodium
      'vitamin-c_100g': 'vitaminC',
      'calcium_100g': 'calcium',
      'iron_100g': 'iron',
    };

    const nutrition: any = {};
    
    for (const [offKey, fieldName] of Object.entries(nutrientMap)) {
      if (nutriments[offKey] !== undefined) {
        let value = nutriments[offKey];
        
        // Convert salt to sodium (salt = sodium * 2.5)
        if (fieldName === 'sodium' && typeof value === 'number') {
          value = value / 2.5;
        }
        
        nutrition[fieldName] = value.toString();
      }
    }

    return nutrition;
  }
}

// Discovery Service - finds new ingredients from various sources
export class DiscoveryService {
  private usdaFetcher = new USDAFetcher();
  private offFetcher = new OpenFoodFactsFetcher();

  async discoverFromRecipe(recipeText: string): Promise<string[]> {
    // Extract potential ingredient names from recipe text
    // This would use NLP/AI to identify food items
    const ingredientNames: string[] = [];
    
    // Simple keyword extraction (in production, use OpenAI or spaCy)
    const foodWords = recipeText.toLowerCase().match(/\b(?:chicken|beef|rice|flour|sugar|salt|pepper|onion|garlic|tomato|cheese|milk|egg|butter|oil)\w*\b/g) || [];
    
    for (const name of foodWords) {
      await this.queueForDiscovery(name, 'recipe_parsing');
    }

    return ingredientNames;
  }

  async queueForDiscovery(ingredientName: string, source: string, priority: number = 5): Promise<void> {
    try {
      // Check if already exists in our database
      const existing = await db.select()
        .from(ingredients)
        .where(eq(ingredients.name, ingredientName))
        .limit(1);

      if (existing.length > 0) return; // Already have this ingredient

      // Check if already in discovery queue
      const queued = await db.select()
        .from(discoveryQueue)
        .where(and(
          eq(discoveryQueue.ingredientName, ingredientName),
          eq(discoveryQueue.status, 'pending')
        ))
        .limit(1);

      if (queued.length > 0) return; // Already queued

      await db.insert(discoveryQueue).values({
        ingredientName,
        source,
        priority,
        metadata: { discovered_from: source }
      });

      console.log(`Queued ingredient "${ingredientName}" for discovery from ${source}`);
    } catch (error) {
      console.error(`Error queueing ingredient "${ingredientName}":`, error);
    }
  }

  async processDiscoveryQueue(batchSize: number = 10): Promise<void> {
    try {
      // Get pending items from queue, ordered by priority (highest first)
      const queueItems = await db.select()
        .from(discoveryQueue)
        .where(eq(discoveryQueue.status, 'pending'))
        .orderBy(discoveryQueue.priority)
        .limit(batchSize);

      console.log(`Processing ${queueItems.length} discovery queue items`);

      for (const item of queueItems) {
        await this.processDiscoveryItem(item);
      }
    } catch (error) {
      console.error('Error processing discovery queue:', error);
    }
  }

  private async processDiscoveryItem(queueItem: any): Promise<void> {
    try {
      // Mark as processing
      await db.update(discoveryQueue)
        .set({ 
          status: 'processing', 
          lastAttempt: new Date(),
          attempts: queueItem.attempts + 1 
        })
        .where(eq(discoveryQueue.id, queueItem.id));

      // Try USDA first
      const usdaResults = await this.usdaFetcher.searchFoods(queueItem.ingredientName, 5);
      if (usdaResults.length > 0) {
        await this.storeUSDAIngredient(usdaResults[0]);
        await db.update(discoveryQueue)
          .set({ status: 'completed' })
          .where(eq(discoveryQueue.id, queueItem.id));
        return;
      }

      // Try Open Food Facts
      const offResults = await this.offFetcher.searchProducts(queueItem.ingredientName, 5);
      if (offResults.length > 0) {
        await this.storeOFFIngredient(offResults[0]);
        await db.update(discoveryQueue)
          .set({ status: 'completed' })
          .where(eq(discoveryQueue.id, queueItem.id));
        return;
      }

      // Mark as failed if no results found
      await db.update(discoveryQueue)
        .set({ status: 'failed' })
        .where(eq(discoveryQueue.id, queueItem.id));

    } catch (error) {
      console.error(`Error processing discovery item ${queueItem.id}:`, error);
      await db.update(discoveryQueue)
        .set({ status: 'failed' })
        .where(eq(discoveryQueue.id, queueItem.id));
    }
  }

  private async storeUSDAIngredient(usdaItem: USDAFoodItem): Promise<string> {
    const [ingredient] = await db.insert(ingredients).values({
      externalId: usdaItem.fdcId.toString(),
      source: 'usda_fdc',
      name: usdaItem.description,
      category: usdaItem.foodCategory?.description,
      brandName: usdaItem.brandName,
      barcode: usdaItem.gtinUpc,
      dataQuality: '0.95', // USDA data is high quality
    }).returning();

    // Store nutrition data
    const nutrition = this.usdaFetcher.transformNutritionData(usdaItem.foodNutrients);
    await db.insert(nutritionData).values({
      ingredientId: ingredient.id,
      ...nutrition,
      dataSource: 'usda_fdc',
      confidence: '0.95',
    });

    return ingredient.id;
  }

  private async storeOFFIngredient(offItem: OFFFoodItem): Promise<string> {
    const [ingredient] = await db.insert(ingredients).values({
      externalId: offItem.code,
      source: 'open_food_facts',
      name: offItem.product_name || `Product ${offItem.code}`,
      category: offItem.categories?.split(',')[0]?.trim(),
      brandName: offItem.brands?.split(',')[0]?.trim(),
      barcode: offItem.code,
      dataQuality: '0.80', // OFF data is good but variable quality
    }).returning();

    // Store nutrition data
    const nutrition = this.offFetcher.transformNutritionData(offItem.nutriments);
    await db.insert(nutritionData).values({
      ingredientId: ingredient.id,
      ...nutrition,
      dataSource: 'open_food_facts',
      confidence: '0.80',
    });

    return ingredient.id;
  }
}

// ETL Job Runner - orchestrates all data fetching and processing
export class ETLJobRunner {
  private discoveryService = new DiscoveryService();

  async runDiscoveryJob(): Promise<void> {
    const jobId = await this.startJob('ingredient_discovery');
    
    try {
      await this.discoveryService.processDiscoveryQueue(50);
      await this.completeJob(jobId, { batchSize: 50 });
    } catch (error) {
      await this.failJob(jobId, error as Error);
    }
  }

  async runUSDARefreshJob(): Promise<void> {
    const jobId = await this.startJob('usda_refresh');
    
    try {
      // Refresh existing USDA ingredients that haven't been updated in 30 days
      // Implementation would go here
      await this.completeJob(jobId, { refreshed: 0 });
    } catch (error) {
      await this.failJob(jobId, error as Error);
    }
  }

  private async startJob(jobType: string): Promise<string> {
    const [job] = await db.insert(etlJobs).values({
      jobType,
      status: 'running',
    }).returning();
    
    return job.id;
  }

  private async completeJob(jobId: string, metadata: any): Promise<void> {
    await db.update(etlJobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        metadata
      })
      .where(eq(etlJobs.id, jobId));
  }

  private async failJob(jobId: string, error: Error): Promise<void> {
    await db.update(etlJobs)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorLog: { message: error.message, stack: error.stack }
      })
      .where(eq(etlJobs.id, jobId));
  }
}