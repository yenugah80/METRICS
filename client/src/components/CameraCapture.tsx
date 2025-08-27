import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onImageCapture: (imageBase64: string, uploadUrl: string) => void;
  disabled?: boolean;
}

export default function CameraCapture({ onImageCapture, disabled = false }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get upload URL mutation
  const getUploadUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/objects/upload");
      return response.json();
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ imageBlob, uploadUrl }: { imageBlob: Blob; uploadUrl: string }) => {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: imageBlob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return uploadUrl;
    },
  });

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions or use file upload.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
  }, [stopCamera]);

  const processImage = useCallback(async (imageDataUrl: string) => {
    if (disabled) return;

    setIsUploading(true);
    try {
      // Get upload URL
      const { uploadURL } = await getUploadUrlMutation.mutateAsync();

      // Convert base64 to blob
      const base64Data = imageDataUrl.split(',')[1];
      const imageBlob = new Blob(
        [Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))],
        { type: 'image/jpeg' }
      );

      // Upload image
      await uploadImageMutation.mutateAsync({ imageBlob, uploadUrl: uploadURL });

      // Set ACL policy after upload
      await apiRequest("PUT", "/api/meals/image-acl", { imageUrl: uploadURL });

      // Trigger analysis
      onImageCapture(base64Data, uploadURL);
      
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Upload Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [disabled, onImageCapture, getUploadUrlMutation, uploadImageMutation, toast]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setCapturedImage(imageDataUrl);
      processImage(imageDataUrl);
    };
    reader.readAsDataURL(file);
  }, [processImage]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  return (
    <div className="space-y-4">
      {capturedImage ? (
        <Card className="overflow-hidden" data-testid="captured-image-preview">
          <CardContent className="p-0">
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Captured meal" 
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                {isUploading && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-3">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="text-sm font-medium">Uploading & Analyzing...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 flex space-x-2">
              <Button 
                variant="outline" 
                onClick={retakePhoto}
                disabled={isUploading || disabled}
                data-testid="button-retake-photo"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button 
                className="flex-1 btn-gradient"
                onClick={() => processImage(capturedImage)}
                disabled={isUploading || disabled}
                data-testid="button-analyze-image"
              >
                {isUploading ? "Processing..." : "Analyze Meal"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : isCameraActive ? (
        <Card className="overflow-hidden" data-testid="camera-preview">
          <CardContent className="p-0">
            <div className="relative">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover bg-gray-100"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/80 rounded-lg"></div>
              </div>
            </div>
            <div className="p-4 flex justify-center space-x-4">
              <Button 
                variant="outline"
                onClick={stopCamera}
                disabled={disabled}
              >
                Cancel
              </Button>
              <Button 
                className="btn-gradient px-8"
                onClick={captureImage}
                disabled={disabled}
                data-testid="button-capture-photo"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capture
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-2 border-dashed border-border hover:border-primary transition-colors camera-preview" data-testid="camera-upload-options">
            <CardContent className="p-8 text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Capture Your Meal</h3>
              <p className="text-muted-foreground mb-6">
                Take a photo for instant AI-powered food analysis
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  className="btn-gradient"
                  onClick={startCamera}
                  disabled={disabled}
                  data-testid="button-start-camera"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Open Camera
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  data-testid="button-upload-file"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            data-testid="input-file-upload"
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
