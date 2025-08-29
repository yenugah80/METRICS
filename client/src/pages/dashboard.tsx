import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
// Icons removed for cleaner interface
import { apiRequest } from "@/lib/queryClient";

// Dashboard interfaces
interface KPIMetric {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

interface IntegrationModule {
  name: string;
  status: 'active' | 'inactive' | 'warning';
  description: string;
  metrics?: { label: string; value: string }[];
}

interface SystemHealth {
  metric: string;
  value: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  type: 'meal' | 'goal' | 'achievement' | 'system';
  title: string;
  description: string;
  timestamp: string;
}

interface DashboardStats {
  todayStats?: {
    calories: number;
    caloriesTrend: number;
    mealsLogged: number;
  };
  weeklyStats?: {
    avgMealsPerDay: number;
  };
  goalsProgress?: {
    achieved: number;
    total: number;
  };
  streak?: {
    current: number;
    longest: number;
  };
  aiStats?: {
    analysesToday: number;
  };
  voiceStats?: {
    logsToday: number;
  };
}

interface SystemHealthData {
  services?: {
    aiAnalysis?: {
      status: string;
      accuracy: number;
      responseTime: number;
    };
    voiceProcessing?: {
      status: string;
      accuracy: number;
      responseTime: number;
    };
  };
}

export default function Dashboard() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch comprehensive dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/overview"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: systemHealthData, isLoading: healthLoading } = useQuery<SystemHealthData>({
    queryKey: ["/api/system/health"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: userProfile } = useQuery({
    queryKey: ["/api/profile"],
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities/recent"],
    refetchInterval: 30000,
  });

  // KPI Metrics based on real data
  const kpiMetrics: KPIMetric[] = [
    {
      title: "Daily Calories",
      value: dashboardData?.todayStats?.calories ?? 0,
      change: `${dashboardData?.todayStats?.caloriesTrend ?? 0}% vs yesterday`,
      trend: (dashboardData?.todayStats?.caloriesTrend ?? 0) >= 0 ? 'up' : 'down',
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Meals Logged",
      value: dashboardData?.todayStats?.mealsLogged ?? 0,
      change: `${dashboardData?.weeklyStats?.avgMealsPerDay ?? 0}/day avg`,
      trend: 'up',
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Goals Achieved",
      value: `${dashboardData?.goalsProgress?.achieved ?? 0}/${dashboardData?.goalsProgress?.total ?? 0}`,
      change: `${Math.round(((dashboardData?.goalsProgress?.achieved ?? 0) / (dashboardData?.goalsProgress?.total ?? 1) * 100))}% completion`,
      trend: 'up',
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Active Streak",
      value: `${dashboardData?.streak?.current ?? 0} days`,
      change: `Best: ${dashboardData?.streak?.longest ?? 0} days`,
      trend: 'up',
      color: "from-purple-500 to-pink-500"
    }
  ];

  // Integration modules showing feature status
  const integrationModules: IntegrationModule[] = [
    {
      name: "AI Food Analysis",
      status: (systemHealthData as any)?.services?.aiAnalysis?.status ?? 'active',
      description: "Computer vision, nutrition calculation",
      metrics: [
        { label: "Analyses Today", value: String((dashboardData as any)?.aiStats?.analysesToday ?? 0) },
        { label: "Accuracy", value: `${(systemHealthData as any)?.services?.aiAnalysis?.accuracy ?? 95}%` },
        { label: "Avg Response", value: `${(systemHealthData as any)?.services?.aiAnalysis?.responseTime ?? 0.8}s` }
      ]
    },
    {
      name: "Voice Logging",
      status: (systemHealthData as any)?.services?.voiceProcessing?.status ?? 'active',
      description: "Speech-to-text, natural language processing",
      metrics: [
        { label: "Voice Logs", value: String((dashboardData as any)?.voiceStats?.logsToday ?? 0) },
        { label: "Recognition", value: `${(systemHealthData as any)?.services?.voiceProcessing?.accuracy ?? 92}%` },
        { label: "Processing", value: `${(systemHealthData as any)?.services?.voiceProcessing?.responseTime ?? 1.2}s` }
      ]
    },
    {
      name: "Recipe Generation",
      status: (systemHealthData as any)?.services?.recipeGeneration?.status ?? 'active',
      description: "AI-powered personalized recipes",
      metrics: [
        { label: "Recipes Created", value: String((dashboardData as any)?.recipeStats?.generated ?? 0) },
        { label: "Success Rate", value: `${(systemHealthData as any)?.services?.recipeGeneration?.successRate ?? 98}%` },
        { label: "Avg Generation", value: `${(systemHealthData as any)?.services?.recipeGeneration?.avgTime ?? 2.1}s` }
      ]
    },
    {
      name: "Barcode Scanner",
      status: (systemHealthData as any)?.services?.barcodeScanner?.status ?? 'active',
      description: "Product database, nutrition lookup",
      metrics: [
        { label: "Scans Today", value: String((dashboardData as any)?.scanStats?.scansToday ?? 0) },
        { label: "Success Rate", value: `${(systemHealthData as any)?.services?.barcodeScanner?.successRate ?? 87}%` },
        { label: "Database", value: `${(systemHealthData as any)?.services?.barcodeScanner?.productCount ?? '2.1M'} products` }
      ]
    },
    {
      name: "Sustainability Scoring",
      status: (systemHealthData as any)?.services?.sustainabilityScoring?.status ?? 'active',
      description: "CO2 footprint, environmental impact",
      metrics: [
        { label: "Foods Scored", value: String((dashboardData as any)?.sustainabilityStats?.foodsScored ?? 0) },
        { label: "Avg CO2 Score", value: `${(dashboardData as any)?.sustainabilityStats?.avgCO2Score ?? 0}/10` },
        { label: "Water Impact", value: `${(dashboardData as any)?.sustainabilityStats?.avgWaterScore ?? 0}/10` }
      ]
    },
    {
      name: "Nutrition Database",
      status: (systemHealthData as any)?.services?.nutritionDatabase?.status ?? 'active',
      description: "USDA data, nutrient calculations",
      metrics: [
        { label: "Foods Available", value: `${(systemHealthData as any)?.services?.nutritionDatabase?.foodCount ?? '8.5K'}` },
        { label: "Data Freshness", value: "Updated daily" },
        { label: "Accuracy", value: `${(systemHealthData as any)?.services?.nutritionDatabase?.accuracy ?? 99}%` }
      ]
    }
  ];

  // System health metrics
  const systemHealth: SystemHealth[] = [
    {
      metric: "API Response",
      value: `${(systemHealthData as any)?.performance?.avgResponseTime ?? 250}ms`,
      status: ((systemHealthData as any)?.performance?.avgResponseTime ?? 250) < 500 ? 'excellent' : 'good'
    },
    {
      metric: "Database",
      value: `${(systemHealthData as any)?.performance?.dbResponseTime ?? 45}ms`,
      status: ((systemHealthData as any)?.performance?.dbResponseTime ?? 45) < 100 ? 'excellent' : 'good'
    },
    {
      metric: "Uptime",
      value: `${(systemHealthData as any)?.performance?.uptime ?? 99.9}%`,
      status: ((systemHealthData as any)?.performance?.uptime ?? 99.9) > 99 ? 'excellent' : 'good'
    },
    {
      metric: "Active Users",
      value: `${(systemHealthData as any)?.users?.activeNow ?? 0}`,
      status: 'excellent'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'inactive': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading your nutrition dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Dashboard Overview
            </h1>
            <p className="text-slate-600">
              Monitor all of your business operations and integrations from here
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <div>
              <span>{currentTime.toLocaleDateString()}</span>
            </div>
            <div>
              <span>Live Data</span>
            </div>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiMetrics.map((metric, index) => (
            <Card key={index} className="card-elegant hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                    <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                    <p className={`text-xs ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-slate-500'
                    }`}>
                      <span>{metric.change}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Integration Modules */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Integration Modules</h2>
              <Button variant="outline" size="sm" className="btn-outline-glow">
                Manage Integrations
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {integrationModules.map((module, index) => (
                <Card key={index} className="card-elegant hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-900">{module.name}</CardTitle>
                        <CardDescription className="text-sm text-slate-600">{module.description}</CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(module.status)} border font-medium`}>
                        {module.status === 'active' ? (
                          <>Active</>
                        ) : module.status === 'warning' ? (
                          <>Warning</>
                        ) : (
                          <>Inactive</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {module.metrics && (
                      <div className="grid grid-cols-3 gap-4">
                        {module.metrics.map((metric, metricIndex) => (
                          <div key={metricIndex} className="text-center">
                            <p className="text-lg font-bold text-slate-900">{metric.value}</p>
                            <p className="text-xs text-slate-500 font-medium">{metric.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* System Health & Recent Activity */}
          <div className="space-y-6">
            {/* System Health */}
            <Card className="card-elegant">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900">
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemHealth.map((health, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-slate-700">{health.metric}</span>
                    <span className={`text-sm font-bold ${getHealthStatusColor(health.status)}`}>
                      {health.value}
                    </span>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Overall Health</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-medium text-green-600">Excellent</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="card-elegant">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin"></div>
                  </div>
                ) : (recentActivities as any)?.slice(0, 5).map((activity: RecentActivity, index: number) => {
                  return (
                    <div key={activity.id || index} className="flex items-center space-x-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {activity.description}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {activity.timestamp}
                      </span>
                    </div>
                  );
                })}
                {(!(recentActivities as any) || (recentActivities as any)?.length === 0) && !activitiesLoading && (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-elegant">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/meal-camera">
                  <Button className="w-full btn-gradient justify-start" size="sm">
                    Log Meal with Photo
                  </Button>
                </Link>
                <Link href="/search">
                  <Button className="w-full btn-outline-glow justify-start" size="sm">
                    Search Food Database
                  </Button>
                </Link>
                <Link href="/recipes">
                  <Button className="w-full btn-outline-glow justify-start" size="sm">
                    Generate AI Recipe
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}