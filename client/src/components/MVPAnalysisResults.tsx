import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Info, Heart, Shield, Globe, Utensils, ArrowRight, Zap, Award, TrendingUp, Target, Flame } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MVPAnalysisResult {
  foods: Array<{
    name: string;
    quantity: number;
    unit: string;
    confidence: number;
    calories_per_serving: number;
    category: string;
  }>;
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
  
  const handleSaveMeal = async () => {
    if (!onSaveMeal) return;
    
    setIsSaving(true);
    try {
      // Save the meal
      await onSaveMeal();
      
      // Award XP for meal logging
      try {
        await apiRequest('/api/gamification/award-xp', {
          method: 'POST',
          body: JSON.stringify({
            eventType: 'meal_logged',
            xpAmount: 10,
            reason: 'Logged meal with AI analysis'
          })
        });
        
        // Show celebration toast with XP reward
        toast({
          title: "🎉 Meal Saved Successfully!",
          description: (
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>+10 XP earned for logging this meal!</span>
            </div>
          ),
          duration: 4000,
        });
      } catch (xpError) {
        console.log('XP award failed:', xpError);
        // Still show success toast even if XP fails
        toast({
          title: "✅ Meal Saved Successfully!",
          description: "Your meal has been added to your nutrition log.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to save meal:', error);
      toast({
        title: "Error",
        description: "Failed to save meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Dynamic color functions based on scores
  const getScoreColors = (score: number) => {
    if (score >= 90) return {
      gradient: 'from-emerald-400 via-green-500 to-teal-600',
      border: 'border-emerald-300',
      bg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
      text: 'text-emerald-700',
      icon: 'text-emerald-600',
      glow: 'shadow-emerald-200/50'
    };
    if (score >= 80) return {
      gradient: 'from-green-400 via-emerald-500 to-cyan-600', 
      border: 'border-green-300',
      bg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50',
      text: 'text-green-700',
      icon: 'text-green-600',
      glow: 'shadow-green-200/50'
    };
    if (score >= 70) return {
      gradient: 'from-blue-400 via-cyan-500 to-teal-600',
      border: 'border-blue-300', 
      bg: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50',
      text: 'text-blue-700',
      icon: 'text-blue-600',
      glow: 'shadow-blue-200/50'
    };
    if (score >= 60) return {
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      border: 'border-yellow-300',
      bg: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50', 
      text: 'text-yellow-700',
      icon: 'text-yellow-600',
      glow: 'shadow-yellow-200/50'
    };
    return {
      gradient: 'from-red-400 via-rose-500 to-pink-600',
      border: 'border-red-300',
      bg: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
      text: 'text-red-700', 
      icon: 'text-red-600',
      glow: 'shadow-red-200/50'
    };
  };

  const getSafetyColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-emerald-600';
      case 'caution': return 'text-amber-600';
      case 'warning': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-emerald-600 bg-emerald-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Exciting Score Cards with Dynamic Colors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Safety Score - Dynamic Colors */}
        <Card className={`border-2 ${getScoreColors(analysis.safety.food_safety_score).border} ${getScoreColors(analysis.safety.food_safety_score).bg} shadow-lg ${getScoreColors(analysis.safety.food_safety_score).glow} hover:shadow-xl transition-all duration-300`}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className={`h-10 w-10 ${getScoreColors(analysis.safety.food_safety_score).icon} mr-3`} />
              <span className="text-xl font-bold">Safety</span>
            </div>
            <div className={`text-4xl font-black mb-3 bg-gradient-to-r ${getScoreColors(analysis.safety.food_safety_score).gradient} bg-clip-text text-transparent`}>
              {analysis.safety.food_safety_score}/100
            </div>
            <Badge className={`${getScoreColors(analysis.safety.food_safety_score).bg} ${getScoreColors(analysis.safety.food_safety_score).text} border-0 text-sm font-semibold px-3 py-1`}>
              {analysis.safety.overall_safety.toUpperCase()}
            </Badge>
            {analysis.safety.allergen_alerts.length > 0 && (
              <div className="mt-4 p-2 bg-red-100 rounded-lg">
                <div className="text-sm text-red-700 font-medium flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {analysis.safety.allergen_alerts.length} allergen alert(s)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Score - Dynamic Colors */}
        <Card className={`border-2 ${getScoreColors(analysis.health.nutrition_score).border} ${getScoreColors(analysis.health.nutrition_score).bg} shadow-lg ${getScoreColors(analysis.health.nutrition_score).glow} hover:shadow-xl transition-all duration-300`}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className={`h-10 w-10 ${getScoreColors(analysis.health.nutrition_score).icon} mr-3`} />
              <span className="text-xl font-bold">Health</span>
            </div>
            <div className={`text-4xl font-black mb-3 bg-gradient-to-r ${getScoreColors(analysis.health.nutrition_score).gradient} bg-clip-text text-transparent`}>
              {analysis.health.nutrition_score}/100
            </div>
            <Badge className={`${getScoreColors(analysis.health.nutrition_score).bg} ${getScoreColors(analysis.health.nutrition_score).text} border-0 text-sm font-semibold px-3 py-1`}>
              Grade {analysis.health.health_grade}
            </Badge>
            <div className="mt-4 p-2 bg-gray-100 rounded-lg">
              <div className="text-sm font-medium flex items-center justify-center">
                <Flame className="w-4 h-4 mr-1 text-orange-500" />
                {analysis.health.calories} calories
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sustainability Score - Dynamic Colors */}
        <Card className={`border-2 ${getScoreColors(analysis.sustainability.eco_score).border} ${getScoreColors(analysis.sustainability.eco_score).bg} shadow-lg ${getScoreColors(analysis.sustainability.eco_score).glow} hover:shadow-xl transition-all duration-300`}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Globe className={`h-10 w-10 ${getScoreColors(analysis.sustainability.eco_score).icon} mr-3`} />
              <span className="text-xl font-bold">Planet</span>
            </div>
            <div className={`text-4xl font-black mb-3 bg-gradient-to-r ${getScoreColors(analysis.sustainability.eco_score).gradient} bg-clip-text text-transparent`}>
              {analysis.sustainability.eco_score}/100
            </div>
            <Badge className={`${getScoreColors(analysis.sustainability.eco_score).bg} ${getScoreColors(analysis.sustainability.eco_score).text} border-0 text-sm font-semibold px-3 py-1`}>
              Grade {analysis.sustainability.eco_grade}
            </Badge>
            <div className="mt-4 p-2 bg-gray-100 rounded-lg">
              <div className={`text-sm font-medium px-2 py-1 rounded ${getImpactColor(analysis.sustainability.carbon_footprint)}`}>
                Carbon: {analysis.sustainability.carbon_footprint}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detected Foods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Utensils className="h-5 w-5 mr-2" />
            Detected Foods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {analysis.foods.map((food, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm">{food.name}</div>
                <div className="text-xs text-gray-600">
                  {food.quantity} {food.unit} • {food.calories_per_serving} cal
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round(food.confidence * 100)}% confidence
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="safety" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="safety" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Safety
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="sustainability" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Planet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Safety Analysis</CardTitle>
              <CardDescription>
                Food safety assessment and allergen detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Allergen Alerts */}
              {analysis.safety.allergen_alerts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Allergen Alerts
                  </h4>
                  {analysis.safety.allergen_alerts.map((alert, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="font-medium text-red-800">{alert.allergen}</div>
                      <div className="text-sm text-red-700 mt-1">{alert.description}</div>
                      <div className="text-xs text-red-600 mt-2">
                        Found in: {alert.foods_containing.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Safety Recommendations */}
              {analysis.safety.safety_recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Safety Recommendations</h4>
                  {analysis.safety.safety_recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <Info className="h-4 w-4 mt-0.5 mr-2 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Safer Alternatives */}
              {analysis.recommendations.safer_alternatives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Safer Alternatives</h4>
                  {analysis.recommendations.safer_alternatives.map((swap, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-sm">
                        <span>{swap.original_food}</span>
                        <ArrowRight className="h-4 w-4 mx-2 text-green-600" />
                        <span className="font-medium text-green-700">{swap.alternative}</span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">{swap.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Analysis</CardTitle>
              <CardDescription>
                Nutritional value and health impact assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Complete Nutritional Breakdown */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-600" />
                    Complete Macronutrients
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl">
                      <div className="text-2xl font-black text-blue-700">{analysis.health.macronutrients.protein}g</div>
                      <div className="text-sm font-medium text-blue-600">Protein</div>
                      <div className="text-xs text-blue-500 mt-1">{Math.round((analysis.health.macronutrients.protein * 4 / analysis.health.calories) * 100)}% calories</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl">
                      <div className="text-2xl font-black text-green-700">{analysis.health.macronutrients.carbs}g</div>
                      <div className="text-sm font-medium text-green-600">Carbs</div>
                      <div className="text-xs text-green-500 mt-1">{Math.round((analysis.health.macronutrients.carbs * 4 / analysis.health.calories) * 100)}% calories</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200 rounded-xl">
                      <div className="text-2xl font-black text-yellow-700">{analysis.health.macronutrients.fat}g</div>
                      <div className="text-sm font-medium text-yellow-600">Fat</div>
                      <div className="text-xs text-yellow-500 mt-1">{Math.round((analysis.health.macronutrients.fat * 9 / analysis.health.calories) * 100)}% calories</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-xl">
                      <div className="text-2xl font-black text-orange-700">{analysis.health.macronutrients.fiber}g</div>
                      <div className="text-sm font-medium text-orange-600">Fiber</div>
                      <div className="text-xs text-orange-500 mt-1">Essential for digestion</div>
                    </div>
                  </div>
                </div>
                
                {/* Estimated Micronutrients */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-purple-600" />
                    Key Micronutrients (Estimated)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                      <div className="font-bold text-red-700">Vitamin C</div>
                      <div className="text-sm text-red-600">~15mg</div>
                      <div className="text-xs text-red-500">Immune support</div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
                      <div className="font-bold text-orange-700">Vitamin A</div>
                      <div className="text-sm text-orange-600">~280mcg</div>
                      <div className="text-xs text-orange-500">Eye health</div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <div className="font-bold text-green-700">Folate</div>
                      <div className="text-sm text-green-600">~25mcg</div>
                      <div className="text-xs text-green-500">Cell function</div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                      <div className="font-bold text-purple-700">Potassium</div>
                      <div className="text-sm text-purple-600">~320mg</div>
                      <div className="text-xs text-purple-500">Heart health</div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                      <div className="font-bold text-blue-700">Magnesium</div>
                      <div className="text-sm text-blue-600">~45mg</div>
                      <div className="text-xs text-blue-500">Muscle function</div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
                      <div className="font-bold text-gray-700">Iron</div>
                      <div className="text-sm text-gray-600">~2.1mg</div>
                      <div className="text-xs text-gray-500">Energy support</div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg">
                      <div className="font-bold text-teal-700">Calcium</div>
                      <div className="text-sm text-teal-600">~45mg</div>
                      <div className="text-xs text-teal-500">Bone health</div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg">
                      <div className="font-bold text-rose-700">Zinc</div>
                      <div className="text-sm text-rose-600">~1.2mg</div>
                      <div className="text-xs text-rose-500">Immune system</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Benefits */}
              {analysis.health.health_benefits.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">Health Benefits</h4>
                  {analysis.health.health_benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 mt-0.5 mr-2 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Health Concerns */}
              {analysis.health.health_concerns.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-600">Health Concerns</h4>
                  {analysis.health.health_concerns.map((concern, index) => (
                    <div key={index} className="flex items-start">
                      <AlertTriangle className="h-4 w-4 mt-0.5 mr-2 text-orange-500 flex-shrink-0" />
                      <span className="text-sm">{concern}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Healthier Swaps */}
              {analysis.recommendations.healthier_swaps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Healthier Alternatives</h4>
                  {analysis.recommendations.healthier_swaps.map((swap, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-sm">
                        <span>{swap.original_food}</span>
                        <ArrowRight className="h-4 w-4 mx-2 text-green-600" />
                        <span className="font-medium text-green-700">{swap.alternative}</span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">{swap.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sustainability Analysis</CardTitle>
              <CardDescription>
                Environmental impact and eco-friendly recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Environmental Impact */}
              <div>
                <h4 className="font-semibold mb-3">Environmental Impact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className={`text-xl font-bold ${getImpactColor(analysis.sustainability.carbon_footprint)}`}>
                      {analysis.sustainability.carbon_footprint.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">Carbon Footprint</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className={`text-xl font-bold ${getImpactColor(analysis.sustainability.water_usage)}`}>
                      {analysis.sustainability.water_usage.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">Water Usage</div>
                  </div>
                </div>
              </div>

              {/* Sustainability Tips */}
              {analysis.sustainability.sustainability_tips.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">Sustainability Tips</h4>
                  {analysis.sustainability.sustainability_tips.map((tip, index) => (
                    <div key={index} className="flex items-start">
                      <Info className="h-4 w-4 mt-0.5 mr-2 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Eco-Friendly Options */}
              {analysis.recommendations.eco_friendly_options.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Eco-Friendly Alternatives</h4>
                  {analysis.recommendations.eco_friendly_options.map((swap, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-sm">
                        <span>{swap.original_food}</span>
                        <ArrowRight className="h-4 w-4 mx-2 text-green-600" />
                        <span className="font-medium text-green-700">{swap.alternative}</span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">{swap.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Smart Food Suggestions */}
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center text-indigo-700">
            <TrendingUp className="h-5 w-5 mr-2" />
            Smart Suggestions for Your Meal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Optimization Tips */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <h5 className="font-semibold text-green-700 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Nutritional Boosters
              </h5>
              <ul className="text-sm space-y-1">
                <li className="text-green-600">• Add spinach for iron and folate</li>
                <li className="text-green-600">• Include bell peppers for vitamin C</li>
                <li className="text-green-600">• Sprinkle hemp seeds for omega-3</li>
                <li className="text-green-600">• Add turmeric for anti-inflammatory benefits</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
              <h5 className="font-semibold text-blue-700 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-1" />
                Balance Improvements
              </h5>
              <ul className="text-sm space-y-1">
                <li className="text-blue-600">• Consider adding lean protein</li>
                <li className="text-blue-600">• Reduce white rice, try quinoa</li>
                <li className="text-blue-600">• Add healthy fats like avocado</li>
                <li className="text-blue-600">• Include probiotic foods</li>
              </ul>
            </div>
          </div>
          
          {/* Personalized Recommendations */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
            <h5 className="font-semibold text-purple-700 mb-3 flex items-center">
              <Award className="w-4 h-4 mr-1" />
              Personalized for Your Goals
            </h5>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="text-purple-600">
                <strong>For Energy:</strong> Add complex carbs like sweet potato
              </div>
              <div className="text-purple-600">
                <strong>For Recovery:</strong> Include antioxidant-rich berries
              </div>
              <div className="text-purple-600">
                <strong>For Satiety:</strong> Add fiber-rich vegetables
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        {onSaveMeal && (
          <Button 
            onClick={handleSaveMeal} 
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Save Meal (+10 XP)</span>
              </div>
            )}
          </Button>
        )}
        {onNewAnalysis && (
          <Button onClick={onNewAnalysis} variant="outline" className="flex-1">
            Analyze Another Meal
          </Button>
        )}
      </div>
    </div>
  );
}