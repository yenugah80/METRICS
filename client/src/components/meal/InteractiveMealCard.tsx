import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChefHat, 
  Clock, 
  Flame, 
  Zap, 
  TrendingUp, 
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Target
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface InteractiveMealCardProps {
  mealId: string;
  mealType: string;
  dayNumber: number;
  title: string;
  description: string;
  calories: number;
  protein: number;
  prepTime: string;
  difficulty: string;
  tags: string[];
  userId?: string;
  source?: string;
  allergens?: string[];
  onComplete?: (mealId: string, mealType: string, dayNumber: number) => void;
  onSwap?: (originalId: string, newMealId: string, mealType: string, reason: string) => void;
  onSaveFavorite?: (mealId: string) => void;
}

export function InteractiveMealCard({ 
  mealId,
  mealType, 
  dayNumber,
  title,
  description,
  calories,
  protein,
  prepTime,
  difficulty,
  tags,
  userId,
  source,
  allergens = [],
  onComplete,
  onSwap,
  onSaveFavorite
}: InteractiveMealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapOptions, setSwapOptions] = useState<any[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Complete meal mutation
  const completeMealMutation = useMutation({
    mutationFn: async (data: { 
      mealId: string; 
      mealType: string; 
      dayNumber: number;
      userId?: string;
    }) => {
      return await apiRequest('POST', '/api/meals/complete', data);
    },
    onSuccess: () => {
      setIsCompleted(true);
      toast({
        title: "Meal Completed! 🎉",
        description: `${title} has been marked as eaten`,
      });
      onComplete?.(mealId, mealType, dayNumber);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to complete meal",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Save meal mutation
  const saveMealMutation = useMutation({
    mutationFn: async (mealId: string) => {
      return await apiRequest('POST', '/api/meals/save-favorite', { mealId });
    },
    onSuccess: () => {
      setIsFavorite(true);
      toast({
        title: "Meal Saved! ⭐",
        description: `${title} added to your favorites`,
      });
      onSaveFavorite?.(mealId);
    }
  });

  // Swap meal mutation
  const swapMealMutation = useMutation({
    mutationFn: async (data: { 
      originalMealId: string; 
      mealType: string; 
      dayNumber: number; 
      preferences?: string[] 
    }) => {
      return await apiRequest('POST', '/api/meals/get-swap-options', data);
    },
    onSuccess: (data: any) => {
      setSwapOptions(data.swapOptions || []);
      setIsSwapping(true);
    }
  });

  const handleSelectSwap = async (newMeal: any) => {
    try {
      // Track the swap for AI learning
      await apiRequest('POST', '/api/meals/track-swap', {
        originalMealId: mealId,
        newMealId: newMeal.id,
        mealType,
        swapReason: 'user_preference'
      });
      
      onSwap?.(mealId, newMeal.id, mealType, 'user_preference');
      setIsSwapping(false);
      setSwapOptions([]);
      
      toast({
        title: "Meal Swapped! 🔄",
        description: `${title} replaced with ${newMeal.name}`,
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
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate contribution to daily targets
  const calorieContribution = Math.round((calories / 2000) * 100); // Default 2000 cal target
  const proteinContribution = Math.round((protein / 150) * 100); // Default 150g protein target

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg bg-white/80 backdrop-blur-sm border-0 shadow-lg ${isCompleted ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
      <CardContent className="p-4">
        {/* Meal Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-indigo-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {title}
              </h3>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {mealType}
                </Badge>
                {isCompleted && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
                {isFavorite && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {description}
            </p>
          </div>
        </div>

        {/* Nutrition Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {calories} cal
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {protein}g protein
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {prepTime}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Badge className={getDifficultyColor(difficulty)}>
              {difficulty}
            </Badge>
          </Badge>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span>Calories</span>
            <span>{calories}/2000</span>
          </div>
          <Progress value={calorieContribution} className="h-1" />
          
          <div className="flex items-center justify-between text-xs">
            <span>Protein</span>
            <span>{protein}g/150g</span>
          </div>
          <Progress value={proteinContribution} className="h-1" />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Allergens Warning */}
        {allergens.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3">
            <div className="flex items-center gap-1 text-orange-800 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>Contains: {allergens.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isCompleted ? (
            <Button 
              size="sm" 
              onClick={() => completeMealMutation.mutate({
                mealId,
                mealType,
                dayNumber,
                userId
              })}
              disabled={completeMealMutation.isPending}
              className="flex-1"
              data-testid={`button-complete-${mealId}`}
            >
              {completeMealMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Complete
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled className="flex-1">
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Completed
            </Button>
          )}

          <Button 
            size="sm" 
            variant="outline"
            onClick={() => swapMealMutation.mutate({
              originalMealId: mealId,
              mealType,
              dayNumber
            })}
            disabled={swapMealMutation.isPending}
            data-testid={`button-swap-${mealId}`}
          >
            {swapMealMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>

          <Button 
            size="sm" 
            variant="outline"
            onClick={() => saveMealMutation.mutate(mealId)}
            disabled={saveMealMutation.isPending || isFavorite}
            data-testid={`button-save-${mealId}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
          </Button>

          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid={`button-expand-${mealId}`}
          >
            <Plus className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
          </Button>
        </div>

        {/* Swap Options */}
        {isSwapping && swapOptions.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Choose a replacement:</h4>
            <div className="space-y-2">
              {swapOptions.slice(0, 3).map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleSelectSwap(option)}
                >
                  <div>
                    <div className="font-medium">{option.name}</div>
                    <div className="text-xs text-gray-500">
                      {option.calories} cal • {option.protein}g protein
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setIsSwapping(false)}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Meal Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>Source: {source || 'Diet Plan'}</div>
              <div>Difficulty: {difficulty}</div>
              <div>Day: {dayNumber}</div>
              <div>Prep Time: {prepTime}</div>
            </div>
            {description && (
              <div className="mt-2">
                <p className="text-xs text-gray-600">{description}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}