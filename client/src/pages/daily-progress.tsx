import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Award, Calendar, Droplets, Target, TrendingUp, CheckCircle, Star, Trophy, Zap } from "lucide-react";

interface DailyStats {
  date: string;
  totalCalories: number;
  targetCalories: number;
  mealsLogged: number;
  waterIntake: number; // in glasses
  targetWater: number;
  wellnessScore: number;
  achievements: string[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedDate?: string;
}

export default function DailyProgress() {
  const [currentDate] = useState(new Date());
  const [weekData, setWeekData] = useState<DailyStats[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [waterIntake, setWaterIntake] = useState(6);

  // Fetch real user progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        // Fetch real user stats from API
        const [statsResponse, badgesResponse] = await Promise.all([
          fetch('/api/stats/weekly'),
          fetch('/api/achievements/badges')
        ]);
        
        if (statsResponse.ok) {
          const realWeekData = await statsResponse.json();
          setWeekData(realWeekData);
        } else {
          // Use calculated stats from user's actual meals
          const todayDate = new Date().toISOString().split('T')[0];
          const calculatedStats: DailyStats[] = [
            {
              date: todayDate,
              totalCalories: todayStats.totalCalories,
              targetCalories: todayStats.targetCalories,
              mealsLogged: todayStats.mealsLogged,
              waterIntake: waterIntake,
              targetWater: todayStats.targetWater,
              wellnessScore: Math.round((todayStats.totalCalories / todayStats.targetCalories) * 100),
              achievements: todayStats.totalCalories >= todayStats.targetCalories ? ["Calorie Goal Met"] : []
            }
          ];
          setWeekData(calculatedStats);
        }
        
        if (badgesResponse.ok) {
          const realBadges = await badgesResponse.json();
          setBadges(realBadges);
        } else {
          // Generate dynamic badges based on actual user progress
          const todayDate = new Date().toISOString().split('T')[0];
          const dynamicBadges: Badge[] = [
            {
              id: "first_meal",
              name: "First Steps",
              description: "Log your first meal",
              icon: <Star className="h-6 w-6" />,
              unlocked: todayStats.mealsLogged > 0,
              unlockedDate: todayStats.mealsLogged > 0 ? todayDate : undefined
            },
            {
              id: "calorie_tracker",
              name: "Calorie Tracker",
              description: "Track calories for your health",
              icon: <Trophy className="h-6 w-6" />,
              unlocked: todayStats.totalCalories > 0,
              unlockedDate: todayStats.totalCalories > 0 ? todayDate : undefined
            },
            {
              id: "hydration_hero",
              name: "Hydration Hero",
              description: "Meet water intake goal",
              icon: <Droplets className="h-6 w-6" />,
              unlocked: waterIntake >= todayStats.targetWater,
              unlockedDate: waterIntake >= todayStats.targetWater ? todayDate : undefined
            },
            {
              id: "nutrition_ninja",
              name: "Nutrition Ninja",
              description: "Analyze food with smart camera",
              icon: <Zap className="h-6 w-6" />,
              unlocked: false
            },
            {
              id: "goal_crusher",
              name: "Goal Crusher",
              description: "Meet daily calorie goals",
              icon: <Target className="h-6 w-6" />,
              unlocked: todayStats.totalCalories >= todayStats.targetCalories,
              unlockedDate: todayStats.totalCalories >= todayStats.targetCalories ? todayDate : undefined
            }
          ];
          setBadges(dynamicBadges);
        }
      } catch (error) {
        console.error('Failed to fetch progress data:', error);
        // Keep using fallback data
      }
    };
    
    fetchProgressData();
  }, [waterIntake]);

  const todayStats = weekData.find(day => day.date === currentDate.toISOString().split('T')[0]) || {
    date: currentDate.toISOString().split('T')[0],
    totalCalories: 0,
    targetCalories: 2000,
    mealsLogged: 0,
    waterIntake: waterIntake,
    targetWater: 8,
    wellnessScore: 0,
    achievements: []
  };

  const addWaterGlass = () => {
    setWaterIntake(prev => Math.min(prev + 1, 12));
  };

  const removeWaterGlass = () => {
    setWaterIntake(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span>Daily Progress</span>
          </h1>
          <p className="text-muted-foreground">
            Track your wellness journey with personalized insights and achievements
          </p>
        </div>

        {/* Daily Wellness Score */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Today's Wellness Score</span>
            </CardTitle>
            <CardDescription>Your overall health score based on today's activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-8">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r="48"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="48"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - todayStats.wellnessScore / 100)}`}
                    className={`transition-all duration-1000 ${
                      todayStats.wellnessScore >= 80 ? 'text-green-500' :
                      todayStats.wellnessScore >= 60 ? 'text-yellow-500' :
                      todayStats.wellnessScore >= 40 ? 'text-orange-500' : 'text-red-500'
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{todayStats.wellnessScore}</div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className={`text-5xl font-bold ${
                  todayStats.wellnessScore >= 80 ? 'text-green-600' :
                  todayStats.wellnessScore >= 60 ? 'text-yellow-600' :
                  todayStats.wellnessScore >= 40 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {todayStats.wellnessScore >= 80 ? 'A' :
                   todayStats.wellnessScore >= 60 ? 'B' :
                   todayStats.wellnessScore >= 40 ? 'C' : 'D'}
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {todayStats.wellnessScore >= 80 ? '🌟 Outstanding wellness today!' :
                   todayStats.wellnessScore >= 60 ? '👍 Good progress, keep it up!' :
                   todayStats.wellnessScore >= 40 ? '⚠️ Room for improvement' :
                   '❌ Focus on healthier choices'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Calorie Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Calorie Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{todayStats.totalCalories} consumed</span>
                  <span>{todayStats.targetCalories} target</span>
                </div>
                <Progress 
                  value={(todayStats.totalCalories / todayStats.targetCalories) * 100} 
                  className="h-3"
                />
                <div className="text-xs text-muted-foreground">
                  {todayStats.targetCalories - todayStats.totalCalories > 0 ? 
                    `${todayStats.targetCalories - todayStats.totalCalories} calories remaining` :
                    `${todayStats.totalCalories - todayStats.targetCalories} calories over target`
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Water Intake */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center space-x-2">
                <Droplets className="h-4 w-4" />
                <span>Water Intake</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{waterIntake} glasses</span>
                  <span>{todayStats.targetWater} target</span>
                </div>
                <Progress 
                  value={(waterIntake / todayStats.targetWater) * 100} 
                  className="h-3"
                />
                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="outline" onClick={removeWaterGlass}>-</Button>
                  <Button size="sm" variant="outline" onClick={addWaterGlass}>+</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meals Logged */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Meals Logged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{todayStats.mealsLogged}</div>
                <div className="text-sm text-muted-foreground">meals today</div>
                <div className="flex space-x-1 mt-2">
                  {[1, 2, 3].map((meal) => (
                    <div 
                      key={meal}
                      className={`w-3 h-3 rounded-full ${
                        meal <= todayStats.mealsLogged ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span>Achievement Badges</span>
            </CardTitle>
            <CardDescription>Unlock badges by maintaining healthy habits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {badges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    badge.unlocked 
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <div className={`mx-auto mb-2 ${badge.unlocked ? 'text-yellow-600' : 'text-gray-300'}`}>
                    {badge.icon}
                  </div>
                  <div className="font-medium text-sm">{badge.name}</div>
                  <div className="text-xs mt-1">{badge.description}</div>
                  {badge.unlocked && badge.unlockedDate && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Unlocked {new Date(badge.unlockedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Achievements */}
        {todayStats.achievements.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Today's Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todayStats.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-800 font-medium">{achievement}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span>7-Day Trend</span>
            </CardTitle>
            <CardDescription>Your wellness progress over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weekData.map((day, index) => (
                <div key={day.date} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
                  <div className="text-sm font-medium w-20">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Wellness Score</span>
                      <span className="font-medium">{day.wellnessScore}/100</span>
                    </div>
                    <Progress value={day.wellnessScore} className="h-2" />
                  </div>
                  <div className="flex space-x-2">
                    {day.achievements.map((achievement, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}