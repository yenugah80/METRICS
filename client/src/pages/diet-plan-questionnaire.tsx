import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, ArrowRight, Target, Heart, Activity, ChefHat } from 'lucide-react';

const questionnaireSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(13).max(120),
    gender: z.enum(['male', 'female', 'other']),
    height: z.number().min(100).max(250),
    weight: z.number().min(30).max(300),
  }),
  healthGoals: z.array(z.string()).min(1, 'Please select at least one health goal'),
  lifestyle: z.array(z.string()),
  foodPreferences: z.array(z.string()).min(1, 'Please select your food preferences'),
  restrictions: z.array(z.string()),
  eatingSchedule: z.array(z.string()).min(1, 'Please select your eating schedule'),
  dietPreparation: z.array(z.string()),
  physicalActivity: z.array(z.string()),
  supplements: z.boolean(),
  currentDiet: z.array(z.string()),
});

type QuestionnaireData = z.infer<typeof questionnaireSchema>;

const steps = [
  { id: 'personal', title: 'Personal Info', icon: Heart },
  { id: 'goals', title: 'Health Goals', icon: Target },
  { id: 'lifestyle', title: 'Lifestyle', icon: Activity },
  { id: 'preferences', title: 'Food Preferences', icon: ChefHat },
];

export default function DietPlanQuestionnaire() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<QuestionnaireData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      personalInfo: {
        age: 25,
        gender: 'male',
        height: 170,
        weight: 70,
      },
      healthGoals: [],
      lifestyle: [],
      foodPreferences: [],
      restrictions: [],
      eatingSchedule: [],
      dietPreparation: [],
      physicalActivity: [],
      supplements: false,
      currentDiet: [],
    },
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (data: QuestionnaireData) => {
      return await apiRequest('POST', '/api/diet-plans/generate', data);
    },
    onSuccess: () => {
      toast({
        title: "Diet Plan Created!",
        description: "Your personalized 28-day nutrition plan is ready. Time to transform your health!",
      });
      setLocation('/diet-plan');
    },
    onError: (error: any) => {
      toast({
        title: "Plan Creation Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: QuestionnaireData) => {
    generatePlanMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-teal-50/30 to-green-50/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
            className="mb-4"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Personal Diet Plan</h1>
          <p className="text-gray-600">Answer a few questions to get a tailored 28-day nutrition plan</p>
          
          <Progress value={progress} className="w-full mt-4" data-testid="progress-questionnaire" />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            {steps.map((step, index) => (
              <span key={step.id} className={index <= currentStep ? 'text-blue-600 font-medium' : ''}>
                {step.title}
              </span>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {steps[currentStep].icon && (() => {
                    const IconComponent = steps[currentStep].icon;
                    return <IconComponent className="w-5 h-5 text-blue-600" />;
                  })()}
                  {steps[currentStep].title}
                </CardTitle>
                <CardDescription>
                  Step {currentStep + 1} of {steps.length}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Step 1: Personal Info */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="personalInfo.age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-age"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="personalInfo.gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} value={field.value} data-testid="radio-gender">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="male" id="male" />
                                  <label htmlFor="male">Male</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="female" id="female" />
                                  <label htmlFor="female">Female</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="other" id="other" />
                                  <label htmlFor="other">Other</label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="personalInfo.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-height"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="personalInfo.weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-weight"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Health Goals */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="healthGoals"
                      render={() => (
                        <FormItem>
                          <FormLabel>What are your main health goals?</FormLabel>
                          <FormDescription>Select all that apply</FormDescription>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'weight_loss', label: 'Weight Loss' },
                              { id: 'muscle_gain', label: 'Muscle Gain' },
                              { id: 'maintenance', label: 'Maintain Weight' },
                              { id: 'diabetes', label: 'Manage Diabetes' },
                              { id: 'pcos', label: 'PCOS Support' },
                              { id: 'pregnancy', label: 'Pregnancy Nutrition' },
                              { id: 'energy', label: 'Boost Energy' },
                              { id: 'digestion', label: 'Better Digestion' },
                            ].map((goal) => (
                              <FormField
                                key={goal.id}
                                control={form.control}
                                name="healthGoals"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(goal.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, goal.id])
                                            : field.onChange(field.value?.filter((value) => value !== goal.id))
                                        }}
                                        data-testid={`checkbox-goal-${goal.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">{goal.label}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="physicalActivity"
                      render={() => (
                        <FormItem>
                          <FormLabel>Physical Activity Level</FormLabel>
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { id: 'sedentary', label: 'Sedentary (office job, little exercise)' },
                              { id: 'light', label: 'Light activity (light exercise 1-3 days/week)' },
                              { id: 'moderate', label: 'Moderate activity (moderate exercise 3-5 days/week)' },
                              { id: 'high', label: 'High activity (heavy exercise 6-7 days/week)' },
                              { id: 'athletic', label: 'Athletic (2x per day, intense training)' },
                            ].map((activity) => (
                              <FormField
                                key={activity.id}
                                control={form.control}
                                name="physicalActivity"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(activity.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, activity.id])
                                            : field.onChange(field.value?.filter((value) => value !== activity.id))
                                        }}
                                        data-testid={`checkbox-activity-${activity.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">{activity.label}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Lifestyle */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="lifestyle"
                      render={() => (
                        <FormItem>
                          <FormLabel>Current Lifestyle Factors</FormLabel>
                          <FormDescription>Help us understand your daily routine</FormDescription>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'busy_schedule', label: 'Very Busy Schedule' },
                              { id: 'travel_frequently', label: 'Travel Frequently' },
                              { id: 'work_from_home', label: 'Work From Home' },
                              { id: 'shift_work', label: 'Shift Work' },
                              { id: 'social_eater', label: 'Frequent Social Dining' },
                              { id: 'meal_prepper', label: 'Like to Meal Prep' },
                              { id: 'stress_eating', label: 'Stress Eating' },
                              { id: 'irregular_meals', label: 'Irregular Meal Times' },
                            ].map((lifestyle) => (
                              <FormField
                                key={lifestyle.id}
                                control={form.control}
                                name="lifestyle"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(lifestyle.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, lifestyle.id])
                                            : field.onChange(field.value?.filter((value) => value !== lifestyle.id))
                                        }}
                                        data-testid={`checkbox-lifestyle-${lifestyle.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">{lifestyle.label}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="eatingSchedule"
                      render={() => (
                        <FormItem>
                          <FormLabel>Preferred Eating Schedule</FormLabel>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'three_meals', label: '3 Main Meals' },
                              { id: 'frequent_small', label: '5-6 Small Meals' },
                              { id: 'intermittent_16_8', label: 'Intermittent Fasting (16:8)' },
                              { id: 'intermittent_18_6', label: 'Intermittent Fasting (18:6)' },
                              { id: 'flexible', label: 'Flexible Schedule' },
                              { id: 'early_dinner', label: 'Early Dinner (6pm)' },
                            ].map((schedule) => (
                              <FormField
                                key={schedule.id}
                                control={form.control}
                                name="eatingSchedule"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(schedule.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, schedule.id])
                                            : field.onChange(field.value?.filter((value) => value !== schedule.id))
                                        }}
                                        data-testid={`checkbox-schedule-${schedule.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">{schedule.label}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 4: Food Preferences */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="foodPreferences"
                      render={() => (
                        <FormItem>
                          <FormLabel>Food Preferences</FormLabel>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'non_vegetarian', label: 'Non-Vegetarian' },
                              { id: 'vegetarian', label: 'Vegetarian' },
                              { id: 'vegan', label: 'Vegan' },
                              { id: 'pescatarian', label: 'Pescatarian' },
                              { id: 'flexitarian', label: 'Flexitarian' },
                              { id: 'mixed', label: 'Mixed Diet' },
                            ].map((pref) => (
                              <FormField
                                key={pref.id}
                                control={form.control}
                                name="foodPreferences"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(pref.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, pref.id])
                                            : field.onChange(field.value?.filter((value) => value !== pref.id))
                                        }}
                                        data-testid={`checkbox-food-pref-${pref.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">{pref.label}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="restrictions"
                      render={() => (
                        <FormItem>
                          <FormLabel>Dietary Restrictions & Allergies</FormLabel>
                          <FormDescription>Select any that apply to you</FormDescription>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'gluten_free', label: 'Gluten-Free' },
                              { id: 'dairy_free', label: 'Dairy-Free' },
                              { id: 'nut_allergy', label: 'Nut Allergy' },
                              { id: 'soy_free', label: 'Soy-Free' },
                              { id: 'low_sodium', label: 'Low Sodium' },
                              { id: 'low_carb', label: 'Low Carb' },
                              { id: 'keto', label: 'Ketogenic' },
                              { id: 'paleo', label: 'Paleo' },
                              { id: 'mediterranean', label: 'Mediterranean' },
                              { id: 'no_restrictions', label: 'No Restrictions' },
                            ].map((restriction) => (
                              <FormField
                                key={restriction.id}
                                control={form.control}
                                name="restrictions"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(restriction.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, restriction.id])
                                            : field.onChange(field.value?.filter((value) => value !== restriction.id))
                                        }}
                                        data-testid={`checkbox-restriction-${restriction.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">{restriction.label}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supplements"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-supplements"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>I'm open to supplement recommendations</FormLabel>
                            <FormDescription>
                              Include vitamin and supplement suggestions in my plan
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                data-testid="button-prev-step"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  disabled={generatePlanMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                  data-testid="button-generate-plan"
                >
                  {generatePlanMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Generating Your Plan...
                    </>
                  ) : (
                    <>
                      Create My Diet Plan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                  data-testid="button-next-step"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}