/**
 * Unit tests for deterministic nutrition scoring algorithm
 */

import { calculateNutritionScore, clamp, type NutritionInput } from '../nutrition-scoring';

describe('Nutrition Scoring Algorithm', () => {
  describe('clamp function', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('calculateNutritionScore', () => {
    it('should calculate perfect score for ideal nutrition profile', () => {
      const nutrition: NutritionInput = {
        sugar_g_per_100g: 2, // Below penalty threshold (5g)
        sodium_mg_per_100g: 100, // Well below penalty threshold (300mg)
        saturated_fat_g_per_100g: 1, // Below penalty threshold (2g)
        fiber_g_per_100g: 8, // Good fiber content
        protein_g_per_100g: 15, // Good protein content
        micronutrients_percent_dv: [15, 20, 12, 25, 8] // 4 vitamins >= 10% DV
      };

      const result = calculateNutritionScore(nutrition);
      
      expect(result.score).toBeGreaterThan(95);
      expect(result.grade).toBe('A');
      expect(result.breakdown.penalty_sugar).toBe(0);
      expect(result.breakdown.penalty_sodium).toBe(0);
      expect(result.breakdown.penalty_saturated_fat).toBe(0);
      expect(result.breakdown.bonus_fiber).toBe(16); // 8 * 2
      expect(result.breakdown.bonus_protein).toBe(18); // 15 * 1.2
      expect(result.breakdown.bonus_micronutrients).toBe(6); // 4 * 1.5
    });

    it('should apply sugar penalty correctly', () => {
      const nutrition: NutritionInput = {
        sugar_g_per_100g: 20, // 15g over threshold
        sodium_mg_per_100g: 100,
        saturated_fat_g_per_100g: 1,
        fiber_g_per_100g: 5,
        protein_g_per_100g: 10,
        micronutrients_percent_dv: []
      };

      const result = calculateNutritionScore(nutrition);
      
      expect(result.breakdown.penalty_sugar).toBe(18); // (20-5) * 1.2 = 18
      expect(result.score).toBeLessThan(100);
    });

    it('should apply sodium penalty correctly', () => {
      const nutrition: NutritionInput = {
        sugar_g_per_100g: 2,
        sodium_mg_per_100g: 1000, // 700mg over threshold
        saturated_fat_g_per_100g: 1,
        fiber_g_per_100g: 5,
        protein_g_per_100g: 10,
        micronutrients_percent_dv: []
      };

      const result = calculateNutritionScore(nutrition);
      
      expect(result.breakdown.penalty_sodium).toBe(50); // (1000-300) / 14 = 50
      expect(result.score).toBeLessThan(100);
    });

    it('should apply saturated fat penalty correctly', () => {
      const nutrition: NutritionInput = {
        sugar_g_per_100g: 2,
        sodium_mg_per_100g: 100,
        saturated_fat_g_per_100g: 12, // 10g over threshold
        fiber_g_per_100g: 5,
        protein_g_per_100g: 10,
        micronutrients_percent_dv: []
      };

      const result = calculateNutritionScore(nutrition);
      
      expect(result.breakdown.penalty_saturated_fat).toBe(20); // (12-2) * 2 = 20
      expect(result.score).toBeLessThan(100);
    });

    it('should cap penalties at maximum values', () => {
      const nutrition: NutritionInput = {
        sugar_g_per_100g: 50, // Way over threshold
        sodium_mg_per_100g: 2000, // Way over threshold
        saturated_fat_g_per_100g: 30, // Way over threshold
        fiber_g_per_100g: 0,
        protein_g_per_100g: 0,
        micronutrients_percent_dv: []
      };

      const result = calculateNutritionScore(nutrition);
      
      expect(result.breakdown.penalty_sugar).toBe(30); // Capped at 25 * 1.2
      expect(result.breakdown.penalty_sodium).toBe(100); // Capped at 1400/14
      expect(result.breakdown.penalty_saturated_fat).toBe(36); // Capped at 18 * 2
      expect(result.score).toBe(0); // Should be clamped to 0
      expect(result.grade).toBe('D');
    });

    it('should assign correct grades', () => {
      const testCases = [
        { score: 90, expectedGrade: 'A' },
        { score: 85, expectedGrade: 'A' },
        { score: 84, expectedGrade: 'B' },
        { score: 70, expectedGrade: 'B' },
        { score: 69, expectedGrade: 'C' },
        { score: 55, expectedGrade: 'C' },
        { score: 54, expectedGrade: 'D' },
        { score: 0, expectedGrade: 'D' }
      ];

      testCases.forEach(({ score, expectedGrade }) => {
        // Create nutrition input that results in approximately the target score
        const nutrition: NutritionInput = {
          sugar_g_per_100g: score >= 85 ? 2 : score >= 70 ? 8 : score >= 55 ? 15 : 25,
          sodium_mg_per_100g: score >= 85 ? 100 : score >= 70 ? 500 : score >= 55 ? 800 : 1200,
          saturated_fat_g_per_100g: score >= 85 ? 1 : score >= 70 ? 3 : score >= 55 ? 6 : 10,
          fiber_g_per_100g: score >= 85 ? 8 : score >= 70 ? 5 : score >= 55 ? 3 : 1,
          protein_g_per_100g: score >= 85 ? 15 : score >= 70 ? 10 : score >= 55 ? 6 : 2,
          micronutrients_percent_dv: score >= 85 ? [15, 20, 12] : score >= 70 ? [12] : []
        };

        const result = calculateNutritionScore(nutrition);
        expect(result.grade).toBe(expectedGrade);
      });
    });

    it('should handle edge cases', () => {
      // All zeros
      const zeroNutrition: NutritionInput = {
        sugar_g_per_100g: 0,
        sodium_mg_per_100g: 0,
        saturated_fat_g_per_100g: 0,
        fiber_g_per_100g: 0,
        protein_g_per_100g: 0,
        micronutrients_percent_dv: []
      };

      const zeroResult = calculateNutritionScore(zeroNutrition);
      expect(zeroResult.score).toBe(100);
      expect(zeroResult.grade).toBe('A');

      // Very high values
      const highNutrition: NutritionInput = {
        sugar_g_per_100g: 100,
        sodium_mg_per_100g: 5000,
        saturated_fat_g_per_100g: 50,
        fiber_g_per_100g: 20, // Should be capped at 10
        protein_g_per_100g: 30, // Should be capped at 20
        micronutrients_percent_dv: Array(20).fill(20) // Many micronutrients
      };

      const highResult = calculateNutritionScore(highNutrition);
      expect(highResult.score).toBe(0); // Should be clamped to 0
      expect(highResult.grade).toBe('D');
      expect(highResult.breakdown.bonus_fiber).toBe(20); // Capped at 10 * 2
      expect(highResult.breakdown.bonus_protein).toBe(24); // Capped at 20 * 1.2
      expect(highResult.breakdown.bonus_micronutrients).toBe(20); // Capped at 20
    });
  });
});