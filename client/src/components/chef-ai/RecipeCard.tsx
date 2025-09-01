import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, Bookmark, Share2, Plus } from 'lucide-react';

interface RecipeIngredient {
  item: string;
  amount: string;
  calories: number;
  protein: number;
}

interface RecipeDetails {
  recipeName: string;
  servings: number;
  prepTime: string;
  cookTime: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutritionPerServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

interface RecipeCardProps {
  recipe: RecipeDetails;
  onSave?: () => void;
  onShare?: () => void;
  onAddToMealPlan?: () => void;
}

export function RecipeCard({ recipe, onSave, onShare, onAddToMealPlan }: RecipeCardProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto my-4 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-gray-900 mb-2">
              {recipe.recipeName}
            </CardTitle>
            <div className="flex gap-4 text-sm text-gray-600">
              {recipe.prepTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Prep: {recipe.prepTime}
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Cook: {recipe.cookTime}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {onSave && (
              <Button variant="ghost" size="sm" onClick={onSave}>
                <Bookmark className="w-4 h-4" />
              </Button>
            )}
            {onShare && (
              <Button variant="ghost" size="sm" onClick={onShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            {onAddToMealPlan && (
              <Button variant="ghost" size="sm" onClick={onAddToMealPlan}>
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Nutrition Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Nutrition (per serving)</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">{recipe.nutritionPerServing.calories}</div>
              <div className="text-gray-600">calories</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{recipe.nutritionPerServing.protein}g</div>
              <div className="text-gray-600">protein</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-orange-600">{recipe.nutritionPerServing.carbs}g</div>
              <div className="text-gray-600">carbs</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">{recipe.nutritionPerServing.fat}g</div>
              <div className="text-gray-600">fat</div>
            </div>
            {recipe.nutritionPerServing.fiber > 0 && (
              <div className="text-center">
                <div className="font-semibold text-teal-600">{recipe.nutritionPerServing.fiber}g</div>
                <div className="text-gray-600">fiber</div>
              </div>
            )}
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Ingredients</h4>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex justify-between items-center py-1">
                <span className="text-gray-700">
                  <span className="font-medium">{ingredient.amount}</span> {ingredient.item}
                </span>
                {ingredient.calories > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {ingredient.calories} cal
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Instructions</h4>
          <ol className="space-y-3">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}