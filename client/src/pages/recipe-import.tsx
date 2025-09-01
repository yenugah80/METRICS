import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload, CheckCircle, Chef } from 'lucide-react';

interface ImportResponse {
  success: boolean;
  imported: number;
  recipeIds: string[];
  processed: Array<{
    name: string;
    calories: number;
    cuisine: string[];
    difficulty: string;
    nutritionConfidence: number;
  }>;
  chefAiTrained: boolean;
  message: string;
}

export default function RecipeImport() {
  const [recipeData, setRecipeData] = useState('');
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/recipes/import', data);
      return response.json() as Promise<ImportResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: "Recipes Imported Successfully! 🎉",
        description: data.message,
      });
      setRecipeData('');
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import recipes",
        variant: "destructive",
      });
    },
  });

  const sampleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/recipes/import-samples', {});
      return response.json() as Promise<ImportResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: "Sample Recipes Added! 🍳",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sample Import Failed",
        description: error.message || "Failed to import sample recipes",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    try {
      const recipes = JSON.parse(recipeData);
      importMutation.mutate({
        recipes: Array.isArray(recipes) ? recipes : [recipes],
        trainChefAI: true
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your recipe data format",
        variant: "destructive",
      });
    }
  };

  const handleSampleImport = () => {
    sampleMutation.mutate();
  };

  const sampleRecipeFormat = `[
  {
    "title": "Mediterranean Quinoa Bowl",
    "ingredients": [
      "1 cup quinoa",
      "2 cups vegetable broth",
      "1 cucumber, diced",
      "1 cup cherry tomatoes",
      "1/2 cup feta cheese",
      "1/4 cup olive oil",
      "2 tbsp lemon juice"
    ],
    "instructions": [
      "Cook quinoa in broth until fluffy",
      "Mix vegetables and herbs",
      "Add dressing and combine",
      "Top with feta cheese"
    ],
    "prepTime": 20,
    "cookTime": 15,
    "servings": 4,
    "cuisine": "Mediterranean",
    "difficulty": "easy"
  }
]`;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center">
              <Chef className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recipe Import & ChefAI Training</h1>
              <p className="text-white/90">Import web recipes and train ChefAI with OpenAI-enhanced nutrition data</p>
            </div>
          </div>
        </div>

        {/* Quick Sample Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Quick Start - Sample Recipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Import sample recipes to test the system and train ChefAI with high-quality nutrition data.
            </p>
            <Button 
              onClick={handleSampleImport}
              disabled={sampleMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sampleMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import Sample Recipes
                </div>
              )}
            </Button>
            
            {sampleMutation.isSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  Sample recipes imported and ChefAI trained successfully!
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Recipe Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-500" />
              Custom Recipe Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Data (JSON Format)
              </label>
              <Textarea
                value={recipeData}
                onChange={(e) => setRecipeData(e.target.value)}
                placeholder={sampleRecipeFormat}
                className="h-64 font-mono text-sm"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleImport}
                disabled={importMutation.isPending || !recipeData.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {importMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Import & Train ChefAI
                  </div>
                )}
              </Button>

              <Button 
                variant="outline"
                onClick={() => setRecipeData(sampleRecipeFormat)}
              >
                Load Sample Format
              </Button>
            </div>

            {importMutation.isSuccess && importMutation.data && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  Import Successful!
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Imported {importMutation.data.imported} recipes</p>
                  <p>• ChefAI knowledge base updated</p>
                  <p>• Recipes processed with OpenAI nutrition analysis</p>
                </div>
                
                {importMutation.data.processed.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-gray-700 mb-2">Processed Recipes:</p>
                    <div className="space-y-1">
                      {importMutation.data.processed.map((recipe, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex justify-between">
                          <span>{recipe.name}</span>
                          <span>{recipe.calories} cal • {recipe.difficulty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Import Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">OpenAI Enhancement</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Nutrition analysis and calorie estimation</li>
                  <li>• Dietary tag detection (vegan, keto, etc.)</li>
                  <li>• Difficulty assessment</li>
                  <li>• Cuisine classification</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">ChefAI Training</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Recipe knowledge base integration</li>
                  <li>• Personalized meal suggestions</li>
                  <li>• Nutrition-aware recommendations</li>
                  <li>• Cooking guidance and tips</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}