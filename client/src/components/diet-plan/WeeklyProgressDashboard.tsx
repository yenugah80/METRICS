import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Flame,
  Activity,
  CheckCircle
} from 'lucide-react';

interface DayProgress {
  day: number;
  date: string;
  adherenceScore: number;
  calories: number;
  protein: number;
  targetCalories: number;
  targetProtein: number;
  streakContinued: boolean;
}

interface WeeklyStats {
  averageAdherence: number;
  streakDays: number;
  bestDay: DayProgress;
  improvementAreas: string[];
  achievements: string[];
}

interface WeeklyProgressDashboardProps {
  weekData: DayProgress[];
  weeklyStats: WeeklyStats;
  className?: string;
}

export function WeeklyProgressDashboard({ weekData, weeklyStats, className = "" }: WeeklyProgressDashboardProps) {
  // Format data for charts
  const chartData = weekData.map(day => ({
    day: `Day ${day.day}`,
    adherence: day.adherenceScore,
    calories: day.calories,
    protein: day.protein,
    targetCalories: day.targetCalories,
    targetProtein: day.targetProtein,
    date: day.date,
  }));

  const getAdherenceColor = (score: number) => {
    if (score >= 90) return 'hsl(142, 76%, 36%)'; // Green
    if (score >= 70) return 'hsl(32, 95%, 44%)'; // Orange
    return 'hsl(0, 84%, 60%)'; // Red
  };

  const getAdherenceText = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Focus';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Target className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Weekly Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Average</p>
                <p className="text-2xl font-bold">{weeklyStats.averageAdherence.toFixed(0)}%</p>
                <p 
                  className="text-sm font-medium"
                  style={{ color: getAdherenceColor(weeklyStats.averageAdherence) }}
                >
                  {getAdherenceText(weeklyStats.averageAdherence)}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Streak Days</p>
                <p className="text-2xl font-bold text-orange-600">{weeklyStats.streakDays}</p>
                <p className="text-sm text-muted-foreground">consecutive</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Best Day</p>
                <p className="text-2xl font-bold text-green-600">{weeklyStats.bestDay?.adherenceScore.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Day {weeklyStats.bestDay?.day}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold text-purple-600">{weeklyStats.achievements.length}</p>
                <p className="text-sm text-muted-foreground">unlocked</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adherence Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Weekly Adherence Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value.toFixed(0)}%`, 
                  'Adherence Score'
                ]}
                labelFormatter={(label: string) => `${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="adherence" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Nutrition Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Nutrition Targets vs Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name.includes('target') ? `${value} (target)` : `${value} (actual)`,
                  name.includes('calories') ? 'Calories' : 'Protein (g)'
                ]}
              />
              <Line type="monotone" dataKey="targetCalories" stroke="#e2e8f0" strokeDasharray="5 5" name="calories target" />
              <Line type="monotone" dataKey="calories" stroke="#3b82f6" name="calories actual" />
              <Line type="monotone" dataKey="targetProtein" stroke="#f1f5f9" strokeDasharray="5 5" name="protein target" />
              <Line type="monotone" dataKey="protein" stroke="#10b981" name="protein actual" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Achievements & Areas for Improvement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-yellow-500" />
              This Week's Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyStats.achievements.length > 0 ? (
              <div className="space-y-2">
                {weeklyStats.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Keep going! Achievements unlock as you maintain consistency.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-blue-500" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyStats.improvementAreas.length > 0 ? (
              <div className="space-y-2">
                {weeklyStats.improvementAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Excellent work! You're hitting all your targets consistently.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}