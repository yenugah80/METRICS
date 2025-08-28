import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Leaf, Droplets, Truck, MapPin, Crown, TrendingUp, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SustainabilityData {
  overallScore: number; // 0-10
  carbonFootprint: number; // kg CO2
  waterUsage: number; // liters
  localSourcing: number; // percentage
  seasonality: number; // percentage
  packaging: number; // 0-10 score
  breakdown: {
    transportation: number;
    production: number;
    packaging: number;
    processing: number;
  };
}

export default function Sustainability() {
  const [isPremium] = useState(true); // For demo - would check actual subscription
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const { toast } = useToast();

  // Mock sustainability data
  const sustainabilityData: SustainabilityData = {
    overallScore: 7.2,
    carbonFootprint: 2.8,
    waterUsage: 45,
    localSourcing: 65,
    seasonality: 80,
    packaging: 6.5,
    breakdown: {
      transportation: 1.2,
      production: 1.1,
      packaging: 0.3,
      processing: 0.2
    }
  };

  const recentMeals = [
    { id: "1", name: "Grilled Chicken Salad", score: 7.2, co2: 2.8, water: 45 },
    { id: "2", name: "Avocado Toast", score: 8.5, co2: 1.2, water: 35 },
    { id: "3", name: "Beef Burger", score: 3.1, co2: 8.5, water: 120 },
    { id: "4", name: "Quinoa Bowl", score: 9.1, co2: 0.8, water: 25 }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 8) return "A";
    if (score >= 6) return "B";
    if (score >= 4) return "C";
    return "D";
  };

  if (!isPremium) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center p-12">
            <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              Sustainability scoring is available for Premium subscribers only.
              Get detailed environmental impact analysis for your meals!
            </p>
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <span>Sustainability Score</span>
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Environmental impact scoring with CO₂ emissions, water usage, and local sourcing insights
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Leaf className="h-6 w-6 text-green-600" />
              <span>Overall Environmental Impact</span>
            </CardTitle>
            <CardDescription>Your latest meal's sustainability breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Score Visualization */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
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
                      strokeDashoffset={`${2 * Math.PI * 48 * (1 - sustainabilityData.overallScore / 10)}`}
                      className={`transition-all duration-1000 ${getScoreColor(sustainabilityData.overallScore)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{sustainabilityData.overallScore}</div>
                      <div className="text-sm text-muted-foreground">/ 10</div>
                    </div>
                  </div>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(sustainabilityData.overallScore)}`}>
                  {getScoreGrade(sustainabilityData.overallScore)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {sustainabilityData.overallScore >= 8 ? '🌱 Excellent eco-choice!' :
                   sustainabilityData.overallScore >= 6 ? '🌿 Good for the planet' :
                   sustainabilityData.overallScore >= 4 ? '⚠️ Room for improvement' :
                   '🔴 High environmental impact'}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg border">
                    <div className="text-2xl font-bold text-red-600">{sustainabilityData.carbonFootprint}</div>
                    <div className="text-sm text-red-600 font-medium">kg CO₂</div>
                    <div className="text-xs text-muted-foreground">Carbon footprint</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">{sustainabilityData.waterUsage}</div>
                    <div className="text-sm text-blue-600 font-medium">liters</div>
                    <div className="text-xs text-muted-foreground">Water usage</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Local sourcing</span>
                      <span className="font-medium">{sustainabilityData.localSourcing}%</span>
                    </div>
                    <Progress value={sustainabilityData.localSourcing} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Seasonal ingredients</span>
                      <span className="font-medium">{sustainabilityData.seasonality}%</span>
                    </div>
                    <Progress value={sustainabilityData.seasonality} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Environmental Impact Breakdown</CardTitle>
            <CardDescription>CO₂ emissions by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(sustainabilityData.breakdown).map(([category, value]) => (
                <div key={category} className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold text-foreground">{value}</div>
                  <div className="text-sm text-muted-foreground">kg CO₂</div>
                  <div className="text-xs font-medium capitalize mt-1">{category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Meals Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Recent Meals Comparison</span>
            </CardTitle>
            <CardDescription>Sustainability scores for your recent meals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMeals.map((meal) => (
                <div key={meal.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium">{meal.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      {meal.co2} kg CO₂ • {meal.water}L water
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(meal.score)}`}>
                      {getScoreGrade(meal.score)}
                    </div>
                    <div className="text-xs text-muted-foreground">{meal.score}/10</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-600" />
              <span>Sustainability Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Choose Local Ingredients</h4>
                    <p className="text-sm text-green-700">
                      Selecting locally-sourced ingredients can reduce your carbon footprint by up to 30%
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Droplets className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Water-Efficient Foods</h4>
                    <p className="text-sm text-blue-700">
                      Try plant-based proteins like lentils and beans which use significantly less water than meat
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Truck className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Reduce Food Miles</h4>
                    <p className="text-sm text-yellow-700">
                      Choose seasonal produce to minimize transportation emissions and support local farmers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Sustainability Goals</CardTitle>
            <CardDescription>Your progress towards eco-friendly eating habits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Weekly average score goal</span>
                  <span className="font-medium">7.2 / 8.0</span>
                </div>
                <Progress value={90} className="h-3" />
                <div className="text-xs text-muted-foreground mt-1">90% of weekly goal achieved</div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Local sourcing goal</span>
                  <span className="font-medium">65% / 80%</span>
                </div>
                <Progress value={81.25} className="h-3" />
                <div className="text-xs text-muted-foreground mt-1">15% away from target</div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Carbon reduction goal</span>
                  <span className="font-medium">-12% / -20%</span>
                </div>
                <Progress value={60} className="h-3" />
                <div className="text-xs text-muted-foreground mt-1">8% more reduction needed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}