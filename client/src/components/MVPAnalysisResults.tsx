import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Heart, Globe, CheckCircle, AlertTriangle, 
  Flame, Apple, Droplets, Leaf, Plus, Minus, Save,
  Trophy, Star, Zap, Eye, Brain, Crown, Utensils, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { localApi } from "@/lib/localApi";
import { queryClient } from "@/lib/queryClient";

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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [mealTotals, setMealTotals] = useState({
    calories: analysis.health.calories,
    protein: analysis.health.macronutrients.protein,
    carbs: analysis.health.macronutrients.carbs,
    fat: analysis.health.macronutrients.fat,
    fiber: analysis.health.macronutrients.fiber
  });

  // USDA Daily Goals - Professional Standards
  const dailyGoals = {
    calories: 2000,
    protein: 150,
    carbs: 200, 
    fat: 67
  };

  // Strategic Grade Colors - MyFitnessPal style
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-emerald-500';
      case 'B': return 'bg-lime-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getGradeTextColor = (grade: string) => {
    return 'text-white';
  };

  const updateFoodQuantity = (index: number, change: number) => {
    const newFoods = [...editableFoods];
    const newQuantity = Math.max(0.1, newFoods[index].quantity + change);
    const ratio = newQuantity / newFoods[index].quantity;
    
    newFoods[index].quantity = newQuantity;
    newFoods[index].calories_per_serving = Math.round((newFoods[index].calories_per_serving || 0) * ratio);
    
    setEditableFoods(newFoods);
    
    // Recalculate totals
    const newTotals = newFoods.reduce((acc, food) => ({
      calories: acc.calories + (food.calories_per_serving || 0),
      protein: acc.protein + ((food.protein || 0) * food.quantity),
      carbs: acc.carbs + (((food.calories_per_serving || 0) * 0.5) / 4),
      fat: acc.fat + (((food.calories_per_serving || 0) * 0.3) / 9),
      fiber: acc.fiber + (food.quantity * 2)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    
    setMealTotals(newTotals);
  };

  const saveMeal = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/meals/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          name: `AI Analyzed Meal`,
          mealType: selectedMealType,
          foods: editableFoods,
          nutrition: {
            total_calories: mealTotals.calories,
            total_protein: mealTotals.protein,
            total_carbs: mealTotals.carbs,
            total_fat: mealTotals.fat,
            nutrition_score: analysis.health,
            sustainability_score: analysis.sustainability,
            safety: analysis.safety
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save meal');
      }

      const result = await response.json();
      
      toast({
        title: "Meal Saved Successfully! ✅",
        description: `Your ${selectedMealType} has been logged. +90 XP earned!`,
        className: "bg-green-50 border-green-200",
      });

      // Invalidate dashboard queries to update today's progress
      await queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/meals/today"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });

      // Call the parent callback
      if (onSaveMeal) {
        onSaveMeal();
      }

    } catch (error: any) {
      console.error('Error saving meal:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExpanded = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto" data-testid="analysis-results">
      
      {/* 🎯 STRATEGIC PRIORITY 1: Meal Summary Card (Always First) */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${getGradeColor(analysis.health.health_grade)} flex items-center justify-center`}>
                <span className={`text-xl font-bold ${getGradeTextColor(analysis.health.health_grade)}`}>
                  {analysis.health.health_grade}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Nutrition Analysis</h3>
                <p className="text-sm text-gray-600">{analysis.health.nutrition_score}/100 • {editableFoods.length} food{editableFoods.length !== 1 ? 's' : ''} detected</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {Math.round(analysis.confidence * 100)}% confidence
            </Badge>
          </div>

          {/* Macro Ring Layout - Apple Fitness Style */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <Progress 
                  value={(mealTotals.calories / dailyGoals.calories) * 100} 
                  className="absolute inset-0 transform rotate-90 h-16 w-16"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-orange-600">{Math.round(mealTotals.calories)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600">Calories</p>
            </div>
            
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <Progress 
                  value={(mealTotals.protein / dailyGoals.protein) * 100} 
                  className="absolute inset-0 transform rotate-90 h-16 w-16"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-red-600">{Math.round(mealTotals.protein)}g</span>
                </div>
              </div>
              <p className="text-xs text-gray-600">Protein</p>
            </div>
            
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <Progress 
                  value={(mealTotals.carbs / dailyGoals.carbs) * 100} 
                  className="absolute inset-0 transform rotate-90 h-16 w-16"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-yellow-600">{Math.round(mealTotals.carbs)}g</span>
                </div>
              </div>
              <p className="text-xs text-gray-600">Carbs</p>
            </div>
            
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <Progress 
                  value={(mealTotals.fat / dailyGoals.fat) * 100} 
                  className="absolute inset-0 transform rotate-90 h-16 w-16"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-600">{Math.round(mealTotals.fat)}g</span>
                </div>
              </div>
              <p className="text-xs text-gray-600">Fat</p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* 🎯 STRATEGIC PRIORITY 2: Food Items with Portion Control */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Detected Foods
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded('foods')}
              className="text-gray-500"
            >
              {expandedSection === 'foods' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {expandedSection === 'foods' && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {editableFoods.map((food, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 capitalize">{food.name}</h4>
                    <p className="text-sm text-gray-600">{food.calories_per_serving} cal per serving</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {Math.round(food.confidence * 100)}% match
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFoodQuantity(index, -0.25)}
                      className="w-8 h-8 p-0"
                      data-testid={`decrease-${food.name}`}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-semibold">{food.quantity}</div>
                      <div className="text-xs text-gray-500">{food.unit}</div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFoodQuantity(index, 0.25)}
                      className="w-8 h-8 p-0"
                      data-testid={`increase-${food.name}`}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* 🎯 STRATEGIC PRIORITY 3: Secondary Insights (Tabbed) */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Tabs defaultValue="health" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 m-0 rounded-none">
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Health
              </TabsTrigger>
              <TabsTrigger value="safety" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Safety
              </TabsTrigger>
              <TabsTrigger value="sustainability" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Impact
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="health" className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">Health Benefits</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.health.health_benefits.slice(0, 3).map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {analysis.health.improvement_suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-700">Suggestions</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysis.health.improvement_suggestions.slice(0, 3).map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Zap className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="safety" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  analysis.safety.overall_safety === 'safe' ? 'bg-green-100' : 
                  analysis.safety.overall_safety === 'caution' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {analysis.safety.overall_safety === 'safe' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium capitalize">
                    {analysis.safety.overall_safety === 'safe' ? 'All Clear' : 'Safety Check'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Safety Score: {analysis.safety.food_safety_score}/100
                  </p>
                </div>
              </div>
              
              {analysis.safety.safety_recommendations.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Safety Tips</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {analysis.safety.safety_recommendations.slice(0, 2).map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sustainability" className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${getGradeColor(analysis.sustainability.eco_grade)}`}>
                    <span className={`text-lg font-bold ${getGradeTextColor(analysis.sustainability.eco_grade)}`}>
                      {analysis.sustainability.eco_grade}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-green-800">Eco Rating</p>
                  <p className="text-xs text-green-600">{analysis.sustainability.eco_score}/100</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Carbon Impact</span>
                    <Badge variant={analysis.sustainability.carbon_footprint === 'low' ? 'default' : 'secondary'}>
                      {analysis.sustainability.carbon_footprint}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Water Usage</span>
                    <Badge variant={analysis.sustainability.water_usage === 'low' ? 'default' : 'secondary'}>
                      {analysis.sustainability.water_usage}
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 🎯 STRATEGIC PRIORITY 4: Sticky Action Bar (Always Visible) */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 -mx-4">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <div className="flex-1">
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="meal-type-select"
            >
              <option value="breakfast">🌅 Breakfast</option>
              <option value="lunch">☀️ Lunch</option>
              <option value="dinner">🌙 Dinner</option>
              <option value="snack">🍎 Snack</option>
            </select>
          </div>
          
          <Button
            onClick={saveMeal}
            disabled={isSaving}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg font-medium transition-all duration-200"
            data-testid="save-meal-button"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Meal (+90 XP)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}