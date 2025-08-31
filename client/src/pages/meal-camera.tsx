import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useLocalAuth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Utensils, Type, Mic, Crown, Sparkles, Info, Database, Target, X, Shield, Heart, Globe } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import VoiceLogger from "@/components/VoiceLogger";
import { SustainabilityCard } from "@/components/business/SustainabilityCard";
import { AllergenAlert } from "@/components/business/AllergenAlert";
import { TokenDisplay } from "@/components/business/TokenDisplay";
import MVPAnalysisResults from "@/components/MVPAnalysisResults";
import AdvancedMealScanning from "@/components/AdvancedMealScanning";

interface AnalyzedFood {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
  calories_per_serving: number;
  category: string;
  calories?: number;
  protein?: number;
  source?: string;
}

interface MVPAnalysisResult {
  foods: AnalyzedFood[];
  safety: {
    overall_safety: 'safe' | 'caution' | 'warning';
    allergen_alerts: Array<{
      allergen: string;
      severity: 'mild' | 'moderate' | 'severe';
      foods_containing: string[];
      description: string;
    }>;
    food_safety_score: number;
    safety_recommendations: string[];
  };
  health: {
    nutrition_score: number;
    health_grade: 'A' | 'B' | 'C' | 'D' | 'F';
    calories: number;
    macronutrients: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    micronutrients: {
      vitamin_c: number;
      iron: number;
      calcium: number;
      vitamin_d: number;
      potassium: number;
      magnesium: number;
    };
    health_benefits: string[];
    health_concerns: string[];
    improvement_suggestions: string[];
  };
  sustainability: {
    eco_score: number;
    eco_grade: 'A' | 'B' | 'C' | 'D' | 'F';
    carbon_footprint: 'low' | 'medium' | 'high';
    water_usage: 'low' | 'medium' | 'high';
    sustainability_tips: string[];
    eco_friendly_alternatives: string[];
  };
  recommendations: {
    safer_alternatives: Array<{
      original_food: string;
      alternative: string;
      reason: string;
      benefit_score: number;
    }>;
    healthier_swaps: Array<{
      original_food: string;
      alternative: string;
      reason: string;
      benefit_score: number;
    }>;
    eco_friendly_options: Array<{
      original_food: string;
      alternative: string;
      reason: string;
      benefit_score: number;
    }>;
    general_tips: string[];
  };
  confidence: number;
  analysis_timestamp: string;
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
  const [analysis, setAnalysis] = useState<MVPAnalysisResult | null>(null);
  const [legacyAnalysis, setLegacyAnalysis] = useState<NutritionAnalysis | null>(null);
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
  const isDemo = window.location.pathname === '/demo';
  const queryClient = useQueryClient();

  // Text analysis handler
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    // Allow demo mode, but encourage signup for full features
    if (!isAuthenticated && !isDemo) {
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
      const response = await apiRequest("POST", "/api/meals/analyze-mvp", { foodDescription: textInput });
      const data = await response.json();
      setAnalysis(data.analysis);
      toast({
        title: "Meal analyzed successfully!",
        description: `Analysis complete with safety, health, and sustainability insights!`,
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
    
    // Allow demo mode, but encourage signup for full features
    if (!isAuthenticated && !isDemo) {
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
      const response = await apiRequest("POST", "/api/meals/analyze-mvp", { foodDescription: transcript });
      const data = await response.json();
      setAnalysis(data.analysis);
      // Speak back the analysis results
      const healthGrade = data.analysis.health.health_grade;
      const nutritionScore = data.analysis.health.nutrition_score;
      const spokenResult = `Great! I analyzed your ${transcript}. Your meal gets a ${healthGrade} grade with a nutrition score of ${nutritionScore} out of 100. This looks like a ${healthGrade === 'A' ? 'fantastic' : healthGrade === 'B' ? 'great' : healthGrade === 'C' ? 'good' : 'decent'} choice for your health goals!`;
      
      // Use text-to-speech to speak the result
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(spokenResult);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      }

      toast({
        title: "🎉 Voice analyzed successfully!",
        description: `Got a ${healthGrade} grade! Listen for more details.`,
      });
    } catch (error: any) {
      const errorMessage = "Sorry, I couldn't analyze that. Could you try describing your meal again?";
      
      // Speak the error message
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(errorMessage);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      }
      
      toast({
        title: "Voice analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler for advanced food detection methods
  const handleAdvancedFoodDetection = (foods: string[], method: 'camera' | 'upload' | 'text' | 'voice' | 'barcode') => {
    const foodText = foods.join(', ');
    analyzeMutation.mutate(foodText);
  };

  const analyzeMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await apiRequest("POST", "/api/meals/analyze-mvp", { imageBase64 });
      return response.json();
    },
    onSuccess: (data: any) => {
      setAnalysis(data.analysis);
      toast({
        title: "Meal analyzed successfully!",
        description: "Analysis complete with safety, health, and sustainability insights!",
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
      
      // Allow demo mode, but encourage signup for full features
      if (!isAuthenticated && !isDemo) {
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
        title: "🎉 Great job! Meal logged successfully!",
        description: "You're building healthy habits! Your nutrition data is now tracking your progress.",
        action: (
          <div className="flex gap-2">
            <button 
              onClick={() => navigate("/dashboard")}
              className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium hover:bg-primary/90"
            >
              See Your Progress
            </button>
          </div>
        ),
      });
      
      // Show clear navigation options after short delay
      setTimeout(() => {
        const shouldViewDashboard = window.confirm(
          "🎉 Amazing! Your meal is logged!\n\n✨ You're building healthy habits and we love seeing your progress!\n\n🏆 Ready to see how you're doing today?\n\nClick OK to see your dashboard or Cancel to continue logging meals."
        );
        
        if (shouldViewDashboard) {
          navigate("/dashboard");
        } else {
          // Stay on current page to continue logging
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
    <div className="p-6 bg-gradient-to-br from-blue-50/40 via-indigo-50/30 to-purple-50/40 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Demo Banner */}
        {isDemo && (
          <div className="mb-6 bg-gradient-to-r from-emerald-100/80 to-teal-100/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2 rounded-xl shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-800">You're in Demo Mode!</h3>
                  <p className="text-sm text-emerald-700">
                    Try all features instantly. Sign up to save your meals and track progress.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/auth')}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="demo-banner-signup"
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isDemo ? 'Try Our Smart Food Assistant' : 'Log Your Meal'}
          </h1>
          <p className="text-muted-foreground">
            {isDemo ? 'See how our AI instantly recognizes your food and gives you personalized health insights' : 'Take a photo, describe it, or tell us what you ate - we\'ll handle the nutrition analysis'}
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
                    <TabsTrigger value="voice" data-testid="tab-voice">
                      <Mic className="h-4 w-4 mr-2" />
                      Voice
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
                    <VoiceLogger 
                      onVoiceResult={handleVoiceResult}
                      disabled={isAnalyzing}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Preview and Analysis */}
        {selectedImage && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6">
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
                  className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover rounded-lg shadow-md"
                  data-testid="image-preview"
                />
                <Button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysis(null);
                  }}
                  variant="outline"
                  className="w-full mt-4 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                  data-testid="button-upload-new"
                >
                  Upload New Photo
                </Button>
              </CardContent>
            </Card>

            {/* MVP Analysis Results */}
            <div className="xl:col-span-1">
              {analysis ? (
                <MVPAnalysisResults 
                  analysis={analysis}
                  onSaveMeal={handleSaveMeal}
                  onNewAnalysis={() => {
                    setSelectedImage(null);
                    setAnalysis(null);
                  }}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {analyzeMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                      {!analysis && !analyzeMutation.isPending && <Database className="h-5 w-5 text-muted-foreground" />}
                      <span>Waiting for Analysis</span>
                    </CardTitle>
                    <CardDescription>
                      {analyzeMutation.isPending && "Analyzing your meal for safety, health, and sustainability..."}
                      {!analysis && !analyzeMutation.isPending && "Upload an image to get instant analysis"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    {analyzeMutation.isPending ? (
                      <div className="space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground">Analyzing your meal...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Database className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">Analysis results will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Error state for failed analysis */}
        {analyzeMutation.isError && selectedImage && (
          <Card className="border-red-200">
            <CardContent className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-600" />
              <p className="text-red-600 font-medium">Analysis Failed</p>
              <p className="text-muted-foreground text-sm mb-4">Please try again or upload a different image</p>
              <Button
                onClick={() => {
                  if (selectedImage) {
                    const base64 = selectedImage.split(",")[1];
                    analyzeMutation.mutate(base64);
                  }
                }}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Retry Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips for Better Analysis */}
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
                  <div className="text-muted-foreground">Take photos in bright, natural light for accurate analysis</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Clear View</div>
                  <div className="text-muted-foreground">Ensure all foods are visible and unobstructed</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Close Focus</div>
                  <div className="text-muted-foreground">Fill the frame with your meal for best results</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Disclaimer */}
        {analysis && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              AI analysis provides estimated insights. Always consult healthcare professionals for dietary advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
