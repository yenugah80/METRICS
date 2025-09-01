import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

interface MacroData {
  name: string;
  target: number;
  actual: number;
  unit: string;
}

interface MacroProgressChartProps {
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  actualIntake: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  className?: string;
}

export function MacroProgressChart({ dailyTargets, actualIntake, className = "" }: MacroProgressChartProps) {
  // Color coding function based on adherence
  const getProgressColor = (actual: number, target: number): string => {
    const percentage = (actual / target) * 100;
    if (percentage >= 90 && percentage <= 110) return 'hsl(142, 76%, 36%)'; // Green - good
    if (percentage >= 80 && percentage <= 120) return 'hsl(32, 95%, 44%)'; // Orange - medium
    return 'hsl(0, 84%, 60%)'; // Red - bad
  };

  const getStatusIcon = (actual: number, target: number) => {
    const percentage = (actual / target) * 100;
    if (percentage >= 90 && percentage <= 110) return <Target className="h-4 w-4 text-green-600" />;
    if (percentage > 110) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (percentage < 90) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-orange-500" />;
  };

  const getStatusText = (actual: number, target: number): string => {
    const percentage = (actual / target) * 100;
    if (percentage >= 90 && percentage <= 110) return 'On Track';
    if (percentage > 110) return 'Over Target';
    return 'Under Target';
  };

  const macroData: MacroData[] = [
    { name: 'Calories', target: dailyTargets.calories, actual: actualIntake.calories, unit: 'kcal' },
    { name: 'Protein', target: dailyTargets.protein, actual: actualIntake.protein, unit: 'g' },
    { name: 'Carbs', target: dailyTargets.carbs, actual: actualIntake.carbs, unit: 'g' },
    { name: 'Fat', target: dailyTargets.fat, actual: actualIntake.fat, unit: 'g' },
    { name: 'Fiber', target: dailyTargets.fiber, actual: actualIntake.fiber, unit: 'g' },
  ];

  // Pie chart data for macro distribution
  const pieData = [
    { name: 'Protein', value: actualIntake.protein * 4, fill: '#8884d8' },
    { name: 'Carbs', value: actualIntake.carbs * 4, fill: '#82ca9d' },
    { name: 'Fat', value: actualIntake.fat * 9, fill: '#ffc658' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Daily Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-blue-600" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {macroData.map((macro) => {
              const percentage = Math.min((macro.actual / macro.target) * 100, 100);
              const color = getProgressColor(macro.actual, macro.target);
              const status = getStatusText(macro.actual, macro.target);
              
              return (
                <div key={macro.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{macro.name}</span>
                    {getStatusIcon(macro.actual, macro.target)}
                  </div>
                  
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{ 
                      '--progress-foreground': color 
                    } as React.CSSProperties}
                  />
                  
                  <div className="text-xs text-muted-foreground">
                    <div>{macro.actual.toFixed(0)} / {macro.target.toFixed(0)} {macro.unit}</div>
                    <Badge 
                      variant={status === 'On Track' ? 'default' : 'secondary'}
                      className={`text-xs ${
                        status === 'On Track' ? 'bg-green-100 text-green-800' :
                        status === 'Over Target' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Macro Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calorie Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} kcal`, 'Calories']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={macroData.slice(1)}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number, name: string) => [
                  `${value}g`, 
                  name === 'target' ? 'Target' : 'Actual'
                ]} />
                <Bar dataKey="target" fill="#e2e8f0" name="target" />
                <Bar dataKey="actual" fill="#3b82f6" name="actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}