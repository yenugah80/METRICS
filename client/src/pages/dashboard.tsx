import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Apple,
  TrendingUp,
  Target,
  Zap,
  Plus,
  BarChart3,
  Calendar,
  Search,
  ScanLine,
  Mic,
  Camera,
  Sparkles,
  Brain,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Star
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DailyStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goal_calories: number;
  goal_protein: number;
  goal_carbs: number;
  goal_fat: number;
  meals_logged: number;
}

interface RecentMeal {
  id: string;
  name: string;
  time: string;
  calories: number;
  main_nutrients: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function Dashboard() {
  const { toast } = useToast();
  const [demoText, setDemoText] = useState("");
  const [demoBarcode, setDemoBarcode] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Fetch real data from APIs
  const { data: dailyStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/today"],
  });

  const { data: recentMealsData, isLoading: mealsLoading } = useQuery({
    queryKey: ["/api/meals/recent"],
  });
  
  const { data: userProfile } = useQuery({
    queryKey: ["/api/profile"],
  });
  
  const { data: usageStats } = useQuery({
    queryKey: ["/api/usage-stats"],
  });
  
  // Food analysis mutation
  const analyzeFoodMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string, data: string }) => {
      const res = await apiRequest("POST", "/api/analyze-food", { type, data });
      return await res.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.data);
      toast({
        title: "Analysis Complete!",
        description: "Food nutrition analysis completed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze food. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Barcode lookup mutation
  const barcodeMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const res = await apiRequest("GET", `/api/nutrition/barcode/${barcode}`);
      return await res.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Product Found!",
        description: `Successfully found product: ${data.product_name || 'Unknown Product'}`,
      });
    },
    onError: () => {
      toast({
        title: "Product Not Found",
        description: "Try a different barcode or use text analysis.",
        variant: "destructive",
      });
    },
  });

  // Transform API data to match component interface
  const dailyStats: DailyStats = {
    calories: (dailyStatsData as any)?.totalCalories || 0,
    protein: parseFloat((dailyStatsData as any)?.totalProtein?.toString() || "0"),
    carbs: parseFloat((dailyStatsData as any)?.totalCarbs?.toString() || "0"),
    fat: parseFloat((dailyStatsData as any)?.totalFat?.toString() || "0"),
    goal_calories: 2000, // Default goals - could be made configurable
    goal_protein: 120,
    goal_carbs: 250,
    goal_fat: 65,
    meals_logged: (dailyStatsData as any)?.mealCount || 0, // Fixed field name
  };

  const recentMeals: RecentMeal[] = Array.isArray(recentMealsData) ? recentMealsData.map((meal: any) => ({
    id: meal.id,
    name: meal.name,
    time: new Date(meal.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    calories: meal.nutrition?.calories || 0,
    main_nutrients: {
      protein: parseFloat(meal.nutrition?.protein || "0"),
      carbs: parseFloat(meal.nutrition?.carbs || "0"),
      fat: parseFloat(meal.nutrition?.fat || "0"),
    },
  })) : [];

  if (statsLoading || mealsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-primary";
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  return (
    <div className="p-4 bg-background min-h-screen">
      <div className="max-w-md mx-auto">
        {/* Mobile Header */}
        <div className="mb-6">
          <h1 className="text-mobile-2xl font-bold mb-2 text-black">Today's Progress</h1>
          <p className="text-mobile-sm text-gray-600 font-medium">Track your nutrition and discover new foods</p>
        </div>

        {/* Mobile-Optimized Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="mobile-card-compact">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <Link href="/camera">
                <Button className="w-full mobile-btn bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Scan Food
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="mobile-card-compact">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Mic className="h-6 w-6 text-green-600" />
              </div>
              <Link href="/voice">
                <Button className="w-full mobile-btn bg-green-600 hover:bg-green-700 text-white text-sm">
                  Voice Log
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Mobile AI Analysis Card */}
        <Card className="mobile-card-featured mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-mobile-lg font-bold text-black">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>AI Food Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-mobile-sm font-semibold text-black">Describe your meal:</label>
              <Textarea 
                placeholder="e.g., chicken salad with avocado"
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
                className="min-h-[60px] text-mobile-sm"
                data-testid="input-food-description"
              />
            </div>
            <Button 
              onClick={() => analyzeFoodMutation.mutate({ type: 'text', data: demoText })}
              disabled={!demoText.trim() || analyzeFoodMutation.isPending}
              className="w-full mobile-btn btn-gradient"
              data-testid="button-analyze-food"
            >
              {analyzeFoodMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Analyze with AI</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Analysis Results */}
          <div>
            {analysisResult ? (
              <Card className="mobile-card-featured">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-mobile-lg font-bold text-black">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Analysis Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mobile Nutrition Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {analysisResult.nutrition?.calories || analysisResult.total_calories || 0}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Calories</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {Math.round(analysisResult.nutrition?.protein || analysisResult.total_protein || 0)}g
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">Protein</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                        {Math.round(analysisResult.nutrition?.carbs || analysisResult.total_carbs || 0)}g
                      </div>
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">Carbs</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {Math.round(analysisResult.nutrition?.fat || analysisResult.total_fat || 0)}g
                      </div>
                      <div className="text-sm text-orange-600 dark:text-orange-400">Fat</div>
                    </div>
                  </div>
                  
                  {/* Nutrition Score */}
                  {analysisResult.nutrition_score && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-black">Nutrition Score</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant={analysisResult.nutrition_score.grade === 'A' ? 'default' : 'secondary'}>
                            Grade {analysisResult.nutrition_score.grade}
                          </Badge>
                          <div className="text-2xl font-bold text-primary">
                            {analysisResult.nutrition_score.score}/100
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.nutrition_score.explanation}
                      </p>
                    </div>
                  )}
                  
                  {/* Diet Compatibility */}
                  {analysisResult.diet_compatibility && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="font-bold text-black mb-2">Diet Compatibility</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(analysisResult.diet_compatibility).map(([diet, score]: [string, any]) => (
                          <Badge 
                            key={diet} 
                            variant={score > 80 ? "default" : score > 50 ? "secondary" : "destructive"}
                            className="capitalize"
                          >
                            {diet}: {score}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Foods Detected */}
                  {analysisResult.foods && (
                    <div>
                      <div className="font-bold text-black mb-2">Foods Detected:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analysisResult.foods.map((food: any, index: number) => (
                          <div key={index} className="border rounded-lg p-2 text-sm">
                            <div className="font-medium">{food.name}</div>
                            <div className="text-muted-foreground">
                              {food.quantity} {food.unit} • {food.calories || 0} cal
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="mobile-card-featured">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-mobile-lg font-bold text-black">
                    <Target className="h-5 w-5 text-indigo-600" />
                    <span>Daily Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Calories */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-black">Calories</span>
                      <span className="text-sm font-medium">
                        {dailyStats.calories} / {dailyStats.goal_calories}
                      </span>
                    </div>
                    <Progress
                      value={getProgressPercentage(dailyStats.calories, dailyStats.goal_calories)}
                      className="h-3"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {dailyStats.goal_calories - dailyStats.calories} calories remaining
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-black">Protein</span>
                        <span className="text-xs font-medium">{dailyStats.protein}g / {dailyStats.goal_protein}g</span>
                      </div>
                      <Progress
                        value={getProgressPercentage(dailyStats.protein, dailyStats.goal_protein)}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-black">Carbs</span>
                        <span className="text-xs font-medium">{dailyStats.carbs}g / {dailyStats.goal_carbs}g</span>
                      </div>
                      <Progress
                        value={getProgressPercentage(dailyStats.carbs, dailyStats.goal_carbs)}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-black">Fat</span>
                        <span className="text-xs font-medium">{dailyStats.fat}g / {dailyStats.goal_fat}g</span>
                      </div>
                      <Progress
                        value={getProgressPercentage(dailyStats.fat, dailyStats.goal_fat)}
                        className="h-2"
                      />
                    </div>
                  </div>

                  {/* Today's Summary */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Today</span>
                      </div>
                      <Badge variant="secondary">{dailyStats.meals_logged} meals logged</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Meals & Features */}
          <div className="space-y-6">
            <Card className="feature-card-primary border-0 rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 font-bold text-black text-xl">
                  <div className="w-10 h-10 feature-icon-enhanced rounded-xl flex items-center justify-center">
                    <Apple className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Recent Meals</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentMeals.length > 0 ? recentMeals.map((meal) => (
                  <div key={meal.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-black">{meal.name}</h4>
                        <p className="text-xs font-medium">{meal.time}</p>
                      </div>
                      <Badge variant="outline">{meal.calories} cal</Badge>
                    </div>
                    <div className="flex space-x-2 text-xs">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        P: {meal.main_nutrients.protein}g
                      </span>
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                        C: {meal.main_nutrients.carbs}g
                      </span>
                      <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                        F: {meal.main_nutrients.fat}g
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Apple className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No meals logged yet.</p>
                    <p className="text-sm">Try the AI analysis above!</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Premium Features Showcase */}
            <Card className="feature-card-premium border-0 rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 font-bold text-black text-xl">
                  <div className="w-10 h-10 feature-icon-enhanced rounded-xl flex items-center justify-center">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span>Premium Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mic className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-bold text-sm">Voice Logging</div>
                      <div className="text-xs text-muted-foreground">"I had a chicken salad"</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-sm">Sustainability Scores</div>
                      <div className="text-xs text-muted-foreground">CO2 & water impact</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-bold text-sm">Unlimited AI Recipes</div>
                      <div className="text-xs text-muted-foreground">Personalized to your diet</div>
                    </div>
                  </div>
                </div>
                
                {usageStats && typeof usageStats === 'object' && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-center">
                      {(usageStats as any)?.usageStats?.isPremium ? (
                        <span className="text-yellow-600 font-bold">✨ Premium Active</span>
                      ) : (
                        <span>
                          Free: {(usageStats as any)?.usageStats?.remainingFree || 5} recipes left
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <Link href="/recipes">
                  <Button className="w-full btn-gradient" data-testid="button-try-premium">
                    Try Premium Features
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Real Features Navigation */}
        <div className="mt-8">
          <Card className="feature-card-hero border-0 rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center space-x-3 font-bold text-black text-2xl">
                <div className="w-12 h-12 feature-icon-enhanced rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <span>Explore All Features</span>
              </CardTitle>
              <CardDescription className="font-medium text-gray-600 ml-15">
                Access the full power of MyFoodMatrics - comprehensive nutrition tracking and AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/search">
                  <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 btn-gradient">
                    <Search className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-bold">Food Search</div>
                      <div className="text-xs opacity-90">2M+ products</div>
                    </div>
                  </Button>
                </Link>

                <Link href="/camera">
                  <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 btn-gradient">
                    <Camera className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-bold">AI Camera</div>
                      <div className="text-xs opacity-90">Photo analysis</div>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/recipes">
                  <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 btn-gradient">
                    <Sparkles className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-bold">AI Recipes</div>
                      <div className="text-xs opacity-90">Personalized</div>
                    </div>
                  </Button>
                </Link>

                <Button 
                  onClick={() => {
                    toast({
                      title: "Analytics Coming Soon!",
                      description: "Advanced nutrition analytics and trends are being developed.",
                    });
                  }}
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 btn-outline-glow"
                  data-testid="button-analytics"
                >
                  <BarChart3 className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-bold">Analytics</div>
                    <div className="text-xs opacity-75">Coming soon</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}