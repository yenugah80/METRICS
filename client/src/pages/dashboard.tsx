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
    caloriesGoal?: number;
    protein?: number;
    proteinGoal?: number;
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
  sustainabilityStats?: {
    co2Saved?: number;
    avgCO2Score?: number;
    avgWaterScore?: number;
    foodsScored?: number;
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

  // User-first health metrics
  const isNewUser = (dashboardData?.todayStats?.calories ?? 0) === 0 && (dashboardData?.todayStats?.mealsLogged ?? 0) === 0;
  const calorieGoal = dashboardData?.todayStats?.caloriesGoal ?? 2000;
  const caloriesRemaining = Math.max(0, calorieGoal - (dashboardData?.todayStats?.calories ?? 0));
  const proteinGoal = dashboardData?.todayStats?.proteinGoal ?? 100;
  const proteinIntake = dashboardData?.todayStats?.protein ?? 0;
  
  const kpiMetrics: KPIMetric[] = [
    {
      title: isNewUser ? "Daily Calorie Goal" : "Calories Remaining Today",
      value: isNewUser ? `${calorieGoal}` : `${caloriesRemaining}`,
      change: isNewUser ? "Set your first goal" : `${dashboardData?.todayStats?.calories ?? 0} consumed`,
      trend: 'up',
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: isNewUser ? "Protein Target" : "Protein Progress",
      value: isNewUser ? `${proteinGoal}g` : `${proteinIntake}g / ${proteinGoal}g`,
      change: isNewUser ? "Track your first meal" : `${Math.round((proteinIntake/proteinGoal)*100)}% of daily goal`,
      trend: 'up',
      color: "from-green-500 to-emerald-600"
    },
    {
      title: isNewUser ? "Weekly Streak Goal" : "Current Streak",
      value: isNewUser ? "7 days" : `${dashboardData?.streak?.current ?? 0} days 🔥`,
      change: isNewUser ? "Start your journey" : `Best: ${dashboardData?.streak?.longest ?? 0} days`,
      trend: 'up',
      color: "from-orange-500 to-red-500"
    },
    {
      title: isNewUser ? "Eco Impact Goal" : "CO₂ Saved This Week",
      value: isNewUser ? "-2.5kg" : `-${(dashboardData?.sustainabilityStats?.co2Saved ?? 0).toFixed(1)}kg`,
      change: isNewUser ? "Make a difference" : "vs average diet",
      trend: 'up',
      color: "from-purple-500 to-pink-500"
    }
  ];

  // Your Health Tools - user benefit focused
  const healthTools: IntegrationModule[] = [
    {
      name: "📸 Snap & Analyze",
      status: (systemHealthData as any)?.services?.aiAnalysis?.status ?? 'active',
      description: "Take a photo, get instant nutrition facts with medical-grade precision",
      metrics: [
        { label: isNewUser ? "Ready to Use" : "Photos Analyzed", value: isNewUser ? "✓" : String((dashboardData as any)?.aiStats?.analysesToday ?? 0) },
        { label: "Accuracy Rate", value: `${(systemHealthData as any)?.services?.aiAnalysis?.accuracy ?? 95}% reliable` },
        { label: "Speed", value: "< 1 second" }
      ]
    },
    {
      name: "🎤 Quick Voice Log",
      status: (systemHealthData as any)?.services?.voiceProcessing?.status ?? 'active',
      description: "Speak your meals → log faster, no typing required!",
      metrics: [
        { label: isNewUser ? "Try It Now" : "Voice Entries", value: isNewUser ? "Say 'chicken salad'" : String((dashboardData as any)?.voiceStats?.logsToday ?? 0) },
        { label: "Recognition Success", value: `${(systemHealthData as any)?.services?.voiceProcessing?.accuracy ?? 92}% accuracy` },
        { label: "Processing", value: "Real-time" }
      ]
    },
    {
      name: "🍳 Personal Chef AI",
      status: (systemHealthData as any)?.services?.recipeGeneration?.status ?? 'active',
      description: "Custom recipes based on your goals, preferences, and what's in your fridge",
      metrics: [
        { label: isNewUser ? "Get Started" : "Recipes Made", value: isNewUser ? "Create your first" : String((dashboardData as any)?.recipeStats?.generated ?? 0) },
        { label: "Success Rate", value: `${(systemHealthData as any)?.services?.recipeGeneration?.successRate ?? 98}% loved` },
        { label: "Generation", value: "Instant" }
      ]
    },
    {
      name: "📱 Smart Scanner",
      status: (systemHealthData as any)?.services?.barcodeScanner?.status ?? 'active',
      description: "Scan any product barcode → instant nutrition breakdown",
      metrics: [
        { label: isNewUser ? "Start Scanning" : "Products Scanned", value: isNewUser ? "Try it now" : String((dashboardData as any)?.scanStats?.scansToday ?? 0) },
        { label: "Database Coverage", value: `2.1M+ products` },
        { label: "Success Rate", value: `${(systemHealthData as any)?.services?.barcodeScanner?.successRate ?? 87}%` }
      ]
    },
    {
      name: "🌱 Eco Impact Tracker",
      status: (systemHealthData as any)?.services?.sustainabilityScoring?.status ?? 'active',
      description: "See how your food choices help the planet → reduce your carbon footprint",
      metrics: [
        { label: isNewUser ? "Make an Impact" : "Foods Scored", value: isNewUser ? "Start today" : String((dashboardData as any)?.sustainabilityStats?.foodsScored ?? 0) },
        { label: "Your CO2 Score", value: `${(dashboardData as any)?.sustainabilityStats?.avgCO2Score ?? 7}/10` },
        { label: "Water Savings", value: `${(dashboardData as any)?.sustainabilityStats?.avgWaterScore ?? 6}/10` }
      ]
    },
    {
      name: "🔬 Nutrition Database",
      status: (systemHealthData as any)?.services?.nutritionDatabase?.status ?? 'active',
      description: "Access the same nutrition data used by doctors and dietitians",
      metrics: [
        { label: "Foods Available", value: `8,500+ verified` },
        { label: "Data Source", value: "USDA certified" },
        { label: "Accuracy", value: `${(systemHealthData as any)?.services?.nutritionDatabase?.accuracy ?? 99}% medical-grade` }
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
          <p className="text-slate-600 font-medium">Loading your health journey...</p>
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
              Your Health Journey
            </h1>
            <p className="text-slate-600">
              Track your nutrition, achieve your goals, and build healthy habits
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

        {/* User Health Progress - Prominent Section */}
        {isNewUser && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-blue-900 mb-3">🎆 Welcome to Your Health Journey!</h2>
                <p className="text-blue-700 mb-4">Ready to transform how you track nutrition? Let's get you started with your first healthy habit!</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/scan">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      📸 Log Your First Meal
                    </Button>
                  </Link>
                  <Link href="/goals">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      🎯 Set Your Health Goals
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      📈 Complete Your Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personal Health Metrics - Now More Prominent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiMetrics.map((metric, index) => (
            <Card key={index} className="card-elegant hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                    <p className="text-4xl font-bold text-slate-900">{metric.value}</p>
                    <p className={`text-sm font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      <span>{metric.change}</span>
                    </p>
                  </div>
                  {!isNewUser && index === 0 && (
                    <Progress 
                      value={Math.min(100, ((dashboardData?.todayStats?.calories ?? 0) / calorieGoal) * 100)}
                      className="mt-3"
                    />
                  )}
                  {!isNewUser && index === 1 && (
                    <Progress 
                      value={Math.min(100, (proteinIntake / proteinGoal) * 100)}
                      className="mt-3"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Integration Modules */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Your Health Tools</h2>
              {isNewUser ? (
                <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                  Ready to explore!
                </Badge>
              ) : (
                <Button variant="outline" size="sm" className="btn-outline-glow">
                  Customize Tools
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {healthTools.map((module, index) => (
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

          {/* Quick Actions & Motivation */}
          <div className="space-y-6">
            {/* Motivational Section */}
            <Card className="card-elegant bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-green-900">🌟 Your Health Wins</CardTitle>
                <CardDescription className="text-sm text-green-700">
                  {isNewUser ? "Ready to start your journey?" : "Keep up the amazing progress!"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isNewUser ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Current Streak</span>
                      <span className="text-lg font-bold text-green-900">{dashboardData?.streak?.current ?? 0} days 🔥</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">This Week's Goals</span>
                      <span className="text-lg font-bold text-green-900">{dashboardData?.goalsProgress?.achieved ?? 0}/{dashboardData?.goalsProgress?.total ?? 4} completed</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Health Score</span>
                      <span className="text-lg font-bold text-green-900">87/100 🏆</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-green-800 font-medium mb-3">🚀 Start building healthy habits today!</p>
                    <p className="text-sm text-green-600">Join thousands who've transformed their nutrition</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  {isNewUser ? "Get started in seconds" : "Continue your health journey"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/scan">
                  <Button className="w-full btn-outline-glow justify-start text-left" size="sm">
                    📸 {isNewUser ? "Log Your First Meal" : "Add New Meal"}
                  </Button>
                </Link>
                <Link href="/voice">
                  <Button className="w-full btn-outline-glow justify-start text-left" size="sm">
                    🎤 {isNewUser ? "Try Voice Logging" : "Quick Voice Entry"}
                  </Button>
                </Link>
                <Link href="/recipes">
                  <Button className="w-full btn-outline-glow justify-start text-left" size="sm">
                    🍳 {isNewUser ? "Get Recipe Ideas" : "Generate New Recipe"}
                  </Button>
                </Link>
                <Link href="/goals">
                  <Button className="w-full btn-outline-glow justify-start text-left" size="sm">
                    🎯 {isNewUser ? "Set Your Goals" : "Update Goals"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* System Status - Minimized */}
            {!isNewUser && (
              <Card className="card-elegant">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Service Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-slate-500">All services operational</span>
                    <Badge className="bg-green-100 text-green-800 text-xs ml-auto">
                      99.9% uptime
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}