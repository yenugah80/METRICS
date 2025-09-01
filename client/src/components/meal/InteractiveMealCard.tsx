import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Camera, 
  RefreshCw, 
  Check, 
  Heart, 
  Clock, 
  ChefHat,
  Zap,
  Leaf,
  AlertCircle,
  Plus,
  Star
} from 'lucide-react';

interface MealCardProps {
  meal: {
    id: string;
    name: string;
    description: string;
    prepTime: number;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    dietTags: string[];
    allergens: string[];
    sustainabilityScore: number;
    difficulty: 'easy' | 'medium' | 'hard';
    imageUrl?: string;
    isCompleted?: boolean;
    isFavorite?: boolean;
  };
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dayNumber: number;
  userTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onMealSwapped?: (newMeal: any) => void;
  onMealCompleted?: (mealId: string) => void;
  onMealSaved?: (mealId: string) => void;
}

export function InteractiveMealCard({ 
  meal, 
  mealType, 
  dayNumber, 
  userTargets,
  onMealSwapped,
  onMealCompleted,
  onMealSaved 
}: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapOptions, setSwapOptions] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Swap meal mutation
  const swapMealMutation = useMutation({
    mutationFn: async (data: { 
      originalMealId: string; 
      mealType: string; 
      dietPreferences: string[];
      allergens: string[];
    }) => {
      return await apiRequest('POST', '/api/meals/get-swap-options', data);
    },
    onSuccess: (data: any) => {
      setSwapOptions(data.alternatives || []);
    },
    onError: (error: any) => {
      toast({
        title: "Swap Error",
        description: error.message || "Failed to get meal alternatives",
        variant: "destructive",
      });
    },
  });

  // Complete meal mutation
  const completeMealMutation = useMutation({
    mutationFn: async (data: { mealId: string; mealType: string; dayNumber: number }) => {
      return await apiRequest('POST', `/api/diet-plans/complete-meal`, data);
    },
    onSuccess: () => {
      toast({
        title: "Meal Completed! 🎉",
        description: `${meal.name} has been marked as eaten`,
      });
      onMealCompleted?.(meal.id);
      queryClient.invalidateQueries({ queryKey: ['/api/diet-plans'] });
    },
  });

  // Save meal mutation
  const saveMealMutation = useMutation({
    mutationFn: async (mealId: string) => {
      return await apiRequest('POST', `/api/meals/save-favorite`, { mealId });
    },
    onSuccess: () => {
      toast({
        title: "Meal Saved! ⭐",
        description: `${meal.name} added to your favorites`,
      });
      onMealSaved?.(meal.id);
    },
  });

  const handleSwapMeal = async () => {
    setIsSwapping(true);
    // In production, get user's actual preferences from profile
    await swapMealMutation.mutateAsync({
      originalMealId: meal.id,
      mealType,
      dietPreferences: [], // Get from user profile
      allergens: [], // Get from user profile
    });
  };

  const handleSelectSwap = async (newMeal: any) => {
    try {
      // Track the swap for AI learning
      await apiRequest('POST', '/api/meals/track-swap', {
        originalMealId: meal.id,
        newMealId: newMeal.id,
        mealType,
        swapReason: 'user_preference'
      });
      
      onMealSwapped?.(newMeal);
      setIsSwapping(false);
      setSwapOptions([]);
      
      toast({
        title: "Meal Swapped! 🔄",
        description: `${meal.name} replaced with ${newMeal.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Swap Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSustainabilityColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate contribution to daily targets
  const calorieContribution = (meal.nutrition.calories / userTargets.calories) * 100;
  const proteinContribution = (meal.nutrition.protein / userTargets.protein) * 100;

  return (
    <Card className={`transition-all duration-300 ${meal.isCompleted ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-lg'}`}>
      <CardContent className="p-4">
        {/* Meal Header */}
        <div className="flex items-start gap-3 mb-3">
          {meal.imageUrl ? (
            <img 
              src={meal.imageUrl} 
              alt={meal.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-indigo-600" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {meal.name}
              </h3>
              <div className="flex items-center gap-1">
                {meal.isCompleted && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
                {meal.isFavorite && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {meal.description}
            </p>
          </div>
        </div>

        {/* Nutrition Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {meal.nutrition.calories} cal
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {meal.nutrition.protein}g protein
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {meal.nutrition.carbs}g carbs
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {meal.nutrition.fat}g fat
          </Badge>
        </div>

        {/* Contribution to Daily Targets */}
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Calories ({Math.round(calorieContribution)}% of daily goal)</span>
            <span>{meal.nutrition.calories}/{userTargets.calories}</span>
          </div>
          <Progress value={Math.min(calorieContribution, 100)} className="h-1" />
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>Protein ({Math.round(proteinContribution)}% of daily goal)</span>
            <span>{meal.nutrition.protein}g/{userTargets.protein}g</span>
          </div>
          <Progress value={Math.min(proteinContribution, 100)} className="h-1" />
        </div>

        {/* Meal Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>{meal.prepTime} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(meal.difficulty)}>
              {meal.difficulty}
            </Badge>
            <div className="flex items-center gap-1">
              <Leaf className={`w-3 h-3 ${getSustainabilityColor(meal.sustainabilityScore)}`} />
              <span className={getSustainabilityColor(meal.sustainabilityScore)}>
                {meal.sustainabilityScore}/10
              </span>
            </div>
          </div>
        </div>

        {/* Diet Tags */}
        {meal.dietTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {meal.dietTags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Allergen Warning */}
        {meal.allergens.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-orange-600 mb-3">
            <AlertCircle className="w-3 h-3" />
            <span>Contains: {meal.allergens.join(', ')}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!meal.isCompleted ? (
            <>
              <Button
                size="sm"
                onClick={() => completeMealMutation.mutate({
                  mealId: meal.id,
                  mealType,
                  dayNumber
                })}
                disabled={completeMealMutation.isPending}
                className="flex-1"
                data-testid={`button-complete-${meal.id}`}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark Eaten
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleSwapMeal}
                disabled={swapMealMutation.isPending}
                data-testid={`button-swap-${meal.id}`}
              >
                <RefreshCw className={`w-4 h-4 ${swapMealMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
              <Check className="w-4 h-4" />
              Completed
            </div>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => saveMealMutation.mutate(meal.id)}
            disabled={saveMealMutation.isPending || meal.isFavorite}
            data-testid={`button-save-${meal.id}`}
          >
            <Heart className={`w-4 h-4 ${meal.isFavorite ? 'fill-current text-red-500' : ''}`} />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid={`button-expand-${meal.id}`}
          >
            <Plus className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
          </Button>
        </div>

        {/* Swap Options */}
        {isSwapping && swapOptions.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Alternative Options:</h4>
            <div className="space-y-2">
              {swapOptions.slice(0, 3).map((option, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectSwap(option)}
                >
                  <div>
                    <p className="font-medium text-sm">{option.name}</p>
                    <p className="text-xs text-gray-600">
                      {option.nutrition.calories} cal • {option.nutrition.protein}g protein
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Select
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsSwapping(false)}
              className="w-full mt-2"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Nutrition Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Fiber: {meal.nutrition.fiber}g</div>
              <div>Prep Time: {meal.prepTime} min</div>
            </div>
            {meal.description && (
              <div>
                <h5 className="font-medium text-xs mb-1">Description</h5>
                <p className="text-xs text-gray-600">{meal.description}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}