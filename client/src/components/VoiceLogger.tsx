import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Check, AlertCircle, Edit3, Trophy, Apple, Flame, Heart, Droplets, Leaf, Shield, Utensils, Zap, Save, Sparkles } from 'lucide-react';
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

        {/* Step 4: Beautiful Nutrition Analysis Results */}
        {nutritionText && (
          <div className="space-y-6">
            {/* Main Grade Display */}
            <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-800">Meal Analysis Complete!</h3>
                </div>
                
                {/* Extract grade from nutritionText */}
                {(() => {
                  const gradeMatch = nutritionText.match(/Nutrition Grade: ([A-F])/);
                  const scoreMatch = nutritionText.match(/\((\d+)\/100\)/);
                  const grade = gradeMatch ? gradeMatch[1] : 'C';
                  const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;
                  
                  const gradeColors = {
                    'A': { bg: 'bg-green-500', text: 'text-white', border: 'border-green-500', accent: 'from-green-400 to-green-600' },
                    'B': { bg: 'bg-lime-500', text: 'text-white', border: 'border-lime-500', accent: 'from-lime-400 to-lime-600' },
                    'C': { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-500', accent: 'from-yellow-400 to-yellow-600' },
                    'D': { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500', accent: 'from-orange-400 to-orange-600' },
                    'F': { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500', accent: 'from-red-400 to-red-600' }
                  };
                  
                  const colors = gradeColors[grade as keyof typeof gradeColors] || gradeColors['C'];
                  
                  return (
                    <div className="flex items-center justify-center space-x-6 mb-6">
                      <div className={`w-20 h-20 rounded-full ${colors.bg} flex items-center justify-center shadow-xl border-4 ${colors.border}`}>
                        <span className={`text-4xl font-black ${colors.text}`}>{grade}</span>
                      </div>
                      <div className="text-left">
                        <div className="text-3xl font-bold text-gray-800">{score}/100</div>
                        <div className="text-lg text-gray-600">Nutrition Score</div>
                        <div className={`text-sm font-medium bg-gradient-to-r ${colors.accent} bg-clip-text text-transparent`}>
                          {grade === 'A' ? 'Excellent Choice!' : grade === 'B' ? 'Great Choice!' : grade === 'C' ? 'Good Choice' : grade === 'D' ? 'Could Be Better' : 'Needs Improvement'}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Nutrition Breakdown Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Foods Found */}
              <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-gray-700">
                    <Utensils className="w-5 h-5 mr-2 text-blue-600" />
                    Foods Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {parsedFoods.map((food, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Apple className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 capitalize">{food.name}</div>
                            <div className="text-sm text-gray-600">{food.quantity} {food.unit}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(food.confidence * 100)}% confident
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Nutrition Facts */}
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-gray-700">
                    <Zap className="w-5 h-5 mr-2 text-emerald-600" />
                    Nutrition Facts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const caloriesMatch = nutritionText.match(/Calories: (\d+)/);
                      const proteinMatch = nutritionText.match(/Protein: (\d+)g/);
                      const carbsMatch = nutritionText.match(/Carbs: (\d+)g/);
                      const fatMatch = nutritionText.match(/Fat: (\d+)g/);
                      const fiberMatch = nutritionText.match(/Fiber: (\d+)g/);
                      const sodiumMatch = nutritionText.match(/Sodium: (\d+)mg/);
                      
                      const nutrients = [
                        { name: 'Calories', value: caloriesMatch ? parseInt(caloriesMatch[1]) : 0, unit: '', max: 600, icon: Flame, color: 'text-orange-600' },
                        { name: 'Protein', value: proteinMatch ? parseInt(proteinMatch[1]) : 0, unit: 'g', max: 50, icon: Heart, color: 'text-red-600' },
                        { name: 'Carbs', value: carbsMatch ? parseInt(carbsMatch[1]) : 0, unit: 'g', max: 75, icon: Apple, color: 'text-yellow-600' },
                        { name: 'Fat', value: fatMatch ? parseInt(fatMatch[1]) : 0, unit: 'g', max: 25, icon: Droplets, color: 'text-blue-600' },
                        { name: 'Fiber', value: fiberMatch ? parseInt(fiberMatch[1]) : 0, unit: 'g', max: 15, icon: Leaf, color: 'text-green-600' },
                        { name: 'Sodium', value: sodiumMatch ? parseInt(sodiumMatch[1]) : 0, unit: 'mg', max: 800, icon: Shield, color: 'text-purple-600' }
                      ];
                      
                      return nutrients.map((nutrient) => (
                        <div key={nutrient.name} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                          <div className="flex items-center space-x-3">
                            <nutrient.icon className={`w-5 h-5 ${nutrient.color}`} />
                            <span className="font-medium text-gray-700">{nutrient.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-800">{nutrient.value}{nutrient.unit}</div>
                            <div className="w-20">
                              <Progress 
                                value={Math.min(100, (nutrient.value / nutrient.max) * 100)} 
                                className="h-2 mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Enhanced Save Button with Gradient */}
            <Button
              onClick={logMeal}
              disabled={isProcessing}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              data-testid="button-log-meal"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Saving Your Meal...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-3" />
                  Save This Meal to Dashboard
                  <Sparkles className="w-5 h-5 ml-3" />
                </>
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