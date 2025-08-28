import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Utensils, Type, Mic, Crown, Sparkles, Info, Database, Target, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import VoiceLogger from "@/components/VoiceLogger";
import { SustainabilityCard } from "@/components/SustainabilityCard";
import { AllergenAlert } from "@/components/AllergenAlert";

interface AnalyzedFood {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
  calories?: number;
  protein?: number;
  source?: string;
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
  nutrition_score?: {
    score: number;
    grade: string;
    explanation: string;
  };
  diet_compatibility?: {
    [key: string]: {
      compatible: boolean;
      reason: string;
      confidence?: number;
    };
  };
  confidence_score?: number;
  data_sources?: string[];
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
  sustainability_score?: {
    overall_score: number;
    grade: string;
    co2_impact: 'low' | 'medium' | 'high';
    water_usage: 'low' | 'medium' | 'high';
    seasonal_score: number;
    processing_score: number;
    local_score: number;
    sustainability_badges: string[];
    environmental_impact: {
      carbon_footprint_kg: number;
      water_footprint_liters: number;
      land_use_m2: number;
    };
    recommendations: string[];
    seasonal_alternatives: string[];
  };
  allergen_analysis?: {
    isAllergenFree: boolean;
    detectedAllergens: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    warnings: string[];
    allergen_details: Array<{
      allergen: string;
      found_in: string[];
      risk_level: 'low' | 'medium' | 'high' | 'critical';
      specific_ingredients: string[];
      reaction_type: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
    }>;
    cross_contamination_risk: 'low' | 'medium' | 'high';
    safe_alternatives: string[];
  };
}

export default function MealCamera() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Text analysis handler
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to analyze your meals and get accurate nutrition data.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/meals/analyze-text", { text: textInput });
      const data = await response.json();
      setAnalysis(data);
      toast({
        title: "Meal analyzed successfully!",
        description: `Found ${data.foods.length} food items with ${data.total_calories} total calories.`,
      });
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Voice analysis handler
  const handleVoiceResult = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use voice logging and get premium nutrition analysis.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/meals/analyze-voice", { audioText: transcript });
      const data = await response.json();
      setAnalysis(data);
      toast({
        title: "Voice input analyzed!",
        description: `Found ${data.foods.length} food items with ${data.total_calories} total calories.`,
      });
    } catch (error: any) {
      toast({
        title: "Voice analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await apiRequest("POST", "/api/meals/analyze-image", { imageBase64 });
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
      
      // Check if user is authenticated before analyzing
      if (!isAuthenticated) {
        toast({
          title: "Sign in required",
          description: "Please sign in to analyze your meal photos and get accurate nutrition data.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      // Extract base64 part
      const base64 = imageDataUrl.split(",")[1];
      analyzeMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to take photos of your meals.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert to base64
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelectedImage(imageDataUrl);
    
    // Stop camera
    stopCamera();
    
    // Check authentication and analyze
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to analyze your meal photos and get accurate nutrition data.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    // Extract base64 part and analyze
    const base64 = imageDataUrl.split(",")[1];
    analyzeMutation.mutate(base64);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleSaveMeal = async () => {
    if (!analysis) return;
    
    try {
      // Save meal to database
      const response = await apiRequest('POST', '/api/meals/save', {
        name: `Meal from ${new Date().toLocaleTimeString()}`,
        mealType: 'lunch', // Default to lunch, could be made configurable
        imageUrl: selectedImage, // Store the base64 image
        foods: analysis.foods,
        nutrition: analysis
      });

      const result = await response.json();
      console.log('Meal saved successfully:', result.mealId);

      // Invalidate dashboard queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meals/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meals/today"] });

      toast({
        title: "🎉 Meal Saved Successfully!",
        description: "Your nutrition data is now available in your dashboard and progress tracking.",
        action: (
          <div className="flex gap-2">
            <button 
              onClick={() => navigate("/dashboard")}
              className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium hover:bg-primary/90"
            >
              View Dashboard
            </button>
          </div>
        ),
      });
      
      // Show clear navigation options after short delay
      setTimeout(() => {
        const shouldViewDashboard = window.confirm(
          "✅ Your meal has been saved!\n\n📊 Your nutrition data is now available in:\n• Dashboard - Today's nutrition summary & progress\n• Progress - Achievements & wellness tracking\n\nWhere would you like to go next?\n\nClick OK for Dashboard or Cancel for Progress tracking."
        );
        
        if (shouldViewDashboard) {
          navigate("/dashboard");
        } else {
          navigate("/daily-progress");
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error saving meal:', error);
      toast({
        title: "Error saving meal",
        description: "Failed to save your meal. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Food Analysis</h1>
          <p className="text-muted-foreground">
            Capture your meal and get instant food identification with complete nutrition analysis
          </p>
          
          {/* Authentication Banner */}
          {!isAuthenticated && (
            <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Info className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">Sign in required</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Get accurate nutrition analysis with 99.9% precision using our USDA database
              </p>
              <Button 
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700"
              >
                Sign In to Start Analyzing
              </Button>
            </div>
          )}
        </div>

        {/* Upload Options */}
        {!selectedImage && (
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Log Your Meal</h3>
                <p className="text-muted-foreground mb-6">
                  Choose how you'd like to capture your meal information
                </p>
                
                <Tabs defaultValue="photo" className="w-full max-w-md mx-auto">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="photo" data-testid="tab-photo">
                      <Camera className="h-4 w-4 mr-2" />
                      Photo
                    </TabsTrigger>
                    <TabsTrigger value="text" data-testid="tab-text">
                      <Type className="h-4 w-4 mr-2" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger 
                      value="voice" 
                      data-testid="tab-voice"
                      disabled={!user?.isPremium}
                      className={!user?.isPremium ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Voice
                      {!user?.isPremium && <Crown className="h-3 w-3 ml-1 text-premium" />}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="photo" className="mt-6">
                    {!isCameraActive ? (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button
                            onClick={startCamera}
                            size="lg"
                            className="flex items-center space-x-3 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95 bg-gradient-to-r from-primary to-primary-600"
                            data-testid="button-camera-capture"
                          >
                            <Camera className="h-6 w-6" />
                            <span>Snap Instantly</span>
                          </Button>
                          <Button
                            onClick={handleCameraClick}
                            size="lg"
                            variant="outline"
                            className="flex items-center space-x-3 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95"
                            data-testid="button-upload-image"
                          >
                            <Upload className="h-6 w-6" />
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
                        <p className="text-xs text-muted-foreground text-center">
                          Supports JPG, PNG, WebP up to 5MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative bg-black rounded-lg overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-64 object-cover"
                            data-testid="camera-preview"
                          />
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="flex gap-4 justify-center">
                          <Button
                            onClick={capturePhoto}
                            size="lg"
                            className="flex items-center space-x-3 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                            data-testid="button-capture-photo"
                          >
                            <Camera className="h-6 w-6" />
                            <span>Capture Photo</span>
                          </Button>
                          <Button
                            onClick={stopCamera}
                            size="lg"
                            variant="outline"
                            className="flex items-center space-x-3 px-8 py-4 text-lg font-semibold"
                            data-testid="button-cancel-camera"
                          >
                            <X className="h-6 w-6" />
                            <span>Cancel</span>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Position your meal in the camera view and tap capture
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="text" className="mt-6">
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Describe what you ate... e.g., 'grilled chicken breast with steamed broccoli and brown rice'"
                        className="min-h-[100px]"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        data-testid="textarea-food-description"
                      />
                      <Button
                        onClick={handleTextSubmit}
                        disabled={!textInput.trim() || isAnalyzing}
                        className="w-full"
                        data-testid="button-analyze-text"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Analyze Food
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="voice" className="mt-6">
                    {user?.isPremium ? (
                      <VoiceLogger 
                        onVoiceResult={handleVoiceResult}
                        disabled={isAnalyzing}
                      />
                    ) : (
                      <div className="text-center p-8 border-2 border-dashed border-premium/30 rounded-xl">
                        <Crown className="w-12 h-12 mx-auto mb-4 text-premium" />
                        <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
                        <p className="text-muted-foreground mb-4">
                          Voice logging is available with premium subscription for just $6.99/month
                        </p>
                        <Button 
                          onClick={() => navigate("/subscribe")}
                          className="btn-gradient"
                          data-testid="button-upgrade-premium"
                        >
                          Upgrade to Premium
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
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
                  className="w-full mt-4 py-3 text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
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
                  <span>Food Analysis</span>
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
                      <span className="text-sm">Computing nutrition and health insights...</span>
                    </div>
                  </div>
                )}

                {analysis && (
                  <div className="space-y-6">
                    {/* Smart Nutrition Score with Radial Dial */}
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border mb-6">
                      <div className="flex items-center justify-center mb-4">
                        <h4 className="font-bold text-lg">Smart Nutrition Score</h4>
                      </div>
                      <div className="flex items-center justify-center space-x-6">
                        <div className="relative w-24 h-24">
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                            <circle
                              cx="48"
                              cy="48"
                              r="36"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-gray-200"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="36"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 36}`}
                              strokeDashoffset={`${2 * Math.PI * 36 * (1 - (analysis.nutrition_score?.score || 0) / 100)}`}
                              className={`transition-all duration-1000 ${
                                (analysis.nutrition_score?.score || 0) >= 80 ? 'text-green-500' :
                                (analysis.nutrition_score?.score || 0) >= 60 ? 'text-yellow-500' :
                                (analysis.nutrition_score?.score || 0) >= 40 ? 'text-orange-500' :
                                'text-red-500'
                              }`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">{analysis.nutrition_score?.score || 0}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-4xl font-bold mb-1 ${
                            analysis.nutrition_score?.grade === 'A' ? 'text-green-600' :
                            analysis.nutrition_score?.grade === 'B' ? 'text-yellow-600' :
                            analysis.nutrition_score?.grade === 'C' ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {analysis.nutrition_score?.grade || 'F'}
                          </div>
                          <div className="text-sm text-muted-foreground">Grade</div>
                        </div>
                      </div>
                      <p className="text-center text-sm mt-4 text-muted-foreground">
                        {analysis.nutrition_score?.explanation || 'Nutrition analysis completed using scientific data.'}
                      </p>
                    </div>

                    {/* Diet Compatibility Check */}
                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold text-base">Diet Compatibility</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {analysis.diet_compatibility && Object.entries(analysis.diet_compatibility).slice(0, 3).map(([dietName, data]: [string, any]) => (
                          <div key={dietName} className={`p-3 rounded-lg border text-center ${
                            data.compatible ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                          }`}>
                            <div className="flex items-center justify-center space-x-2">
                              {data.compatible ? (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              ) : (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                              <span className="font-medium">{dietName.charAt(0).toUpperCase() + dietName.slice(1)}</span>
                            </div>
<span className="text-xs block mt-1">{data.compatible ? '✓ Compatible' : '✗ Not Compatible'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Allergen Analysis */}
                    {analysis.allergen_analysis && (
                      <div className="mb-6">
                        <AllergenAlert analysis={analysis.allergen_analysis} />
                      </div>
                    )}

                    {/* Enhanced Sustainability Analysis */}
                    {analysis.sustainability_score && (
                      <div className="mb-6">
                        <SustainabilityCard score={analysis.sustainability_score} />
                      </div>
                    )}

                    {/* Prominent Macro Display */}
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border">
                      <div className="flex items-center justify-center mb-4">
                        <h4 className="font-bold text-lg">Nutrition Summary</h4>
                      </div>
                      
                      {/* Main Macros - Responsive Large Display */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                        <div className="text-center p-3 md:p-4 bg-background/60 backdrop-blur rounded-lg border shadow-sm">
                          <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                            {Math.round(analysis.total_calories || 0)}
                          </div>
                          <div className="text-xs md:text-sm font-medium text-muted-foreground">Calories</div>
                        </div>
                        <div className="text-center p-3 md:p-4 bg-background/60 backdrop-blur rounded-lg border shadow-sm">
                          <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                            {Math.round((analysis.total_protein || 0) * 10) / 10}g
                          </div>
                          <div className="text-xs md:text-sm font-medium text-muted-foreground">Protein</div>
                        </div>
                        <div className="text-center p-3 md:p-4 bg-background/60 backdrop-blur rounded-lg border shadow-sm">
                          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                            {Math.round((analysis.total_carbs || 0) * 10) / 10}g
                          </div>
                          <div className="text-xs md:text-sm font-medium text-muted-foreground">Carbs</div>
                        </div>
                        <div className="text-center p-3 md:p-4 bg-background/60 backdrop-blur rounded-lg border shadow-sm">
                          <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">
                            {Math.round((analysis.total_fat || 0) * 10) / 10}g
                          </div>
                          <div className="text-xs md:text-sm font-medium text-muted-foreground">Fat</div>
                        </div>
                      </div>

                      {/* Detailed Nutrition Breakdown */}
                      {analysis.detailed_nutrition && (
                        <div className="bg-background/40 rounded-lg p-4 mb-4 border">
                          <div className="flex items-center mb-4">
                            <h5 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Detailed Breakdown</h5>
                          </div>
                          <div className="space-y-3">
                            {analysis.detailed_nutrition.saturated_fat && (
                              <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Saturated Fat</span>
                                <span className="font-medium">{analysis.detailed_nutrition.saturated_fat}g</span>
                              </div>
                            )}
                            {analysis.detailed_nutrition.fiber && (
                              <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Fiber</span>
                                <span className="font-medium">{analysis.detailed_nutrition.fiber}g</span>
                              </div>
                            )}
                            {analysis.detailed_nutrition.sugar && (
                              <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Sugar</span>
                                <span className="font-medium">{analysis.detailed_nutrition.sugar}g</span>
                              </div>
                            )}
                            {analysis.detailed_nutrition.sodium && (
                              <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Sodium</span>
                                <span className="font-medium">{analysis.detailed_nutrition.sodium}mg</span>
                              </div>
                            )}
                            {analysis.detailed_nutrition.cholesterol && (
                              <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Cholesterol</span>
                                <span className="font-medium">{analysis.detailed_nutrition.cholesterol}mg</span>
                              </div>
                            )}
                            {analysis.detailed_nutrition.vitamin_c && (
                              <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Vitamin C</span>
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
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold">Identified Foods</h4>
                      </div>
                      <div className="space-y-2">
                        {analysis.foods.map((food, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{food.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {food.quantity} {food.unit}
                              </div>
                              {food.calories && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {Math.round(food.calories)} cal | {Math.round((food.protein || 0) * 10) / 10}g protein
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={food.confidence > 0.8 ? "default" : "secondary"}
                                data-testid={`confidence-${index}`}
                              >
                                {Math.round(food.confidence * 100)}% confident
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* USDA Food Name Disclaimer */}
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          <strong>Note:</strong> Food names are abbreviated in some places by the USDA to shorten the length of their description. If you see a weird food name, please{" "}
                          <a href="#contact" className="underline hover:no-underline font-medium">
                            contact us
                          </a>
                          .
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveMeal}
                      className="w-full py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1 active:scale-95 bg-gradient-to-r from-primary to-primary/80"
                      data-testid="button-save-meal"
                    >
                      Save to Dashboard & Progress
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
                      className="mt-2 px-6 py-3 text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
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
        
        {/* AI Disclaimer */}
        {analysis && (
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              AI can make mistakes. Please verify nutrition information and consult healthcare professionals for dietary advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}