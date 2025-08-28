import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Utensils } from "lucide-react";

interface AnalyzedFood {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
}

interface NutritionAnalysis {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  detailed_nutrition?: {
    saturated_fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    cholesterol?: number;
    vitamin_c?: number;
    iron?: number;
    calcium?: number;
  };
  health_suggestions?: string[];
  tracking_integration?: {
    summary?: string;
    compatible_apps?: string[];
    export_data?: {
      meal_type?: string;
      health_score?: number;
      diet_compatibility?: string[];
    };
  };
  foods: AnalyzedFood[];
}

export default function MealCamera() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await fetch("/api/meals/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze meal");
      }
      
      return response.json();
    },
    onSuccess: (data: NutritionAnalysis) => {
      setAnalysis(data);
      toast({
        title: "Meal analyzed successfully!",
        description: `Found ${data.foods.length} food items with ${data.total_calories} total calories.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSelectedImage(imageDataUrl);
      
      // Extract base64 part
      const base64 = imageDataUrl.split(",")[1];
      analyzeMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveMeal = () => {
    if (!analysis) return;
    
    // In a real app, this would save to the database
    toast({
      title: "Meal saved!",
      description: "Your meal has been added to your nutrition log.",
    });
    
    // Reset for next meal
    setSelectedImage(null);
    setAnalysis(null);
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meal Analysis</h1>
          <p className="text-muted-foreground">
            Upload a photo of your meal and get instant nutrition tracking
          </p>
        </div>

        {/* Image Upload */}
        {!selectedImage && (
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Take or Upload a Photo</h3>
                <p className="text-muted-foreground mb-6">
                  Capture your meal and let AI identify the foods and calculate nutrition automatically
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleCameraClick}
                    size="lg"
                    className="flex items-center space-x-2"
                    data-testid="button-upload-image"
                  >
                    <Upload className="h-5 w-5" />
                    <span>Upload Photo</span>
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                <p className="text-xs text-muted-foreground mt-4">
                  Supports JPG, PNG, WebP up to 5MB
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Preview and Analysis */}
        {selectedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Image Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Utensils className="h-5 w-5" />
                  <span>Your Meal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={selectedImage}
                  alt="Uploaded meal"
                  className="w-full h-64 object-cover rounded-lg"
                  data-testid="image-preview"
                />
                <Button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysis(null);
                  }}
                  variant="outline"
                  className="w-full mt-4"
                  data-testid="button-upload-new"
                >
                  Upload New Photo
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {analyzeMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                  {analysis && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {analyzeMutation.isError && <AlertCircle className="h-5 w-5 text-red-600" />}
                  <span>AI Analysis</span>
                </CardTitle>
                <CardDescription>
                  {analyzeMutation.isPending && "Analyzing your meal..."}
                  {analysis && "Analysis complete!"}
                  {analyzeMutation.isError && "Analysis failed"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyzeMutation.isPending && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Identifying food items...</span>
                    </div>
                    <Progress value={33} className="h-2" />
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Calculating nutrition...</span>
                    </div>
                  </div>
                )}

                {analysis && (
                  <div className="space-y-6">
                    {/* Prominent Macro Display */}
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border">
                      <h4 className="font-bold text-lg mb-4 text-center">Nutrition Summary</h4>
                      
                      {/* Main Macros - Large Display */}
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-background/60 backdrop-blur rounded-lg border">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {analysis.total_calories}
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">Calories</div>
                        </div>
                        <div className="text-center p-4 bg-background/60 backdrop-blur rounded-lg border">
                          <div className="text-3xl font-bold text-blue-600 mb-1">
                            {analysis.total_protein}g
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">Protein</div>
                        </div>
                        <div className="text-center p-4 bg-background/60 backdrop-blur rounded-lg border">
                          <div className="text-3xl font-bold text-green-600 mb-1">
                            {analysis.total_carbs}g
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">Carbs</div>
                        </div>
                        <div className="text-center p-4 bg-background/60 backdrop-blur rounded-lg border">
                          <div className="text-3xl font-bold text-orange-600 mb-1">
                            {analysis.total_fat}g
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">Fat</div>
                        </div>
                      </div>

                      {/* Detailed Nutrition Breakdown */}
                      {analysis.detailed_nutrition && (
                        <div className="bg-background/40 rounded-lg p-4 mb-4">
                          <h5 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Detailed Breakdown</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {analysis.detailed_nutrition.saturated_fat && (
                              <div className="flex justify-between">
                                <span>Saturated Fat</span>
                                <span className="font-medium">{analysis.detailed_nutrition.saturated_fat}g</span>
                              </div>
                            )}
                            {analysis.detailed_nutrition.fiber && (
                              <div className="flex justify-between">
                                <span>Fiber</span>
                                <span className="font-medium">{analysis.detailed_nutrition.fiber}g</span>
                              </div>
                            )}
                            {analysis.detailed_nutrition.sugar && (
                              <div className="flex justify-between">
                                <span>Sugar</span>
                                <span className="font-medium">{analysis.detailed_nutrition.sugar}g</span>
                              </div>
                            )}
                            {analysis.detailed_nutrition.sodium && (
                              <div className="flex justify-between">
                                <span>Sodium</span>
                                <span className="font-medium">{analysis.detailed_nutrition.sodium}mg</span>
                              </div>
                            )}
                            {analysis.detailed_nutrition.cholesterol && (
                              <div className="flex justify-between">
                                <span>Cholesterol</span>
                                <span className="font-medium">{analysis.detailed_nutrition.cholesterol}mg</span>
                              </div>
                            )}
                            {analysis.detailed_nutrition.vitamin_c && (
                              <div className="flex justify-between">
                                <span>Vitamin C</span>
                                <span className="font-medium">{analysis.detailed_nutrition.vitamin_c}mg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Health Insights */}
                      {analysis.health_suggestions && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <h5 className="font-semibold mb-2 text-blue-800 dark:text-blue-200 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.663 17h4.673a1.001 1.001 0 00.853-1.519l-2.337-4a1 1 0 00-.853-.481h-2.333l-2.337 4A1.001 1.001 0 009.663 17zM6.5 7.5A1.5 1.5 0 108 6h4a1.5 1.5 0 101.5 1.5v1a4 4 0 01-4 4H6.5a1.5 1.5 0 000 3h7a.5.5 0 010 1h-7a2.5 2.5 0 110-5H9.5a3 3 0 003-3v-1z"/>
                            </svg>
                            Health Insights
                          </h5>
                          <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                            {analysis.health_suggestions.map((suggestion, index) => (
                              <div key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Health Tracking Integration */}
                      {analysis.tracking_integration && (
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800 mt-4">
                          <h5 className="font-semibold mb-2 text-green-800 dark:text-green-200 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Health Tracking Integration
                          </h5>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            <p className="mb-2">{analysis.tracking_integration.summary}</p>
                            <div className="flex flex-wrap gap-2">
                              {analysis.tracking_integration.compatible_apps?.map((app, index) => (
                                <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs font-medium">
                                  {app}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Identified Foods */}
                    <div>
                      <h4 className="font-semibold mb-3">Identified Foods</h4>
                      <div className="space-y-2">
                        {analysis.foods.map((food, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{food.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {food.quantity} {food.unit}
                              </div>
                            </div>
                            <Badge 
                              variant={food.confidence > 0.8 ? "default" : "secondary"}
                              data-testid={`confidence-${index}`}
                            >
                              {Math.round(food.confidence * 100)}% confident
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveMeal}
                      className="w-full"
                      data-testid="button-save-meal"
                    >
                      Save to Nutrition Log
                    </Button>
                  </div>
                )}

                {analyzeMutation.isError && (
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-600" />
                    <p>Failed to analyze the image. Please try again.</p>
                    <Button
                      onClick={() => {
                        if (selectedImage) {
                          const base64 = selectedImage.split(",")[1];
                          analyzeMutation.mutate(base64);
                        }
                      }}
                      variant="outline"
                      className="mt-2"
                    >
                      Retry Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Tips for Better Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Good Lighting</div>
                  <div className="text-muted-foreground">Take photos in bright, natural light</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Clear View</div>
                  <div className="text-muted-foreground">Ensure all foods are visible</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Close Up</div>
                  <div className="text-muted-foreground">Fill the frame with your meal</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}