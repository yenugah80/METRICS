import { db } from "../db";
import { unitConversions, densityData, contextOverrides, ingredients, nutritionData } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Unit Conversion Engine
export class UnitConverter {
  private conversionCache = new Map<string, number>();

  async convert(
    value: number, 
    fromUnit: string, 
    toUnit: string, 
    ingredientId?: string,
    category?: string
  ): Promise<number> {
    if (fromUnit === toUnit) return value;

    const cacheKey = `${fromUnit}-${toUnit}-${ingredientId || category || 'general'}`;
    
    if (this.conversionCache.has(cacheKey)) {
      return value * this.conversionCache.get(cacheKey)!;
    }

    const factor = await this.getConversionFactor(fromUnit, toUnit, ingredientId, category);
    if (factor === null) {
      throw new Error(`No conversion found from ${fromUnit} to ${toUnit}`);
    }

    this.conversionCache.set(cacheKey, factor);
    return value * factor;
  }

  private async getConversionFactor(
    fromUnit: string, 
    toUnit: string, 
    ingredientId?: string,
    category?: string
  ): Promise<number | null> {
    // Try ingredient-specific conversion first
    if (ingredientId) {
      const specific = await db.select()
        .from(unitConversions)
        .where(and(
          eq(unitConversions.fromUnit, fromUnit),
          eq(unitConversions.toUnit, toUnit),
          eq(unitConversions.ingredientId, ingredientId)
        ))
        .limit(1);

      if (specific.length > 0) {
        return parseFloat(specific[0].factor);
      }
    }

    // Try category-specific conversion
    if (category) {
      const categoryConversion = await db.select()
        .from(unitConversions)
        .where(and(
          eq(unitConversions.fromUnit, fromUnit),
          eq(unitConversions.toUnit, toUnit),
          eq(unitConversions.category, category)
        ))
        .limit(1);

      if (categoryConversion.length > 0) {
        return parseFloat(categoryConversion[0].factor);
      }
    }

    // Try general conversion
    const general = await db.select()
      .from(unitConversions)
      .where(and(
        eq(unitConversions.fromUnit, fromUnit),
        eq(unitConversions.toUnit, toUnit),
        eq(unitConversions.isGeneral, true)
      ))
      .limit(1);

    if (general.length > 0) {
      return parseFloat(general[0].factor);
    }

    return null;
  }

  // Initialize common conversions
  async initializeConversions(): Promise<void> {
    const commonConversions = [
      // Weight conversions
      { from: 'g', to: 'kg', factor: 0.001, general: true },
      { from: 'kg', to: 'g', factor: 1000, general: true },
      { from: 'oz', to: 'g', factor: 28.3495, general: true },
      { from: 'g', to: 'oz', factor: 0.035274, general: true },
      { from: 'lb', to: 'g', factor: 453.592, general: true },
      { from: 'g', to: 'lb', factor: 0.002205, general: true },

      // Volume conversions
      { from: 'ml', to: 'l', factor: 0.001, general: true },
      { from: 'l', to: 'ml', factor: 1000, general: true },
      { from: 'cup', to: 'ml', factor: 236.588, general: true },
      { from: 'ml', to: 'cup', factor: 0.004227, general: true },
      { from: 'tbsp', to: 'ml', factor: 14.7868, general: true },
      { from: 'ml', to: 'tbsp', factor: 0.067628, general: true },
      { from: 'tsp', to: 'ml', factor: 4.92892, general: true },
      { from: 'ml', to: 'tsp', factor: 0.202884, general: true },
      { from: 'fl_oz', to: 'ml', factor: 29.5735, general: true },
      { from: 'ml', to: 'fl_oz', factor: 0.033814, general: true },
    ];

    for (const conversion of commonConversions) {
      try {
        await db.insert(unitConversions).values({
          fromUnit: conversion.from,
          toUnit: conversion.to,
          factor: conversion.factor.toString(),
          isGeneral: conversion.general,
        }).onConflictDoNothing();
      } catch (error) {
        // Ignore duplicates
      }
    }
  }
}

// Density Calculator for volume to weight conversions
export class DensityCalculator {
  private densityCache = new Map<string, number>();

  async getDensity(
    ingredientId?: string,
    category?: string,
    state?: string
  ): Promise<number | null> {
    const cacheKey = `${ingredientId || category || 'unknown'}-${state || 'default'}`;
    
    if (this.densityCache.has(cacheKey)) {
      return this.densityCache.get(cacheKey)!;
    }

    let density: number | null = null;

    // Try ingredient-specific density first
    if (ingredientId) {
      const specific = await db.select()
        .from(densityData)
        .where(and(
          eq(densityData.ingredientId, ingredientId),
          state ? eq(densityData.state, state) : eq(densityData.state, 'default')
        ))
        .limit(1);

      if (specific.length > 0) {
        density = parseFloat(specific[0].densityGMl);
      }
    }

    // Try category-based density
    if (!density && category) {
      const categoryDensity = await db.select()
        .from(densityData)
        .where(and(
          eq(densityData.category, category),
          state ? eq(densityData.state, state) : eq(densityData.state, 'default')
        ))
        .limit(1);

      if (categoryDensity.length > 0) {
        density = parseFloat(categoryDensity[0].densityGMl);
      }
    }

    if (density) {
      this.densityCache.set(cacheKey, density);
    }

    return density;
  }

  async convertVolumeToWeight(
    volume: number,
    volumeUnit: string,
    ingredientId?: string,
    category?: string,
    state?: string
  ): Promise<{ weight: number; unit: string } | null> {
    // Convert volume to ml first
    const unitConverter = new UnitConverter();
    const volumeInMl = await unitConverter.convert(volume, volumeUnit, 'ml');

    // Get density
    const density = await this.getDensity(ingredientId, category, state);
    if (!density) return null;

    // Calculate weight in grams
    const weightInGrams = volumeInMl * density;

    return {
      weight: weightInGrams,
      unit: 'g'
    };
  }

  // Initialize common density data
  async initializeDensities(): Promise<void> {
    const commonDensities = [
      // Liquids
      { category: 'liquids', name: 'Water', density: 1.0, state: 'liquid' },
      { category: 'liquids', name: 'Milk', density: 1.03, state: 'liquid' },
      { category: 'liquids', name: 'Oil', density: 0.92, state: 'liquid' },
      { category: 'liquids', name: 'Honey', density: 1.42, state: 'liquid' },

      // Powders
      { category: 'flour', name: 'All-purpose flour', density: 0.57, state: 'powder' },
      { category: 'sugar', name: 'Granulated sugar', density: 0.85, state: 'powder' },
      { category: 'salt', name: 'Table salt', density: 1.21, state: 'powder' },

      // Grains
      { category: 'grains', name: 'Rice (uncooked)', density: 0.75, state: 'solid' },
      { category: 'grains', name: 'Quinoa (uncooked)', density: 0.69, state: 'solid' },

      // Dairy
      { category: 'dairy', name: 'Butter', density: 0.91, state: 'solid' },
      { category: 'dairy', name: 'Cream cheese', density: 1.04, state: 'solid' },
    ];

    for (const item of commonDensities) {
      try {
        await db.insert(densityData).values({
          category: item.category,
          densityGMl: item.density.toString(),
          state: item.state,
          source: 'manual_initialization',
          confidence: '0.90',
        }).onConflictDoNothing();
      } catch (error) {
        // Ignore duplicates
      }
    }
  }
}

// Context Override System for handling preparation methods
export class ContextProcessor {
  async applyContextOverrides(
    ingredientId: string,
    context: string,
    preparation?: string,
    baseNutrition?: any
  ): Promise<any> {
    // Find applicable overrides
    const overrides = await db.select()
      .from(contextOverrides)
      .where(and(
        eq(contextOverrides.ingredientId, ingredientId),
        eq(contextOverrides.context, context),
        eq(contextOverrides.isActive, true)
      ));

    if (overrides.length === 0) return baseNutrition;

    const override = overrides[0];
    let adjustedNutrition = { ...baseNutrition };

    // Apply multipliers
    if (override.calorieMultiplier) {
      const multiplier = parseFloat(override.calorieMultiplier);
      if (adjustedNutrition.calories) {
        adjustedNutrition.calories = (parseFloat(adjustedNutrition.calories) * multiplier).toString();
      }
    }

    // Apply nutrition changes from JSON
    if (override.nutritionChanges) {
      const changes = override.nutritionChanges as any;
      for (const [nutrient, changePercent] of Object.entries(changes)) {
        if (adjustedNutrition[nutrient]) {
          const currentValue = parseFloat(adjustedNutrition[nutrient]);
          const changeMultiplier = 1 + (changePercent as number) / 100;
          adjustedNutrition[nutrient] = (currentValue * changeMultiplier).toString();
        }
      }
    }

    return adjustedNutrition;
  }

  // Initialize common context overrides
  async initializeContextOverrides(): Promise<void> {
    // This would be populated with common cooking/preparation overrides
    // For example: raw vs cooked vegetables, baked vs fried foods, etc.
    
    const commonOverrides = [
      {
        context: 'cooked',
        preparation: 'boiled',
        changes: { 
          // Cooking generally reduces water-soluble vitamins
          vitaminC: -25, // 25% reduction
          fiber: -10     // Some fiber loss
        }
      },
      {
        context: 'fried',
        preparation: 'deep_fried',
        changes: {
          calories: 50,  // 50% increase due to oil absorption
          totalFat: 200  // Significant fat increase
        }
      }
    ];

    // Implementation would insert these overrides for specific ingredients
    // This is just an example structure
  }
}

// Nutrition Calculation Engine
export class NutritionCalculationEngine {
  private unitConverter = new UnitConverter();
  private densityCalculator = new DensityCalculator();
  private contextProcessor = new ContextProcessor();

  async calculateNutritionForQuantity(
    ingredientId: string,
    quantity: number,
    unit: string,
    context?: string,
    preparation?: string
  ): Promise<any> {
    // Get ingredient and nutrition data
    const [ingredient] = await db.select()
      .from(ingredients)
      .where(eq(ingredients.id, ingredientId))
      .limit(1);

    if (!ingredient) {
      throw new Error(`Ingredient ${ingredientId} not found`);
    }

    const [nutrition] = await db.select()
      .from(nutritionData)
      .where(eq(nutritionData.ingredientId, ingredientId))
      .limit(1);

    if (!nutrition) {
      throw new Error(`Nutrition data for ingredient ${ingredientId} not found`);
    }

    // Convert quantity to grams (our base unit for nutrition calculations)
    let quantityInGrams: number;

    try {
      // Try direct weight conversion first
      quantityInGrams = await this.unitConverter.convert(
        quantity, 
        unit, 
        'g', 
        ingredientId, 
        ingredient.category || undefined
      );
    } catch (error) {
      // If direct conversion fails, try volume to weight conversion
      const volumeToWeight = await this.densityCalculator.convertVolumeToWeight(
        quantity,
        unit,
        ingredientId,
        ingredient.category || undefined
      );

      if (!volumeToWeight) {
        throw new Error(`Cannot convert ${unit} to grams for ingredient ${ingredient.name}`);
      }

      quantityInGrams = volumeToWeight.weight;
    }

    // Calculate nutrition per actual quantity (nutrition data is per 100g)
    const scaleFactor = quantityInGrams / 100;
    let scaledNutrition: any = {};

    // Scale all nutrition values
    const nutritionFields = [
      'calories', 'protein', 'totalFat', 'saturatedFat', 'transFat',
      'carbohydrates', 'fiber', 'sugar', 'addedSugar', 'sodium',
      'potassium', 'cholesterol', 'vitaminA', 'vitaminC', 'vitaminD',
      'calcium', 'iron', 'magnesium'
    ];

    for (const field of nutritionFields) {
      if (nutrition[field as keyof typeof nutrition]) {
        const value = parseFloat(nutrition[field as keyof typeof nutrition] as string);
        scaledNutrition[field] = (value * scaleFactor).toFixed(3);
      }
    }

    // Apply context overrides if specified
    if (context) {
      scaledNutrition = await this.contextProcessor.applyContextOverrides(
        ingredientId,
        context,
        preparation,
        scaledNutrition
      );
    }

    return {
      ingredient: {
        id: ingredient.id,
        name: ingredient.name,
        source: ingredient.source
      },
      quantity: quantityInGrams,
      unit: 'g',
      originalQuantity: quantity,
      originalUnit: unit,
      context,
      preparation,
      nutrition: scaledNutrition,
      confidence: nutrition.confidence
    };
  }

  // Initialize the transformation system
  async initialize(): Promise<void> {
    console.log('Initializing nutrition calculation engine...');
    
    await this.unitConverter.initializeConversions();
    await this.densityCalculator.initializeDensities();
    await this.contextProcessor.initializeContextOverrides();
    
    console.log('Nutrition calculation engine initialized');
  }
}