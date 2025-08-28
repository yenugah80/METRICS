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
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Meal Analysis</h1>
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
                    {/* Total Nutrition */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Total Nutrition</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {analysis.total_calories}
                          </div>
                          <div className="text-sm text-muted-foreground">Calories</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Protein</span>
                            <span>{analysis.total_protein}g</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Carbs</span>
                            <span>{analysis.total_carbs}g</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Fat</span>
                            <span>{analysis.total_fat}g</span>
                          </div>
                        </div>
                      </div>
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