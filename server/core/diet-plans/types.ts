export interface DietPlanQuestionnaire {
  personalInfo: {
    age: number;
    gender: string;
    height: number; // cm
    weight: number; // kg
  };
  healthGoals: string[]; // weight_loss, muscle_gain, diabetes, pcos, pregnancy, maintenance
  lifestyle: string[];
  foodPreferences: string[]; // vegetarian, non_vegetarian, vegan, mixed
  restrictions: string[]; // allergens and dietary restrictions
  eatingSchedule: string[]; // meal times
  dietPreparation: string[]; // cooking habits
  physicalActivity: string[];
  supplements: boolean;
  currentDiet: string[];
}

export interface DietPlanResponse {
  planId: string;
  planName: string;
  duration: number;
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    micronutrients: Record<string, number>;
  };
  startDate: string;
  endDate: string;
}

export interface NutritionalTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micronutrients: Record<string, number>;
  explanation: string;
}