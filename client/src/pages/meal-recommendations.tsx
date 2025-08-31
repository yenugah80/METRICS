import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  ChefHat, 
  Clock, 
  Users, 
  Target, 
  Sparkles, 
  Leaf, 
  CheckCircle,
  Utensils,
  Apple
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useLocalAuth';
import MealRecommendations from '@/components/MealRecommendations';

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

export default function MealRecommendationsPage() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<MealRecommendation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSelectRecommendation = (recommendation: MealRecommendation) => {
    setSelectedRecommendation(recommendation);
    setIsDialogOpen(true);
  };

  const addToMealPlan = () => {
    if (selectedRecommendation) {
      toast({
        title: "Added to meal plan!",
        description: `${selectedRecommendation.name} has been saved to your meal planning`,
      });
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
              AI Meal Recommendations
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get personalized meal suggestions tailored to your nutritional goals, dietary preferences, and cooking style
          </p>
        </div>

        {/* Main Recommendations Component */}
        <MealRecommendations onSelectRecommendation={handleSelectRecommendation} />

        {/* Detailed Recommendation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedRecommendation && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    {selectedRecommendation.name}
                  </DialogTitle>
                  <p className="text-muted-foreground">
                    {selectedRecommendation.description}
                  </p>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Meal Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium">Total Time</p>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedRecommendation.prepTime + selectedRecommendation.cookTime}min
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <p className="text-sm font-medium">Servings</p>
                      <p className="text-lg font-bold text-green-600">
                        {selectedRecommendation.servings}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Target className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                      <p className="text-sm font-medium">Goal Match</p>
                      <p className="text-lg font-bold text-purple-600">
                        {Math.round(selectedRecommendation.goalAlignment.overallScore)}/100
                      </p>
                    </div>
                    <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                      <Leaf className="w-6 h-6 mx-auto mb-2 text-teal-600" />
                      <p className="text-sm font-medium">Sustainability</p>
                      <p className="text-lg font-bold text-teal-600">
                        {selectedRecommendation.sustainabilityScore}/10
                      </p>
                    </div>
                  </div>

                  {/* Nutrition Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Apple className="w-5 h-5" />
                        Nutrition per Serving
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Calories</p>
                          <p className="text-2xl font-bold">{Math.round(selectedRecommendation.nutrition.calories)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Protein</p>
                          <p className="text-2xl font-bold">{Math.round(selectedRecommendation.nutrition.protein)}g</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Carbs</p>
                          <p className="text-2xl font-bold">{Math.round(selectedRecommendation.nutrition.carbs)}g</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Fat</p>
                          <p className="text-2xl font-bold">{Math.round(selectedRecommendation.nutrition.fat)}g</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Fiber</p>
                          <p className="text-2xl font-bold">{Math.round(selectedRecommendation.nutrition.fiber)}g</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sodium</p>
                          <p className="text-2xl font-bold">{Math.round(selectedRecommendation.nutrition.sodium)}mg</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recipe Details */}
                  <Tabs defaultValue="ingredients" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                      <TabsTrigger value="instructions">Instructions</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="ingredients" className="space-y-4">
                      <div className="grid gap-2">
                        {selectedRecommendation.ingredients.map((ingredient, index) => (
                          <div key={index} className="flex justify-between items-center p-2 rounded border">
                            <span className="font-medium">{ingredient.name}</span>
                            <span className="text-muted-foreground">
                              {ingredient.quantity} {ingredient.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="instructions" className="space-y-4">
                      <div className="space-y-3">
                        {selectedRecommendation.instructions.map((instruction, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-relaxed">{instruction}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="space-y-4">
                      <div className="space-y-4">
                        {/* Diet Compatibility */}
                        <div>
                          <h4 className="font-medium mb-2">Diet Compatibility</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(selectedRecommendation.dietCompatibility)
                              .filter(([_, compatible]) => compatible)
                              .map(([diet, _]) => (
                                <Badge key={diet} variant="secondary" className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {diet.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </Badge>
                              ))}
                          </div>
                        </div>
                        
                        {/* Sustainability */}
                        <div>
                          <h4 className="font-medium mb-2">Sustainability</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedRecommendation.sustainabilityNotes}
                          </p>
                        </div>
                        
                        {/* AI Reasoning */}
                        <div>
                          <h4 className="font-medium mb-2">Why This Recommendation?</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedRecommendation.reasoning}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      onClick={addToMealPlan} 
                      className="flex items-center gap-2"
                      data-testid="button-add-to-meal-plan"
                    >
                      <Utensils className="w-4 h-4" />
                      Add to Meal Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-close-recommendation"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}