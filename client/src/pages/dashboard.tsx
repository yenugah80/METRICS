import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  Zap, 
  Target, 
  Calendar, 
  TrendingUp, 
  Award,
  Camera,
  Mic,
  Activity,
  Droplets,
  Moon,
  Footprints,
  ChefHat,
  User,
  CheckCircle,
  Clock,
  CalendarDays,
  Flame
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardData {
  user: {
    firstName: string;
    profileImageUrl?: string;
    level: number;
    xp: number;
    currentStreak: number;
  };
  today: {
    date: string;
    calories: { consumed: number; goal: number; burned: number };
    macros: { protein: number; carbs: number; fat: number };
    steps: { count: number; goal: number };
    water: { intake: number; goal: number };
    sleep: { hours: number; quality: number };
    weight: { current: number; target: number; trend: string };
  };
  workouts: Array<{
    id: string;
    name: string;
    type: string;
    duration: number;
    progress: number;
    difficulty: string;
  }>;
  meals: Array<{
    id: string;
    name: string;
    mealType: string;
    calories: number;
    protein: number;
    imageUrl?: string;
    loggedAt: string;
  }>;
  recommendations: {
    meals: Array<{
      id: string;
      name: string;
      calories: number;
      prepTime: number;
      difficulty: string;
      nutritionMatch: number;
    }>;
    exercises: Array<{
      id: string;
      name: string;
      type: string;
      duration: number;
      difficulty: string;
    }>;
  };
  achievements: Array<{
    id: string;
    title: string;
    type: string;
    progress: number;
    isCompleted: boolean;
    points: number;
  }>;
  activity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    icon: string;
  }>;
}

// Mock comprehensive dashboard data - will be replaced with real API calls
const mockDashboardData: DashboardData = {
  user: {
    firstName: "Adam",
    profileImageUrl: "/api/placeholder/profile.jpg",
    level: 5,
    xp: 2340,
    currentStreak: 7
  },
  today: {
    date: new Date().toISOString().split('T')[0],
    calories: { consumed: 1240, goal: 2100, burned: 320 },
    macros: { protein: 95, carbs: 140, fat: 45 },
    steps: { count: 8050, goal: 10000 },
    water: { intake: 1.8, goal: 2.5 },
    sleep: { hours: 7.5, quality: 8 },
    weight: { current: 78, target: 75, trend: "down" }
  },
  workouts: [
    { id: "1", name: "Running", type: "cardio", duration: 30, progress: 75, difficulty: "medium" },
    { id: "2", name: "Strength Training", type: "strength", duration: 45, progress: 100, difficulty: "hard" },
    { id: "3", name: "Yoga", type: "flexibility", duration: 20, progress: 60, difficulty: "easy" }
  ],
  meals: [
    { id: "1", name: "Scrambled Eggs with Spinach & Whole Grain Toast", mealType: "breakfast", calories: 380, protein: 24, loggedAt: "2025-09-01T08:30:00Z" },
    { id: "2", name: "Grilled Chicken Salad with Avocado and Quinoa", mealType: "lunch", calories: 520, protein: 35, loggedAt: "2025-09-01T13:15:00Z" },
    { id: "3", name: "Greek Yogurt with Mixed Berries and Almonds", mealType: "snack", calories: 180, protein: 15, loggedAt: "2025-09-01T16:00:00Z" }
  ],
  recommendations: {
    meals: [
      { id: "1", name: "Oatmeal with Almond Butter", calories: 380, prepTime: 10, difficulty: "easy", nutritionMatch: 0.92 },
      { id: "2", name: "Grilled Chicken Wrap", calories: 450, prepTime: 15, difficulty: "easy", nutritionMatch: 0.88 },
      { id: "3", name: "Salmon with Steamed Vegetables", calories: 520, prepTime: 25, difficulty: "medium", nutritionMatch: 0.95 }
    ],
    exercises: [
      { id: "1", name: "Brisk Walking", type: "cardio", duration: 30, difficulty: "easy" },
      { id: "2", name: "Bodyweight Squats", type: "strength", duration: 15, difficulty: "medium" },
      { id: "3", name: "Dumbbell Squats", type: "strength", duration: 20, difficulty: "medium" }
    ]
  },
  achievements: [
    { id: "1", title: "7 Day Streak", type: "consistency", progress: 100, isCompleted: true, points: 500 },
    { id: "2", title: "Hydration Hero", type: "wellness", progress: 75, isCompleted: false, points: 250 },
    { id: "3", title: "Macro Master", type: "nutrition", progress: 85, isCompleted: false, points: 300 }
  ],
  activity: [
    { id: "1", type: "notification", message: "Congratulations! You've completed 75% of your cardio session for flexibility improvement.", timestamp: "2025-09-01T14:30:00Z", icon: "award" },
    { id: "2", type: "milestone", message: "You've completed our 3rd workout session for flexibility improvement.", timestamp: "2025-09-01T12:00:00Z", icon: "target" },
    { id: "3", type: "progress", message: "Cardio progress completed - 7.5 km completed out of 8 km goal for endurance improvement.", timestamp: "2025-09-01T09:15:00Z", icon: "activity" }
  ]
};

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isScanning, setIsScanning] = useState(false);

  // In production, this would fetch real data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/comprehensive'],
    queryFn: () => Promise.resolve(mockDashboardData), // Mock for now
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleScanMeal = () => {
    setIsScanning(true);
    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Meal Scanned Successfully!",
        description: "Grilled Salmon (380 cal, 35g protein) added to your log.",
      });
    }, 2000);
  };

  const handleVoiceLog = () => {
    toast({
      title: "Voice Logging",
      description: "Voice meal logging feature coming soon!",
    });
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading your nutrition dashboard...</p>
        </div>
      </div>
    );
  }

  const data = dashboardData;
  const calorieProgress = (data.today.calories.consumed / data.today.calories.goal) * 100;
  const stepsProgress = (data.today.steps.count / data.today.steps.goal) * 100;
  const waterProgress = (data.today.water.intake / data.today.water.goal) * 100;
  const proteinProgress = (data.today.macros.protein / 150) * 100; // Assuming 150g protein goal

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Header - Personal Greeting */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {data.user.firstName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hello, {data.user.firstName}!</h1>
                <p className="text-gray-600">Let's begin our journey to better health today.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Level {data.user.level}</div>
                <div className="text-lg font-bold text-purple-600">{data.user.xp} XP</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-200">
                <CalendarDays className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <div className="text-sm font-bold text-orange-600">{format(selectedDate, 'MMM')}</div>
                <div className="text-lg font-bold text-orange-800">{format(selectedDate, 'd')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Key Metrics */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Weight */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mx-auto mb-2">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{data.today.weight.current}</div>
                  <div className="text-sm text-gray-500">kg</div>
                  <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    -2% this week
                  </div>
                </CardContent>
              </Card>

              {/* Steps */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
                    <Footprints className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{data.today.steps.count.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">steps</div>
                  <div className="text-xs text-blue-600">{Math.round(stepsProgress)}% of goal</div>
                </CardContent>
              </Card>

              {/* Sleep */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2">
                    <Moon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{data.today.sleep.hours}</div>
                  <div className="text-sm text-gray-500">hours</div>
                  <div className="text-xs text-purple-600">Quality: {data.today.sleep.quality}/10</div>
                </CardContent>
              </Card>

              {/* Water */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-cyan-100 rounded-full mx-auto mb-2">
                    <Droplets className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{data.today.water.intake}</div>
                  <div className="text-sm text-gray-500">L of {data.today.water.goal}L</div>
                  <Progress value={waterProgress} className="h-1 mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Nutrition Overview */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-500" />
                  Today's Nutrition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Calories Circle */}
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="40"
                          fill="transparent"
                          stroke="#f97316"
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - calorieProgress / 100)}`}
                          className="transition-all duration-1000 ease-out"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-orange-600">{data.today.calories.consumed}</span>
                        <span className="text-xs text-gray-500">of {data.today.calories.goal}</span>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-800 mt-2">Calories</p>
                    <p className="text-sm text-gray-600">{Math.round(calorieProgress)}% of goal</p>
                  </div>

                  {/* Macro Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Protein</span>
                      <span className="text-sm font-bold text-blue-600">{data.today.macros.protein}g</span>
                    </div>
                    <Progress value={proteinProgress} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Carbs</span>
                      <span className="text-sm font-bold text-green-600">{data.today.macros.carbs}g</span>
                    </div>
                    <Progress value={70} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Fat</span>
                      <span className="text-sm font-bold text-orange-600">{data.today.macros.fat}g</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workout Progress */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Workout Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {data.workouts.map((workout, index) => (
                    <div key={workout.id} className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                        workout.type === 'cardio' ? 'bg-green-100' :
                        workout.type === 'strength' ? 'bg-orange-100' : 'bg-purple-100'
                      }`}>
                        {workout.type === 'cardio' ? <Heart className="w-6 h-6 text-green-600" /> :
                         workout.type === 'strength' ? <Zap className="w-6 h-6 text-orange-600" /> :
                         <Activity className="w-6 h-6 text-purple-600" />}
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-1">{workout.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{workout.progress}% ({workout.difficulty})</p>
                      <Progress value={workout.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity & Recommendations */}
          <div className="space-y-6">
            
            {/* Recent Activity */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {item.icon === 'award' ? <Award className="w-4 h-4 text-green-600" /> :
                       item.icon === 'target' ? <Target className="w-4 h-4 text-blue-600" /> :
                       <Activity className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 leading-relaxed">{item.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{format(new Date(item.timestamp), 'HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  Recommended
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="meals" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="meals">Meals</TabsTrigger>
                    <TabsTrigger value="exercises">Exercises</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="meals" className="space-y-3 mt-4">
                    {data.recommendations.meals.slice(0, 3).map((meal) => (
                      <div key={meal.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-800 text-sm">{meal.name}</h4>
                          <Badge variant="outline" className="text-xs">{meal.calories} cal</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{meal.prepTime} min</span>
                          <span>•</span>
                          <span className="capitalize">{meal.difficulty}</span>
                          <span>•</span>
                          <span className="text-green-600">{Math.round(meal.nutritionMatch * 100)}% match</span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="exercises" className="space-y-3 mt-4">
                    {data.recommendations.exercises.map((exercise) => (
                      <div key={exercise.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-800 text-sm">{exercise.name}</h4>
                          <Badge variant="outline" className="text-xs">{exercise.duration} min</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Activity className="w-3 h-3" />
                          <span className="capitalize">{exercise.type}</span>
                          <span>•</span>
                          <span className="capitalize">{exercise.difficulty}</span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      achievement.isCompleted ? 'bg-green-100' : 'bg-gray-200'
                    }`}>
                      {achievement.isCompleted ? 
                        <CheckCircle className="w-5 h-5 text-green-600" /> :
                        <Clock className="w-5 h-5 text-gray-500" />
                      }
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm">{achievement.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={achievement.progress} className="h-1 flex-1" />
                        <span className="text-xs text-gray-600">{achievement.progress}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-purple-600">+{achievement.points}</div>
                      <div className="text-xs text-gray-500">XP</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={handleScanMeal}
            disabled={isScanning}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-6 h-auto rounded-xl shadow-lg transition-all duration-200"
            data-testid="button-scan"
          >
            <div className="text-center">
              {isScanning ? (
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              ) : (
                <Camera className="w-8 h-8 mx-auto mb-2" />
              )}
              <span className="text-sm font-medium">
                {isScanning ? 'Scanning...' : 'Scan Meal'}
              </span>
            </div>
          </Button>
          
          <Button 
            variant="outline"
            className="border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 p-6 h-auto rounded-xl shadow-lg transition-all duration-200"
            onClick={handleVoiceLog}
            data-testid="button-voice"
          >
            <div className="text-center">
              <Mic className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Voice Log</span>
            </div>
          </Button>
          
          <Button 
            variant="outline"
            className="border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 p-6 h-auto rounded-xl shadow-lg transition-all duration-200"
            onClick={() => window.location.href = '/profile'}
            data-testid="button-profile"
          >
            <div className="text-center">
              <User className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Profile</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}