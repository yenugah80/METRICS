import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface MealAdjustment {
  mealType: string;
  originalCalories: number;
  adjustedCalories: number;
  reason: string;
  macroChanges: {
    protein: number;
    carbs: number;
    fat: number;
  };
  urgency: 'low' | 'medium' | 'high';
}

interface RealTimeAdjustmentPanelProps {
  currentIntake: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  remainingMeals: string[]; // ['lunch', 'dinner', 'snack']
  onApplyAdjustment: (adjustment: MealAdjustment) => void;
  className?: string;
}

export function RealTimeAdjustmentPanel({ 
  currentIntake, 
  dailyTargets, 
  remainingMeals, 
  onApplyAdjustment,
  className = "" 
}: RealTimeAdjustmentPanelProps) {
  const [adjustments, setAdjustments] = useState<MealAdjustment[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate remaining targets
  const remainingTargets = {
    calories: Math.max(0, dailyTargets.calories - currentIntake.calories),
    protein: Math.max(0, dailyTargets.protein - currentIntake.protein),
    carbs: Math.max(0, dailyTargets.carbs - currentIntake.carbs),
    fat: Math.max(0, dailyTargets.fat - currentIntake.fat),
  };

  // Calculate daily progress percentages
  const progress = {
    calories: Math.min((currentIntake.calories / dailyTargets.calories) * 100, 100),
    protein: Math.min((currentIntake.protein / dailyTargets.protein) * 100, 100),
    carbs: Math.min((currentIntake.carbs / dailyTargets.carbs) * 100, 100),
    fat: Math.min((currentIntake.fat / dailyTargets.fat) * 100, 100),
  };

  // Get progress color based on adherence
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90 && percentage <= 110) return 'hsl(142, 76%, 36%)'; // Green
    if (percentage >= 80 && percentage <= 120) return 'hsl(32, 95%, 44%)'; // Orange
    return 'hsl(0, 84%, 60%)'; // Red
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate smart adjustments based on current intake
  useEffect(() => {
    if (remainingMeals.length === 0) return;

    const newAdjustments: MealAdjustment[] = [];
    const caloriesPerMeal = remainingTargets.calories / remainingMeals.length;

    // If over calories, suggest reductions
    if (currentIntake.calories > dailyTargets.calories * 0.8 && remainingMeals.length > 0) {
      const excessCalories = currentIntake.calories - (dailyTargets.calories * 0.8);
      const reductionPerMeal = Math.min(excessCalories / remainingMeals.length, 150);

      remainingMeals.forEach(mealType => {
        newAdjustments.push({
          mealType,
          originalCalories: caloriesPerMeal,
          adjustedCalories: Math.max(caloriesPerMeal - reductionPerMeal, 200),
          reason: "Adjusting to stay within daily calorie target",
          macroChanges: {
            protein: -2,
            carbs: -15,
            fat: -3,
          },
          urgency: 'medium',
        });
      });
    }

    // If protein is low, suggest protein boost
    if (currentIntake.protein < dailyTargets.protein * 0.5 && remainingMeals.includes('dinner')) {
      newAdjustments.push({
        mealType: 'dinner',
        originalCalories: caloriesPerMeal,
        adjustedCalories: caloriesPerMeal + 50,
        reason: "Boosting protein to meet daily target",
        macroChanges: {
          protein: 15,
          carbs: 0,
          fat: 2,
        },
        urgency: 'high',
      });
    }

    setAdjustments(newAdjustments);
  }, [currentIntake, dailyTargets, remainingMeals]);

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (percentage > 110) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <TrendingDown className="h-4 w-4 text-orange-500" />;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-blue-600" />
          Real-Time Adjustments
          {adjustments.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {adjustments.length} suggested
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Progress Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {Object.entries(progress).map(([macro, percentage]) => (
            <div key={macro} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize">{macro}</span>
                {getStatusIcon(percentage)}
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
                style={{ 
                  '--progress-foreground': getProgressColor(percentage) 
                } as React.CSSProperties}
              />
              <div className="text-xs text-muted-foreground">
                {percentage.toFixed(0)}% of target
              </div>
            </div>
          ))}
        </div>

        {/* Remaining Targets */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-2">
            Remaining for Today ({remainingMeals.length} meals left)
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-blue-700">Calories:</span>
              <span className="ml-1 font-medium">{remainingTargets.calories.toFixed(0)}</span>
            </div>
            <div>
              <span className="text-blue-700">Protein:</span>
              <span className="ml-1 font-medium">{remainingTargets.protein.toFixed(0)}g</span>
            </div>
            <div>
              <span className="text-blue-700">Carbs:</span>
              <span className="ml-1 font-medium">{remainingTargets.carbs.toFixed(0)}g</span>
            </div>
            <div>
              <span className="text-blue-700">Fat:</span>
              <span className="ml-1 font-medium">{remainingTargets.fat.toFixed(0)}g</span>
            </div>
          </div>
        </div>

        {/* Smart Adjustments */}
        {adjustments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              Suggested Adjustments
            </div>
            
            {adjustments.map((adjustment, index) => (
              <div key={index} className="border rounded-lg p-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getUrgencyColor(adjustment.urgency)}>
                        {adjustment.urgency} priority
                      </Badge>
                      <span className="text-sm font-medium capitalize">
                        {adjustment.mealType}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {adjustment.reason}
                    </p>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span>Calories:</span>
                        <span className="line-through text-gray-500">
                          {adjustment.originalCalories}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium">
                          {adjustment.adjustedCalories}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span>Protein: {adjustment.macroChanges.protein > 0 ? '+' : ''}{adjustment.macroChanges.protein}g</span>
                        <span>Carbs: {adjustment.macroChanges.carbs > 0 ? '+' : ''}{adjustment.macroChanges.carbs}g</span>
                        <span>Fat: {adjustment.macroChanges.fat > 0 ? '+' : ''}{adjustment.macroChanges.fat}g</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    size="sm"
                    onClick={() => onApplyAdjustment(adjustment)}
                    data-testid={`button-apply-adjustment-${index}`}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {adjustments.length === 0 && remainingMeals.length > 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">You're on track! No adjustments needed.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}