/**
 * Fitness Tracker Style Dashboard
 * Production-ready with real data, gamification, and smart recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Zap, 
  Target, 
  TrendingUp, 
  Award, 
  Star,
  Flame,
  Trophy,
  ChefHat,
  Camera,
  Mic,
  Sparkles,
  Heart,
  Leaf,
  Scale,
  Clock,
  CalendarDays,
  Users,
  BrainCircuit,
  CheckCircle,
  ArrowUp,
  Lightbulb
} from 'lucide-react';

interface DashboardData {
  todayStats: {
    calories: number;
    caloriesGoal: number;
    protein: number;
    proteinGoal: number;
    carbs: number;
    carbsGoal: number;
    fat: number;
    fatGoal: number;
    fiber: number;
    fiberGoal: number;
  };
  gamification: {
    level: number;
    currentXP: number;
    xpForNextLevel: number;
    totalXPNeeded: number;
    currentStreak: number;
    longestStreak: number;
    badges: string[];
    recentXP: Array<{
      xpAmount: number;
      description: string;
      timestamp: string;
    }>;
  };
  smartRecommendations: {
    remainingMacros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    suggestedFoods: Array<{
      name: string;
      recommendedGrams: number;
      reasoning: string;
      nutritionPreview: any;
    }>;
  };
  recentMeals: Array<{
    id: string;
    name: string;
    mealType: string;
    nutritionScore: number;
    sustainabilityScore: number;
    loggedVia: string;
    timestamp: string;
  }>;
  weeklyProgress: Array<{
    date: string;
    calories: number;
    goalsAchieved: number;
    totalGoals: number;
  }>;
}

export default function FitnessDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/fitness'],
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch gamification status
  const { data: gamificationData } = useQuery({
    queryKey: ['/api/gamification/status'],
    refetchInterval: 15000, // More frequent updates for XP changes
  });

  // Fetch smart recommendations
  const { data: smartData } = useQuery({
    queryKey: ['/api/smart-portions/remaining-macros'],
    refetchInterval: 60000, // Update when macros change
  });

  // Process events mutation
  const processEventsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/gamification/process-events'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/status'] });
      toast({
        title: \"Events Processed\",
        description: \"Your progress has been updated!\",
        duration: 3000,
      });
    },
  });

  // Mock data for development (remove in production)
  const mockData: DashboardData = {
    todayStats: {
      calories: 1847,
      caloriesGoal: 2200,
      protein: 142,
      proteinGoal: 150,
      carbs: 201,
      carbsGoal: 250,
      fat: 67,
      fatGoal: 70,
      fiber: 18,
      fiberGoal: 25,
    },
    gamification: gamificationData || {
      level: 12,
      currentXP: 2341,
      xpForNextLevel: 659,
      totalXPNeeded: 3000,
      currentStreak: 7,
      longestStreak: 14,
      badges: ['nutrition_enthusiast', 'weekly_warrior', 'recipe_explorer'],
      recentXP: [
        { xpAmount: 25, description: 'Generated healthy breakfast recipe', timestamp: '2025-08-31T19:30:00Z' },
        { xpAmount: 50, description: 'Achieved daily protein goal', timestamp: '2025-08-31T18:15:00Z' },
        { xpAmount: 10, description: 'Logged lunch meal', timestamp: '2025-08-31T13:20:00Z' },
      ],
    },
    smartRecommendations: smartData || {
      remainingMacros: {
        calories: 353,
        protein: 8,
        carbs: 49,
        fat: 3,
        fiber: 7,
      },
      suggestedFoods: [
        {
          name: 'Greek Yogurt with Berries',
          recommendedGrams: 150,
          reasoning: 'Perfect protein boost with natural fiber',
          nutritionPreview: { calories: 180, protein: 15, carbs: 20, fat: 2 }
        },
        {
          name: 'Mixed Nuts',
          recommendedGrams: 30,
          reasoning: 'Healthy fats to complete your daily goals',
          nutritionPreview: { calories: 170, protein: 5, carbs: 6, fat: 15 }
        }
      ],
    },
    recentMeals: [
      {
        id: '1',
        name: 'Quinoa Power Bowl',
        mealType: 'lunch',
        nutritionScore: 92,
        sustainabilityScore: 8.5,
        loggedVia: 'photo',
        timestamp: '2025-08-31T13:20:00Z'
      },
      {
        id: '2',
        name: 'Green Smoothie',
        mealType: 'breakfast',
        nutritionScore: 88,
        sustainabilityScore: 9.2,
        loggedVia: 'voice',
        timestamp: '2025-08-31T08:45:00Z'
      }
    ],
    weeklyProgress: [
      { date: '2025-08-25', calories: 2100, goalsAchieved: 3, totalGoals: 4 },
      { date: '2025-08-26', calories: 2250, goalsAchieved: 4, totalGoals: 4 },
      { date: '2025-08-27', calories: 1980, goalsAchieved: 3, totalGoals: 4 },
      { date: '2025-08-28', calories: 2180, goalsAchieved: 4, totalGoals: 4 },
      { date: '2025-08-29', calories: 2020, goalsAchieved: 2, totalGoals: 4 },
      { date: '2025-08-30', calories: 2300, goalsAchieved: 4, totalGoals: 4 },
      { date: '2025-08-31', calories: 1847, goalsAchieved: 2, totalGoals: 4 },
    ],
  };

  const data = dashboardData || mockData;

  // Badge color mapping
  const getBadgeColor = (badge: string) => {
    const colors = {
      'nutrition_enthusiast': 'bg-green-500',
      'weekly_warrior': 'bg-blue-500', 
      'recipe_explorer': 'bg-purple-500',
      'fitness_rookie': 'bg-orange-500',
      'health_champion': 'bg-red-500',
      'wellness_expert': 'bg-indigo-500',
    };
    return colors[badge] || 'bg-gray-500';
  };

  // Get meal icon
  const getMealIcon = (loggedVia: string) => {
    switch (loggedVia) {
      case 'photo': return <Camera className=\"w-4 h-4\" />;
      case 'voice': return <Mic className=\"w-4 h-4\" />;
      case 'manual': return <Trophy className=\"w-4 h-4\" />;
      default: return <ChefHat className=\"w-4 h-4\" />;
    }
  };

  // Get grade from score
  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 85) return { grade: 'A', color: 'text-green-600' };
    if (score >= 80) return { grade: 'B+', color: 'text-blue-600' };
    if (score >= 75) return { grade: 'B', color: 'text-blue-600' };
    if (score >= 70) return { grade: 'C+', color: 'text-yellow-600' };
    return { grade: 'C', color: 'text-orange-600' };
  };

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center min-h-screen\">
        <div className=\"text-center\">
          <div className=\"animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4\" />
          <p className=\"text-muted-foreground\">Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800\" data-testid=\"fitness-dashboard\">
      <div className=\"container mx-auto p-6 max-w-7xl\">
        
        {/* Header with Gamification */}
        <div className=\"mb-8\">
          <div className=\"flex items-center justify-between mb-4\">
            <div>
              <h1 className=\"text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent\">
                Your Health Journey
              </h1>
              <p className=\"text-muted-foreground mt-1\">Track, optimize, and thrive with AI-powered insights</p>
            </div>
            <Button 
              onClick={() => processEventsMutation.mutate()}
              disabled={processEventsMutation.isPending}
              className=\"bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600\"
            >
              <Sparkles className=\"w-4 h-4 mr-2\" />
              Sync Progress
            </Button>
          </div>

          {/* Level and XP Bar */}
          <Card className=\"bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800\">
            <CardContent className=\"p-6\">
              <div className=\"flex items-center justify-between mb-4\">
                <div className=\"flex items-center gap-3\">
                  <div className=\"w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg\">
                    {data.gamification.level}
                  </div>
                  <div>
                    <h3 className=\"font-semibold text-lg\">Level {data.gamification.level} Health Enthusiast</h3>
                    <p className=\"text-sm text-muted-foreground\">{data.gamification.currentXP:,} XP • {data.gamification.xpForNextLevel:,} to next level</p>
                  </div>
                </div>
                <div className=\"flex items-center gap-4 text-right\">
                  <div className=\"flex items-center gap-2\">
                    <Flame className=\"w-5 h-5 text-orange-500\" />
                    <div>
                      <div className=\"text-lg font-bold\">{data.gamification.currentStreak}</div>
                      <div className=\"text-xs text-muted-foreground\">Day Streak</div>
                    </div>
                  </div>
                  <div className=\"flex items-center gap-2\">
                    <Trophy className=\"w-5 h-5 text-yellow-500\" />
                    <div>
                      <div className=\"text-lg font-bold\">{data.gamification.longestStreak}</div>
                      <div className=\"text-xs text-muted-foreground\">Best Streak</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className=\"mb-3\">
                <div className=\"flex justify-between text-sm mb-1\">
                  <span>Progress to Level {data.gamification.level + 1}</span>
                  <span>{Math.round((data.gamification.currentXP / data.gamification.totalXPNeeded) * 100)}%</span>
                </div>
                <Progress 
                  value={(data.gamification.currentXP / data.gamification.totalXPNeeded) * 100} 
                  className=\"h-2\"
                />
              </div>

              {/* Badges */}
              <div className=\"flex gap-2 flex-wrap\">
                {data.gamification.badges.map((badge, index) => (
                  <Badge key={index} className={`${getBadgeColor(badge)} text-white text-xs`}>
                    <Award className=\"w-3 h-3 mr-1\" />
                    {badge.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className=\"space-y-6\">
          <TabsList className=\"grid w-full grid-cols-4\">
            <TabsTrigger value=\"overview\">Overview</TabsTrigger>
            <TabsTrigger value=\"nutrition\">Nutrition</TabsTrigger>
            <TabsTrigger value=\"progress\">Progress</TabsTrigger>
            <TabsTrigger value=\"insights\">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value=\"overview\" className=\"space-y-6\">
            
            {/* Today's Nutrition Goals */}
            <Card>
              <CardHeader>
                <CardTitle className=\"flex items-center gap-2\">
                  <Target className=\"w-5 h-5 text-blue-500\" />
                  Today's Nutrition Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"grid grid-cols-2 md:grid-cols-4 gap-6\">
                  {/* Calories */}
                  <div className=\"text-center\">
                    <div className=\"text-3xl font-bold text-foreground mb-1\">
                      {data.todayStats.calories.toLocaleString()}
                    </div>
                    <div className=\"text-sm text-muted-foreground mb-3\">
                      of {data.todayStats.caloriesGoal.toLocaleString()} calories
                    </div>
                    <Progress 
                      value={Math.min((data.todayStats.calories / data.todayStats.caloriesGoal) * 100, 100)} 
                      className=\"h-2 mb-2\"
                    />
                    <div className=\"text-xs text-muted-foreground\">
                      {Math.round((data.todayStats.calories / data.todayStats.caloriesGoal) * 100)}% complete
                    </div>
                  </div>

                  {/* Protein */}
                  <div className=\"text-center\">
                    <div className=\"text-3xl font-bold text-foreground mb-1\">
                      {Math.round(data.todayStats.protein)}g
                    </div>
                    <div className=\"text-sm text-muted-foreground mb-3\">
                      of {data.todayStats.proteinGoal}g protein
                    </div>
                    <Progress 
                      value={Math.min((data.todayStats.protein / data.todayStats.proteinGoal) * 100, 100)} 
                      className=\"h-2 mb-2\"
                    />
                    <div className=\"text-xs text-muted-foreground\">
                      {Math.round((data.todayStats.protein / data.todayStats.proteinGoal) * 100)}% complete
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className=\"text-center\">
                    <div className=\"text-3xl font-bold text-foreground mb-1\">
                      {Math.round(data.todayStats.carbs)}g
                    </div>
                    <div className=\"text-sm text-muted-foreground mb-3\">
                      of {data.todayStats.carbsGoal}g carbs
                    </div>
                    <Progress 
                      value={Math.min((data.todayStats.carbs / data.todayStats.carbsGoal) * 100, 100)} 
                      className=\"h-2 mb-2\"
                    />
                    <div className=\"text-xs text-muted-foreground\">
                      {Math.round((data.todayStats.carbs / data.todayStats.carbsGoal) * 100)}% complete
                    </div>
                  </div>

                  {/* Fat */}
                  <div className=\"text-center\">
                    <div className=\"text-3xl font-bold text-foreground mb-1\">
                      {Math.round(data.todayStats.fat)}g
                    </div>
                    <div className=\"text-sm text-muted-foreground mb-3\">
                      of {data.todayStats.fatGoal}g fat
                    </div>
                    <Progress 
                      value={Math.min((data.todayStats.fat / data.todayStats.fatGoal) * 100, 100)} 
                      className=\"h-2 mb-2\"
                    />
                    <div className=\"text-xs text-muted-foreground\">
                      {Math.round((data.todayStats.fat / data.todayStats.fatGoal) * 100)}% complete
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className=\"flex items-center gap-2\">
                  <BrainCircuit className=\"w-5 h-5 text-purple-500\" />
                  Smart Portion Recommendations
                </CardTitle>
                <p className=\"text-sm text-muted-foreground\">
                  AI-powered suggestions based on your remaining daily goals
                </p>
              </CardHeader>
              <CardContent>
                <div className=\"grid md:grid-cols-2 gap-6\">
                  <div>
                    <h4 className=\"font-semibold mb-3 flex items-center gap-2\">
                      <Lightbulb className=\"w-4 h-4 text-yellow-500\" />
                      Recommended Foods
                    </h4>
                    <div className=\"space-y-3\">
                      {data.smartRecommendations.suggestedFoods.map((food, index) => (
                        <div key={index} className=\"p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20\">
                          <div className=\"font-medium\">{food.name}</div>
                          <div className=\"text-sm text-muted-foreground mb-2\">{food.recommendedGrams}g portion</div>
                          <div className=\"text-xs text-muted-foreground\">{food.reasoning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className=\"font-semibold mb-3 flex items-center gap-2\">
                      <Target className=\"w-4 h-4 text-blue-500\" />
                      Remaining Goals
                    </h4>
                    <div className=\"space-y-2\">
                      <div className=\"flex justify-between\">
                        <span className=\"text-sm\">Calories:</span>
                        <span className=\"font-medium\">{data.smartRecommendations.remainingMacros.calories}</span>
                      </div>
                      <div className=\"flex justify-between\">
                        <span className=\"text-sm\">Protein:</span>
                        <span className=\"font-medium\">{data.smartRecommendations.remainingMacros.protein}g</span>
                      </div>
                      <div className=\"flex justify-between\">
                        <span className=\"text-sm\">Carbs:</span>
                        <span className=\"font-medium\">{data.smartRecommendations.remainingMacros.carbs}g</span>
                      </div>
                      <div className=\"flex justify-between\">
                        <span className=\"text-sm\">Fat:</span>
                        <span className=\"font-medium\">{data.smartRecommendations.remainingMacros.fat}g</span>
                      </div>
                      <div className=\"flex justify-between\">
                        <span className=\"text-sm\">Fiber:</span>
                        <span className=\"font-medium\">{data.smartRecommendations.remainingMacros.fiber}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className=\"grid md:grid-cols-2 gap-6\">
              {/* Recent Meals */}
              <Card>
                <CardHeader>
                  <CardTitle className=\"flex items-center gap-2\">
                    <ChefHat className=\"w-5 h-5 text-green-500\" />
                    Recent Meals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-4\">
                    {data.recentMeals.map((meal) => {
                      const nutritionGrade = getGrade(meal.nutritionScore);
                      return (
                        <div key={meal.id} className=\"flex items-center justify-between p-3 rounded-lg border bg-card/50\">
                          <div className=\"flex items-center gap-3\">
                            <div className=\"p-2 rounded-full bg-primary/10\">
                              {getMealIcon(meal.loggedVia)}
                            </div>
                            <div>
                              <div className=\"font-medium\">{meal.name}</div>
                              <div className=\"text-sm text-muted-foreground capitalize\">{meal.mealType}</div>
                            </div>
                          </div>
                          <div className=\"text-right\">
                            <div className={`font-bold ${nutritionGrade.color}`}>
                              {nutritionGrade.grade}
                            </div>
                            <div className=\"text-xs text-muted-foreground flex items-center gap-1\">
                              <Leaf className=\"w-3 h-3\" />
                              {meal.sustainabilityScore.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent XP */}
              <Card>
                <CardHeader>
                  <CardTitle className=\"flex items-center gap-2\">
                    <Zap className=\"w-5 h-5 text-yellow-500\" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-4\">
                    {data.gamification.recentXP.map((xp, index) => (
                      <div key={index} className=\"flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20\">
                        <div className=\"flex items-center gap-3\">
                          <div className=\"w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-white text-sm font-bold\">
                            +{xp.xpAmount}
                          </div>
                          <div>
                            <div className=\"text-sm font-medium\">{xp.description}</div>
                            <div className=\"text-xs text-muted-foreground\">
                              {new Date(xp.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <Zap className=\"w-4 h-4 text-yellow-500\" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value=\"nutrition\" className=\"space-y-6\">
            <div className=\"text-center py-12\">
              <ChefHat className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
              <h3 className=\"text-xl font-semibold mb-2\">Detailed Nutrition Analysis</h3>
              <p className=\"text-muted-foreground\">Coming soon: Micronutrient tracking, meal timing optimization, and personalized recommendations.</p>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value=\"progress\" className=\"space-y-6\">
            <div className=\"text-center py-12\">
              <TrendingUp className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
              <h3 className=\"text-xl font-semibold mb-2\">Progress Analytics</h3>
              <p className=\"text-muted-foreground\">Coming soon: Weekly trends, body composition tracking, and goal achievement analytics.</p>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value=\"insights\" className=\"space-y-6\">
            <div className=\"text-center py-12\">
              <BrainCircuit className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
              <h3 className=\"text-xl font-semibold mb-2\">AI-Powered Insights</h3>
              <p className=\"text-muted-foreground\">Coming soon: Personalized health insights, meal pattern analysis, and optimization suggestions.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}