import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, Users, ChefHat, Heart, TrendingUp, Filter, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MealRecommendation {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  mealType: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  personalizedScore: number;
  nutritionScore: number;
  matchReasons: string[];
  ingredients: Array<{ name: string; amount: string; category: string }>;
  instructions: string[];
  tags: string[];
  healthBenefits: string[];
  variations: string[];
  pairedWith: string[];
}

export default function RecommendationsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMealType, setSelectedMealType] = useState<string>('all');
  const [maxCalories, setMaxCalories] = useState<string>('');
  const [selectedDiet, setSelectedDiet] = useState<string>('');
  const [excludeIngredients, setExcludeIngredients] = useState<string>('');

  // Get personalized recommendations
  const { data: personalizedRecs, isLoading: loadingPersonalized, refetch: refetchPersonalized } = useQuery({
    queryKey: ['/api/recommendations/personalized'],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/recommendations/personalized', {
        mealType: selectedMealType === 'all' ? undefined : selectedMealType,
        maxCalories: maxCalories ? parseInt(maxCalories) : undefined,
        excludeIngredients: excludeIngredients ? excludeIngredients.split(',').map(s => s.trim()) : [],
        limit: 6
      });
      return response.json();
    },
    enabled: false // We'll trigger manually
  });

  // Get trending recommendations
  const { data: trendingRecs, isLoading: loadingTrending } = useQuery({
    queryKey: ['/api/recommendations/trending'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/recommendations/trending?limit=8');
      return response.json();
    }
  });

  // Get quick recommendations
  const { data: quickRecs, isLoading: loadingQuick } = useQuery({
    queryKey: ['/api/recommendations/quick'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/recommendations/quick');
      return response.json();
    }
  });

  // Get favorites (if authenticated)
  const { data: favoritesData, isLoading: loadingFavorites } = useQuery({
    queryKey: ['/api/recommendations/favorites'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/recommendations/favorites');
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Save favorite mutation
  const saveFavoriteMutation = useMutation({
    mutationFn: async (recommendation: MealRecommendation) => {
      const response = await apiRequest('POST', '/api/recommendations/save-favorite', {
        recommendation
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Saved to Favorites",
        description: "This recommendation has been added to your favorites.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/favorites'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save recommendation to favorites.",
        variant: "destructive",
      });
    }
  });

  // Dietary recommendations mutation
  const dietaryRecsMutation = useMutation({
    mutationFn: async (dietType: string) => {
      const response = await apiRequest('POST', '/api/recommendations/dietary', {
        dietType,
        mealType: selectedMealType === 'all' ? undefined : selectedMealType,
        maxCalories: maxCalories ? parseInt(maxCalories) : undefined,
        allergens: excludeIngredients ? excludeIngredients.split(',').map(s => s.trim()) : []
      });
      return response.json();
    }
  });

  const handleGetRecommendations = () => {
    refetchPersonalized();
  };

  const handleDietaryFilter = (dietType: string) => {
    setSelectedDiet(dietType);
    dietaryRecsMutation.mutate(dietType);
  };

  const renderRecommendationCard = (rec: MealRecommendation, showSaveButton = true) => (
    <Card key={rec.id} className="h-full" data-testid={`recommendation-card-${rec.id}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg" data-testid={`recipe-title-${rec.id}`}>{rec.name}</CardTitle>
            <CardDescription className="text-sm mt-1" data-testid={`recipe-description-${rec.id}`}>
              {rec.description}
            </CardDescription>
          </div>
          {showSaveButton && isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveFavoriteMutation.mutate(rec)}
              disabled={saveFavoriteMutation.isPending}
              data-testid={`save-favorite-${rec.id}`}
            >
              <Heart className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" data-testid={`cuisine-${rec.id}`}>{rec.cuisine}</Badge>
          <Badge variant="outline" data-testid={`meal-type-${rec.id}`}>{rec.mealType}</Badge>
          <Badge variant={rec.difficulty === 'easy' ? 'default' : rec.difficulty === 'medium' ? 'secondary' : 'destructive'}>
            {rec.difficulty}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2" data-testid={`prep-time-${rec.id}`}>
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{rec.prepTime} min</span>
          </div>
          <div className="flex items-center gap-2" data-testid={`servings-${rec.id}`}>
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{rec.servings} servings</span>
          </div>
        </div>

        {/* Nutrition summary */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold" data-testid={`calories-${rec.id}`}>{rec.calories}</div>
            <div className="text-muted-foreground">cal</div>
          </div>
          <div className="text-center">
            <div className="font-semibold" data-testid={`protein-${rec.id}`}>{rec.protein}g</div>
            <div className="text-muted-foreground">protein</div>
          </div>
          <div className="text-center">
            <div className="font-semibold" data-testid={`carbs-${rec.id}`}>{rec.carbs}g</div>
            <div className="text-muted-foreground">carbs</div>
          </div>
          <div className="text-center">
            <div className="font-semibold" data-testid={`fat-${rec.id}`}>{rec.fat}g</div>
            <div className="text-muted-foreground">fat</div>
          </div>
        </div>

        {/* Scores */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span data-testid={`personalized-score-${rec.id}`}>Match: {rec.personalizedScore}/100</span>
          </div>
          <div className="text-muted-foreground" data-testid={`nutrition-score-${rec.id}`}>
            Health: {rec.nutritionScore}/100
          </div>
        </div>

        {/* Match reasons */}
        {rec.matchReasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Why this matches:</h4>
            <div className="space-y-1">
              {rec.matchReasons.slice(0, 2).map((reason, index) => (
                <div key={index} className="text-xs text-muted-foreground" data-testid={`match-reason-${rec.id}-${index}`}>
                  • {reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {rec.tags.slice(0, 4).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs" data-testid={`tag-${rec.id}-${index}`}>
              {tag}
            </Badge>
          ))}
        </div>

        {/* Health benefits */}
        {rec.healthBenefits.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-green-700">Health Benefits:</h4>
            <div className="text-xs text-green-600" data-testid={`health-benefits-${rec.id}`}>
              {rec.healthBenefits.slice(0, 2).join(' • ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Meal Recommendations</h1>
        <p className="text-muted-foreground" data-testid="page-description">
          Discover personalized meal suggestions tailored to your preferences and nutrition goals
        </p>
      </div>

      <Tabs defaultValue="personalized" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4" data-testid="recommendation-tabs">
          <TabsTrigger value="personalized" data-testid="tab-personalized">
            <ChefHat className="h-4 w-4 mr-2" />
            For You
          </TabsTrigger>
          <TabsTrigger value="trending" data-testid="tab-trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="quick" data-testid="tab-quick">
            <Clock className="h-4 w-4 mr-2" />
            Quick Picks
          </TabsTrigger>
          <TabsTrigger value="favorites" disabled={!isAuthenticated} data-testid="tab-favorites">
            <Heart className="h-4 w-4 mr-2" />
            Favorites
          </TabsTrigger>
        </TabsList>

        {/* Personalized Recommendations */}
        <TabsContent value="personalized" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Customize Your Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="meal-type">Meal Type</Label>
                  <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                    <SelectTrigger data-testid="select-meal-type">
                      <SelectValue placeholder="All meals" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All meals</SelectItem>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="max-calories">Max Calories</Label>
                  <Input
                    id="max-calories"
                    type="number"
                    placeholder="e.g. 500"
                    value={maxCalories}
                    onChange={(e) => setMaxCalories(e.target.value)}
                    data-testid="input-max-calories"
                  />
                </div>
                
                <div>
                  <Label htmlFor="exclude-ingredients">Exclude Ingredients</Label>
                  <Input
                    id="exclude-ingredients"
                    placeholder="e.g. nuts, dairy"
                    value={excludeIngredients}
                    onChange={(e) => setExcludeIngredients(e.target.value)}
                    data-testid="input-exclude-ingredients"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={handleGetRecommendations}
                    disabled={loadingPersonalized}
                    className="w-full"
                    data-testid="button-get-recommendations"
                  >
                    {loadingPersonalized ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Get Recommendations
                  </Button>
                </div>
              </div>
              
              {/* Dietary filters */}
              <div className="flex flex-wrap gap-2">
                <Label className="text-sm">Quick filters:</Label>
                {['keto', 'vegan', 'paleo', 'mediterranean', 'gluten-free'].map((diet) => (
                  <Button
                    key={diet}
                    variant={selectedDiet === diet ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDietaryFilter(diet)}
                    disabled={dietaryRecsMutation.isPending}
                    data-testid={`filter-${diet}`}
                  >
                    {diet}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div>
            {loadingPersonalized ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-personalized" />
                <span className="ml-2">Generating personalized recommendations...</span>
              </div>
            ) : personalizedRecs?.recommendations?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personalizedRecs.recommendations.map((rec: MealRecommendation) => 
                  renderRecommendationCard(rec)
                )}
              </div>
            ) : dietaryRecsMutation.data?.recommendations?.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-4" data-testid="dietary-results-title">
                  {selectedDiet} Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dietaryRecsMutation.data.recommendations.map((rec: MealRecommendation) => 
                    renderRecommendationCard(rec)
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="no-results-title">
                  Ready to discover your perfect meals?
                </h3>
                <p className="text-muted-foreground mb-4" data-testid="no-results-description">
                  Click "Get Recommendations" to see personalized meal suggestions based on your preferences.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Trending Recommendations */}
        <TabsContent value="trending" className="space-y-6">
          {loadingTrending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-trending" />
              <span className="ml-2">Loading trending recommendations...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trendingRecs?.recommendations?.map((rec: MealRecommendation) => 
                renderRecommendationCard(rec)
              )}
            </div>
          )}
        </TabsContent>

        {/* Quick Picks */}
        <TabsContent value="quick" className="space-y-6">
          {loadingQuick ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-quick" />
              <span className="ml-2">Loading quick recommendations...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickRecs?.recommendations?.map((rec: MealRecommendation) => 
                renderRecommendationCard(rec)
              )}
            </div>
          )}
        </TabsContent>

        {/* Favorites */}
        <TabsContent value="favorites" className="space-y-6">
          {!isAuthenticated ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sign in to save favorites</h3>
              <p className="text-muted-foreground">
                Create an account to save your favorite meal recommendations.
              </p>
            </div>
          ) : loadingFavorites ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-favorites" />
              <span className="ml-2">Loading your favorites...</span>
            </div>
          ) : favoritesData?.favorites?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoritesData.favorites.map((meal: any) => 
                renderRecommendationCard({
                  id: meal.id,
                  name: meal.name,
                  description: `A favorite meal from your history`,
                  cuisine: 'favorite',
                  mealType: meal.mealType,
                  difficulty: 'medium' as const,
                  prepTime: 30,
                  servings: 2,
                  calories: 400,
                  protein: 25,
                  carbs: 35,
                  fat: 15,
                  fiber: 8,
                  sodium: 300,
                  personalizedScore: 95,
                  nutritionScore: 80,
                  matchReasons: ['One of your favorite meals'],
                  ingredients: [],
                  instructions: [],
                  tags: ['favorite'],
                  healthBenefits: [],
                  variations: [],
                  pairedWith: []
                }, false)
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="no-favorites-title">No favorites yet</h3>
              <p className="text-muted-foreground" data-testid="no-favorites-description">
                Save recommendations you love by clicking the heart icon.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}