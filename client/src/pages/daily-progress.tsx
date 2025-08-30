import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Award, Calendar, Droplets, Target, TrendingUp, CheckCircle, Star, Trophy, Zap, Crown, Flame, Medal } from "lucide-react";

interface GamificationProfile {
  userId: string;
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  badges: GamificationBadge[];
  dailyQuests: DailyQuest[];
  stats: {
    totalMealsLogged: number;
    recipesGenerated: number;
    avgNutritionScore: number;
    voiceInputsUsed: number;
  };
}

interface GamificationBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt: Date;
}

interface DailyQuest {
  id: string;
  type: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
}

export default function DailyProgress() {
  const [waterIntake, setWaterIntake] = useState(6);

  // Fetch gamification profile
  const { data: gamificationData, isLoading: isGamificationLoading } = useQuery<GamificationProfile>({
    queryKey: ['/api/gamification/profile'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Helper functions for tier colors and icons
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'silver': return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'platinum': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Medal className="h-4 w-4" />;
      case 'silver': return <Star className="h-4 w-4" />;
      case 'gold': return <Trophy className="h-4 w-4" />;
      case 'platinum': return <Crown className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  if (isGamificationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!gamificationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Your Progress Journey!</h2>
          <p className="text-slate-600 mb-4">Start logging meals to unlock your first achievements</p>
          <Button className="bg-emerald-600 hover:bg-emerald-700">Log Your First Meal</Button>
        </div>
      </div>
    );
  }

  const xpToNextLevel = ((gamificationData.currentLevel) * 100) - gamificationData.totalXP;
  const currentLevelXP = gamificationData.totalXP - ((gamificationData.currentLevel - 1) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header with Level and XP */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Crown className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
              Level {gamificationData.currentLevel}
            </h1>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-600">{currentLevelXP} XP</span>
              <span className="text-emerald-600">{xpToNextLevel} XP to next level</span>
            </div>
            <Progress 
              value={(currentLevelXP / 100) * 100} 
              className="h-3 bg-gradient-to-r from-emerald-200 to-purple-200" 
            />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {gamificationData.totalXP.toLocaleString()} Total XP
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{gamificationData.currentStreak}</div>
              <div className="text-sm text-slate-600">Day Streak</div>
              <div className="text-xs text-orange-600 mt-1">Best: {gamificationData.longestStreak} days</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{gamificationData.stats.totalMealsLogged}</div>
              <div className="text-sm text-slate-600">Meals Logged</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{gamificationData.stats.avgNutritionScore}/100</div>
              <div className="text-sm text-slate-600">Avg Score</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-pink-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{gamificationData.badges.length}</div>
              <div className="text-sm text-slate-600">Badges Earned</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Quests */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-lg font-bold text-slate-900">Daily Quests</CardTitle>
              </div>
              <CardDescription>Complete daily challenges to earn XP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gamificationData.dailyQuests.map((quest) => (
                <div 
                  key={quest.id} 
                  className={`p-4 rounded-lg border ${
                    quest.completed 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-slate-50 border-slate-200'
                  } transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">{quest.title}</h3>
                    {quest.completed && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{quest.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{quest.progress}/{quest.target}</span>
                      <span className="text-emerald-600 font-medium">+{quest.xpReward} XP</span>
                    </div>
                    <Progress 
                      value={(quest.progress / quest.target) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Badges Collection */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg font-bold text-slate-900">Achievement Badges</CardTitle>
              </div>
              <CardDescription>Your collection of earned achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {gamificationData.badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {gamificationData.badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className={`p-4 rounded-lg border ${getTierColor(badge.tier)} hover:shadow-md transition-all duration-300`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        {getTierIcon(badge.tier)}
                        <span className="text-2xl">{badge.icon}</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 mb-1">{badge.name}</h3>
                      <p className="text-xs text-slate-600 mb-2">{badge.description}</p>
                      <Badge className={`text-xs ${getTierColor(badge.tier)}`}>
                        {badge.tier.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No badges earned yet</p>
                  <Button variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                    Start Your Journey
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Water Tracking */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-bold text-slate-900">Hydration Tracking</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-700 font-medium">Daily Water Goal: 8 glasses</span>
              <span className="text-blue-600 font-bold">{waterIntake}/8 glasses</span>
            </div>
            <Progress value={(waterIntake / 8) * 100} className="mb-4 h-3" />
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setWaterIntake(Math.max(0, waterIntake - 1))}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                -
              </Button>
              <span className="text-blue-600 font-bold text-lg px-4">{waterIntake}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setWaterIntake(Math.min(12, waterIntake + 1))}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}