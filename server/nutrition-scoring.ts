/**
 * Deterministic Nutrition Scoring Algorithm (0-100)
 * Pure TypeScript implementation with transparent penalties and bonuses
 */

export interface NutritionInput {
  // Per 100g values
  sugar_g_per_100g: number;
  sodium_mg_per_100g: number;
  saturated_fat_g_per_100g: number;
  fiber_g_per_100g: number;
  protein_g_per_100g: number;
  
  // Micronutrients - array of %DV values for vitamins/minerals
  micronutrients_percent_dv: number[];
}

export interface NutritionScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    base_score: number;
    penalty_sugar: number;
    penalty_sodium: number;
    penalty_saturated_fat: number;
    bonus_fiber: number;
    bonus_protein: number;
    bonus_micronutrients: number;
    final_score: number;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate deterministic nutrition score (0-100) with transparent weights
 */
export function calculateNutritionScore(nutrition: NutritionInput): NutritionScore {
  const base_score = 100;
  
  // Penalties (subtract from score)
  const penalty_sugar = clamp(nutrition.sugar_g_per_100g - 5, 0, 25) * 1.2;
  const penalty_sodium = clamp(nutrition.sodium_mg_per_100g - 300, 0, 1400) / 14; // up to ~100
  const penalty_saturated_fat = clamp(nutrition.saturated_fat_g_per_100g - 2, 0, 18) * 2; // up to ~36
  
  // Bonuses (add to score)
  const bonus_fiber = clamp(nutrition.fiber_g_per_100g, 0, 10) * 2; // up to 20
  const bonus_protein = clamp(nutrition.protein_g_per_100g, 0, 20) * 1.2; // up to 24
  
  // Micronutrient bonus: count vitamins/minerals with >= 10% DV
  const micros_above_10_percent = nutrition.micronutrients_percent_dv.filter(dv => dv >= 10).length;
  const bonus_micronutrients = Math.min(Math.round(micros_above_10_percent * 1.5), 20);
  
  // Calculate final score
  const total_penalties = penalty_sugar + penalty_sodium + penalty_saturated_fat;
  const total_bonuses = bonus_fiber + bonus_protein + bonus_micronutrients;
  const final_score = clamp(base_score - total_penalties + total_bonuses, 0, 100);
  
  // Assign grade
  let grade: 'A' | 'B' | 'C' | 'D';
  if (final_score >= 85) grade = 'A';
  else if (final_score >= 70) grade = 'B';
  else if (final_score >= 55) grade = 'C';
  else grade = 'D';
  
  return {
    score: Math.round(final_score),
    grade,
    breakdown: {
      base_score,
      penalty_sugar: Math.round(penalty_sugar * 100) / 100,
      penalty_sodium: Math.round(penalty_sodium * 100) / 100,
      penalty_saturated_fat: Math.round(penalty_saturated_fat * 100) / 100,
      bonus_fiber: Math.round(bonus_fiber * 100) / 100,
      bonus_protein: Math.round(bonus_protein * 100) / 100,
      bonus_micronutrients: Math.round(bonus_micronutrients * 100) / 100,
      final_score: Math.round(final_score)
    }
  };
}

// Export for testing
export { clamp };