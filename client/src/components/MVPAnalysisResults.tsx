import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Info, Heart, Shield, Globe, Utensils, ArrowRight, Zap } from "lucide-react";
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
  
  const getSafetyColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600';
      case 'caution': return 'text-yellow-600';
      case 'warning': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200';
      case 'B': return 'text-green-500 bg-green-50 border-green-200';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'F': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Core Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Safety Score */}
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Shield className={`h-8 w-8 ${getSafetyColor(analysis.safety.overall_safety)} mr-2`} />
              <span className="text-lg font-semibold">Safety</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {analysis.safety.food_safety_score}/100
            </div>
            <Badge variant="outline" className={getSafetyColor(analysis.safety.overall_safety)}>
              {analysis.safety.overall_safety.toUpperCase()}
            </Badge>
            {analysis.safety.allergen_alerts.length > 0 && (
              <div className="mt-3 text-sm text-red-600 font-medium">
                🚨 {analysis.safety.allergen_alerts.length} allergen alert(s)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Score */}
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Heart className="h-8 w-8 text-green-600 mr-2" />
              <span className="text-lg font-semibold">Health</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {analysis.health.nutrition_score}/100
            </div>
            <Badge variant="outline" className={getGradeColor(analysis.health.health_grade)}>
              Grade {analysis.health.health_grade}
            </Badge>
            <div className="mt-3 text-sm text-gray-600">
              {analysis.health.calories} calories
            </div>
          </CardContent>
        </Card>

        {/* Sustainability Score */}
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Globe className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-lg font-semibold">Planet</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {analysis.sustainability.eco_score}/100
            </div>
            <Badge variant="outline" className={getGradeColor(analysis.sustainability.eco_grade)}>
              Grade {analysis.sustainability.eco_grade}
            </Badge>
            <div className="mt-3 text-sm">
              <span className={getImpactColor(analysis.sustainability.carbon_footprint)}>
                Carbon: {analysis.sustainability.carbon_footprint}
              </span>
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
              {/* Macronutrients */}
              <div>
                <h4 className="font-semibold mb-3">Macronutrients</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold">{analysis.health.macronutrients.protein}g</div>
                    <div className="text-sm text-gray-600">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold">{analysis.health.macronutrients.carbs}g</div>
                    <div className="text-sm text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-xl font-bold">{analysis.health.macronutrients.fat}g</div>
                    <div className="text-sm text-gray-600">Fat</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-xl font-bold">{analysis.health.macronutrients.fiber}g</div>
                    <div className="text-sm text-gray-600">Fiber</div>
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