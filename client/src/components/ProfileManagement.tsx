import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Leaf, Target, User, Plus, X } from "lucide-react";

const profileSchema = z.object({
  dietPreferences: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  dailyCalorieTarget: z.number().min(1000).max(5000).default(2000),
  dailyProteinTarget: z.number().min(50).max(300).default(150),
  dailyCarbTarget: z.number().min(50).max(500).default(250),
  dailyFatTarget: z.number().min(30).max(200).default(80),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserProfile {
  id: string;
  userId: string;
  dietPreferences: string[];
  allergens: string[];
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbTarget: number;
  dailyFatTarget: number;
}

const DIET_OPTIONS = [
  { id: 'keto', label: 'Ketogenic', description: 'Low-carb, high-fat diet' },
  { id: 'vegan', label: 'Vegan', description: 'Plant-based only' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat or fish' },
  { id: 'paleo', label: 'Paleo', description: 'Whole foods, no processed' },
  { id: 'mediterranean', label: 'Mediterranean', description: 'Fish, olive oil, whole grains' },
  { id: 'gluten-free', label: 'Gluten-Free', description: 'No wheat, barley, rye' },
  { id: 'dairy-free', label: 'Dairy-Free', description: 'No milk products' },
  { id: 'low-sodium', label: 'Low Sodium', description: 'Reduced salt intake' },
  { id: 'low-carb', label: 'Low Carb', description: 'Reduced carbohydrate intake' },
  { id: 'intermittent-fasting', label: 'Intermittent Fasting', description: 'Time-restricted eating' }
];

const ALLERGEN_OPTIONS = [
  { id: 'nuts', label: 'Tree Nuts', severity: 'high', description: 'Almonds, cashews, walnuts, etc.' },
  { id: 'peanuts', label: 'Peanuts', severity: 'high', description: 'Groundnuts and peanut derivatives' },
  { id: 'dairy', label: 'Dairy/Milk', severity: 'medium', description: 'Milk, cheese, yogurt, butter' },
  { id: 'eggs', label: 'Eggs', severity: 'medium', description: 'Chicken eggs and egg products' },
  { id: 'soy', label: 'Soy', severity: 'medium', description: 'Soybeans and soy products' },
  { id: 'wheat', label: 'Wheat/Gluten', severity: 'high', description: 'Wheat, barley, rye, gluten' },
  { id: 'fish', label: 'Fish', severity: 'high', description: 'All fish species' },
  { id: 'shellfish', label: 'Shellfish', severity: 'high', description: 'Shrimp, crab, lobster, mollusks' },
  { id: 'sesame', label: 'Sesame', severity: 'medium', description: 'Sesame seeds and tahini' }
];

export function ProfileManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      dietPreferences: [],
      allergens: [],
      dailyCalorieTarget: 2000,
      dailyProteinTarget: 150,
      dailyCarbTarget: 250,
      dailyFatTarget: 80,
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        dietPreferences: profile.dietPreferences || [],
        allergens: profile.allergens || [],
        dailyCalorieTarget: profile.dailyCalorieTarget || 2000,
        dailyProteinTarget: profile.dailyProteinTarget || 150,
        dailyCarbTarget: profile.dailyCarbTarget || 250,
        dailyFatTarget: profile.dailyFatTarget || 80,
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Profile updated successfully!",
        description: "Your dietary preferences and targets have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
          <User className="h-8 w-8 text-primary" />
          Profile Management
        </h1>
        <p className="text-muted-foreground">
          Customize your dietary preferences, allergens, and nutrition targets for personalized meal analysis
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="diet" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diet" className="flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Diet Preferences
              </TabsTrigger>
              <TabsTrigger value="allergens" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Allergens
              </TabsTrigger>
              <TabsTrigger value="targets" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Nutrition Targets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diet" className="space-y-6">
              <Card data-testid="card-diet-preferences">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    Dietary Preferences
                  </CardTitle>
                  <CardDescription>
                    Select your dietary preferences to get personalized meal analysis and recipe recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="dietPreferences"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {DIET_OPTIONS.map((diet) => (
                            <FormField
                              key={diet.id}
                              control={form.control}
                              name="dietPreferences"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={diet.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg hover:bg-accent"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(diet.id)}
                                        onCheckedChange={(checked) => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), diet.id]
                                            : (field.value || []).filter((value) => value !== diet.id);
                                          field.onChange(updatedValue);
                                        }}
                                        data-testid={`checkbox-diet-${diet.id}`}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none flex-1">
                                      <FormLabel className="font-medium cursor-pointer">
                                        {diet.label}
                                      </FormLabel>
                                      <FormDescription className="text-sm text-muted-foreground">
                                        {diet.description}
                                      </FormDescription>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('dietPreferences').length > 0 && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">Selected Preferences</h4>
                      <div className="flex flex-wrap gap-2">
                        {form.watch('dietPreferences').map((pref) => {
                          const diet = DIET_OPTIONS.find(d => d.id === pref);
                          return (
                            <Badge key={pref} variant="secondary" className="bg-green-100 text-green-800">
                              {diet?.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allergens" className="space-y-6">
              <Card data-testid="card-allergen-management">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Allergen Management
                  </CardTitle>
                  <CardDescription>
                    Select allergens to avoid for detailed food safety analysis and warnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="allergens"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {ALLERGEN_OPTIONS.map((allergen) => (
                            <FormField
                              key={allergen.id}
                              control={form.control}
                              name="allergens"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={allergen.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg hover:bg-accent"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(allergen.id)}
                                        onCheckedChange={(checked) => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), allergen.id]
                                            : (field.value || []).filter((value) => value !== allergen.id);
                                          field.onChange(updatedValue);
                                        }}
                                        data-testid={`checkbox-allergen-${allergen.id}`}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none flex-1">
                                      <div className="flex items-center justify-between">
                                        <FormLabel className="font-medium cursor-pointer">
                                          {allergen.label}
                                        </FormLabel>
                                        <Badge className={getSeverityColor(allergen.severity)} variant="outline">
                                          {allergen.severity} risk
                                        </Badge>
                                      </div>
                                      <FormDescription className="text-sm text-muted-foreground">
                                        {allergen.description}
                                      </FormDescription>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('allergens').length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Active Allergen Alerts
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {form.watch('allergens').map((allergen) => {
                          const allergenData = ALLERGEN_OPTIONS.find(a => a.id === allergen);
                          return (
                            <Badge key={allergen} className="bg-red-100 text-red-800 border-red-200">
                              {allergenData?.label}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-sm text-red-700 mt-2">
                        All meal analysis will include detailed warnings for these allergens
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="targets" className="space-y-6">
              <Card data-testid="card-nutrition-targets">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Daily Nutrition Targets
                  </CardTitle>
                  <CardDescription>
                    Set your daily nutrition goals for personalized meal tracking and insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="dailyCalorieTarget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Calorie Target</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1000"
                              max="5000"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-calorie-target"
                            />
                          </FormControl>
                          <FormDescription>
                            Recommended: 1,500-2,500 calories per day
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dailyProteinTarget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Protein Target (g)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="50"
                              max="300"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-protein-target"
                            />
                          </FormControl>
                          <FormDescription>
                            Recommended: 0.8-1.6g per kg body weight
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dailyCarbTarget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Carbohydrate Target (g)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="50"
                              max="500"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-carb-target"
                            />
                          </FormControl>
                          <FormDescription>
                            Recommended: 45-65% of total calories
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dailyFatTarget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Fat Target (g)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="30"
                              max="200"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-fat-target"
                            />
                          </FormControl>
                          <FormDescription>
                            Recommended: 20-35% of total calories
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Current Targets Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{form.watch('dailyCalorieTarget')}</div>
                        <div className="text-blue-700">Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{form.watch('dailyProteinTarget')}g</div>
                        <div className="text-blue-700">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{form.watch('dailyCarbTarget')}g</div>
                        <div className="text-blue-700">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{form.watch('dailyFatTarget')}g</div>
                        <div className="text-blue-700">Fat</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              size="lg"
              disabled={updateProfileMutation.isPending}
              className="px-8"
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}