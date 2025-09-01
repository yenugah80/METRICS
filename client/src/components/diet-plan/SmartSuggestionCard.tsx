import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  TrendingUp, 
  ArrowRight, 
  Clock, 
  Scale,
  Utensils,
  Target,
  Zap
} from 'lucide-react';

interface SmartSuggestion {
  type: 'meal_swap' | 'portion_adjust' | 'timing_shift' | 'ingredient_sub';
  reason: string;
  originalItem: string;
  suggestedItem: string;
  nutritionalImpact: {
    calorieDelta: number;
    proteinDelta: number;
    macroImprovement: boolean;
  };
  confidenceScore: number;
}

interface SmartSuggestionCardProps {
  suggestions: SmartSuggestion[];
  onApplySuggestion: (suggestion: SmartSuggestion) => void;
  className?: string;
}

export function SmartSuggestionCard({ suggestions, onApplySuggestion, className = "" }: SmartSuggestionCardProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meal_swap': return <Utensils className="h-4 w-4" />;
      case 'portion_adjust': return <Scale className="h-4 w-4" />;
      case 'timing_shift': return <Clock className="h-4 w-4" />;
      case 'ingredient_sub': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meal_swap': return 'bg-blue-100 text-blue-800';
      case 'portion_adjust': return 'bg-green-100 text-green-800';
      case 'timing_shift': return 'bg-purple-100 text-purple-800';
      case 'ingredient_sub': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (delta: number) => {
    if (delta > 0) return 'text-red-600';
    if (delta < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Smart Suggestions
          <Badge variant="secondary" className="ml-auto">
            {suggestions.length} available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(suggestion.type)}
                  <Badge className={getTypeColor(suggestion.type)}>
                    {suggestion.type.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1 ml-auto">
                    <Progress value={suggestion.confidenceScore} className="w-16 h-2" />
                    <span className="text-xs text-muted-foreground">
                      {suggestion.confidenceScore}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">{suggestion.reason}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {suggestion.originalItem}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                      {suggestion.suggestedItem}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span>Calories:</span>
                      <span className={getImpactColor(suggestion.nutritionalImpact.calorieDelta)}>
                        {suggestion.nutritionalImpact.calorieDelta > 0 ? '+' : ''}
                        {suggestion.nutritionalImpact.calorieDelta}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Protein:</span>
                      <span className={getImpactColor(-suggestion.nutritionalImpact.proteinDelta)}>
                        {suggestion.nutritionalImpact.proteinDelta > 0 ? '+' : ''}
                        {suggestion.nutritionalImpact.proteinDelta}g
                      </span>
                    </div>
                    {suggestion.nutritionalImpact.macroImprovement && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Better Balance
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                size="sm"
                variant="outline"
                onClick={() => onApplySuggestion(suggestion)}
                className="shrink-0"
                data-testid={`button-apply-suggestion-${index}`}
              >
                Apply
              </Button>
            </div>
          </div>
        ))}
        
        {suggestions.length > 3 && (
          <Button variant="ghost" className="w-full" data-testid="button-view-all-suggestions">
            View All {suggestions.length} Suggestions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}