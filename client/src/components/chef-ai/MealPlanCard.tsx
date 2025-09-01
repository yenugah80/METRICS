import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Utensils, 
  TrendingUp, 
  Target, 
  Bookmark, 
  Share2, 
  Download,
  CheckCircle2,
  Leaf
} from 'lucide-react';

interface MealPlanMeal {
  mealType: string;
  name: string;
  foods: string[];
  portionControl: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  benefits: string[];
}

interface DailyPlan {
  day: string;
  meals: MealPlanMeal[];
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

interface MealPlanData {
  title: string;
  duration: string;
  overview: string;
  dailyPlans: DailyPlan[];
  nutritionalAnalysis: {
    averageDailyCalories: number;
    proteinRange: string;
    carbRange: string;
    fatRange: string;
    keyBenefits: string[];
  };
}

interface MealPlanCardProps {
  mealPlan: MealPlanData;
  onSave?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

// Nutrition Badge Component
const MacroDisplay = ({ label, value, unit, color }: {
  label: string;
  value: number | string;
  unit: string;
  color: string;
}) => (
  <div className="text-center">
    <div className={`text-lg font-bold ${color}`}>
      {value}{unit}
    </div>
    <div className="text-xs text-gray-600 font-medium">{label}</div>
  </div>
);

export function MealPlanCard({ mealPlan, onSave, onShare, onDownload }: MealPlanCardProps) {
  return (
    <Card className="w-full max-w-5xl mx-auto my-6 shadow-xl bg-gradient-to-br from-white to-blue-50/20">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-t-lg">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl mb-2 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              {mealPlan.title}
            </CardTitle>
            <div className="flex gap-4 text-blue-100 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {mealPlan.duration}
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {mealPlan.nutritionalAnalysis.averageDailyCalories} cal/day
              </div>
            </div>
            <p className="text-blue-100 mt-2 text-sm">{mealPlan.overview}</p>
          </div>
          <div className="flex gap-2">
            {onSave && (
              <Button variant="ghost" size="sm" onClick={onSave} className="text-white hover:bg-white/20">
                <Bookmark className="w-4 h-4" />
              </Button>
            )}
            {onShare && (
              <Button variant="ghost" size="sm" onClick={onShare} className="text-white hover:bg-white/20">
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            {onDownload && (
              <Button variant="ghost" size="sm" onClick={onDownload} className="text-white hover:bg-white/20">
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Nutritional Analysis Overview */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-5 rounded-xl border border-green-100">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Nutritional Overview
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MacroDisplay 
              label="Avg Calories" 
              value={mealPlan.nutritionalAnalysis.averageDailyCalories} 
              unit="" 
              color="text-blue-600" 
            />
            <MacroDisplay 
              label="Protein" 
              value={mealPlan.nutritionalAnalysis.proteinRange} 
              unit="" 
              color="text-green-600" 
            />
            <MacroDisplay 
              label="Carbs" 
              value={mealPlan.nutritionalAnalysis.carbRange} 
              unit="" 
              color="text-orange-600" 
            />
            <MacroDisplay 
              label="Fat" 
              value={mealPlan.nutritionalAnalysis.fatRange} 
              unit="" 
              color="text-purple-600" 
            />
          </div>
          
          {/* Key Benefits */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Leaf className="w-4 h-4 text-green-600" />
              Key Health Benefits
            </h5>
            <div className="flex flex-wrap gap-2">
              {mealPlan.nutritionalAnalysis.keyBenefits.map((benefit, i) => (
                <Badge key={i} className="bg-green-100 text-green-700 hover:bg-green-200 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Meal Plans - Professional Table Format */}
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
            <Utensils className="w-5 h-5 text-blue-600" />
            Daily Meal Plans
          </h4>
          
          <ScrollArea className="h-[600px] w-full rounded-lg border">
            <div className="space-y-6 p-4">
              {mealPlan.dailyPlans.map((dailyPlan, dayIndex) => (
                <div key={dayIndex} className="border rounded-lg overflow-hidden">
                  {/* Day Header */}
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold text-gray-900">{dailyPlan.day}</h5>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span className="font-medium">Total: {dailyPlan.dailyTotals.calories} cal</span>
                        <span>{dailyPlan.dailyTotals.protein}g protein</span>
                        <span>{dailyPlan.dailyTotals.carbs}g carbs</span>
                        <span>{dailyPlan.dailyTotals.fat}g fat</span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Meal Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b text-left">
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-20">Meal</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-48">Foods</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-32">Portion Control</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-32">Macros</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700">Health Benefits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyPlan.meals.map((meal, mealIndex) => (
                          <tr key={mealIndex} className="border-b hover:bg-gray-50/50 transition-colors">
                            {/* Meal Type */}
                            <td className="px-4 py-4 align-top">
                              <div className="font-medium text-gray-900 text-sm">{meal.mealType}</div>
                              <div className="text-xs text-gray-500 mt-1">{meal.name}</div>
                            </td>
                            
                            {/* Foods */}
                            <td className="px-4 py-4 align-top">
                              <ul className="text-sm text-gray-700 space-y-1">
                                {meal.foods.map((food, foodIndex) => (
                                  <li key={foodIndex} className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                                    {food}
                                  </li>
                                ))}
                              </ul>
                            </td>
                            
                            {/* Portion Control */}
                            <td className="px-4 py-4 align-top">
                              <div className="text-sm text-gray-700">{meal.portionControl}</div>
                            </td>
                            
                            {/* Macros */}
                            <td className="px-4 py-4 align-top">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-blue-600 font-medium">{meal.macros.calories} cal</div>
                                <div className="text-green-600">{meal.macros.protein}g protein</div>
                                <div className="text-orange-600">{meal.macros.carbs}g carbs</div>
                                <div className="text-purple-600">{meal.macros.fat}g fat</div>
                                {meal.macros.fiber > 0 && (
                                  <>
                                    <div className="text-teal-600">{meal.macros.fiber}g fiber</div>
                                    <div></div>
                                  </>
                                )}
                              </div>
                            </td>
                            
                            {/* Health Benefits */}
                            <td className="px-4 py-4 align-top">
                              <div className="flex flex-wrap gap-1">
                                {meal.benefits.map((benefit, benefitIndex) => (
                                  <Badge 
                                    key={benefitIndex} 
                                    variant="secondary" 
                                    className="text-xs bg-green-100 text-green-700 hover:bg-green-200"
                                  >
                                    {benefit}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Plan Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h5 className="font-medium text-gray-900 mb-2">Plan Summary</h5>
          <p className="text-sm text-gray-700">
            This {mealPlan.duration.toLowerCase()} meal plan provides an average of {mealPlan.nutritionalAnalysis.averageDailyCalories} calories daily, 
            with protein ranging from {mealPlan.nutritionalAnalysis.proteinRange}, 
            carbs from {mealPlan.nutritionalAnalysis.carbRange}, 
            and fats from {mealPlan.nutritionalAnalysis.fatRange}. 
            Perfect for balanced nutrition and sustainable health goals.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}