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
import { ChefHat, Globe, Clock, Users, Star, Utensils, BookOpen } from 'lucide-react';
import { RecipeChatbot } from '@/components/recipe-chatbot';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CuisineInfo {
  name: string;
  key: string;
  description: string;
  regions: string[];
  popularDishes: string[];
}

export default function RecipesPage() {
  const { user } = useAuth();
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');

  // Fetch available cuisines with authentic information
  const { data: cuisineData } = useQuery({
    queryKey: ['/api/chatbot/cuisines'],
    queryFn: async () => {
      const response = await fetch('/api/chatbot/cuisines');
      return response.json();
    },
  });

  const cuisines: CuisineInfo[] = cuisineData?.cuisines || [];

  const handleCuisineSelect = (cuisineKey: string) => {
    setSelectedCuisine(cuisineKey);
    // Optional: could trigger a cuisine info request to the chatbot
  };

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="page-recipes">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">Recipe Generation</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover authentic recipes from around the world with our professional culinary AI. 
          Get real recipes based on traditional techniques and genuine ingredients.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            8 Authentic Cuisines
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Traditional Techniques
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Utensils className="h-3 w-3" />
            Cultural Context
          </Badge>
        </div>
      </div>

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

                  <div className="text-center">
                    <Button 
                      className="w-full max-w-md"
                      onClick={() => {
                        // Switch to chat tab with a cuisine-specific message
                        const chatTab = document.querySelector('[data-testid="tab-chat"]') as HTMLElement;
                        chatTab?.click();
                      }}
                    >
                      <ChefHat className="h-4 w-4 mr-2" />
                      Get {cuisines.find(c => c.key === selectedCuisine)?.name} Recipes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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