import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Volume2, Loader2, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface VoiceLoggerProps {
  onFoodLogged?: (mealData: any) => void;
  onClose?: () => void;
}

interface ParsedFood {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
}

export default function VoiceLogger({ onFoodLogged, onClose }: VoiceLoggerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedFoods, setParsedFoods] = useState<ParsedFood[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      setError('Voice recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript + ' ');
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Voice recognition error: ${event.error}`);
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!isSupported) return;

    try {
      setError(null);
      setTranscript('');
      setParsedFoods([]);
      
      // Start speech recognition
      recognitionRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak your meal description clearly",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const processVoiceInput = async () => {
    if (!transcript.trim()) {
      setError('No speech detected. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Parse the voice input using AI
      const response = await apiRequest('POST', '/api/voice-food-parsing', {
        transcript: transcript.trim(),
        isPremium: user?.isPremium || false
      });

      if (!response.ok) {
        throw new Error('Failed to process voice input');
      }

      const result = await response.json();
      
      if (result.foods && result.foods.length > 0) {
        setParsedFoods(result.foods);
        
        toast({
          title: "Voice input processed!",
          description: `Identified ${result.foods.length} food item(s)`,
        });
      } else {
        setError('No foods could be identified from your description. Please try speaking more clearly or describing specific foods.');
      }
    } catch (error: any) {
      console.error('Error processing voice input:', error);
      setError(error.message || 'Failed to process voice input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const logMeal = async () => {
    if (parsedFoods.length === 0) return;

    setIsProcessing(true);
    try {
      // Create a new meal log with the parsed foods
      const response = await apiRequest('POST', '/api/meals', {
        foods: parsedFoods,
        source: 'voice',
        notes: transcript.trim()
      });

      if (!response.ok) {
        throw new Error('Failed to log meal');
      }

      const mealData = await response.json();
      
      toast({
        title: "Meal logged successfully!",
        description: "Your voice-logged meal has been saved",
      });

      if (onFoodLogged) {
        onFoodLogged(mealData);
      }

      // Reset state
      setTranscript('');
      setParsedFoods([]);
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error logging meal:', error);
      setError(error.message || 'Failed to log meal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MicOff className="w-5 h-5" />
            Voice Logging Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Voice recognition is not supported in this browser. Please use Chrome, Safari, or Edge for voice logging.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto" data-testid="voice-logger">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Voice Meal Logging
          {user?.isPremium && (
            <Badge className="bg-premium text-premium-foreground">Premium</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Recording Controls */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-3">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="flex items-center gap-2"
                size="lg"
                data-testid="button-start-recording"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex items-center gap-2"
                size="lg"
                data-testid="button-stop-recording"
              >
                <MicOff className="w-5 h-5" />
                Stop Recording
              </Button>
            )}
            
            {transcript && !isRecording && (
              <Button
                onClick={processVoiceInput}
                disabled={isProcessing}
                className="flex items-center gap-2"
                data-testid="button-process-voice"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Parse Foods
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center justify-center gap-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Recording...</span>
            </div>
          )}
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">What you said:</h4>
            <div className="p-3 bg-muted rounded-lg text-sm" data-testid="transcript-display">
              {transcript}
            </div>
          </div>
        )}

        {/* Parsed Foods Display */}
        {parsedFoods.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Identified Foods:</h4>
            <div className="space-y-2">
              {parsedFoods.map((food, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="font-medium">{food.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {food.quantity} {food.unit}
                  </span>
                </div>
              ))}
            </div>
            
            <Button
              onClick={logMeal}
              disabled={isProcessing}
              className="w-full mt-4"
              data-testid="button-log-meal"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging meal...
                </>
              ) : (
                'Log This Meal'
              )}
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        {!transcript && !isRecording && (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Speak clearly and describe your meal with quantities
            </p>
            <p className="text-xs text-muted-foreground">
              Example: "I had two slices of toast with butter and a cup of coffee"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}