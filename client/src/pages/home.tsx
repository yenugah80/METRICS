import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import NutritionCard from "@/components/NutritionCard";
import MealCard from "@/components/MealCard";
import ScoreBadge from "@/components/ScoreBadge";
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
  Settings
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

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Apple className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2">
            {user?.isPremium && (
              <Badge variant="secondary" className="hidden sm:flex bg-premium-100 text-premium-foreground border-premium/30">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="w-8 h-8 bg-muted/20 rounded-full"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-profile"
            >
              <User className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gradient-to-r from-slate-50/80 via-blue-50/80 to-indigo-50/80 backdrop-blur-xl border-b border-white/30 sticky top-16 z-40 shadow-sm">
        <div className="flex items-center justify-center">
          <Tabs defaultValue="today" className="m-3">
            <TabsList className="bg-white/40 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/20">
              <TabsTrigger value="today" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg shadow-md data-[state=active]:shadow-lg" data-testid="tab-today">
                Today
              </TabsTrigger>
              <TabsTrigger value="history" className="text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-lg transition-all" data-testid="tab-history">
                History
              </TabsTrigger>
              <TabsTrigger value="premium" className="text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all relative" data-testid="tab-premium">
                Premium
                <Crown className="w-3 h-3 ml-1 text-amber-500" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4">
        {/* Daily Progress */}
        <Card className="card-shadow border-0 rounded-2xl mb-6" data-testid="card-daily-progress">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Today's Progress</h2>
              <div className="flex items-center space-x-2">
                <ScoreBadge grade={nutritionGrade} />
                <span className="text-2xl font-bold text-foreground" data-testid="text-nutrition-score">
                  {nutritionScore}
                </span>
              </div>
            </div>
            
            <NutritionCard 
              calories={dailyCalories}
              protein={dailyProtein}
              carbs={dailyCarbs}
              fat={dailyFat}
              targets={{
                calories: 2000,
                protein: 150,
                carbs: 300,
                fat: 80
              }}
            />

            {/* Micronutrients Preview */}
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Key Micronutrients</h3>
                <Button variant="ghost" size="sm" className="text-xs text-secondary hover:text-secondary/80">
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-sm">Iron 94%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <span className="text-sm">Vit C 67%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-sm">Mg 89%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-danger"></div>
                  <span className="text-sm">B12 34%</span>
                  {!user?.isPremium && <Crown className="w-3 h-3 text-premium" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Log Actions */}
        <Card className="card-shadow border-0 rounded-2xl mb-6" data-testid="card-log-actions">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Log Your Meal</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Photo Upload */}
              <Button 
                variant="outline"
                className="h-auto p-6 border-2 border-dashed camera-preview hover:border-primary"
                onClick={() => window.location.href = '/log?mode=photo'}
                data-testid="button-photo-log"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Snap & Analyze</h3>
                  <p className="text-sm text-muted-foreground">Take a photo of your meal</p>
                </div>
              </Button>

              {/* Barcode Scanner */}
              <Button 
                variant="outline"
                className="h-auto p-6 border-2 border-dashed hover:border-accent"
                onClick={() => window.location.href = '/log?mode=barcode'}
                data-testid="button-barcode-scan"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ScanLine className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Scan Barcode</h3>
                  <p className="text-sm text-muted-foreground">Quick product lookup</p>
                </div>
              </Button>

              {/* Voice Input */}
              <Button 
                variant="outline"
                className="h-auto p-6 border-2 border-dashed hover:border-secondary relative"
                onClick={() => user?.isPremium ? window.location.href = '/log?mode=voice' : window.location.href = '/subscribe'}
                data-testid="button-voice-log"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mic className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Voice Log</h3>
                  <p className="text-sm text-muted-foreground">Speak your meal</p>
                </div>
                {!user?.isPremium && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-premium rounded-full flex items-center justify-center">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
              </Button>
            </div>

            {/* Manual Entry */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Or type food name (e.g., Greek yogurt with berries)" 
                  className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  data-testid="input-manual-food"
                />
                <Button 
                  className="btn-gradient px-6 py-3 rounded-xl font-medium"
                  onClick={() => window.location.href = '/log?mode=manual'}
                  data-testid="button-search-food"
                >
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Meals */}
        <Card className="card-shadow border-0 rounded-2xl mb-6" data-testid="card-todays-meals">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Today's Meals</h2>
              <Button variant="ghost" size="sm" className="text-sm text-secondary hover:text-secondary/80">
                Edit
              </Button>
            </div>

            <div className="space-y-4">
              {(todayMeals as any[]).length > 0 ? (
                (todayMeals as any[]).map((meal: any) => (
                  <MealCard key={meal.id} meal={meal} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No meals logged today. Start by taking a photo of your meal!</p>
                </div>
              )}

              {/* Add meal prompt */}
              <Button 
                variant="outline"
                className="w-full p-4 border-2 border-dashed border-border hover:border-primary"
                onClick={() => window.location.href = '/log'}
                data-testid="button-add-meal"
              >
                <div className="flex items-center justify-center space-x-2 text-muted-foreground group-hover:text-primary">
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Add dinner or another meal</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Smart Insights */}
        <Card className="card-shadow border-0 rounded-2xl mb-6" data-testid="card-smart-insights">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Smart Insights</h2>
              <Sparkles className="w-5 h-5 text-premium" />
            </div>

            <div className="space-y-4">
              {/* Diet Compatibility */}
              <div className="p-4 bg-gradient-to-r from-success/10 to-success/5 rounded-xl border border-success/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Leaf className="w-4 h-4 text-success" />
                  <h3 className="font-semibold text-foreground">Diet Compatibility</h3>
                  <Badge variant="secondary" className="bg-success text-white">98%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your meals today are perfectly aligned with your Mediterranean diet. Great job!
                </p>
              </div>

              {/* Allergen Safety */}
              <div className="p-4 bg-gradient-to-r from-success/10 to-success/5 rounded-xl border border-success/20">
                <div className="flex items-center space-x-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <h3 className="font-semibold text-foreground">Allergen Safety</h3>
                  <Badge variant="secondary" className="bg-success text-white">Safe</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  No detected allergens based on your profile (nuts, dairy allergies).
                </p>
              </div>

              {/* Premium Feature Preview */}
              {!user?.isPremium && (
                <div className="p-4 bg-gradient-to-r from-premium/10 to-premium/5 rounded-xl border border-premium/30 relative">
                  <div className="flex items-center space-x-2 mb-2">
                    <Leaf className="w-4 h-4 text-premium" />
                    <h3 className="font-semibold text-foreground">Sustainability Score</h3>
                    <Badge variant="secondary" className="bg-premium text-white">7.2/10</Badge>
                    <Crown className="w-3 h-3 text-premium" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your food choices have a moderate environmental impact. Consider more plant-based options.
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs font-medium text-premium hover:text-premium/80"
                    onClick={() => window.location.href = '/subscribe'}
                    data-testid="button-unlock-premium"
                  >
                    Unlock with Premium →
                  </Button>
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl"></div>
                </div>
              )}

              {/* Nutrition Recommendation */}
              <div className="p-4 bg-gradient-to-r from-warning/10 to-warning/5 rounded-xl border border-warning/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-warning" />
                  <h3 className="font-semibold text-foreground">Micronutrient Gap</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  You're low on Vitamin B12 today. Consider adding fortified foods or supplements.
                </p>
                <Button variant="ghost" size="sm" className="text-xs font-medium text-secondary hover:text-secondary/80">
                  View Recommendations →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Upsell */}
        {!user?.isPremium && (
          <Card className="bg-gradient-to-br from-secondary via-secondary to-primary card-shadow border-0 rounded-2xl text-white mb-6" data-testid="card-premium-upsell">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Crown className="w-6 h-6 text-premium" />
                <h2 className="text-xl font-bold">Unlock Premium Features</h2>
              </div>
              
              <p className="text-white/90 mb-4">
                Get advanced nutrition insights, unlimited recipes, and personalized coaching.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Mic className="w-4 h-4 text-premium" />
                  <span className="text-sm">Voice Logging</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Leaf className="w-4 h-4 text-premium" />
                  <span className="text-sm">Sustainability Scores</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChefHat className="w-4 h-4 text-premium" />
                  <span className="text-sm">Unlimited Recipes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-premium" />
                  <span className="text-sm">Wellness Tracking</span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  className="flex-1 bg-white text-secondary font-bold py-3 rounded-xl hover:bg-white/95"
                  onClick={() => window.location.href = '/subscribe'}
                  data-testid="button-start-premium-trial"
                >
                  Start Free Trial
                </Button>
                <Button 
                  variant="outline" 
                  className="px-6 py-3 border-white/30 rounded-xl font-medium hover:bg-white/10"
                >
                  $6.99/mo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recipe Recommendations */}
        <Card className="card-shadow border-0 rounded-2xl" data-testid="card-recipe-recommendations">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Recipe Suggestions</h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">3 of 5 daily</span>
                <Button variant="ghost" size="sm" className="text-sm text-secondary hover:text-secondary/80">
                  View All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(recipes as any[]).slice(0, 2).map((recipe: any) => (
                <Card key={recipe.id} className="border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {recipe.imageUrl && (
                    <img 
                      src={recipe.imageUrl} 
                      alt={recipe.title}
                      className="w-full h-32 object-cover" 
                    />
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-foreground">{recipe.title}</h3>
                      <ScoreBadge grade={recipe.nutritionGrade || 'C'} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{recipe.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{recipe.prepTime + recipe.cookTime} min</span>
                      <span>{recipe.estimatedCalories} cal</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-border" data-testid="nav-bottom">
        <div className="flex items-center justify-around py-2">
          <Button variant="ghost" className="flex flex-col items-center p-2 text-primary" data-testid="nav-home">
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground"
            onClick={() => window.location.href = '/log'}
            data-testid="nav-log"
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs mt-1">Log</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground" data-testid="nav-stats">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs mt-1">Stats</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground" data-testid="nav-recipes">
            <ChefHat className="w-5 h-5" />
            <span className="text-xs mt-1">Recipes</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground" data-testid="nav-settings">
            <Settings className="w-5 h-5" />
            <span className="text-xs mt-1">Settings</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
