import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { InteractiveMealCard } from '@/components/meal/InteractiveMealCard';
import { MacroProgressChart } from '@/components/diet-plan/MacroProgressChart';
import { SmartSuggestionCard } from '@/components/diet-plan/SmartSuggestionCard';
import { HealthConditionIndicators } from '@/components/diet-plan/HealthConditionIndicators';
import { RealTimeAdjustmentPanel } from '@/components/diet-plan/RealTimeAdjustmentPanel';
import { WeeklyProgressDashboard } from '@/components/diet-plan/WeeklyProgressDashboard';
import { useAuth } from '@/hooks/useLocalAuth';
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Utensils, 
  Pill, 
  Activity,
  Plus,
  CheckCircle,
  Star,
  Clock,
  RefreshCw,
  Calculator,
  Info,
  Zap,
  Award,
  Brain,
  Heart
} from 'lucide-react';

interface DietPlan {
  id: string;
  planName: string;
  planType: string;
  duration: number;
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface DayMeals {
  breakfast?: { option1?: any; option2?: any };
  lunch?: { option1?: any; option2?: any };
  dinner?: { option1?: any; option2?: any };
  snack?: { option1?: any; option2?: any };
}

export default function DietPlan() {
  const [currentDay, setCurrentDay] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTargetCalculation, setShowTargetCalculation] = useState(false);
  const { user } = useAuth();

  // Fetch active diet plan
  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: ['/api/diet-plans/active'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch meals for current day
  const { data: mealsData, isLoading: mealsLoading } = useQuery({
    queryKey: ['/api/diet-plans', (planData as any)?.dietPlan?.id, 'meals', currentDay],
    enabled: !!(planData as any)?.dietPlan?.id,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch today's actual intake for real-time adjustments
  const { data: todayIntake } = useQuery({
    queryKey: ['/api/nutrition/today-progress'],
    staleTime: 2 * 60 * 1000, // 2 minutes - frequent updates for real-time
  });

  // Fetch weekly progress data
  const { data: weeklyProgress } = useQuery({
    queryKey: ['/api/diet-plans', (planData as any)?.dietPlan?.id, 'weekly-progress'],
    enabled: !!(planData as any)?.dietPlan?.id,
    staleTime: 15 * 60 * 1000,
  });

  // Fetch supplements
  const { data: supplementsData } = useQuery({
    queryKey: ['/api/diet-plans', (planData as any)?.dietPlan?.id, 'supplements'],
    enabled: !!(planData as any)?.dietPlan?.id,
    staleTime: 30 * 60 * 1000,
  });

  // Fetch lifestyle recommendations
  const { data: lifestyleData } = useQuery({
    queryKey: ['/api/diet-plans', (planData as any)?.dietPlan?.id, 'lifestyle'],
    enabled: !!(planData as any)?.dietPlan?.id,
    staleTime: 30 * 60 * 1000,
  });

  // Calculate adherence
  const adherenceMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest('POST', `/api/diet-plans/${planId}/adherence`);
    },
  });

  // Apply smart suggestions
  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestion: any) => {
      return await apiRequest('POST', '/api/diet-plans/apply-suggestion', { suggestion });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diet-plans'] });
      toast({
        title: "Suggestion Applied! ✨",
        description: "Your plan has been updated with the smart recommendation.",
      });
    },
  });

  // Apply real-time adjustments
  const applyAdjustmentMutation = useMutation({
    mutationFn: async (adjustment: any) => {
      return await apiRequest('POST', '/api/diet-plans/apply-adjustment', { adjustment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diet-plans'] });
      toast({
        title: "Plan Adjusted! ⚡",
        description: "Your remaining meals have been optimized for today's intake.",
      });
    },
  });

  // Recalculate nutrition targets
  const recalculateTargetsMutation = useMutation({
    mutationFn: async (goalType: string = 'weight_loss') => {
      return await apiRequest('POST', '/api/nutrition/recalculate-targets', { goalType });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/diet-plans/active'] });
      toast({
        title: "Targets Updated! 🎯",
        description: `New daily calorie target: ${data.targets?.calories || 'Updated'}`,
      });
      setShowTargetCalculation(true);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Unable to recalculate. Please check your profile.",
        variant: "destructive",
      });
    },
  });

  if (planLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-teal-50/30 to-green-50/20 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // No active plan - redirect to questionnaire
  if (!(planData as any)?.hasPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-teal-50/30 to-green-50/20 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl p-8">
            <CardHeader>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Create Your AI-Powered Diet Plan
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-4">
                Get a personalized 28-day nutrition plan with real-time adjustments, 
                smart meal suggestions, and health condition support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>Real-time plan adjustments</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>Health condition support</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>Smart meal suggestions</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>Visual progress tracking</span>
                </div>
              </div>
              <Button
                onClick={() => setLocation('/diet-plan-questionnaire')}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg px-8 py-3 h-auto"
                data-testid="button-create-plan"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create My Personalized Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const plan: DietPlan = (planData as any).dietPlan;
  const meals: DayMeals = (mealsData as any)?.meals || {};
  const supplements = (supplementsData as any)?.supplements || [];
  const lifestyle = (lifestyleData as any)?.lifestyle || {};
  
  // Get actual intake data for real-time features
  const actualIntake = (todayIntake as any)?.intake || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };

  // Calculate days remaining
  const startDate = new Date(plan.startDate);
  const endDate = new Date(plan.endDate);
  const today = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = totalDays - daysPassed;

  // Mock data for health conditions and smart suggestions (replaced with real data in production)
  const mockHealthConditions = [
    {
      condition: 'pcos',
      severity: 'moderate' as const,
      adherenceScore: 85,
      recommendations: [
        'Low glycemic index foods prioritized',
        'Anti-inflammatory ingredients included'
      ],
      alerts: ['Monitor blood sugar response', 'Ensure adequate protein intake']
    }
  ];

  const mockSmartSuggestions = [
    {
      type: 'meal_swap' as const,
      reason: 'Better protein distribution for PCOS management',
      originalItem: 'Pasta with marinara sauce',
      suggestedItem: 'Zucchini noodles with grilled chicken',
      nutritionalImpact: {
        calorieDelta: -120,
        proteinDelta: 25,
        macroImprovement: true,
      },
      confidenceScore: 92,
    },
    {
      type: 'portion_adjust' as const,
      reason: 'You\'re ahead on calories - reduce dinner portion',
      originalItem: '200g salmon fillet',
      suggestedItem: '150g salmon fillet + extra vegetables',
      nutritionalImpact: {
        calorieDelta: -80,
        proteinDelta: -8,
        macroImprovement: true,
      },
      confidenceScore: 88,
    }
  ];

  // Determine remaining meals for real-time adjustments
  const getRemainingMeals = () => {
    const currentHour = new Date().getHours();
    const remaining = [];
    
    if (currentHour < 10) remaining.push('breakfast');
    if (currentHour < 14) remaining.push('lunch');
    if (currentHour < 19) remaining.push('dinner');
    remaining.push('snack');
    
    return remaining;
  };

  const weeklyData = (weeklyProgress as any)?.weekData || [];
  const weeklyStats = (weeklyProgress as any)?.stats || {
    averageAdherence: 78,
    streakDays: 3,
    bestDay: { day: 2, adherenceScore: 95 },
    achievements: ['3-Day Streak', 'Protein Target Met'],
    improvementAreas: ['Increase fiber intake', 'Better hydration']
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-teal-50/30 to-green-50/20 p-4">
      <div className="max-w-8xl mx-auto">
        {/* Enhanced Header with Visual Appeal */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              {plan.planName}
            </h1>
            <Badge className="bg-green-100 text-green-800">
              <Activity className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2 bg-white/70 px-3 py-1 rounded-full">
              <Calendar className="w-4 h-4" />
              Day {currentDay} of {plan.duration}
            </div>
            <div className="flex items-center gap-2 bg-white/70 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4" />
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Plan completed!'}
            </div>
            <div className="flex items-center gap-2 bg-white/70 px-3 py-1 rounded-full">
              <Award className="w-4 h-4 text-yellow-500" />
              {weeklyStats.streakDays} day streak
            </div>
          </div>
        </div>

        {/* Top Row: Progress Overview & Real-Time Adjustments */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2">
            <MacroProgressChart
              dailyTargets={plan.dailyTargets}
              actualIntake={actualIntake}
              className="bg-white/90 backdrop-blur-sm border-0 shadow-lg"
            />
          </div>
          
          <div className="space-y-4">
            <RealTimeAdjustmentPanel
              currentIntake={actualIntake}
              dailyTargets={plan.dailyTargets}
              remainingMeals={getRemainingMeals()}
              onApplyAdjustment={(adjustment) => applyAdjustmentMutation.mutate(adjustment)}
              className="bg-white/90 backdrop-blur-sm border-0 shadow-lg"
            />
          </div>
        </div>

        {/* Middle Row: Smart Suggestions & Health Conditions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <SmartSuggestionCard
            suggestions={mockSmartSuggestions}
            onApplySuggestion={(suggestion) => applySuggestionMutation.mutate(suggestion)}
            className="bg-white/90 backdrop-blur-sm border-0 shadow-lg"
          />
          
          <HealthConditionIndicators
            conditions={mockHealthConditions}
            className="bg-white/90 backdrop-blur-sm border-0 shadow-lg"
          />
        </div>

        <Tabs defaultValue="meals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/90 backdrop-blur-sm shadow-lg">
            <TabsTrigger value="meals" className="flex items-center gap-2" data-testid="tab-meals">
              <Utensils className="w-4 h-4" />
              Today's Meals
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2" data-testid="tab-progress">
              <TrendingUp className="w-4 h-4" />
              Weekly Progress
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2" data-testid="tab-calendar">
              <Calendar className="w-4 h-4" />
              28-Day Plan
            </TabsTrigger>
            <TabsTrigger value="supplements" className="flex items-center gap-2" data-testid="tab-supplements">
              <Pill className="w-4 h-4" />
              Supplements
            </TabsTrigger>
            <TabsTrigger value="lifestyle" className="flex items-center gap-2" data-testid="tab-lifestyle">
              <Heart className="w-4 h-4" />
              Lifestyle
            </TabsTrigger>
          </TabsList>

          {/* Today's Meals Tab - Enhanced */}
          <TabsContent value="meals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-white" />
                </div>
                Day {currentDay} Meals
                <Badge className="bg-blue-100 text-blue-800">
                  Personalized
                </Badge>
              </h2>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
                  disabled={currentDay === 1}
                  data-testid="button-prev-day"
                >
                  ← Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDay(Math.min(plan.duration, currentDay + 1))}
                  disabled={currentDay === plan.duration}
                  data-testid="button-next-day"
                >
                  Next →
                </Button>
              </div>
            </div>

            {mealsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                  const mealData = meals[mealType as keyof DayMeals]?.option1;
                  
                  return (
                    <InteractiveMealCard
                      key={mealType}
                      mealId={mealData?.id || `${mealType}-day-${currentDay}`}
                      mealType={mealType}
                      dayNumber={currentDay}
                      title={mealData?.mealName || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Option`}
                      description={mealData?.description || "Nutritious meal from your personalized diet plan"}
                      calories={mealData?.calories || 0}
                      protein={mealData?.protein || 0}
                      prepTime={mealData?.prepTime || "15 min"}
                      difficulty={mealData?.difficulty || "Easy"}
                      tags={mealData?.tags || ["Healthy", "Balanced"]}
                      userId={user?.id}
                      source="diet_plan"
                      allergens={mealData?.allergens || []}
                      onComplete={(mealId, mealType, dayNumber) => {
                        toast({
                          title: "Meal Completed! 🎉",
                          description: `${mealType} for Day ${dayNumber} logged successfully.`,
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/nutrition/today-progress'] });
                      }}
                      onSwap={(originalId, newMealId, mealType, reason) => {
                        toast({
                          title: "Meal Swapped! 🔄",
                          description: `Your ${mealType} has been updated.`,
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/diet-plans'] });
                      }}
                      onSaveFavorite={(mealId) => {
                        toast({
                          title: "Saved to Favorites! ⭐",
                          description: "This meal has been added to your favorites.",
                        });
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                onClick={() => recalculateTargetsMutation.mutate(plan.planType)}
                disabled={recalculateTargetsMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                data-testid="button-optimize-plan"
              >
                {recalculateTargetsMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Optimize Plan
              </Button>
            </div>
          </TabsContent>

          {/* Weekly Progress Tab - NEW */}
          <TabsContent value="progress" className="space-y-6">
            <WeeklyProgressDashboard
              weekData={weeklyData}
              weeklyStats={weeklyStats}
              className="bg-white/90 backdrop-blur-sm border-0 shadow-lg"
            />
          </TabsContent>

          {/* 28-Day Calendar Tab - Enhanced */}
          <TabsContent value="calendar" className="space-y-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  28-Day Plan Journey
                </CardTitle>
                <CardDescription>
                  Track your progress through your personalized nutrition plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-3">
                  {Array.from({ length: plan.duration }, (_, i) => {
                    const day = i + 1;
                    const isPast = day < daysPassed;
                    const isToday = day === daysPassed;
                    const isActive = day === currentDay;
                    
                    return (
                      <Button
                        key={day}
                        variant={isActive ? "default" : isPast ? "secondary" : "outline"}
                        size="sm"
                        className={`h-16 text-xs flex flex-col gap-1 ${
                          isToday ? 'ring-2 ring-blue-500 shadow-lg' : ''
                        } ${
                          isPast ? 'bg-green-100 hover:bg-green-200 text-green-700' : ''
                        }`}
                        onClick={() => setCurrentDay(day)}
                        data-testid={`button-day-${day}`}
                      >
                        {isPast && <CheckCircle className="w-4 h-4" />}
                        {isToday && <Target className="w-4 h-4" />}
                        <span>Day {day}</span>
                        {isPast && <span className="text-xs text-green-600">✓</span>}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded border"></div>
                    <span>Completed ({daysPassed - 1})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                    <span>Upcoming ({daysRemaining})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Supplements Tab */}
          <TabsContent value="supplements" className="space-y-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-6 h-6 text-blue-600" />
                  Personalized Supplement Stack
                </CardTitle>
                <CardDescription>
                  Evidence-based supplements tailored to your goals and health conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {supplements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supplements.map((supplement: any, index: number) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-lg">{supplement.supplementName}</h4>
                            <Badge 
                              className={
                                supplement.priority === 'essential' ? 'bg-red-100 text-red-800' :
                                supplement.priority === 'recommended' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {supplement.priority}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3 text-sm">
                            <div className="bg-blue-50 p-3 rounded">
                              <p className="font-medium text-blue-900">Dosage & Timing</p>
                              <p className="text-blue-800">{supplement.dosage}</p>
                              <p className="text-blue-700 capitalize">{supplement.timing.replace('_', ' ')}</p>
                            </div>
                            
                            <div>
                              <p className="font-medium text-gray-900">Purpose</p>
                              <p className="text-gray-600">{supplement.purpose}</p>
                            </div>
                            
                            {supplement.safetyNotes && (
                              <div className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                                <p className="font-medium text-amber-800">Safety Notes</p>
                                <p className="text-amber-700 text-xs">{supplement.safetyNotes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Pill className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No Supplements Needed</p>
                    <p className="text-sm">Your current plan provides all necessary nutrients through food.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Lifestyle Tab */}
          <TabsContent value="lifestyle" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(lifestyle).map(([category, recommendations]: [string, any]) => (
                <Card key={category} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      {category.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendations.map((rec: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-base">{rec.title}</h4>
                            <Badge className={
                              rec.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              rec.difficulty === 'medium' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {rec.difficulty}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {rec.frequency}
                            </Badge>
                          </div>
                          
                          {rec.actionItems && rec.actionItems.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-700">Action Steps:</p>
                              <ul className="space-y-1">
                                {rec.actionItems.slice(0, 3).map((item: string, i: number) => (
                                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation('/dashboard')}
            className="bg-white/90 backdrop-blur-sm"
            data-testid="button-back-dashboard"
          >
            ← Back to Dashboard
          </Button>
          
          <Button
            onClick={() => adherenceMutation.mutate(plan.id)}
            disabled={adherenceMutation.isPending}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
            data-testid="button-check-adherence"
          >
            {adherenceMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                AI Progress Analysis
              </>
            )}
          </Button>

          <Button
            onClick={() => setLocation('/diet-plan-questionnaire')}
            variant="outline"
            className="bg-white/90 backdrop-blur-sm"
            data-testid="button-new-plan"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Plan
          </Button>
        </div>
      </div>
    </div>
  );
}