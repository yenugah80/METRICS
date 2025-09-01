import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useLocalAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Apple, 
  User, 
  Crown, 
  Camera, 
  ScanLine, 
  Mic, 
  Plus,
  Sparkles,
  Leaf,
  ShieldCheck,
  Target,
  ChefHat,
  Home,
  BarChart3,
  Settings,
  Zap,
  Trophy,
  Fire
} from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: todayStats } = useQuery({
    queryKey: ["/api/stats/today"],
    enabled: isAuthenticated,
  });

  const { data: todayMeals = [] } = useQuery({
    queryKey: ["/api/meals/today"],
    enabled: isAuthenticated,
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["/api/recipes"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const dailyCalories = (todayStats as any)?.totalCalories || 0;
  const dailyProtein = parseFloat((todayStats as any)?.totalProtein || "0");
  const dailyCarbs = parseFloat((todayStats as any)?.totalCarbs || "0");
  const dailyFat = parseFloat((todayStats as any)?.totalFat || "0");
  const nutritionScore = (todayStats as any)?.averageNutritionScore || 0;
  const nutritionGrade = (todayStats as any)?.averageNutritionGrade || "C";

  // Calculate progress percentages using user's actual goals
  const calorieGoal = user?.dailyCalorieGoal || 2000;
  const proteinGoal = user?.dailyProteinGoal || 150;
  const carbGoal = user?.dailyCarbGoal || 200;
  const fatGoal = user?.dailyFatGoal || 67;

  const calorieProgress = Math.min((dailyCalories / calorieGoal) * 100, 100);
  const proteinProgress = Math.min((dailyProtein / proteinGoal) * 100, 100);
  const carbProgress = Math.min((dailyCarbs / carbGoal) * 100, 100);
  const fatProgress = Math.min((dailyFat / fatGoal) * 100, 100);

  // Generate coaching insights based on real data
  const getCoachingInsight = () => {
    if (dailyCalories === 0) {
      return "👩‍🍳 No meals logged yet — snap a photo and I'll analyze it in 5 seconds!";
    }
    
    if (dailyProtein < proteinGoal * 0.5) {
      return `Protein boost needed! Add ${Math.round(proteinGoal - dailyProtein)}g more protein today. Try Greek yogurt for easy gains.`;
    }
    
    if (calorieProgress > 80) {
      return `Excellent! You're ${Math.round(calorieProgress)}% to your calorie goal. Your nutrition looks balanced today.`;
    }
    
    if (calorieProgress < 40) {
      return `You have ${Math.round(calorieGoal - dailyCalories)} calories left. Perfect time for a nutritious meal!`;
    }
    
    return `Great progress! You're ${Math.round(calorieProgress)}% to your goal. Keep the momentum going.`;
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Apple className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">MyFoodMatrics</h1>
          </div>
          <div className="flex items-center space-x-2">
            {user?.isPremium && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="w-8 h-8 rounded-full"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-profile"
            >
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* 1. HERO: Coaching Summary Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg mb-1">Your AI Nutrition Coach</h2>
              <p className="text-white/90 leading-relaxed">
                {getCoachingInsight()}
              </p>
            </div>
            {dailyCalories > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold">{nutritionGrade}</div>
                <div className="text-sm opacity-80">Today's Grade</div>
              </div>
            )}
          </div>
        </div>

        {/* 2. HERO: Apple Fitness-Style Progress Rings */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Daily Progress</h2>
              <p className="text-gray-600">Track your nutrition goals with precision</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Calories Ring */}
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="#fee2e2"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - calorieProgress / 100)}`}
                      className="transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-red-600">{Math.round(dailyCalories)}</span>
                    <span className="text-xs text-gray-500">kcal</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">Calories</p>
                <p className="text-xs text-gray-500">{Math.round(calorieProgress)}% of {calorieGoal}</p>
              </div>
              
              {/* Protein Ring */}
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="#dbeafe"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - proteinProgress / 100)}`}
                      className="transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">{Math.round(dailyProtein)}</span>
                    <span className="text-xs text-gray-500">g</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">Protein</p>
                <p className="text-xs text-gray-500">{Math.round(proteinProgress)}% of {proteinGoal}g</p>
              </div>
              
              {/* Carbs Ring */}
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="#f3e8ff"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="#8b5cf6"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - carbProgress / 100)}`}
                      className="transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-purple-600">{Math.round(dailyCarbs)}</span>
                    <span className="text-xs text-gray-500">g</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">Carbs</p>
                <p className="text-xs text-gray-500">{Math.round(carbProgress)}% of {carbGoal}g</p>
              </div>
              
              {/* Fat Ring */}
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="#fed7aa"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="#f97316"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - fatProgress / 100)}`}
                      className="transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-orange-600">{Math.round(dailyFat)}</span>
                    <span className="text-xs text-gray-500">g</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">Fat</p>
                <p className="text-xs text-gray-500">{Math.round(fatProgress)}% of {fatGoal}g</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. AI GUIDANCE: Smart Recommendations */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Smart AI Coach
              </h2>
              <Button variant="outline" size="sm" className="text-xs hover:bg-indigo-50" data-testid="button-refresh-recommendations">
                New Tips
              </Button>
            </div>
            
            <div className="space-y-3">
              {/* Protein Recommendation */}
              {dailyProtein < proteinGoal * 0.7 && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">Protein Boost Needed</p>
                    <p className="text-sm text-blue-700">Add {Math.round(proteinGoal - dailyProtein)}g more protein today. Try Greek yogurt (150g) for +18g protein.</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                    +18g
                  </Badge>
                </div>
              )}
              
              {/* Calorie Balance Recommendation */}
              {dailyCalories < calorieGoal * 0.6 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Ready for Your Next Meal</p>
                    <p className="text-sm text-green-700">You have {Math.round(calorieGoal - dailyCalories)} calories left. Perfect time for a balanced lunch!</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    +{Math.round(calorieGoal - dailyCalories)}
                  </Badge>
                </div>
              )}
              
              {/* Empty State Recommendation */}
              {(todayMeals?.length || 0) === 0 && (
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Camera className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-indigo-900">Start Your Journey</p>
                    <p className="text-sm text-indigo-700">Snap a photo of your meal and I'll analyze nutrition, safety, and environmental impact instantly!</p>
                  </div>
                  <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white" onClick={() => window.location.href = '/meal-camera'}>
                    <Plus className="w-4 h-4 mr-1" /> Log Meal
                  </Button>
                </div>
              )}
              
              {/* Achievement Motivation */}
              {dailyCalories > 0 && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900">Earn +50 XP</p>
                    <p className="text-sm text-yellow-700">Log one more meal today to complete your daily streak and earn bonus XP!</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                    +50 XP
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. MOTIVATION: Gamification & Achievements */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Achievements & Progress
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* XP Progress */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-gray-900">Level {user?.level || 1}</span>
                  </div>
                  <span className="text-sm text-gray-600">{user?.xp || 0} XP</span>
                </div>
                <Progress value={((user?.xp || 0) % 1000) / 10} className="h-2 mb-2" />
                <p className="text-xs text-gray-600">{1000 - ((user?.xp || 0) % 1000)} XP to next level</p>
              </div>
              
              {/* Streak Counter */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Fire className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-gray-900">Daily Streak</span>
                  </div>
                  <span className="text-sm text-gray-600">{user?.currentStreak || 0} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-600">{user?.currentStreak || 0}</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Best: {user?.longestStreak || 0} days</p>
                    <p className="text-xs text-red-600">Keep it going!</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. HISTORY: Recent Meals */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Today's Meals</h2>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 hover:bg-gray-50"
                onClick={() => window.location.href = '/meal-camera'}
                data-testid="button-add-meal"
              >
                <Plus className="w-4 h-4" />
                Add Meal
              </Button>
            </div>
            
            <div className="space-y-3">
              {(todayMeals as any[]).length > 0 ? (
                (todayMeals as any[]).map((meal: any) => (
                  <div key={meal.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 capitalize">{meal.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{meal.mealType} • {new Date(meal.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            {Math.round(meal.nutrition?.total_calories || 0)} cal
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            {Math.round(meal.nutrition?.total_protein || 0)}g protein
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            {Math.round(meal.nutrition?.total_carbs || 0)}g carbs
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${\n                          (meal.nutrition?.nutrition_score || 0) >= 80 ? 'bg-green-100 text-green-700' :\n                          (meal.nutrition?.nutrition_score || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' :\n                          'bg-red-100 text-red-700'\n                        }`}>\n                          {Math.round(meal.nutrition?.nutrition_score || 0)} health\n                        </div>\n                      </div>\n                    </div>\n                  </div>\n                ))\n              ) : (\n                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">\n                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />\n                  <h3 className="font-semibold text-gray-900 mb-2">No meals logged today</h3>\n                  <p className="text-sm text-gray-600 mb-4">👩‍🍳 Start your nutrition journey — snap a photo and I'll analyze it instantly!</p>\n                  <Button \n                    className="bg-indigo-500 hover:bg-indigo-600 text-white"\n                    onClick={() => window.location.href = '/meal-camera'}\n                    data-testid="button-start-logging"\n                  >\n                    <Camera className="w-4 h-4 mr-2" />\n                    Log Your First Meal\n                  </Button>\n                </div>\n              )}\n            </div>\n          </CardContent>\n        </Card>\n\n        {/* Quick Action Bar */}\n        <div className="grid grid-cols-3 gap-4">\n          <Button \n            className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 h-auto rounded-xl shadow-lg"\n            onClick={() => window.location.href = '/meal-camera'}\n            data-testid="button-camera"\n          >\n            <div className="text-center">\n              <Camera className="w-6 h-6 mx-auto mb-2" />\n              <span className="text-sm font-medium">Camera</span>\n            </div>\n          </Button>\n          \n          <Button \n            variant="outline"\n            className="border-2 border-gray-200 hover:bg-gray-50 p-4 h-auto rounded-xl shadow-lg"\n            data-testid="button-voice"\n          >\n            <div className="text-center">\n              <Mic className="w-6 h-6 mx-auto mb-2 text-gray-600" />\n              <span className="text-sm font-medium text-gray-700">Voice</span>\n            </div>\n          </Button>\n          
          <Button \n            variant="outline"\n            className="border-2 border-gray-200 hover:bg-gray-50 p-4 h-auto rounded-xl shadow-lg"\n            onClick={() => window.location.href = '/profile'}\n            data-testid="button-goals"\n          >\n            <div className="text-center">\n              <Target className="w-6 h-6 mx-auto mb-2 text-gray-600" />\n              <span className="text-sm font-medium text-gray-700">Goals</span>\n            </div>\n          </Button>\n        </div>\n      </main>\n    </div>\n  );\n}