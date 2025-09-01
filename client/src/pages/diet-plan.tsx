import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
  Info
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

  // Fetch active diet plan
  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: ['/api/diet-plans/active'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch meals for current day
  const { data: mealsData, isLoading: mealsLoading } = useQuery({
    queryKey: ['/api/diet-plans', (planData as any)?.dietPlan?.id, 'meals', currentDay],
    enabled: !!(planData as any)?.dietPlan?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch supplements
  const { data: supplementsData } = useQuery({
    queryKey: ['/api/diet-plans', (planData as any)?.dietPlan?.id, 'supplements'],
    enabled: !!(planData as any)?.dietPlan?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch lifestyle recommendations
  const { data: lifestyleData } = useQuery({
    queryKey: ['/api/diet-plans', (planData as any)?.dietPlan?.id, 'lifestyle'],
    enabled: !!(planData as any)?.dietPlan?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Calculate adherence
  const adherenceMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest('POST', `/api/diet-plans/${planId}/adherence`);
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
        title: "Targets Updated!",
        description: data.message + ` New calories: ${data.targets.calories}`,
      });
      setShowTargetCalculation(true);
    },
    onError: (error: any) => {
      toast({
        title: "Recalculation Failed",
        description: error.message || "Unable to recalculate targets. Please check your profile is complete.",
        variant: "destructive",
      });
    },
  });

  if (planLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-teal-50/30 to-green-50/20 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
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
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg p-8">
            <CardHeader>
              <CardTitle className="text-2xl">Create Your Personal Diet Plan</CardTitle>
              <CardDescription>
                Get a tailored 28-day nutrition plan designed specifically for your goals and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setLocation('/diet-plan-questionnaire')}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                data-testid="button-create-plan"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create My Diet Plan
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

  // Calculate days remaining
  const startDate = new Date(plan.startDate);
  const endDate = new Date(plan.endDate);
  const today = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = totalDays - daysPassed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-teal-50/30 to-green-50/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.planName}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Day {currentDay} of {plan.duration}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Plan completed!'}
            </span>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Daily Targets
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => recalculateTargetsMutation.mutate('weight_loss')}
                disabled={recalculateTargetsMutation.isPending}
                className="flex items-center gap-2"
                data-testid="button-recalculate-targets"
              >
                {recalculateTargetsMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4" />
                )}
                Recalculate
              </Button>
            </CardTitle>
            <CardDescription>
              BMR-based targets calculated from your profile data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Calories', value: plan.dailyTargets.calories, unit: 'kcal', color: 'bg-blue-500' },
                { label: 'Protein', value: plan.dailyTargets.protein, unit: 'g', color: 'bg-green-500' },
                { label: 'Carbs', value: plan.dailyTargets.carbs, unit: 'g', color: 'bg-orange-500' },
                { label: 'Fat', value: plan.dailyTargets.fat, unit: 'g', color: 'bg-purple-500' },
                { label: 'Fiber', value: plan.dailyTargets.fiber, unit: 'g', color: 'bg-teal-500' },
              ].map((target) => (
                <div key={target.label} className="text-center">
                  <div className={`w-12 h-12 rounded-full ${target.color} text-white flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-sm font-semibold">{target.value}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{target.label}</p>
                  <p className="text-xs text-gray-500">{target.unit}</p>
                </div>
              ))}
            </div>
            
            {showTargetCalculation && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">BMR-Based Calculation:</p>
                    <p className="text-xs leading-relaxed">
                      Your targets are calculated using the Mifflin-St Jeor equation for BMR (Basal Metabolic Rate), 
                      then adjusted for your activity level and weight loss goals. This ensures scientifically accurate 
                      nutrition recommendations rather than generic defaults.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="meals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="meals" data-testid="tab-meals">Today's Meals</TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar">28-Day Plan</TabsTrigger>
            <TabsTrigger value="supplements" data-testid="tab-supplements">Supplements</TabsTrigger>
            <TabsTrigger value="lifestyle" data-testid="tab-lifestyle">Lifestyle</TabsTrigger>
          </TabsList>

          {/* Today's Meals Tab */}
          <TabsContent value="meals" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Day {currentDay} Meal Plan
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
                  disabled={currentDay === 1}
                  data-testid="button-prev-day"
                >
                  Previous Day
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDay(Math.min(plan.duration, currentDay + 1))}
                  disabled={currentDay === plan.duration}
                  data-testid="button-next-day"
                >
                  Next Day
                </Button>
              </div>
            </div>

            {mealsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => (
                  <Card key={mealType} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg capitalize">{mealType}</CardTitle>
                      {meals[mealType as keyof DayMeals]?.option1 && (
                        <Badge variant="secondary" className="w-fit">
                          {meals[mealType as keyof DayMeals]?.option1?.calories || 0} calories
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      {meals[mealType as keyof DayMeals]?.option1 ? (
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold">{meals[mealType as keyof DayMeals]?.option1?.mealName}</h4>
                            <p className="text-sm text-gray-600">{meals[mealType as keyof DayMeals]?.option1?.description}</p>
                          </div>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <p><strong>Portion:</strong> {meals[mealType as keyof DayMeals]?.option1?.portionSize}</p>
                            <p><strong>Benefits:</strong> {meals[mealType as keyof DayMeals]?.option1?.healthBenefits}</p>
                          </div>

                          {meals[mealType as keyof DayMeals]?.option2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              data-testid={`button-view-options-${mealType}`}
                            >
                              View Alternative Option
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p>No meal planned</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 28-Day Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  28-Day Plan Overview
                </CardTitle>
                <CardDescription>
                  Track your journey through your personalized nutrition plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
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
                        className={`h-12 text-xs ${
                          isToday ? 'ring-2 ring-blue-500' : ''
                        } ${
                          isPast ? 'bg-green-100 text-green-700' : ''
                        }`}
                        onClick={() => setCurrentDay(day)}
                        data-testid={`button-day-${day}`}
                      >
                        {isPast && <CheckCircle className="w-3 h-3 mb-1" />}
                        Day {day}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100 rounded"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-gray-300 rounded"></div>
                    <span>Upcoming</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supplements Tab */}
          <TabsContent value="supplements" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-blue-600" />
                  Recommended Supplements
                </CardTitle>
                <CardDescription>
                  Personalized supplement recommendations for your goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {supplements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supplements.map((supplement: any, index: number) => (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold">{supplement.supplementName}</h4>
                            <Badge variant={
                              supplement.priority === 'essential' ? 'default' :
                              supplement.priority === 'recommended' ? 'secondary' : 'outline'
                            }>
                              {supplement.priority}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <p><strong>Dosage:</strong> {supplement.dosage}</p>
                            <p><strong>Timing:</strong> {supplement.timing}</p>
                            <p><strong>Purpose:</strong> {supplement.purpose}</p>
                            {supplement.safetyNotes && (
                              <p className="text-amber-600"><strong>Notes:</strong> {supplement.safetyNotes}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No supplement recommendations for this plan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lifestyle Tab */}
          <TabsContent value="lifestyle" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(lifestyle).map(([category, recommendations]: [string, any]) => (
                <Card key={category} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <Activity className="w-5 h-5 text-blue-600" />
                      {category.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendations.map((rec: any, index: number) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-4">
                          <h4 className="font-semibold text-sm">{rec.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline">{rec.frequency}</Badge>
                            <Badge variant="outline">{rec.difficulty}</Badge>
                          </div>
                          
                          {rec.actionItems && rec.actionItems.length > 0 && (
                            <ul className="mt-2 text-xs text-gray-500 space-y-1">
                              {rec.actionItems.map((item: string, i: number) => (
                                <li key={i} className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
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

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation('/dashboard')}
            data-testid="button-back-dashboard"
          >
            Back to Dashboard
          </Button>
          
          <Button
            onClick={() => adherenceMutation.mutate(plan.id)}
            disabled={adherenceMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            data-testid="button-check-adherence"
          >
            {adherenceMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Check My Progress
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}