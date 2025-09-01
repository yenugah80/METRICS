import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Activity,
  Droplets,
  Brain
} from 'lucide-react';

interface HealthCondition {
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  adherenceScore: number; // 0-100 how well current plan supports this condition
  recommendations: string[];
  alerts: string[];
}

interface HealthConditionIndicatorsProps {
  conditions: HealthCondition[];
  className?: string;
}

export function HealthConditionIndicators({ conditions, className = "" }: HealthConditionIndicatorsProps) {
  if (!conditions || conditions.length === 0) {
    return null;
  }

  const getConditionIcon = (condition: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      diabetes: Activity,
      pcos: Heart,
      ibs: Shield,
      hypertension: Droplets,
      heart_disease: Heart,
      thyroid_disorder: Brain,
    };
    
    const IconComponent = iconMap[condition] || Info;
    return <IconComponent className="h-4 w-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAdherenceColor = (score: number) => {
    if (score >= 80) return 'hsl(142, 76%, 36%)'; // Green
    if (score >= 60) return 'hsl(32, 95%, 44%)'; // Orange
    return 'hsl(0, 84%, 60%)'; // Red
  };

  const getAdherenceText = (score: number) => {
    if (score >= 80) return 'Excellent Support';
    if (score >= 60) return 'Good Support';
    if (score >= 40) return 'Moderate Support';
    return 'Needs Improvement';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-blue-600" />
          Health Condition Support
          <Badge variant="secondary" className="ml-auto">
            {conditions.length} condition{conditions.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {conditions.map((condition, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getConditionIcon(condition.condition)}
                <span className="font-medium capitalize">
                  {condition.condition.replace('_', ' ')}
                </span>
                <Badge className={getSeverityColor(condition.severity)}>
                  {condition.severity}
                </Badge>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Plan Support</div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={condition.adherenceScore} 
                    className="w-20 h-2"
                    style={{ 
                      '--progress-foreground': getAdherenceColor(condition.adherenceScore) 
                    } as React.CSSProperties}
                  />
                  <span className="text-sm font-medium">
                    {condition.adherenceScore}%
                  </span>
                </div>
                <div className="text-xs" style={{ color: getAdherenceColor(condition.adherenceScore) }}>
                  {getAdherenceText(condition.adherenceScore)}
                </div>
              </div>
            </div>

            {condition.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm font-medium text-green-700">
                  <CheckCircle className="h-3 w-3" />
                  Active Recommendations
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {condition.recommendations.slice(0, 2).map((rec, recIndex) => (
                    <div key={recIndex} className="text-xs bg-green-50 text-green-800 p-2 rounded">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {condition.alerts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm font-medium text-orange-700">
                  <AlertTriangle className="h-3 w-3" />
                  Important Notes
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {condition.alerts.slice(0, 2).map((alert, alertIndex) => (
                    <div key={alertIndex} className="text-xs bg-orange-50 text-orange-800 p-2 rounded">
                      {alert}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}