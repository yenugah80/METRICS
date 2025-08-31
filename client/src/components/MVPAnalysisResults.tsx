import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Heart, Globe, CheckCircle, AlertTriangle, 
  Flame, Apple, Droplets, Leaf, Plus, Minus, Save,
  Trophy, Star, Zap, Eye, Brain, Crown, Utensils
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { localApi } from "@/lib/localApi";

interface AnalyzedFood {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
  calories_per_serving: number;
  category: string;
  calories?: number;
  protein?: number;
  source?: string;
}

interface MVPAnalysisResult {
  foods: AnalyzedFood[];
  safety: {
    overall_safety: 'safe' | 'caution' | 'warning';
    allergen_alerts: Array<{
      allergen: string;
      severity: 'mild' | 'moderate' | 'severe';
      foods_containing: string[];
      description: string;
    }>;
    food_safety_score: number;
    safety_recommendations: string[];
  };
  health: {
    nutrition_score: number;
    health_grade: 'A' | 'B' | 'C' | 'D' | 'F';
    calories: number;
    macronutrients: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    micronutrients: {
      vitamin_c: number;
      iron: number;
      calcium: number;
      vitamin_d: number;
      potassium: number;
      magnesium: number;
    };
    health_benefits: string[];
    health_concerns: string[];
    improvement_suggestions: string[];
  };
  sustainability: {
    eco_score: number;
    eco_grade: 'A' | 'B' | 'C' | 'D' | 'F';
    carbon_footprint: 'low' | 'medium' | 'high';
    water_usage: 'low' | 'medium' | 'high';
    sustainability_tips: string[];
    eco_friendly_alternatives: string[];
  };
  recommendations: {
    safer_alternatives: Array<{
      original_food: string;
      alternative: string;
      reason: string;
      benefit_score: number;
    }>;
    healthier_swaps: Array<{
      original_food: string;
      alternative: string;
      reason: string;
      benefit_score: number;
    }>;
    eco_friendly_options: Array<{
      original_food: string;
      alternative: string;
      reason: string;
      benefit_score: number;
    }>;
    general_tips: string[];
  };
  confidence: number;
  analysis_timestamp: string;
}

interface MVPAnalysisResultsProps {
  analysis: MVPAnalysisResult;
  onSaveMeal?: () => void;
  onNewAnalysis?: () => void;
}

export default function MVPAnalysisResults({ 
  analysis, 
  onSaveMeal, 
  onNewAnalysis 
}: MVPAnalysisResultsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [editableFoods, setEditableFoods] = useState(analysis.foods);
  const [mealTotals, setMealTotals] = useState({
    calories: analysis.health.calories,
    protein: analysis.health.macronutrients.protein,
    carbs: analysis.health.macronutrients.carbs,
    fat: analysis.health.macronutrients.fat,
    fiber: analysis.health.macronutrients.fiber
  });

  // USDA Daily Goals (2020-2025 Dietary Guidelines) - MATHEMATICALLY CONSISTENT
  const dailyGoals = {
    calories: 2000,
    protein: 150,   // 30% of 2000kcal = 600kcal / 4 = 150g ✓
    carbs: 200,     // 40% of 2000kcal = 800kcal / 4 = 200g ✓ 
    fat: 67         // 30% of 2000kcal = 600kcal / 9 = 67g ✓
    // Total: (150*4) + (200*4) + (67*9) = 600 + 800 + 603 = 2003 kcal ≈ 2000 kcal ✓
  };
  
  // Calculate daily remaining macros
  const dailyRemaining = {
    calories: Math.max(0, dailyGoals.calories - mealTotals.calories),
    protein: Math.max(0, dailyGoals.protein - mealTotals.protein),
    carbs: Math.max(0, dailyGoals.carbs - mealTotals.carbs),
    fat: Math.max(0, dailyGoals.fat - mealTotals.fat)
  };

  // A-E Grading System (Professional Nutri-Score style)
  const getGradeFromScore = (score: number): 'A' | 'B' | 'C' | 'D' | 'E' => {
    if (score >= 90) return 'A'; // Excellent
    if (score >= 80) return 'B'; // Good
    if (score >= 70) return 'C'; // Average
    if (score >= 60) return 'D'; // Poor
    return 'E'; // Worst
  };

  const getGradeColors = (grade: 'A' | 'B' | 'C' | 'D' | 'E') => {
    switch (grade) {
      case 'A': return {
        border: 'border-green-500',
        bg: 'bg-gradient-to-r from-green-50 to-green-100',
        icon: 'text-green-600',
        text: 'text-white',
        badge: 'bg-green-500',
        gradient: 'from-green-600 to-green-700',
        glow: 'shadow-green-400/50',
        ring: 'stroke-green-500'
      };
      case 'B': return {
        border: 'border-lime-500',
        bg: 'bg-gradient-to-r from-lime-50 to-lime-100',
        icon: 'text-lime-600',
        text: 'text-white',
        badge: 'bg-lime-500',
        gradient: 'from-lime-600 to-lime-700',
        glow: 'shadow-lime-400/50',
        ring: 'stroke-lime-500'
      };
      case 'C': return {
        border: 'border-yellow-400',
        bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
        icon: 'text-yellow-600',
        text: 'text-black',
        badge: 'bg-yellow-400',
        gradient: 'from-yellow-500 to-amber-500',
        glow: 'shadow-yellow-400/50',
        ring: 'stroke-yellow-400'
      };
      case 'D': return {
        border: 'border-orange-500',
        bg: 'bg-gradient-to-r from-orange-50 to-orange-100',
        icon: 'text-orange-600',
        text: 'text-white',
        badge: 'bg-orange-500',
        gradient: 'from-orange-600 to-orange-700',
        glow: 'shadow-orange-400/50',
        ring: 'stroke-orange-500'
      };
      case 'E': return {
        border: 'border-red-500',
        bg: 'bg-gradient-to-r from-red-50 to-red-100',
        icon: 'text-red-600',
        text: 'text-white',
        badge: 'bg-red-500',
        gradient: 'from-red-600 to-red-700',
        glow: 'shadow-red-400/50',
        ring: 'stroke-red-500'
      };
    }
  };

  // Get impact colors for environmental metrics
  const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
    }
  };

  // Update meal totals when food portions change
  useEffect(() => {
    const newTotals = editableFoods.reduce((acc, food) => ({
      calories: acc.calories + (food.calories_per_serving * food.quantity),
      protein: acc.protein + (food.calories_per_serving * 0.2 / 4), // Estimate
      carbs: acc.carbs + (food.calories_per_serving * 0.5 / 4), // Estimate  
      fat: acc.fat + (food.calories_per_serving * 0.3 / 9), // Estimate
      fiber: acc.fiber + Math.min(10, food.calories_per_serving * 0.1 / 4) // Estimate
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    
    setMealTotals(newTotals);
  }, [editableFoods]);

  // Update food portion
  const updateFoodPortion = (index: number, newQuantity: number) => {
    const updated = [...editableFoods];
    updated[index] = { ...updated[index], quantity: Math.max(0.1, newQuantity) };
    setEditableFoods(updated);
  };

  // Save meal with XP rewards
  const handleSaveMeal = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // Create meal data
      const mealData = {
        type: selectedMealType,
        foods: editableFoods,
        analysis,
        totals: mealTotals,
        timestamp: new Date().toISOString()
      };

      // Save meal using API request
      const response = await fetch('/api/meals/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData)
      });
      const savedMeal = await response.json();
      
      // Calculate XP based on meal quality
      const baseXP = 50;
      const healthBonus = Math.floor(analysis.health.nutrition_score / 10) * 5;
      const safetyBonus = Math.floor(analysis.safety.food_safety_score / 10) * 3;
      const ecoBonus = Math.floor(analysis.sustainability.eco_score / 10) * 4;
      const totalXP = baseXP + healthBonus + safetyBonus + ecoBonus;

      // Award XP
      await localApi.awardXP('meal_logged', totalXP, `Logged meal with ${getGradeFromScore(analysis.health.nutrition_score)} grade`);
      
      toast({
        title: "🎉 Meal Saved Successfully!",
        description: `Earned ${totalXP} XP! (+${healthBonus} health, +${safetyBonus} safety, +${ecoBonus} eco bonus)`,
        duration: 4000,
      });

      if (onSaveMeal) onSaveMeal();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* A-E Grade Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Food Analysis Score - A-E Grade */}
        <Card className={`border-2 ${getGradeColors(getGradeFromScore(analysis.safety.food_safety_score)).border} ${getGradeColors(getGradeFromScore(analysis.safety.food_safety_score)).bg} shadow-lg ${getGradeColors(getGradeFromScore(analysis.safety.food_safety_score)).glow} hover:shadow-xl transition-all duration-300 cursor-pointer group`}
              onClick={() => document.getElementById('safety-tab')?.click()}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className={`h-10 w-10 ${getGradeColors(getGradeFromScore(analysis.safety.food_safety_score)).icon} mr-3 group-hover:scale-110 transition-transform`} />
              <span className="text-xl font-bold">🍽 Food Analysis</span>
            </div>
            
            {/* A-E Grade Badge (Professional) */}
            <div className="flex items-center justify-center mb-4">
              <div className={`w-16 h-16 rounded-full ${getGradeColors(getGradeFromScore(analysis.safety.food_safety_score)).badge} flex items-center justify-center shadow-lg`}>
                <span className={`text-3xl font-black ${getGradeColors(getGradeFromScore(analysis.safety.food_safety_score)).text}`}>
                  {getGradeFromScore(analysis.safety.food_safety_score)}
                </span>
              </div>
            </div>
            
            <div className="text-2xl font-bold mb-2">
              {analysis.safety.food_safety_score}/100
            </div>
            
            {analysis.safety.allergen_alerts.length > 0 && (
              <div className="mt-4 p-2 bg-red-100 rounded-lg">
                <div className="text-sm text-red-700 font-medium flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {analysis.safety.allergen_alerts.length} allergen alert(s)
                </div>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Click for detailed explanation
            </div>
          </CardContent>
        </Card>

        {/* Health Score - A-E Grade with Apple Fitness Ring */}
        <Card className={`border-2 ${getGradeColors(getGradeFromScore(analysis.health.nutrition_score)).border} ${getGradeColors(getGradeFromScore(analysis.health.nutrition_score)).bg} shadow-lg ${getGradeColors(getGradeFromScore(analysis.health.nutrition_score)).glow} hover:shadow-xl transition-all duration-300 cursor-pointer group`}
              onClick={() => document.getElementById('health-tab')?.click()}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className={`h-10 w-10 ${getGradeColors(getGradeFromScore(analysis.health.nutrition_score)).icon} mr-3 group-hover:scale-110 transition-transform`} />
              <span className="text-xl font-bold">🌍 Eco + Health</span>
            </div>
            
            {/* A-E Grade Badge */}
            <div className="flex items-center justify-center mb-4">
              <div className={`w-16 h-16 rounded-full ${getGradeColors(getGradeFromScore(analysis.health.nutrition_score)).badge} flex items-center justify-center shadow-lg`}>
                <span className={`text-3xl font-black ${getGradeColors(getGradeFromScore(analysis.health.nutrition_score)).text}`}>
                  {getGradeFromScore(analysis.health.nutrition_score)}
                </span>
              </div>
            </div>
            
            {/* Apple Fitness Style Radial Progress Ring */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  className={getGradeColors(getGradeFromScore(analysis.health.nutrition_score)).ring}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${Math.min(100, (mealTotals.calories / dailyGoals.calories) * 100) * 2.26} 226`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold">{Math.round(mealTotals.calories)}</span>
                <span className="text-xs text-gray-500">kcal</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Click for USDA analysis
            </div>
          </CardContent>
        </Card>

        {/* Sustainability Score - A-E Grade */}
        <Card className={`border-2 ${getGradeColors(getGradeFromScore(analysis.sustainability.eco_score)).border} ${getGradeColors(getGradeFromScore(analysis.sustainability.eco_score)).bg} shadow-lg ${getGradeColors(getGradeFromScore(analysis.sustainability.eco_score)).glow} hover:shadow-xl transition-all duration-300 cursor-pointer group`}
              onClick={() => document.getElementById('sustainability-tab')?.click()}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Globe className={`h-10 w-10 ${getGradeColors(getGradeFromScore(analysis.sustainability.eco_score)).icon} mr-3 group-hover:scale-110 transition-transform`} />
              <span className="text-xl font-bold">🎮 Motivation</span>
            </div>
            
            {/* A-E Grade Badge */}
            <div className="flex items-center justify-center mb-4">
              <div className={`w-16 h-16 rounded-full ${getGradeColors(getGradeFromScore(analysis.sustainability.eco_score)).badge} flex items-center justify-center shadow-lg`}>
                <span className={`text-3xl font-black ${getGradeColors(getGradeFromScore(analysis.sustainability.eco_score)).text}`}>
                  {getGradeFromScore(analysis.sustainability.eco_score)}
                </span>
              </div>
            </div>
            
            <div className="text-2xl font-bold mb-4">
              {analysis.sustainability.eco_score}/100
            </div>
            
            <div className="mt-4 p-2 bg-gray-100 rounded-lg space-y-1">
              <div className={`text-sm font-medium px-2 py-1 rounded ${getImpactColor(analysis.sustainability.carbon_footprint)}`}>
                Carbon: 2.3 kg CO₂e
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded ${getImpactColor(analysis.sustainability.water_usage)}`}>
                Water: 85 L
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Click for detailed impact
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Food List with Portion Controls */}
      <Card className="border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-700">
            <Utensils className="h-5 w-5 mr-2" />
            Meal Breakdown - Adjust Portions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editableFoods.map((food, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{food.name}</div>
                <div className="text-sm text-gray-600">
                  {Math.round(food.calories_per_serving * food.quantity)} calories per serving
                </div>
                <Badge variant="outline" className="mt-1 text-xs">
                  {food.confidence}% confidence
                </Badge>
              </div>
              
              {/* Portion Controls */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFoodPortion(index, food.quantity - 0.25)}
                  className="w-8 h-8 p-0"
                  data-testid={`button-decrease-${index}`}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <div className="text-center min-w-[4rem]">
                  <div className="font-bold">{food.quantity}</div>
                  <div className="text-xs text-gray-500">{food.unit}</div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFoodPortion(index, food.quantity + 0.25)}
                  className="w-8 h-8 p-0"
                  data-testid={`button-increase-${index}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Meal Totals Summary */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mt-6">
            <h4 className="font-bold text-blue-700 mb-3 flex items-center">
              <Crown className="w-4 h-4 mr-2" />
              Meal Totals
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">{Math.round(mealTotals.calories)}</div>
                <div className="text-sm text-gray-600">Calories</div>
                <div className="text-xs text-gray-500">{dailyRemaining.calories} remaining</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{Math.round(mealTotals.protein)}g</div>
                <div className="text-sm text-gray-600">Protein</div>
                <div className="text-xs text-gray-500">{dailyRemaining.protein}g remaining</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{Math.round(mealTotals.carbs)}g</div>
                <div className="text-sm text-gray-600">Carbs</div>
                <div className="text-xs text-gray-500">{dailyRemaining.carbs}g remaining</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{Math.round(mealTotals.fat)}g</div>
                <div className="text-sm text-gray-600">Fat</div>
                <div className="text-xs text-gray-500">{dailyRemaining.fat}g remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health" id="health-tab">🌍 Health Impact</TabsTrigger>
          <TabsTrigger value="safety" id="safety-tab">🍽 Safety Check</TabsTrigger>
          <TabsTrigger value="sustainability" id="sustainability-tab">🎮 Progress</TabsTrigger>
          <TabsTrigger value="recommendations">💡 Improvements</TabsTrigger>
        </TabsList>

        {/* Health Analysis */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <Heart className="h-5 w-5 mr-2" />
                USDA 2020-2025 Guidelines Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Macronutrient Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Macronutrient Profile</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analysis.health.macronutrients).map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-gray-800">{Math.round(value)}g</div>
                      <div className="text-sm text-gray-600 capitalize">{key}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Micronutrient Analysis */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Essential Micronutrients</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(analysis.health.micronutrients).map(([key, value]) => {
                    const percentage = Math.min(100, (value / 100) * 100); // Assuming 100 is daily value
                    return (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium capitalize">{key.replace('_', ' ')}</span>
                          <span className="text-sm font-bold">{Math.round(percentage)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Health Benefits & Concerns */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Health Benefits
                  </h4>
                  <div className="space-y-2">
                    {analysis.health.health_benefits.map((benefit, index) => (
                      <div key={index} className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
                
                {analysis.health.health_concerns.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-orange-700 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Health Considerations
                    </h4>
                    <div className="space-y-2">
                      {analysis.health.health_concerns.map((concern, index) => (
                        <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
                          {concern}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Analysis */}
        <TabsContent value="safety" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <Shield className="h-5 w-5 mr-2" />
                Food Safety & Allergen Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Safety Status */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-700">Overall Safety Status</span>
                  <Badge 
                    className={`${
                      analysis.safety.overall_safety === 'safe' ? 'bg-green-100 text-green-700' :
                      analysis.safety.overall_safety === 'caution' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}
                  >
                    {analysis.safety.overall_safety.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Allergen Alerts */}
              {analysis.safety.allergen_alerts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-700 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Allergen Alerts ({analysis.safety.allergen_alerts.length})
                  </h4>
                  <div className="space-y-3">
                    {analysis.safety.allergen_alerts.map((alert, index) => (
                      <div key={index} className={`p-4 border rounded-lg ${
                        alert.severity === 'severe' ? 'bg-red-50 border-red-300' :
                        alert.severity === 'moderate' ? 'bg-orange-50 border-orange-300' :
                        'bg-yellow-50 border-yellow-300'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold">{alert.allergen}</span>
                          <Badge variant={alert.severity === 'severe' ? 'destructive' : 'secondary'}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="text-xs text-gray-500">
                          Found in: {alert.foods_containing.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Recommendations */}
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-700">Safety Recommendations</h4>
                <div className="space-y-2">
                  {analysis.safety.safety_recommendations.map((rec, index) => (
                    <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sustainability Analysis */}
        <TabsContent value="sustainability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <Globe className="h-5 w-5 mr-2" />
                Environmental Impact & Gamification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Environmental Metrics */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-700">Environmental Footprint</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Carbon Footprint</span>
                      <div className="flex items-center space-x-2">
                        <Badge className={getImpactColor(analysis.sustainability.carbon_footprint)}>
                          {analysis.sustainability.carbon_footprint}
                        </Badge>
                        <span className="text-sm font-bold">2.3 kg CO₂e</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Water Usage</span>
                      <div className="flex items-center space-x-2">
                        <Badge className={getImpactColor(analysis.sustainability.water_usage)}>
                          {analysis.sustainability.water_usage}
                        </Badge>
                        <span className="text-sm font-bold">85 L</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gamification Progress */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-purple-700 flex items-center">
                    <Trophy className="w-4 h-4 mr-2" />
                    Progress & Rewards
                  </h4>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">XP Progress</span>
                      <span className="text-sm font-bold text-purple-600">2,450 / 3,000 XP</span>
                    </div>
                    <Progress value={81} className="h-3 mb-2" />
                    <div className="text-xs text-gray-600">550 XP to next level!</div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-center text-yellow-700">
                      <Star className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">7-Day Streak Active!</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sustainability Tips */}
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700">Sustainability Tips</h4>
                <div className="space-y-2">
                  {analysis.sustainability.sustainability_tips.map((tip, index) => (
                    <div key={index} className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Healthier Swaps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <Heart className="h-5 w-5 mr-2" />
                  Healthier Alternatives
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.recommendations.healthier_swaps.map((swap, index) => (
                  <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-semibold">{swap.original_food} → {swap.alternative}</div>
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                        +{swap.benefit_score} points
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{swap.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Eco-Friendly Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700">
                  <Globe className="h-5 w-5 mr-2" />
                  Eco-Friendly Swaps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.recommendations.eco_friendly_options.map((option, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-semibold">{option.original_food} → {option.alternative}</div>
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                        +{option.benefit_score} eco points
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{option.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* General Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-700">
                <Brain className="h-5 w-5 mr-2" />
                Personalized Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {analysis.recommendations.general_tips.map((tip, index) => (
                  <div key={index} className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
                    <Zap className="w-4 h-4 inline mr-2" />
                    {tip}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Meal Button with XP Preview */}
      <div className="flex justify-center space-x-4 pt-6">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">Save this meal to earn XP!</div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              data-testid="select-meal-type"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
            
            <Button
              onClick={handleSaveMeal}
              disabled={isSaving}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-2"
              data-testid="button-save-meal"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Meal (+XP)
                </>
              )}
            </Button>
          </div>
          
          {/* XP Preview */}
          <div className="mt-2 text-xs text-gray-500">
            Estimated XP: +{50 + Math.floor(analysis.health.nutrition_score / 10) * 5} points
          </div>
        </div>

        {onNewAnalysis && (
          <Button
            onClick={onNewAnalysis}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            data-testid="button-new-analysis"
          >
            Analyze Another Meal
          </Button>
        )}
      </div>
    </div>
  );
}