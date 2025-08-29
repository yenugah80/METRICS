import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Shield, ShieldAlert, X, Info } from "lucide-react";

interface AllergenDetail {
  allergen: string;
  found_in: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  specific_ingredients: string[];
  reaction_type: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
}

interface AllergenAnalysis {
  isAllergenFree: boolean;
  detectedAllergens: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  allergen_details: AllergenDetail[];
  cross_contamination_risk: 'low' | 'medium' | 'high';
  safe_alternatives: string[];
}

interface AllergenAlertProps {
  analysis: AllergenAnalysis;
  className?: string;
}

export function AllergenAlert({ analysis, className = "" }: AllergenAlertProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Shield className="h-5 w-5 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-600 bg-red-50';
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-green-500 bg-green-50';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getReactionTypeColor = (type: string) => {
    switch (type) {
      case 'anaphylaxis':
        return 'bg-red-100 text-red-800';
      case 'severe':
        return 'bg-orange-100 text-orange-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'mild':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // If allergen-free, show positive message
  if (analysis.isAllergenFree) {
    return (
      <Alert className={`border-green-500 bg-green-50 ${className}`} data-testid="alert-allergen-safe">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Allergen Safe ✅</AlertTitle>
        <AlertDescription className="text-green-700">
          This meal appears to be free from your specified allergens. Enjoy safely!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Alert */}
      <Alert className={`${getSeverityColor(analysis.severity)}`} data-testid="alert-allergen-warning">
        {getSeverityIcon(analysis.severity)}
        <AlertTitle className="flex items-center gap-2">
          Allergen Warning 
          <Badge variant="outline" className={getRiskLevelColor(analysis.severity)}>
            {analysis.severity.toUpperCase()} RISK
          </Badge>
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-2 mt-2">
            <p className="font-medium">
              Detected allergens: {analysis.detectedAllergens.join(', ')}
            </p>
            {analysis.warnings.map((warning, index) => (
              <p key={index} className="text-sm">⚠️ {warning}</p>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      {/* Detailed Allergen Analysis */}
      {analysis.allergen_details.length > 0 && (
        <Card data-testid="card-allergen-details">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Allergen Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.allergen_details.map((detail, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-lg capitalize">{detail.allergen}</h4>
                  <div className="flex gap-2">
                    <Badge className={getRiskLevelColor(detail.risk_level)}>
                      {detail.risk_level.toUpperCase()}
                    </Badge>
                    <Badge className={getReactionTypeColor(detail.reaction_type)}>
                      {detail.reaction_type}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Found in:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detail.found_in.map((food, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {food}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {detail.specific_ingredients.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Specific ingredients:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detail.specific_ingredients.map((ingredient, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {ingredient}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cross-Contamination Warning */}
      {analysis.cross_contamination_risk !== 'low' && (
        <Alert className="border-yellow-500 bg-yellow-50" data-testid="alert-cross-contamination">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Cross-Contamination Risk</AlertTitle>
          <AlertDescription className="text-yellow-700">
            <Badge className={getRiskLevelColor(analysis.cross_contamination_risk)}>
              {analysis.cross_contamination_risk.toUpperCase()} RISK
            </Badge>
            <p className="mt-2 text-sm">
              This meal may have been prepared in facilities or equipment that also process your allergens.
              {analysis.cross_contamination_risk === 'high' 
                ? ' Exercise extreme caution.'
                : ' Please verify with the restaurant or manufacturer.'}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Safe Alternatives */}
      {analysis.safe_alternatives.length > 0 && (
        <Card data-testid="card-safe-alternatives">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Safe Alternatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Consider these safer options instead:
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.safe_alternatives.map((alt, index) => (
                  <Badge key={index} variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    {alt}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}