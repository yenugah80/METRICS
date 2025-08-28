import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChefHat, Clock, Users, Star, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  servings: number;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
}

export default function RecipeGenerator() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [cuisine, setCuisine] = useState("");
  const [dietType, setDietType] = useState("");
  const { toast } = useToast();

  const MAX_DAILY_RECIPES = 5; // Free tier limit

  const generateRecipes = async () => {
    if (dailyCount >= MAX_DAILY_RECIPES) {
      toast({
        title: "Daily limit reached",
        description: `You've reached your daily limit of ${MAX_DAILY_RECIPES} recipes. Upgrade to Premium for unlimited recipes!`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock recipe generation
    const mockRecipes: Recipe[] = [
      {
        id: "1",
        name: "Mediterranean Quinoa Bowl",
        description: "A nutritious bowl packed with quinoa, fresh vegetables, and a tangy lemon dressing",
        prepTime: 25,
        servings: 2,
        difficulty: "Easy",
        ingredients: [
          "1 cup quinoa",
          "2 cups vegetable broth",
          "1 cucumber, diced",
          "1 cup cherry tomatoes, halved",
          "1/2 red onion, sliced",
          "1/4 cup kalamata olives",
          "1/4 cup feta cheese",
          "2 tbsp olive oil",
          "1 lemon, juiced",
          "1 tsp oregano"
        ],
        instructions: [
          "Rinse quinoa and cook in vegetable broth for 15 minutes",
          "Let quinoa cool to room temperature",
          "Dice cucumber and halve cherry tomatoes",
          "Slice red onion thinly",
          "Whisk together olive oil, lemon juice, and oregano",
          "Combine all ingredients in a large bowl",
          "Toss with dressing and serve"
        ],
        nutrition: {
          calories: 420,
          protein: 18,
          carbs: 52,
          fat: 16
        },
        tags: ["Vegetarian", "Mediterranean", "High Protein", "Gluten-Free"]
      },
      {
        id: "2", 
        name: "Spicy Black Bean Tacos",
        description: "Plant-based tacos with seasoned black beans, fresh salsa, and avocado",
        prepTime: 20,
        servings: 4,
        difficulty: "Easy",
        ingredients: [
          "2 cans black beans, drained",
          "8 corn tortillas",
          "1 avocado, sliced",
          "1/2 red onion, diced",
          "2 tomatoes, diced",
          "1/4 cup cilantro, chopped",
          "1 lime, juiced",
          "1 tsp cumin",
          "1 tsp chili powder",
          "1/2 tsp paprika"
        ],
        instructions: [
          "Heat black beans with cumin, chili powder, and paprika",
          "Warm tortillas in a dry pan",
          "Dice tomatoes and red onion for salsa",
          "Mix tomatoes, onion, cilantro, and lime juice",
          "Slice avocado",
          "Assemble tacos with beans, salsa, and avocado",
          "Serve immediately"
        ],
        nutrition: {
          calories: 280,
          protein: 12,
          carbs: 45,
          fat: 8
        },
        tags: ["Vegan", "Mexican", "High Fiber", "Quick"]
      }
    ];

    try {
      // Try real API call to generate recipes
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuisine, dietType, preferences: [] })
      });
      
      if (response.ok) {
        const newRecipes = await response.json();
        setRecipes(prev => [...newRecipes, ...prev]);
        setDailyCount(prev => prev + newRecipes.length);
        
        toast({
          title: "Recipes generated!",
          description: `Generated ${newRecipes.length} personalized recipes based on your preferences.`,
        });
        setIsGenerating(false);
        return;
      }
    } catch (error) {
      console.warn('Recipe API failed, using mock data:', error);
    }
    
    // Fallback to mock recipe generation
    setRecipes(prev => [...mockRecipes, ...prev]);
    setDailyCount(prev => prev + mockRecipes.length);
    setIsGenerating(false);

    toast({
      title: "Recipes generated!",
      description: `Generated ${mockRecipes.length} sample recipes. API integration coming soon!`,
    });
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center space-x-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span>Recipe Generator</span>
          </h1>
          <p className="text-muted-foreground">
            Generate personalized recipes based on your dietary preferences
          </p>
        </div>

        {/* Free Tier Limit Display */}
        <div className="mb-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium">Daily Recipe Limit</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {dailyCount} / {MAX_DAILY_RECIPES} recipes used today
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(dailyCount / MAX_DAILY_RECIPES) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              {dailyCount >= MAX_DAILY_RECIPES && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    🎯 You've reached your daily limit! Upgrade to Premium for unlimited recipe generation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Generation Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recipe Preferences</CardTitle>
            <CardDescription>
              Customize your recipe generation with dietary preferences and cuisine types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Cuisine Type</label>
                <Select value={cuisine} onValueChange={setCuisine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mediterranean">Mediterranean</SelectItem>
                    <SelectItem value="asian">Asian</SelectItem>
                    <SelectItem value="mexican">Mexican</SelectItem>
                    <SelectItem value="italian">Italian</SelectItem>
                    <SelectItem value="american">American</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Diet Type</label>
                <Select value={dietType} onValueChange={setDietType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select diet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                    <SelectItem value="paleo">Paleo</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={generateRecipes}
                  disabled={isGenerating || dailyCount >= MAX_DAILY_RECIPES}
                  className="w-full py-3 text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ChefHat className="h-4 w-4 mr-2" />
                      Generate Recipes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Recipes */}
        {recipes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{recipe.name}</CardTitle>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                  </div>
                  <CardDescription>{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Recipe Meta Info */}
                  <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{recipe.prepTime} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{recipe.servings} servings</span>
                    </div>
                    <Badge variant="secondary">{recipe.difficulty}</Badge>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Nutrition Info */}
                  <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <div className="font-bold text-sm">{recipe.nutrition.calories}</div>
                      <div className="text-xs text-muted-foreground">cal</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm">{recipe.nutrition.protein}g</div>
                      <div className="text-xs text-muted-foreground">protein</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm">{recipe.nutrition.carbs}g</div>
                      <div className="text-xs text-muted-foreground">carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm">{recipe.nutrition.fat}g</div>
                      <div className="text-xs text-muted-foreground">fat</div>
                    </div>
                  </div>

                  {/* Ingredients Preview */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-2">Ingredients ({recipe.ingredients.length})</h4>
                    <div className="text-sm text-muted-foreground">
                      {recipe.ingredients.slice(0, 3).join(", ")}
                      {recipe.ingredients.length > 3 && "..."}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    View Full Recipe
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {recipes.length === 0 && !isGenerating && (
          <Card className="p-12 text-center">
            <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No recipes generated yet</h3>
            <p className="text-muted-foreground mb-6">
              Select your preferences and generate personalized recipes to get started
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}