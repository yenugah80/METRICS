import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Apple } from "lucide-react";

interface FoodItem {
  name: string;
  barcode?: string;
  quantity: number;
  unit: string;
  brand?: string;
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
    saturatedFat?: number;
  };
  confidence: number;
  source: string;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchFood = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search term",
        description: "Enter a food name, brand, or ingredient to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch('/api/foods/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        
        if (results.length === 0) {
          toast({
            title: "No results found",
            description: "Try a different search term or check the spelling",
            variant: "default",
          });
        }
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search food database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addToMeal = async (food: FoodItem) => {
    try {
      // Add to current meal or create new meal
      const response = await fetch('/api/meals/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: food.name,
          quantity: food.quantity,
          unit: food.unit,
          nutrition: food.nutrition,
          source: 'search'
        })
      });

      if (response.ok) {
        toast({
          title: "Added to meal",
          description: `${food.name} has been added to your current meal`,
        });
      } else {
        throw new Error('Failed to add to meal');
      }
    } catch (error) {
      console.error('Add to meal error:', error);
      toast({
        title: "Failed to add",
        description: "Unable to add item to meal. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-2">
            <Search className="h-8 w-8 text-primary" />
            <span>Food Search</span>
          </h1>
          <p className="text-muted-foreground">
            Search our comprehensive food database including USDA FoodData Central and Open Food Facts
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Search for food items (e.g., 'chicken breast', 'apple', 'whole milk')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchFood()}
                  className="text-base"
                  data-testid="input-food-search"
                />
                <Button 
                  onClick={searchFood}
                  disabled={isSearching}
                  className="px-6"
                  data-testid="button-search-food"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results ({searchResults.length})</h2>
            
            {searchResults.map((food, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{food.name}</h3>
                        {food.brand && (
                          <Badge variant="outline">{food.brand}</Badge>
                        )}
                        <Badge 
                          variant="secondary"
                          className="text-xs"
                        >
                          {food.source}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Calories:</span>
                          <div className="font-medium">
                            {food.nutrition.calories || 'N/A'} per {food.quantity}{food.unit}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Protein:</span>
                          <div className="font-medium">{food.nutrition.protein || 'N/A'}g</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Carbs:</span>
                          <div className="font-medium">{food.nutrition.carbs || 'N/A'}g</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fat:</span>
                          <div className="font-medium">{food.nutrition.fat || 'N/A'}g</div>
                        </div>
                      </div>
                      
                      {food.nutrition.fiber && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Fiber: {food.nutrition.fiber}g | Sodium: {food.nutrition.sodium || 'N/A'}mg
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => addToMeal(food)}
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      data-testid={`button-add-${index}`}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Meal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !isSearching && (
          <Card>
            <CardContent className="p-8 text-center">
              <Apple className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Start searching for food</h3>
              <p className="text-muted-foreground mb-4">
                Enter a food name above to search our comprehensive nutrition database
              </p>
              <div className="text-sm text-muted-foreground">
                <p>• Over 350,000 foods from USDA FoodData Central</p>
                <p>• Brand products from Open Food Facts</p>
                <p>• AI-powered nutrition estimates when data unavailable</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}