import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Leaf, Droplets, Factory, Truck, Star } from "lucide-react";

interface SustainabilityScore {
  overall_score: number;
  grade: string;
  co2_impact: 'low' | 'medium' | 'high';
  water_usage: 'low' | 'medium' | 'high';
  seasonal_score: number;
  processing_score: number;
  local_score: number;
  sustainability_badges: string[];
  environmental_impact: {
    carbon_footprint_kg: number;
    water_footprint_liters: number;
    land_use_m2: number;
  };
  recommendations: string[];
  seasonal_alternatives: string[];
}

interface SustainabilityCardProps {
  score: SustainabilityScore;
  className?: string;
}

export function SustainabilityCard({ score, className = "" }: SustainabilityCardProps) {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getBadgeVariant = (badge: string) => {
    const variants: Record<string, any> = {
      'Plant-Based': 'bg-green-100 text-green-800',
      'Local': 'bg-blue-100 text-blue-800', 
      'Seasonal': 'bg-orange-100 text-orange-800',
      'Low-Carbon': 'bg-emerald-100 text-emerald-800',
      'Water-Efficient': 'bg-cyan-100 text-cyan-800'
    };
    return variants[badge] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={`w-full ${className}`} data-testid="card-sustainability">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Sustainability Impact
          </CardTitle>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(score.grade)}`}>
            Grade {score.grade}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{score.overall_score}/10</span>
          <Progress value={score.overall_score * 10} className="flex-1" data-testid="progress-sustainability" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sustainability Badges */}
        {score.sustainability_badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {score.sustainability_badges.map((badge) => (
              <Badge 
                key={badge} 
                className={getBadgeVariant(badge)}
                data-testid={`badge-${badge.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Impact Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">CO2 Impact:</span>
            <span className={`text-sm font-medium capitalize ${getImpactColor(score.co2_impact)}`}>
              {score.co2_impact}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">Water Usage:</span>
            <span className={`text-sm font-medium capitalize ${getImpactColor(score.water_usage)}`}>
              {score.water_usage}
            </span>
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Leaf className="h-3 w-3" />
              Seasonal Score
            </span>
            <span className="text-sm font-medium">{score.seasonal_score}/10</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Star className="h-3 w-3" />
              Processing Score
            </span>
            <span className="text-sm font-medium">{score.processing_score}/10</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Local Score
            </span>
            <span className="text-sm font-medium">{score.local_score}/10</span>
          </div>
        </div>

        {/* Environmental Impact */}
        {(score.environmental_impact.carbon_footprint_kg > 0 || 
          score.environmental_impact.water_footprint_liters > 0) && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Environmental Footprint</h4>
              {score.environmental_impact.carbon_footprint_kg > 0 && (
                <div className="text-sm text-gray-600">
                  Carbon: <span className="font-medium">{score.environmental_impact.carbon_footprint_kg.toFixed(2)} kg CO2</span>
                </div>
              )}
              {score.environmental_impact.water_footprint_liters > 0 && (
                <div className="text-sm text-gray-600">
                  Water: <span className="font-medium">{score.environmental_impact.water_footprint_liters.toFixed(0)} liters</span>
                </div>
              )}
              {score.environmental_impact.land_use_m2 > 0 && (
                <div className="text-sm text-gray-600">
                  Land: <span className="font-medium">{score.environmental_impact.land_use_m2.toFixed(1)} m²</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Recommendations */}
        {score.recommendations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Eco-Friendly Tips</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {score.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Seasonal Alternatives */}
        {score.seasonal_alternatives.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Seasonal Alternatives</h4>
              <div className="flex flex-wrap gap-2">
                {score.seasonal_alternatives.map((alt, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {alt}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}