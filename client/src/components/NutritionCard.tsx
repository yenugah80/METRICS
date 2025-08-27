import { Progress } from "@/components/ui/progress";

interface NutritionCardProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function NutritionCard({ 
  calories, 
  protein, 
  carbs, 
  fat, 
  targets 
}: NutritionCardProps) {
  const calorieProgress = Math.min((calories / targets.calories) * 100, 100);
  const proteinProgress = Math.min((protein / targets.protein) * 100, 100);
  const carbProgress = Math.min((carbs / targets.carbs) * 100, 100);
  const fatProgress = Math.min((fat / targets.fat) * 100, 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="nutrition-card">
      {/* Calories */}
      <div className="text-center" data-testid="nutrition-calories">
        <div className="text-2xl font-bold text-foreground">{calories.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground mb-2">Calories</div>
        <div className="w-full bg-muted/20 rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${calorieProgress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {Math.round(calorieProgress)}% of {targets.calories}
        </div>
      </div>

      {/* Protein */}
      <div className="text-center" data-testid="nutrition-protein">
        <div className="text-2xl font-bold text-foreground">{Math.round(protein)}g</div>
        <div className="text-sm text-muted-foreground mb-2">Protein</div>
        <div className="w-full bg-muted/20 rounded-full h-1.5">
          <div 
            className="bg-secondary h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${proteinProgress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {Math.round(proteinProgress)}% of {targets.protein}g
        </div>
      </div>

      {/* Carbs */}
      <div className="text-center" data-testid="nutrition-carbs">
        <div className="text-2xl font-bold text-foreground">{Math.round(carbs)}g</div>
        <div className="text-sm text-muted-foreground mb-2">Carbs</div>
        <div className="w-full bg-muted/20 rounded-full h-1.5">
          <div 
            className="bg-accent h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${carbProgress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {Math.round(carbProgress)}% of {targets.carbs}g
        </div>
      </div>

      {/* Fat */}
      <div className="text-center" data-testid="nutrition-fat">
        <div className="text-2xl font-bold text-foreground">{Math.round(fat)}g</div>
        <div className="text-sm text-muted-foreground mb-2">Fat</div>
        <div className="w-full bg-muted/20 rounded-full h-1.5">
          <div 
            className="bg-warning h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${fatProgress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {Math.round(fatProgress)}% of {targets.fat}g
        </div>
      </div>
    </div>
  );
}
