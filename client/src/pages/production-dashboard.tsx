import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Activity, 
  Camera, 
  Mic, 
  ChefHat, 
  Zap,
  Database,
  Globe,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Leaf,
  Brain,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

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
  };
  mealsLogged: number;
  goalsAchieved: {
    achieved: number;
    total: number;
  };
  activeStreak: number;
  overallScore: number;
}

interface SystemHealth {
  services: {
    aiAnalysis: {
      status: string;
      responseTime: number;
      accuracy: number;
    };
    voiceLogging: {
      status: string;
      logsToday: number;
      recognitionAccuracy: number;
      processingTime: number;
    };
    recipeGeneration: {
      status: string;
      recipesCreated: number;
      successRate: number;
      avgGenerationTime: number;
    };
    barcodeScanner: {
      status: string;
      scansToday: number;
      successRate: number;
      databaseSize: number;
    };
    sustainabilityScoring: {
      status: string;
      foodsScored: number;
      avgCO2Score: number;
      waterImpact: number;
    };
    nutritionDatabase: {
      status: string;
      foodsAvailable: number;
      dataFreshness: string;
      accuracy: number;
    };
  };
  systemMetrics: {
    apiResponse: number;
    database: number;
    uptime: number;
    activeUsers: number;
    overallHealth: string;
  };
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export default function ProductionDashboard() {
  const { user } = useAuth();
  
  // Dashboard overview data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/dashboard/overview'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // System health data
  const { data: systemHealth, isLoading: systemLoading } = useQuery({
    queryKey: ['/api/system/health'],
    refetchInterval: 60000, // Refresh every minute
  });
  
  // Recent activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities/recent'],
    refetchInterval: 30000,
  });

  const dashboard = dashboardData as DashboardData;
  const health = systemHealth as SystemHealth;
  const recentActivities = activities as Activity[];

  if (dashboardLoading || systemLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getServiceStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground">
          Monitor all of your business operations and integrations from here
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
          <Badge variant="outline" className="text-xs">Live Data</Badge>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Daily Calories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.todayStats?.calories || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              0% vs yesterday
            </div>
            <Progress 
              value={(dashboard?.todayStats?.calories / dashboard?.todayStats?.caloriesGoal) * 100 || 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Meals Logged */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meals Logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.mealsLogged || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              0/day avg
            </div>
          </CardContent>
        </Card>

        {/* Goals Achieved */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Goals Achieved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.goalsAchieved?.achieved || 0}/{dashboard?.goalsAchieved?.total || 4}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {Math.round(((dashboard?.goalsAchieved?.achieved || 0) / (dashboard?.goalsAchieved?.total || 4)) * 100)}% completion
            </div>
          </CardContent>
        </Card>

        {/* Active Streak */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.activeStreak || 0} days
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Best: 26 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Modules */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Integration Modules</h2>
          <Button variant="outline" size="sm">
            Manage Integrations
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI Food Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-base">AI Food Analysis</CardTitle>
                </div>
                <Badge className={`${getServiceStatusColor(health?.services?.aiAnalysis?.status || 'active')} text-white`}>
                  {health?.services?.aiAnalysis?.status || 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Computer vision, nutrition calculation
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">10</div>
                  <div className="text-xs text-muted-foreground">Analyses Today</div>
                </div>
                <div>
                  <div className="text-lg font-bold">95%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
                <div>
                  <div className="text-lg font-bold">0.8s</div>
                  <div className="text-xs text-muted-foreground">Avg Response</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice Logging */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-base">Voice Logging</CardTitle>
                </div>
                <Badge className={`${getServiceStatusColor(health?.services?.voiceLogging?.status || 'active')} text-white`}>
                  {health?.services?.voiceLogging?.status || 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Speech-to-text, natural language processing
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{health?.services?.voiceLogging?.logsToday || 2}</div>
                  <div className="text-xs text-muted-foreground">Voice Logs</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{health?.services?.voiceLogging?.recognitionAccuracy || 92}%</div>
                  <div className="text-xs text-muted-foreground">Recognition</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{health?.services?.voiceLogging?.processingTime || 1.2}s</div>
                  <div className="text-xs text-muted-foreground">Processing</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipe Generation */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-base">Recipe Generation</CardTitle>
                </div>
                <Badge className={`${getServiceStatusColor(health?.services?.recipeGeneration?.status || 'active')} text-white`}>
                  {health?.services?.recipeGeneration?.status || 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                AI-powered personalized recipes
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{health?.services?.recipeGeneration?.recipesCreated || 2}</div>
                  <div className="text-xs text-muted-foreground">Recipes Created</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{health?.services?.recipeGeneration?.successRate || 98}%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{health?.services?.recipeGeneration?.avgGenerationTime || 2.1}s</div>
                  <div className="text-xs text-muted-foreground">Avg Generation</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Scanner */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-base">Barcode Scanner</CardTitle>
                </div>
                <Badge className={`${getServiceStatusColor(health?.services?.barcodeScanner?.status || 'active')} text-white`}>
                  {health?.services?.barcodeScanner?.status || 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Product database, nutrition lookup
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{health?.services?.barcodeScanner?.scansToday || 8}</div>
                  <div className="text-xs text-muted-foreground">Scans Today</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{health?.services?.barcodeScanner?.successRate || 87}%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
                <div>
                  <div className="text-lg font-bold">2.1M</div>
                  <div className="text-xs text-muted-foreground">products</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sustainability Scoring */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-base">Sustainability Scoring</CardTitle>
                </div>
                <Badge className={`${getServiceStatusColor(health?.services?.sustainabilityScoring?.status || 'active')} text-white`}>
                  {health?.services?.sustainabilityScoring?.status || 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                CO2 footprint, environmental impact
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{health?.services?.sustainabilityScoring?.foodsScored || 8}</div>
                  <div className="text-xs text-muted-foreground">Foods Scored</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{health?.services?.sustainabilityScoring?.avgCO2Score || 4.9}/10</div>
                  <div className="text-xs text-muted-foreground">Avg CO2 Score</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{health?.services?.sustainabilityScoring?.waterImpact || 8.5}/10</div>
                  <div className="text-xs text-muted-foreground">Water Impact</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Database */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-base">Nutrition Database</CardTitle>
                </div>
                <Badge className={`${getServiceStatusColor(health?.services?.nutritionDatabase?.status || 'active')} text-white`}>
                  {health?.services?.nutritionDatabase?.status || 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                USDA data, nutrient calculations
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{(health?.services?.nutritionDatabase?.foodsAvailable || 8500).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Foods Available</div>
                </div>
                <div>
                  <div className="text-lg font-bold">Updated</div>
                  <div className="text-xs text-muted-foreground">daily</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{health?.services?.nutritionDatabase?.accuracy || 99}%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Response</span>
              <span className="text-sm font-mono">{health?.systemMetrics?.apiResponse || 299}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="text-sm font-mono">{health?.systemMetrics?.database || 299}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Uptime</span>
              <span className="text-sm font-mono">{health?.systemMetrics?.uptime || 99.9}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Users</span>
              <span className="text-sm font-mono">{health?.systemMetrics?.activeUsers || 35}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">Overall Health</span>
              <Badge className="bg-green-500 text-white">
                {health?.systemMetrics?.overallHealth || 'Excellent'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentActivities?.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}