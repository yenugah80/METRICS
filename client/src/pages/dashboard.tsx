import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

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
  // Fetch real data from APIs
  const { data: dailyStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/today"],
  });

  const { data: recentMealsData, isLoading: mealsLoading } = useQuery({
    queryKey: ["/api/meals/recent"],
  });

  // Transform API data to match component interface
  const dailyStats: DailyStats = {
    calories: dailyStatsData?.totalCalories || 0,
    protein: parseFloat(dailyStatsData?.totalProtein?.toString() || "0"),
    carbs: parseFloat(dailyStatsData?.totalCarbs?.toString() || "0"),
    fat: parseFloat(dailyStatsData?.totalFat?.toString() || "0"),
    goal_calories: 2000, // Default goals - could be made configurable
    goal_protein: 120,
    goal_carbs: 250,
    goal_fat: 65,
    meals_logged: dailyStatsData?.mealsLogged || 0,
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
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Nutrition Dashboard</h1>
          <p className="text-muted-foreground">Track your daily nutrition goals and discover new foods</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/search">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="flex items-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Search Foods</h3>
                  <p className="text-sm text-muted-foreground">Find nutrition data</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mr-4">
                <ScanLine className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Scan Barcode</h3>
                <p className="text-sm text-muted-foreground">Quick product lookup</p>
              </div>
            </CardContent>
          </Card>

          <Link href="/camera">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="flex items-center p-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mr-4">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Camera</h3>
                  <p className="text-sm text-muted-foreground">Photo meal analysis</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Progress */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Today's Progress</span>
                </CardTitle>
                <CardDescription>Your nutrition goals for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Calories */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Calories</span>
                    <span className="text-sm text-muted-foreground">
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
                      <span className="text-sm font-medium">Protein</span>
                      <span className="text-xs">{dailyStats.protein}g / {dailyStats.goal_protein}g</span>
                    </div>
                    <Progress
                      value={getProgressPercentage(dailyStats.protein, dailyStats.goal_protein)}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Carbs</span>
                      <span className="text-xs">{dailyStats.carbs}g / {dailyStats.goal_carbs}g</span>
                    </div>
                    <Progress
                      value={getProgressPercentage(dailyStats.carbs, dailyStats.goal_carbs)}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Fat</span>
                      <span className="text-xs">{dailyStats.fat}g / {dailyStats.goal_fat}g</span>
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
          </div>

          {/* Recent Meals */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Apple className="h-5 w-5" />
                  <span>Recent Meals</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentMeals.map((meal) => (
                  <div key={meal.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{meal.name}</h4>
                        <p className="text-xs text-muted-foreground">{meal.time}</p>
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
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Live API Demo */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Live Nutrition API Demo</span>
              </CardTitle>
              <CardDescription>
                Test our powerful nutrition database powered by USDA FoodData Central and Open Food Facts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/search">
                  <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                    <Search className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Search Foods</div>
                      <div className="text-xs opacity-75">Try "banana" or "chicken"</div>
                    </div>
                  </Button>
                </Link>

                <Button 
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => {
                    window.location.href = "/search";
                    setTimeout(() => {
                      const barcodeTab = document.querySelector('[data-tab="barcode"]') as HTMLElement;
                      if (barcodeTab) barcodeTab.click();
                    }, 100);
                  }}
                >
                  <ScanLine className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Scan Barcode</div>
                    <div className="text-xs opacity-75">Try Nutella: 3017620422003</div>
                  </div>
                </Button>

                <Button 
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <BarChart3 className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">View Analytics</div>
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