import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Camera,
  RotateCcw,
  Check,
  X,
  Loader2,
  Sparkles,
  FlipHorizontal,
  ScanLine,
  Upload
} from "lucide-react";

interface CameraProps {
  onResult?: (result: any) => void;
}

export default function MobileCamera({ onResult }: CameraProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Food analysis mutation
  const analyzeFoodMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const res = await apiRequest("POST", "/api/analyze-food", { 
        type: 'image', 
        data: imageData 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.data);
      onResult?.(data.data);
      toast({
        title: "Food Analyzed! 🍽️",
        description: "Successfully analyzed your food image.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan food.",
        variant: "destructive",
      });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setAnalysisResult(null);
    startCamera();
  }, [startCamera]);

  const analyzeImage = useCallback(() => {
    if (!capturedImage) return;
    analyzeFoodMutation.mutate(capturedImage);
  }, [capturedImage, analyzeFoodMutation]);

  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    setTimeout(startCamera, 100);
  }, [startCamera, stopCamera]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCapturedImage(result);
      setIsStreaming(false);
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="p-4 bg-background min-h-screen">
      <div className="max-w-md mx-auto">
        {/* Mobile Header */}
        <div className="mb-6">
          <h1 className="text-mobile-2xl font-bold mb-2 text-black">Food Scanner</h1>
          <p className="text-mobile-sm text-gray-600 font-medium">Capture food to analyze nutrition</p>
        </div>

        {/* Camera/Image Display */}
        <Card className="mobile-card-featured mb-6">
          <CardContent className="p-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {!capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${!isStreaming ? 'hidden' : ''}`}
                  />
                  {!isStreaming && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                      <Camera className="h-12 w-12 text-gray-400" />
                      <p className="text-mobile-sm text-gray-500 text-center">
                        Ready to scan your food
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <img 
                  src={capturedImage} 
                  alt="Captured food" 
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Camera overlay */}
              {isStreaming && (
                <div className="absolute inset-0 border-2 border-white/50 rounded-lg">
                  <div className="absolute top-4 left-4 right-4 flex justify-between">
                    <Badge variant="secondary" className="bg-white/90 text-black">
                      <ScanLine className="h-3 w-3 mr-1" />
                      Scanning
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={flipCamera}
                      className="bg-white/90 hover:bg-white h-8 w-8 p-0"
                    >
                      <FlipHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          {!capturedImage ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={isStreaming ? capturePhoto : startCamera}
                className="mobile-btn bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-camera-action"
              >
                {isStreaming ? (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mobile-btn"
                data-testid="button-upload"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="mobile-btn"
                data-testid="button-retake"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              
              <Button
                onClick={analyzeImage}
                disabled={analyzeFoodMutation.isPending}
                className="mobile-btn btn-gradient"
                data-testid="button-analyze"
              >
                {analyzeFoodMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="mobile-card-featured">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-mobile-lg font-bold text-black">
                <Check className="h-5 w-5 text-green-600" />
                <span>Analysis Complete</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nutrition Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-mobile-lg font-bold text-blue-700">
                    {analysisResult.nutrition?.calories || 0}
                  </div>
                  <div className="text-mobile-xs text-blue-600">Calories</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-mobile-lg font-bold text-green-700">
                    {Math.round(analysisResult.nutrition?.protein || 0)}g
                  </div>
                  <div className="text-mobile-xs text-green-600">Protein</div>
                </div>
              </div>
              
              {/* Nutrition Score */}
              {analysisResult.nutrition_score && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-mobile-sm font-semibold">Nutrition Score</span>
                    <Badge variant={analysisResult.nutrition_score.grade === 'A' ? 'default' : 'secondary'}>
                      Grade {analysisResult.nutrition_score.grade}
                    </Badge>
                  </div>
                  <div className="text-mobile-xl font-bold text-primary">
                    {analysisResult.nutrition_score.score}/100
                  </div>
                </div>
              )}
              
              {/* Foods Detected */}
              {analysisResult.foods && (
                <div>
                  <div className="text-mobile-sm font-semibold mb-2">Foods Detected:</div>
                  <div className="space-y-2">
                    {analysisResult.foods.slice(0, 3).map((food: any, index: number) => (
                      <div key={index} className="border rounded-lg p-2">
                        <div className="text-mobile-sm font-medium">{food.name}</div>
                        <div className="text-mobile-xs text-gray-600">
                          {food.quantity} {food.unit} • {food.calories || 0} cal
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Hidden elements */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}