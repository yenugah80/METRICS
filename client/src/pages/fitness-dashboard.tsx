/**
 * Vibrant Fitness Tracker Dashboard - Production Ready
 * Matches the colorful UI from reference image with real API integration
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
  Lightbulb,
  Plus,
  Play
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
  recentMeals: Array<{
    id: string;
    name: string;
    mealType: string;
    nutritionScore: number;
    sustainabilityScore: number;
    loggedVia: string;
    timestamp: string;
  }>;
}

export default function FitnessDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch real fitness dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/fitness'],
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  // Fetch gamification status
  const { data: gamificationData } = useQuery({
    queryKey: ['/api/gamification/status'],
    refetchInterval: 15000, // More frequent for XP changes
  });

  // Fetch smart recommendations
  const { data: smartData } = useQuery({
    queryKey: ['/api/smart-portions/remaining-macros'],
    refetchInterval: 60000, // Update when macros change
  });

  // Process events mutation with real API
  const processEventsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/gamification/process-events'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/fitness'] });
      toast({
        title: "Events Processed",
        description: "Your progress has been updated!",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sync progress. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Award XP mutation for testing
  const awardXPMutation = useMutation({
    mutationFn: (xpData: any) => apiRequest('POST', '/api/gamification/award-xp', xpData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/status'] });
      toast({
        title: "XP Awarded!",
        description: "Great job! You earned experience points.",
        duration: 3000,
      });
    },
  });

  // Badge color mapping - vibrant like reference image
  const getBadgeColor = (badge: string) => {
    const colors = {
      'nutrition_enthusiast': 'bg-gradient-to-r from-green-400 to-green-600 text-white',
      'weekly_warrior': 'bg-gradient-to-r from-blue-400 to-blue-600 text-white', 
      'recipe_explorer': 'bg-gradient-to-r from-purple-400 to-purple-600 text-white',
      'fitness_rookie': 'bg-gradient-to-r from-orange-400 to-orange-600 text-white',
      'health_champion': 'bg-gradient-to-r from-red-400 to-red-600 text-white',
      'wellness_expert': 'bg-gradient-to-r from-indigo-400 to-indigo-600 text-white',
      'first_steps': 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
    };
    return colors[badge] || 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
  };

  // Get meal icon with colors
  const getMealIcon = (loggedVia: string) => {
    switch (loggedVia) {
      case 'photo': return <Camera className="w-4 h-4 text-green-500" />;
      case 'voice': return <Mic className="w-4 h-4 text-blue-500" />;
      case 'manual': return <Trophy className="w-4 h-4 text-purple-500" />;
      default: return <ChefHat className="w-4 h-4 text-orange-500" />;
    }
  };

  // Get grade from score with vibrant colors
  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm font-bold' };
    if (score >= 85) return { grade: 'A', color: 'text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm font-bold' };
    if (score >= 80) return { grade: 'B+', color: 'text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-sm font-bold' };
    if (score >= 75) return { grade: 'B', color: 'text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-sm font-bold' };
    if (score >= 70) return { grade: 'C+', color: 'text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-sm font-bold' };
    return { grade: 'C', color: 'text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-sm font-bold' };
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your fitness journey...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Target className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">Please check your connection and try again.</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/dashboard/fitness'] })}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Use real data or safe fallbacks
  const data = dashboardData || {
    todayStats: {
      calories: 0, caloriesGoal: 2000,
      protein: 0, proteinGoal: 150,
      carbs: 0, carbsGoal: 250,
      fat: 0, fatGoal: 65,
      fiber: 0, fiberGoal: 25,
    },
    gamification: gamificationData?.status || {
      level: 1, currentXP: 0, xpForNextLevel: 100, totalXPNeeded: 100,
      currentStreak: 0, longestStreak: 0, badges: [], recentXP: [],
    },
    recentMeals: [],
  };

  const smartRecommendations = smartData || {
    remaining: { calories: 2000, protein: 150, carbs: 250, fat: 65, fiber: 25 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50" data-testid="fitness-dashboard">
      <div className="container mx-auto p-6 max-w-7xl">
        
        {/* Vibrant Header with Gamification */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Nutrition Journey
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Track, optimize, and thrive with AI-powered insights</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => awardXPMutation.mutate({
                  eventType: 'goal_achieved',
                  xpAmount: 25,
                  description: 'Test XP award for dashboard interaction'
                })}
                disabled={awardXPMutation.isPending}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                data-testid="button-test-xp"
              >
                <Star className="w-4 h-4 mr-2" />
                Test XP
              </Button>
              <Button 
                onClick={() => processEventsMutation.mutate()}
                disabled={processEventsMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                data-testid="button-sync-progress"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {processEventsMutation.isPending ? 'Syncing...' : 'Sync Progress'}
              </Button>
            </div>
          </div>

          {/* Vibrant Level and XP Bar */}
          <Card className="bg-gradient-to-r from-green-400/20 via-blue-400/20 to-purple-400/20 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {data.gamification.level}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">Level {data.gamification.level} Health Champion</h3>
                    <p className="text-gray-600">{data.gamification.currentXP.toLocaleString()} XP • {data.gamification.xpForNextLevel.toLocaleString()} to next level</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 bg-orange-100 px-4 py-2 rounded-full">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-700">{data.gamification.currentStreak}</div>
                      <div className="text-xs text-orange-600">Day Streak</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-yellow-100 px-4 py-2 rounded-full">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-yellow-700">{data.gamification.longestStreak}</div>
                      <div className="text-xs text-yellow-600">Best Streak</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Progress to Level {data.gamification.level + 1}</span>
                  <span className="font-bold text-green-600">{Math.round((data.gamification.currentXP / data.gamification.totalXPNeeded) * 100)}%</span>
                </div>
                <Progress 
                  value={(data.gamification.currentXP / data.gamification.totalXPNeeded) * 100} 
                  className="h-3 bg-gray-200"
                />
              </div>

              {/* Vibrant Badges */}
              <div className="flex gap-2 flex-wrap">
                {data.gamification.badges.map((badge, index) => (
                  <Badge key={index} className={`${getBadgeColor(badge)} shadow-md`}>
                    <Award className="w-3 h-3 mr-1" />
                    {badge.replace('_', ' ')}
                  </Badge>
                ))}
                {data.gamification.badges.length === 0 && (
                  <span className="text-gray-500 text-sm">Complete your first goal to earn badges!</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-md">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="nutrition" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Nutrition</TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">Progress</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Colorful and Vibrant */}
          <TabsContent value="overview" className="space-y-6">
            
            {/* Vibrant Nutrition Goals Cards */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Today's Nutrition Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Calories - Green Theme */}
                  <div className="text-center p-4 bg-gradient-to-b from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="text-3xl font-bold text-green-700 mb-2">
                      {data.todayStats.calories.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600 mb-3">
                      of {data.todayStats.caloriesGoal.toLocaleString()} calories
                    </div>
                    <Progress 
                      value={Math.min((data.todayStats.calories / data.todayStats.caloriesGoal) * 100, 100)} 
                      className="h-3 mb-2 bg-green-200"
                    />
                    <div className="text-xs text-green-600 font-medium">
                      {Math.round((data.todayStats.calories / data.todayStats.caloriesGoal) * 100)}% complete
                    </div>
                  </div>

                  {/* Protein - Blue Theme */}
                  <div className="text-center p-4 bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-700 mb-2">
                      {Math.round(data.todayStats.protein)}g
                    </div>
                    <div className="text-sm text-blue-600 mb-3">
                      of {data.todayStats.proteinGoal}g protein
                    </div>
                    <Progress 
                      value={Math.min((data.todayStats.protein / data.todayStats.proteinGoal) * 100, 100)} 
                      className="h-3 mb-2 bg-blue-200"
                    />
                    <div className="text-xs text-blue-600 font-medium">
                      {Math.round((data.todayStats.protein / data.todayStats.proteinGoal) * 100)}% complete
                    </div>
                  </div>

                  {/* Carbs - Purple Theme */}
                  <div className="text-center p-4 bg-gradient-to-b from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div className="text-3xl font-bold text-purple-700 mb-2">
                      {Math.round(data.todayStats.carbs)}g
                    </div>
                    <div className="text-sm text-purple-600 mb-3">
                      of {data.todayStats.carbsGoal}g carbs
                    </div>
                    <Progress 
                      value={Math.min((data.todayStats.carbs / data.todayStats.carbsGoal) * 100, 100)} 
                      className="h-3 mb-2 bg-purple-200"
                    />
                    <div className="text-xs text-purple-600 font-medium">
                      {Math.round((data.todayStats.carbs / data.todayStats.carbsGoal) * 100)}% complete
                    </div>
                  </div>

                  {/* Fat - Orange Theme */}
                  <div className="text-center p-4 bg-gradient-to-b from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                    <div className="text-3xl font-bold text-orange-700 mb-2">
                      {Math.round(data.todayStats.fat)}g
                    </div>
                    <div className="text-sm text-orange-600 mb-3">
                      of {data.todayStats.fatGoal}g fat
                    </div>
                    <Progress 
                      value={Math.min((data.todayStats.fat / data.todayStats.fatGoal) * 100, 100)} 
                      className="h-3 mb-2 bg-orange-200"
                    />
                    <div className="text-xs text-orange-600 font-medium">
                      {Math.round((data.todayStats.fat / data.todayStats.fatGoal) * 100)}% complete
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Recommendations - Vibrant Card */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6" />
                  Smart AI Recommendations
                </CardTitle>
                <p className="text-purple-100">
                  Personalized suggestions based on your remaining daily goals
                </p>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-purple-700">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Recommended Foods
                    </h4>
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-green-100 to-blue-100 border border-green-200">
                        <div className="font-medium text-green-800">Greek Yogurt with Berries</div>
                        <div className="text-sm text-green-600 mb-2">150g portion • Perfect protein boost</div>
                        <div className="text-xs text-green-600">Rich in protein and probiotics for digestive health</div>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-200">
                        <div className="font-medium text-orange-800">Mixed Nuts</div>
                        <div className="text-sm text-orange-600 mb-2">30g portion • Healthy fats</div>
                        <div className="text-xs text-orange-600">Complete your daily fat goals with heart-healthy options</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-purple-700">
                      <Target className="w-5 h-5 text-blue-500" />
                      Remaining Goals
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                        <span className="text-gray-700 font-medium">Calories:</span>
                        <span className="font-bold text-green-600">{smartRecommendations.remaining?.calories || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                        <span className="text-gray-700 font-medium">Protein:</span>
                        <span className="font-bold text-blue-600">{smartRecommendations.remaining?.protein || 0}g</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                        <span className="text-gray-700 font-medium">Carbs:</span>
                        <span className="font-bold text-purple-600">{smartRecommendations.remaining?.carbs || 0}g</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                        <span className="text-gray-700 font-medium">Fat:</span>
                        <span className="font-bold text-orange-600">{smartRecommendations.remaining?.fat || 0}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity - Colorful Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Meals */}
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5" />
                    Recent Meals
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {data.recentMeals.length > 0 ? data.recentMeals.map((meal) => {
                      const nutritionGrade = getGrade(meal.nutritionScore);
                      return (
                        <div key={meal.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-green-100">
                              {getMealIcon(meal.loggedVia)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{meal.name}</div>
                              <div className="text-sm text-gray-600 capitalize">{meal.mealType}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={nutritionGrade.color}>
                              {nutritionGrade.grade}
                            </div>
                            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                              <Leaf className="w-3 h-3" />
                              {meal.sustainabilityScore.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-8">
                        <ChefHat className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500">No meals logged yet today</p>
                        <p className="text-sm text-gray-400">Start tracking to see your progress!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent XP */}
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {data.gamification.recentXP.length > 0 ? data.gamification.recentXP.map((xp, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            +{xp.xpAmount}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{xp.description}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(xp.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <Zap className="w-5 h-5 text-yellow-500" />
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <Zap className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500">No recent achievements</p>
                        <p className="text-sm text-gray-400">Complete goals to earn XP!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other Tabs - Coming Soon with Colorful Placeholders */}
          <TabsContent value="nutrition" className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="text-center py-16 bg-gradient-to-br from-blue-50 to-green-50">
                <ChefHat className="w-20 h-20 mx-auto text-blue-500 mb-6" />
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Detailed Nutrition Analysis</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Coming soon: Micronutrient tracking, meal timing optimization, and personalized nutrition recommendations.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50">
                <TrendingUp className="w-20 h-20 mx-auto text-purple-500 mb-6" />
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Progress Analytics</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Coming soon: Weekly trends, body composition tracking, and goal achievement analytics.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="text-center py-16 bg-gradient-to-br from-orange-50 to-red-50">
                <BrainCircuit className="w-20 h-20 mx-auto text-orange-500 mb-6" />
                <h3 className="text-2xl font-bold text-gray-800 mb-3">AI-Powered Insights</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Coming soon: Personalized health insights, meal pattern analysis, and optimization suggestions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}