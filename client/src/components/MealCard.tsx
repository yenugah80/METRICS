import { Card, CardContent } from "@/components/ui/card";
import ScoreBadge from "@/components/ScoreBadge";
import { ChevronRight } from "lucide-react";

interface MealCardProps {
  meal: {
    id: string;
    name: string;
    mealType: string;
    loggedAt: string;
    imageUrl?: string;
    nutrition?: {
      calories: number;
      protein: string;
      carbs: string;
      fat: string;
    };
    scores?: {
      nutritionGrade: string;
    };
  };
}

export default function MealCard({ meal }: MealCardProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const nutrition = meal.nutrition;
  const grade = meal.scores?.nutritionGrade || 'C';

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer bg-muted/5 border-0" 
      data-testid={`meal-card-${meal.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Meal Image */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted/20 flex-shrink-0">
            {meal.imageUrl ? (
              <img 
                src={meal.imageUrl} 
                alt={meal.name}
                className="w-full h-full object-cover" 
                data-testid={`meal-image-${meal.id}`}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <span className="text-2xl">🍽️</span>
              </div>
            )}
          </div>

          {/* Meal Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-foreground truncate" data-testid={`meal-name-${meal.id}`}>
                {meal.name}
              </h3>
              <ScoreBadge grade={grade} />
            </div>
            
            <p className="text-sm text-muted-foreground mb-2" data-testid={`meal-time-${meal.id}`}>
              {formatTime(meal.loggedAt)} • {formatMealType(meal.mealType)}
            </p>

            {/* Nutrition Summary */}
            {nutrition && (
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span data-testid={`meal-calories-${meal.id}`}>
                  {nutrition.calories} cal
                </span>
                <span data-testid={`meal-protein-${meal.id}`}>
                  {Math.round(parseFloat(nutrition.protein))}g protein
                </span>
                <span data-testid={`meal-carbs-${meal.id}`}>
                  {Math.round(parseFloat(nutrition.carbs))}g carbs
                </span>
                <span data-testid={`meal-fat-${meal.id}`}>
                  {Math.round(parseFloat(nutrition.fat))}g fat
                </span>
              </div>
            )}
          </div>

          {/* Chevron */}
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
