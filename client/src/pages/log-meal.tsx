import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import CameraCapture from "@/components/CameraCapture";
import BarcodeScanner from "@/components/BarcodeScanner";
import VoiceLogger from "@/components/VoiceLogger";
import ScoreBadge from "@/components/ScoreBadge";
import { ArrowLeft, Save, Sparkles, Crown } from "lucide-react";

interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  confidence?: number;
}

export default function LogMeal() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("photo");
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Parse URL params for mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode && ['photo', 'barcode', 'voice', 'manual'].includes(mode)) {
      setActiveTab(mode);
    }
  }, []);

  // Image analysis mutation
  const analyzeImageMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await apiRequest("POST", "/api/meals/analyze-image", {
        imageBase64
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsAnalyzing(false);
      if (data.foods) {
        setFoods(data.foods);
        setMealName(data.foods.map((f: any) => f.name).join(", "));
        setMealType(data.mealType || "breakfast");
      }
    },
    onError: (error) => {
      setIsAnalyzing(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Voice analysis mutation
  const analyzeVoiceMutation = useMutation({
    mutationFn: async (audioText: string) => {
      const response = await apiRequest("POST", "/api/meals/analyze-voice", {
        audioText
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.foods) {
        setFoods(data.foods);
        setMealName(data.foods.map((f: any) => f.name).join(", "));
        setMealType(data.mealType || "breakfast");
        setRawText(data.rawText || "");
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Voice Analysis Failed",
        description: "Failed to analyze voice input. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save meal mutation
  const saveMealMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/meals", {
        name: mealName,
        mealType,
        imageUrl,
        rawText,
        source: activeTab,
        foods,
        confidence: foods.reduce((acc, f) => acc + (f.confidence || 0), 0) / foods.length
      });
      return response.json();
    },
    onSuccess: (data) => {
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
      
      // Show navigation options after short delay
      setTimeout(() => {
        const shouldViewDashboard = window.confirm(
          "✅ Your meal has been saved!\n\nWhere would you like to go next?\n\nClick OK to view your Dashboard with today's nutrition summary, or Cancel to see your Progress tracking and achievements."
        );
        
        if (shouldViewDashboard) {
          navigate("/dashboard");
        } else {
          navigate("/daily-progress");
        }
      }, 2000);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Save Failed",
        description: "Failed to save meal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageCapture = (imageBase64: string, uploadUrl: string) => {
    setIsAnalyzing(true);
    setImageUrl(uploadUrl);
    analyzeImageMutation.mutate(imageBase64);
  };

  const handleBarcodeResult = (barcodeData: any) => {
    if (barcodeData) {
      setMealName(barcodeData.name || "Scanned Product");
      setFoods([{
        name: barcodeData.name || "Scanned Product",
        quantity: 1,
        unit: "serving",
        confidence: 0.9
      }]);
    }
  };

  const handleVoiceResult = (audioText: string) => {
    setRawText(audioText);
    analyzeVoiceMutation.mutate(audioText);
  };

  const handleFoodChange = (index: number, field: keyof FoodItem, value: any) => {
    const newFoods = [...foods];
    newFoods[index] = { ...newFoods[index], [field]: value };
    setFoods(newFoods);
  };

  const addFood = () => {
    setFoods([...foods, { name: "", quantity: 1, unit: "g" }]);
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Log Meal</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-premium" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <Card className="card-shadow border-0 rounded-2xl" data-testid="card-log-meal">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Log Your Meal
              {isAnalyzing && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                  Analyzing...
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="photo" data-testid="tab-photo">Photo</TabsTrigger>
                <TabsTrigger value="barcode" data-testid="tab-barcode">Barcode</TabsTrigger>
                <TabsTrigger value="voice" disabled={!user?.isPremium} data-testid="tab-voice">
                  <span className="flex items-center space-x-1">
                    <span>Voice</span>
                    {!user?.isPremium && <Crown className="w-3 h-3 text-premium" />}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="manual" data-testid="tab-manual">Manual</TabsTrigger>
              </TabsList>

              <TabsContent value="photo" className="mt-4">
                <CameraCapture 
                  onImageCapture={handleImageCapture}
                  disabled={isAnalyzing}
                />
              </TabsContent>

              <TabsContent value="barcode" className="mt-4">
                <BarcodeScanner 
                  onBarcodeResult={handleBarcodeResult}
                />
              </TabsContent>

              <TabsContent value="voice" className="mt-4">
                {user?.isPremium ? (
                  <VoiceLogger 
                    onVoiceResult={handleVoiceResult}
                    disabled={analyzeVoiceMutation.isPending}
                  />
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-premium/30 rounded-xl">
                    <Crown className="w-12 h-12 mx-auto mb-4 text-premium" />
                    <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
                    <p className="text-muted-foreground mb-4">
                      Voice logging is available with premium subscription
                    </p>
                    <Button 
                      onClick={() => navigate("/subscribe")}
                      className="btn-gradient"
                    >
                      Upgrade to Premium
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="manual-search">Search for food</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input 
                        id="manual-search"
                        placeholder="e.g., Greek yogurt with berries"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              setFoods([{
                                name: input.value.trim(),
                                quantity: 1,
                                unit: "serving"
                              }]);
                              setMealName(input.value.trim());
                            }
                          }
                        }}
                        data-testid="input-manual-search"
                      />
                      <Button variant="outline">Search</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Meal Details Form */}
            {foods.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meal-name">Meal Name</Label>
                    <Input 
                      id="meal-name"
                      value={mealName}
                      onChange={(e) => setMealName(e.target.value)}
                      placeholder="e.g., Breakfast Bowl"
                      data-testid="input-meal-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meal-type">Meal Type</Label>
                    <Select value={mealType} onValueChange={setMealType}>
                      <SelectTrigger data-testid="select-meal-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Food Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Food Items</Label>
                    <Button variant="outline" size="sm" onClick={addFood} data-testid="button-add-food">
                      Add Item
                    </Button>
                  </div>
                  
                  {foods.map((food, index) => (
                    <Card key={index} className="p-4" data-testid={`food-item-${index}`}>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <Label className="text-xs">Food Name</Label>
                          <Input 
                            value={food.name}
                            onChange={(e) => handleFoodChange(index, 'name', e.target.value)}
                            placeholder="Food name"
                            data-testid={`input-food-name-${index}`}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input 
                            type="number"
                            value={food.quantity}
                            onChange={(e) => handleFoodChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="1"
                            data-testid={`input-food-quantity-${index}`}
                          />
                        </div>
                        <div className="flex space-x-1">
                          <div className="flex-1">
                            <Label className="text-xs">Unit</Label>
                            <Select 
                              value={food.unit} 
                              onValueChange={(value) => handleFoodChange(index, 'unit', value)}
                            >
                              <SelectTrigger data-testid={`select-food-unit-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="g">grams</SelectItem>
                                <SelectItem value="oz">ounces</SelectItem>
                                <SelectItem value="cup">cups</SelectItem>
                                <SelectItem value="piece">pieces</SelectItem>
                                <SelectItem value="slice">slices</SelectItem>
                                <SelectItem value="serving">servings</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {foods.length > 1 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => removeFood(index)}
                              className="mt-5"
                              data-testid={`button-remove-food-${index}`}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </div>
                      {food.confidence && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            AI Confidence: {Math.round(food.confidence * 100)}%
                          </span>
                          <ScoreBadge 
                            grade={food.confidence > 0.8 ? 'A' : food.confidence > 0.6 ? 'B' : 'C'} 
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Notes */}
                {rawText && (
                  <div>
                    <Label htmlFor="notes">Original Input</Label>
                    <Textarea 
                      id="notes"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Additional notes..."
                      className="mt-1"
                      data-testid="textarea-notes"
                    />
                  </div>
                )}

                {/* Save Button */}
                <Button 
                  className="w-full btn-gradient py-3 text-lg font-semibold"
                  onClick={() => saveMealMutation.mutate()}
                  disabled={saveMealMutation.isPending || !mealName.trim() || foods.length === 0}
                  data-testid="button-save-meal"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saveMealMutation.isPending ? "Saving..." : "Save & Analyze Meal"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
