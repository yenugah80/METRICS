import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Play, Pause, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceTranscription {
  text: string;
  confidence: number;
  foods?: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
}

export default function VoiceLogging() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPremium] = useState(true); // For demo - would check actual subscription
  const [transcription, setTranscription] = useState<VoiceTranscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Voice logging is available for Premium subscribers only!",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        processVoiceInput(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak clearly about your meal...",
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Please allow microphone access to use voice logging.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Simulate voice processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock transcription and food parsing
      const mockTranscription: VoiceTranscription = {
        text: "I had a grilled chicken salad with mixed greens, cherry tomatoes, and olive oil dressing for lunch",
        confidence: 0.92,
        foods: [
          { name: "grilled chicken breast", quantity: "100", unit: "g" },
          { name: "mixed salad greens", quantity: "50", unit: "g" },
          { name: "cherry tomatoes", quantity: "30", unit: "g" },
          { name: "olive oil dressing", quantity: "15", unit: "ml" }
        ]
      };

      setTranscription(mockTranscription);
      toast({
        title: "Voice processed successfully!",
        description: "Your meal has been parsed from voice input.",
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "Failed to process voice input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isPremium) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center p-12">
            <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              Voice-powered meal logging is available for Premium subscribers only.
              Upgrade to unlock this hands-free experience!
            </p>
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center space-x-2">
            <Mic className="h-8 w-8 text-primary" />
            <span>Voice-Powered Meal Logging</span>
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Simply speak your meal and let AI parse ingredients and nutrition data
          </p>
        </div>

        {/* Recording Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Voice Recording</CardTitle>
            <CardDescription>
              Speak clearly about your meal - mention foods, quantities, and preparation methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              {/* Recording Button */}
              <div className="relative">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`w-32 h-32 rounded-full text-2xl font-bold transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isRecording ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
                </Button>
                
                {isRecording && (
                  <div className="absolute -inset-4 border-4 border-red-500 rounded-full animate-ping opacity-30"></div>
                )}
              </div>

              {/* Recording Status */}
              <div className="space-y-2">
                {isRecording && (
                  <div className="text-lg font-semibold text-red-600">
                    Recording... {formatTime(recordingTime)}
                  </div>
                )}
                {isProcessing && (
                  <div className="flex items-center justify-center space-x-2 text-primary">
                    <Zap className="h-4 w-4 animate-spin" />
                    <span>Processing voice input...</span>
                  </div>
                )}
                {!isRecording && !isProcessing && (
                  <div className="text-muted-foreground">
                    Tap the microphone to start recording
                  </div>
                )}
              </div>

              {/* Audio Playback */}
              {audioURL && !isRecording && (
                <div className="flex justify-center">
                  <audio controls src={audioURL} className="max-w-xs">
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transcription Results */}
        {transcription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-green-500" />
                <span>Voice Transcription</span>
                <Badge variant="secondary">
                  {Math.round(transcription.confidence * 100)}% confidence
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">What you said:</h4>
                  <p className="text-foreground italic">"{transcription.text}"</p>
                </div>

                {transcription.foods && (
                  <div>
                    <h4 className="font-semibold mb-3">Identified Foods:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {transcription.foods.map((food, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {food.quantity} {food.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button className="flex-1">
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze Nutrition
                  </Button>
                  <Button variant="outline">
                    Edit Foods
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Logging Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <strong>Be specific:</strong> Mention quantities and units (e.g., "two slices of bread" or "100 grams of chicken")
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <strong>Include preparation:</strong> Specify cooking methods (grilled, fried, baked, raw)
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <strong>Speak clearly:</strong> Use a normal pace and volume for best recognition
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <strong>Group similar items:</strong> Say "salad with lettuce, tomatoes, and cucumber" rather than listing separately
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}