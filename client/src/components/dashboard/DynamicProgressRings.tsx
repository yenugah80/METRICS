import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Flame,
  Droplets,
  Zap
} from 'lucide-react';

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

function ProgressRing({ value, max, size = 120, strokeWidth = 8, color = "#3B82F6", children }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

interface TodaysProgressProps {
  userId?: string;
}

export function DynamicProgressRings({ userId }: TodaysProgressProps) {
  // Fetch today's nutrition progress
  const { data: todayStats, isLoading } = useQuery({
    queryKey: ['/api/nutrition/today-progress', userId],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Fetch user's targets
  const { data: userTargets } = useQuery({
    queryKey: ['/api/user/nutrition-targets', userId],
  });

  // Fetch meal completion status
  const { data: mealStatus } = useQuery({
    queryKey: ['/api/meals/today-status', userId],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 mt-2"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const consumed = todayStats || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const targets = userTargets || { calories: 2000, protein: 150, carbs: 200, fat: 67 };
  const meals = mealStatus || { breakfast: false, lunch: false, dinner: false, snack: false };
  
  const progressData = [
    {
      label: 'Calories',
      consumed: consumed.calories,
      target: targets.calories,
      unit: 'kcal',
      color: '#EF4444', // Red
      icon: <Flame className="w-4 h-4" />,
    },
    {
      label: 'Protein',
      consumed: consumed.protein,
      target: targets.protein,
      unit: 'g',
      color: '#10B981', // Green
      icon: <Zap className="w-4 h-4" />,
    },
    {
      label: 'Carbs',
      consumed: consumed.carbs,
      target: targets.carbs,
      unit: 'g',
      color: '#F59E0B', // Yellow
      icon: <Droplets className="w-4 h-4" />,
    },
    {
      label: 'Fat',
      consumed: consumed.fat,
      target: targets.fat,
      unit: 'g',
      color: '#8B5CF6', // Purple
      icon: <Target className="w-4 h-4" />,
    },
  ];

  const completedMeals = Object.values(meals).filter(Boolean).length;
  const totalMeals = Object.keys(meals).length;
  const overallProgress = (progressData.reduce((sum, item) => sum + Math.min((item.consumed / item.target) * 100, 100), 0) / progressData.length);

  return (
    <div className="space-y-6">
      {/* Main Progress Rings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Today's Nutrition Progress
            </CardTitle>
            <Badge variant={overallProgress >= 80 ? "default" : "secondary"}>
              {Math.round(overallProgress)}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {progressData.map((item, index) => {
              const percentage = Math.min((item.consumed / item.target) * 100, 100);
              const isOverTarget = item.consumed > item.target;
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <ProgressRing
                    value={item.consumed}
                    max={item.target}
                    color={isOverTarget ? '#EF4444' : item.color}
                    size={100}
                  >
                    <div className="text-center">
                      {item.icon}
                      <div className="text-lg font-bold text-gray-900">
                        {Math.round(item.consumed)}
                      </div>
                      <div className="text-xs text-gray-500">
                        of {item.target}
                      </div>
                    </div>
                  </ProgressRing>
                  
                  <div className="text-center">
                    <p className="font-medium text-sm text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-600">
                      {Math.round(percentage)}% • {item.consumed}{item.unit}/{item.target}{item.unit}
                    </p>
                    {isOverTarget && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Over target
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Meal Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Meals Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">{completedMeals}/{totalMeals} meals</span>
            </div>
            <Progress value={(completedMeals / totalMeals) * 100} className="h-2" />
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(meals).map(([mealType, completed]) => (
                <div key={mealType} className="flex items-center gap-2">
                  <CheckCircle 
                    className={`w-4 h-4 ${completed ? 'text-green-600' : 'text-gray-300'}`}
                  />
                  <span className={`text-sm capitalize ${completed ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                    {mealType}
                  </span>
                  {completed && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      ✓ Logged
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button 
              className="p-3 text-left rounded-lg border hover:bg-gray-50 transition-colors"
              onClick={() => window.location.href = '/meal-camera'}
              data-testid="button-scan-meal"
            >
              <div className="font-medium text-sm">📸 Scan Meal</div>
              <div className="text-xs text-gray-600">Quick photo logging</div>
            </button>
            
            <button 
              className="p-3 text-left rounded-lg border hover:bg-gray-50 transition-colors"
              onClick={() => window.location.href = '/diet-plan'}
              data-testid="button-view-plan"
            >
              <div className="font-medium text-sm">📋 View Plan</div>
              <div className="text-xs text-gray-600">Today's meal plan</div>
            </button>
            
            <button 
              className="p-3 text-left rounded-lg border hover:bg-gray-50 transition-colors"
              onClick={() => {
                // TODO: Open body measurements modal
                console.log('Open body measurements');
              }}
              data-testid="button-log-weight"
            >
              <div className="font-medium text-sm">⚖️ Log Weight</div>
              <div className="text-xs text-gray-600">Track progress</div>
            </button>
            
            <button 
              className="p-3 text-left rounded-lg border hover:bg-gray-50 transition-colors"
              onClick={() => {
                // TODO: Open AI coach chat
                console.log('Open AI coach');
              }}
              data-testid="button-ai-coach"
            >
              <div className="font-medium text-sm">🤖 AI Coach</div>
              <div className="text-xs text-gray-600">Get guidance</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}