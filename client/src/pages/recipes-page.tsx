/**
 * Professional Recipe Generation Page with Real-World Chatbot
 * No mock data - only authentic global cuisine generation
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChefHat, Globe, Clock, Users, Star, Utensils, BookOpen, Search, Heart, FolderOpen, ShoppingCart, Calendar, Filter } from 'lucide-react';
import { RecipeChatbot } from '@/components/recipe-chatbot';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CuisineInfo {
  name: string;
  key: string;
  description: string;
  regions: string[];
  popularDishes: string[];
}

interface Recipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  ingredients: any[];
  instructions: any[];
  tags?: string[];
  difficulty?: string;
  category?: string;
  cuisine?: string;
  estimatedCalories?: number;
  estimatedProtein?: number;
  estimatedCarbs?: number;
  estimatedFat?: number;
  nutritionGrade?: string;
  isPremium: boolean;
  isPublic: boolean;
  createdBy?: string;
  createdAt: string;
}

interface RecipeCollection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  recipeCount?: number;
  createdAt: string;
}

export default function RecipesPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [activeTab, setActiveTab] = useState('browse');

  // Fetch available cuisines with authentic information
  const { data: cuisineData } = useQuery({
    queryKey: ['/api/chatbot/cuisines'],
    queryFn: async () => {
      const response = await fetch('/api/chatbot/cuisines');
      return response.json();
    },
  });

  // Fetch recipes based on filters
  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['/api/recipes', { search: searchQuery, category: selectedCategory, cuisine: selectedCuisine, difficulty: selectedDifficulty }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedCuisine) params.append('cuisine', selectedCuisine);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      
      const response = await fetch(`/api/recipes?${params.toString()}`);
      return response.json();
    },
  });

  // Fetch user's saved recipes (if authenticated)
  const { data: savedRecipes = [] } = useQuery({
    queryKey: ['/api/recipes/saved'],
    enabled: isAuthenticated,
  });

  // Fetch user's recipe collections (if authenticated)
  const { data: collections = [] } = useQuery({
    queryKey: ['/api/collections'],
    enabled: isAuthenticated,
  });

  // Fetch user's shopping lists (if authenticated)
  const { data: shoppingLists = [] } = useQuery({
    queryKey: ['/api/shopping-lists'],
    enabled: isAuthenticated,
  });

  // Fetch recently viewed recipes (if authenticated)
  const { data: recentlyViewed = [] } = useQuery({
    queryKey: ['/api/recipes/recently-viewed'],
    enabled: isAuthenticated,
  });

  const cuisines: CuisineInfo[] = cuisineData?.cuisines || [];

  // Mutation for saving/unsaving recipes
  const saveRecipeMutation = useMutation({
    mutationFn: async ({ recipeId, action }: { recipeId: string; action: 'save' | 'unsave' }) => {
      const url = `/api/recipes/${recipeId}/save`;
      if (action === 'save') {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        return response.json();
      } else {
        const response = await fetch(url, {
          method: 'DELETE',
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes/saved'] });
      toast({
        title: "Success",
        description: "Recipe updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update recipe",
        variant: "destructive",
      });
    },
  });

  // Mutation for recording recipe views
  const recordViewMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      const response = await fetch(`/api/recipes/${recipeId}/view`, {
        method: 'POST',
      });
      return response.json();
    },
  });

  const handleCuisineSelect = (cuisineKey: string) => {
    setSelectedCuisine(cuisineKey);
  };

  const handleRecipeView = (recipe: Recipe) => {
    if (isAuthenticated) {
      recordViewMutation.mutate(recipe.id);
    }
  };

  const handleSaveRecipe = (recipeId: string, isSaved: boolean) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save recipes",
        variant: "destructive",
      });
      return;
    }
    
    saveRecipeMutation.mutate({
      recipeId,
      action: isSaved ? 'unsave' : 'save'
    });
  };

  const isRecipeSaved = (recipeId: string) => {
    return (savedRecipes as any[]).some((saved: any) => saved.recipeId === recipeId);
  };

  const categories = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'soup', 'salad', 'main-course', 'side-dish'];
  const difficulties = ['easy', 'medium', 'hard'];

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="page-recipes">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">Recipe Hub</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover, save, and organize recipes from around the world. Create collections, 
          plan meals, and build shopping lists with our comprehensive recipe management system.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Search className="h-3 w-3" />
            Smart Search
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            Save Favorites
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            Collections
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            Shopping Lists
          </Badge>
        </div>
      </div>

      {/* Old Tabs Structure - Keep for compatibility */}
      <div className="mb-8">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" data-testid="tab-chat">
              <ChefHat className="h-4 w-4 mr-2" />
              Recipe Chat
            </TabsTrigger>
            <TabsTrigger value="explore" data-testid="tab-explore">
              <Globe className="h-4 w-4 mr-2" />
              Explore Cuisines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            {/* Professional Recipe Chatbot */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Professional Recipe Assistant
                </CardTitle>
                <p className="text-muted-foreground">
                  Chat with our AI chef for authentic recipes, cooking techniques, and culinary wisdom from around the world.
                </p>
              </CardHeader>
              <CardContent>
                <RecipeChatbot />
              </CardContent>
            </Card>

          {/* Quick Start Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Start Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <h4 className="font-medium mb-2">🍝 Italian Classics</h4>
                  <p className="text-sm text-muted-foreground">
                    "Show me an authentic Italian carbonara recipe"
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <h4 className="font-medium mb-2">🍛 Asian Favorites</h4>
                  <p className="text-sm text-muted-foreground">
                    "I want to make Japanese ramen from scratch"
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <h4 className="font-medium mb-2">🌮 Mexican Cuisine</h4>
                  <p className="text-sm text-muted-foreground">
                    "Teach me to make authentic Mexican mole"
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <h4 className="font-medium mb-2">🥖 French Techniques</h4>
                  <p className="text-sm text-muted-foreground">
                    "How do I make perfect French bread?"
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <h4 className="font-medium mb-2">🍛 Indian Spices</h4>
                  <p className="text-sm text-muted-foreground">
                    "Show me how to make a traditional curry"
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <h4 className="font-medium mb-2">🍲 Ingredient Magic</h4>
                  <p className="text-sm text-muted-foreground">
                    "I have chicken, vegetables, and rice. What can I make?"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explore" className="space-y-6">
          {/* Cuisine Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Explore Global Cuisines</CardTitle>
              <p className="text-muted-foreground">
                Learn about authentic cooking traditions from around the world
              </p>
            </CardHeader>
            <CardContent>
              <Select value={selectedCuisine} onValueChange={handleCuisineSelect}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a cuisine to explore" />
                </SelectTrigger>
                <SelectContent>
                  {cuisines.map((cuisine) => (
                    <SelectItem key={cuisine.key} value={cuisine.key}>
                      {cuisine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Cuisine Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cuisines.map((cuisine) => (
              <Card 
                key={cuisine.key} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedCuisine === cuisine.key ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleCuisineSelect(cuisine.key)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{cuisine.name}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {cuisine.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Regions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {cuisine.regions.slice(0, 3).map((region, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                      {cuisine.regions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{cuisine.regions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Popular Dishes:</h4>
                    <div className="text-xs text-muted-foreground">
                      {cuisine.popularDishes.slice(0, 3).join(', ')}
                      {cuisine.popularDishes.length > 3 && '...'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Cuisine Details */}
          {selectedCuisine && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {cuisines.find(c => c.key === selectedCuisine)?.name} Cuisine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {cuisines.find(c => c.key === selectedCuisine)?.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Regional Variations</h4>
                      <div className="space-y-2">
                        {cuisines.find(c => c.key === selectedCuisine)?.regions.map((region, index) => (
                          <div key={index} className="p-2 bg-muted/30 rounded text-sm">
                            {region}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Signature Dishes</h4>
                      <div className="space-y-2">
                        {cuisines.find(c => c.key === selectedCuisine)?.popularDishes.map((dish, index) => (
                          <div key={index} className="p-2 bg-muted/30 rounded text-sm">
                            {dish}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="explore" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Explore World Cuisines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cuisines.map((cuisine) => (
                  <Card key={cuisine.key} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCuisineSelect(cuisine.key)}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold">{cuisine.name}</h4>
                      <p className="text-sm text-muted-foreground mt-2">{cuisine.description}</p>
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground">Popular Dishes:</p>
                        <p className="text-sm">{cuisine.popularDishes.slice(0, 3).join(', ')}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
      
      {/* Main Content - Comprehensive Recipe Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full"
            defaultValue="browse">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="browse" data-testid="tab-browse">
            <Search className="h-4 w-4 mr-2" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="saved" data-testid="tab-saved" disabled={!isAuthenticated}>
            <Heart className="h-4 w-4 mr-2" />
            Saved
          </TabsTrigger>
          <TabsTrigger value="collections" data-testid="tab-collections" disabled={!isAuthenticated}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Collections
          </TabsTrigger>
          <TabsTrigger value="shopping" data-testid="tab-shopping" disabled={!isAuthenticated}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Shopping
          </TabsTrigger>
          <TabsTrigger value="generate" data-testid="tab-generate">
            <ChefHat className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="cuisines" data-testid="tab-cuisines">
            <Globe className="h-4 w-4 mr-2" />
            Cuisines
          </TabsTrigger>
        </TabsList>

        {/* Browse Recipes Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Discover Recipes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes, ingredients, or cooking techniques..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-recipe-search"
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Cuisines</SelectItem>
                    {cuisines.map((cuisine) => (
                      <SelectItem key={cuisine.key} value={cuisine.key}>
                        {cuisine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Recipe Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : recipes.length > 0 ? (
              recipes.map((recipe: Recipe) => (
                <Card key={recipe.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleRecipeView(recipe)}>
                  {recipe.imageUrl && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {recipe.isPremium && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant={isRecipeSaved(recipe.id) ? "default" : "outline"}
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveRecipe(recipe.id, isRecipeSaved(recipe.id));
                        }}
                        data-testid={`button-save-${recipe.id}`}
                      >
                        <Heart className={`h-4 w-4 ${isRecipeSaved(recipe.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{recipe.title}</h3>
                    {recipe.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{recipe.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      {recipe.totalTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {recipe.totalTime}m
                        </div>
                      )}
                      {recipe.servings && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {recipe.servings} servings
                        </div>
                      )}
                      {recipe.difficulty && (
                        <Badge variant="outline" className="text-xs">
                          {recipe.difficulty}
                        </Badge>
                      )}
                    </div>
                    
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {recipe.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{recipe.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recipes Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or explore our recipe generator.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Saved Recipes Tab */}
        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                My Saved Recipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(savedRecipes as any[]).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(savedRecipes as any[]).map((saved: any) => (
                    <Card key={saved.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h4 className="font-semibold">{saved.recipeId}</h4>
                        {saved.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{saved.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Saved {new Date(saved.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Saved Recipes</h3>
                  <p className="text-muted-foreground">Start saving recipes you love to see them here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Recipe Collections
                </CardTitle>
                <Button size="sm" data-testid="button-create-collection">
                  Create Collection
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(collections as any[]).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(collections as any[]).map((collection: RecipeCollection) => (
                    <Card key={collection.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <h4 className="font-semibold">{collection.name}</h4>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground mt-2">{collection.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            {collection.recipeCount || 0} recipes
                          </span>
                          <Badge variant={collection.isPublic ? "default" : "secondary"}>
                            {collection.isPublic ? "Public" : "Private"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Collections</h3>
                  <p className="text-muted-foreground mb-4">Organize your recipes into collections.</p>
                  <Button data-testid="button-create-first-collection">
                    Create Your First Collection
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Shopping Lists Tab */}
        <TabsContent value="shopping" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Shopping Lists
                </CardTitle>
                <Button size="sm" data-testid="button-create-shopping-list">
                  Create List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(shoppingLists as any[]).length > 0 ? (
                <div className="space-y-4">
                  {(shoppingLists as any[]).map((list: any) => (
                    <Card key={list.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{list.name}</h4>
                            {list.description && (
                              <p className="text-sm text-muted-foreground">{list.description}</p>
                            )}
                          </div>
                          <Badge variant={list.isDefault ? "default" : "outline"}>
                            {list.isDefault ? "Default" : "Custom"}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Created {new Date(list.createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Shopping Lists</h3>
                  <p className="text-muted-foreground mb-4">Create shopping lists from your favorite recipes.</p>
                  <Button data-testid="button-create-first-shopping-list">
                    Create Your First List
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recipe Generation Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card data-testid="card-recipe-generation">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                AI Recipe Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecipeChatbot />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Cuisines Tab */}
        <TabsContent value="cuisines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Explore Cuisines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cuisines.map((cuisine) => (
                  <Card key={cuisine.key} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCuisineSelect(cuisine.key)}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold">{cuisine.name}</h4>
                      <p className="text-sm text-muted-foreground mt-2">{cuisine.description}</p>
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground">Popular Dishes:</p>
                        <p className="text-sm">{cuisine.popularDishes.slice(0, 3).join(', ')}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">Professional Culinary AI</span>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our AI chef has been trained on authentic culinary traditions from around the world. 
            Get real recipes with traditional techniques, cultural context, and professional cooking tips.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}