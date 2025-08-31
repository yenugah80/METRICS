import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  ChefHat, 
  Clock, 
  Users, 
  Target, 
  Sparkles, 
  Leaf, 
  AlertCircle, 
  RefreshCw,
  Heart,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useLocalAuth';

interface MealRecommendation {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  
  goalAlignment: {
    calorieMatch: number;
    proteinMatch: number;
    carbMatch: number;
    fatMatch: number;
    overallScore: number;
  };
  
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  instructions: string[];
  
  dietCompatibility: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    lowSodium: boolean;
    keto: boolean;
  };
  
  sustainabilityScore: number;
  sustainabilityNotes: string;
  confidence: number;
  reasoning: string;
}

interface MealRecommendationsProps {
  onSelectRecommendation?: (recommendation: MealRecommendation) => void;
}

export default function MealRecommendations({ onSelectRecommendation }: MealRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<MealRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [maxPrepTime, setMaxPrepTime] = useState<number>(30);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  
  const { toast } = useToast();
  const { user } = useAuth();

  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/meal-recommendations/generate', {
        mealType: selectedMealType,
        preferences: {
          prepTime: maxPrepTime,
          difficulty: selectedDifficulty,
          cuisineType: selectedCuisine || undefined,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const result = await response.json();
      setRecommendations(result.recommendations || []);
      
      toast({
        title: "Recommendations generated!",
        description: `Found ${result.recommendations?.length || 0} personalized meal suggestions`,
      });
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      setError(error.message || 'Failed to generate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', '/api/meal-recommendations/quick');

      if (!response.ok) {
        throw new Error('Failed to get quick recommendation');
      }

      const result = await response.json();
      setRecommendations([result.recommendation]);
      
      toast({
        title: "Smart recommendation ready!",
        description: "Generated based on your remaining daily nutrition goals",
      });
    } catch (error: any) {
      console.error('Error getting quick recommendation:', error);
      setError(error.message || 'Failed to get quick recommendation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate recommendations on mount
  useEffect(() => {
    generateRecommendations();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" data-testid="meal-recommendations">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Meal Recommendations
            {user?.isPremium && (
              <Badge className="bg-premium text-premium-foreground">Premium</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={getQuickRecommendation}
              disabled={isLoading}
              className="flex items-center gap-2"
              data-testid="button-quick-recommendation"
            >
              <Zap className="w-4 h-4" />
              Smart Suggestion
            </Button>
            <Button
              onClick={generateRecommendations}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="button-custom-recommendations"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ChefHat className="w-4 h-4" />
              )}
              Custom Recommendations
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meal Type</label>
              <Select
                value={selectedMealType}
                onValueChange={(value: 'breakfast' | 'lunch' | 'dinner' | 'snack') => setSelectedMealType(value)}
              >
                <SelectTrigger data-testid="select-meal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select
                value={selectedDifficulty}
                onValueChange={(value: 'easy' | 'medium' | 'hard') => setSelectedDifficulty(value)}
              >
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Prep Time</label>
              <Select
                value={maxPrepTime.toString()}
                onValueChange={(value) => setMaxPrepTime(parseInt(value))}
              >
                <SelectTrigger data-testid="select-prep-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cuisine</label>
              <Select
                value={selectedCuisine}
                onValueChange={setSelectedCuisine}
              >
                <SelectTrigger data-testid="select-cuisine">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="american">American</SelectItem>
                  <SelectItem value="mediterranean">Mediterranean</SelectItem>
                  <SelectItem value="asian">Asian</SelectItem>
                  <SelectItem value="mexican">Mexican</SelectItem>
                  <SelectItem value="italian">Italian</SelectItem>
                  <SelectItem value="indian">Indian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Generating personalized recommendations...</p>
          <p className="text-sm text-muted-foreground">Analyzing your goals and preferences</p>
        </div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length > 0 && !isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((recommendation) => (
            <Card 
              key={recommendation.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onSelectRecommendation?.(recommendation)}
              data-testid={`recommendation-${recommendation.id}`}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-tight">
                    {recommendation.name}
                  </CardTitle>
                  <div className={`text-lg font-bold ${getScoreColor(recommendation.goalAlignment.overallScore)}`}>
                    {Math.round(recommendation.goalAlignment.overallScore)}/100
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {recommendation.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Meal Info */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getDifficultyColor(recommendation.difficulty)}>
                    {recommendation.difficulty}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recommendation.prepTime + recommendation.cookTime}m
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {recommendation.servings} serving{recommendation.servings > 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    {recommendation.sustainabilityScore}/10
                  </Badge>
                </div>

                {/* Nutrition Overview */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Calories</span>
                      <span className="font-medium">{Math.round(recommendation.nutrition.calories)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protein</span>
                      <span className="font-medium">{Math.round(recommendation.nutrition.protein)}g</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Carbs</span>
                      <span className="font-medium">{Math.round(recommendation.nutrition.carbs)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fat</span>
                      <span className="font-medium">{Math.round(recommendation.nutrition.fat)}g</span>
                    </div>
                  </div>
                </div>

                {/* Goal Alignment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Goal Alignment</span>
                  </div>
                  <Progress 
                    value={recommendation.goalAlignment.overallScore} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {recommendation.reasoning}
                  </p>
                </div>

                {/* Diet Compatibility */}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(recommendation.dietCompatibility)
                    .filter(([_, compatible]) => compatible)
                    .map(([diet, _]) => (
                      <Badge key={diet} variant="secondary" className="text-xs">
                        {diet.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Badge>
                    ))}
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRecommendation?.(recommendation);
                  }}
                  data-testid={`button-select-${recommendation.id}`}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Select This Meal
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && !isLoading && !error && (
        <Card className="text-center py-12">
          <CardContent>
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate personalized meal suggestions based on your nutritional goals
            </p>
            <Button onClick={generateRecommendations} data-testid="button-generate-initial">
              <Sparkles className="w-4 h-4 mr-2" />
              Get Recommendations
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}