import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Check, AlertCircle, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useLocalAuth';

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
  const [isTranscriptConfirmed, setIsTranscriptConfirmed] = useState(false);
  const [parsedFoods, setParsedFoods] = useState<ParsedFood[]>([]);
  const [nutritionText, setNutritionText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthSupported, setSpeechSynthSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      setError('Voice recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    // Check for text-to-speech support
    if (!('speechSynthesis' in window)) {
      setSpeechSynthSupported(false);
    } else {
      synthRef.current = window.speechSynthesis;
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
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Text-to-Speech Functions
  const speak = (text: string) => {
    if (!speechSynthSupported || !synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const replayTranscript = () => {
    if (transcript) {
      speak(`You said: ${transcript}`);
    }
  };

  const replayNutritionText = () => {
    if (nutritionText) {
      speak(nutritionText);
    }
  };

  const startRecording = async () => {
    if (!isSupported) return;

    try {
      setError(null);
      setTranscript('');
      setParsedFoods([]);
      setNutritionText('');
      setIsTranscriptConfirmed(false);
      
      // Start speech recognition
      recognitionRef.current.start();
      setIsRecording(true);
      
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

  const confirmTranscript = () => {
    setIsTranscriptConfirmed(true);
    processVoiceInput();
  };

  const editTranscript = () => {
    setIsTranscriptConfirmed(false);
    setParsedFoods([]);
    setNutritionText('');
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
      
      console.log('Voice parsing response:', result);
      
      // Check for foods in the data object
      const foods = result.data?.foods || [];
      const totalNutrition = result.data?.totalNutrition;
      const nutritionScore = result.data?.nutritionScore;
      
      if (foods && foods.length > 0) {
        setParsedFoods(foods);
        
        // Create detailed nutrition text summary
        const nutritionSummary = `Analysis complete! I found ${foods.length} food item${foods.length > 1 ? 's' : ''}:

${foods.map((food: any) => `• ${food.name}: ${food.quantity} ${food.unit}`).join('\n')}

Total Nutrition:
• Calories: ${Math.round(totalNutrition?.calories || 0)}
• Protein: ${Math.round(totalNutrition?.protein || 0)}g
• Carbs: ${Math.round(totalNutrition?.carbs || 0)}g
• Fat: ${Math.round(totalNutrition?.fat || 0)}g
• Fiber: ${Math.round(totalNutrition?.fiber || 0)}g
• Sodium: ${Math.round(totalNutrition?.sodium || 0)}mg

Nutrition Grade: ${nutritionScore?.grade || 'N/A'} (${nutritionScore?.score || 0}/100)`;
        
        setNutritionText(nutritionSummary);
        
        toast({
          title: "Food analysis complete!",
          description: `Found ${foods.length} food item(s) with full nutrition data`,
        });
      } else {
        const message = result.data?.message || 'No foods could be identified from your description. Please try speaking more clearly or describing specific foods.';
        setError(message);
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
      setNutritionText('');
      setIsTranscriptConfirmed(false);
      
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
    <Card className="w-full max-w-2xl mx-auto" data-testid="voice-logger">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Voice Meal Logging
          {user?.isPremium && (
            <Badge className="bg-premium text-premium-foreground">Premium</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Voice Recording */}
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
          </div>

          {isRecording && (
            <div className="flex items-center justify-center gap-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Recording...</span>
            </div>
          )}
        </div>

        {/* Step 2: Transcript with Speaker Button */}
        {transcript && !isTranscriptConfirmed && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">What you said:</label>
              <div className="flex gap-2">
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="flex-1"
                  rows={3}
                  placeholder="Your speech will appear here..."
                  data-testid="transcript-textbox"
                />
                {speechSynthSupported && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={isSpeaking ? stopSpeaking : replayTranscript}
                    className="shrink-0"
                    data-testid="button-replay-transcript"
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-primary" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Step 3: Confirmation Question */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-medium mb-3">Is this transcript correct?</p>
              <div className="flex gap-2">
                <Button
                  onClick={confirmTranscript}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                  data-testid="button-confirm-transcript"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Yes, Analyze This Food
                </Button>
                <Button
                  variant="outline"
                  onClick={editTranscript}
                  className="flex items-center gap-2"
                  data-testid="button-edit-transcript"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Text
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Nutrition Analysis Results */}
        {nutritionText && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nutrition Analysis:</label>
              <div className="flex gap-2">
                <Textarea
                  value={nutritionText}
                  readOnly
                  className="flex-1 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20"
                  rows={12}
                  data-testid="nutrition-results-text"
                />
                {speechSynthSupported && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={isSpeaking ? stopSpeaking : replayNutritionText}
                    className="shrink-0"
                    data-testid="button-replay-nutrition"
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-primary" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              onClick={logMeal}
              disabled={isProcessing}
              className="w-full"
              size="lg"
              data-testid="button-log-meal"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging meal...
                </>
              ) : (
                'Save This Meal to Dashboard'
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