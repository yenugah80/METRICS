import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Volume2, VolumeX, Zap, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpeechCapabilitiesProps {
  onFoodDetected?: (text: string) => void;
  analysisText?: string;
}

export default function SpeechCapabilities({ onFoodDetected, analysisText }: SpeechCapabilitiesProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "🎤 Listening...",
          description: "Say what you ate, like 'I had a chicken salad with avocado'",
          duration: 2000,
        });
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
        
        if (finalTranscript && onFoodDetected) {
          onFoodDetected(finalTranscript.trim());
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event) => {
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: `Unable to recognize speech: ${event.error}`,
          variant: "destructive",
        });
      };
      
      recognitionRef.current = recognition;
      return recognition;
    } else {
      setIsRecognitionSupported(false);
      return null;
    }
  }, [onFoodDetected, toast]);

  // Start voice recognition
  const startListening = () => {
    if (!recognitionRef.current) {
      initSpeechRecognition();
    }
    
    if (recognitionRef.current) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Text-to-Speech function
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast({
          title: "Speech Error",
          description: "Unable to speak the text",
          variant: "destructive",
        });
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in this browser",
        variant: "destructive",
      });
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Speech-to-Speech (voice command processing)
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('analyze') || lowerCommand.includes('tell me about')) {
      if (analysisText) {
        speakText(analysisText);
      } else {
        speakText("I'll analyze your meal once you provide food information.");
      }
    } else if (lowerCommand.includes('calories') || lowerCommand.includes('nutrition')) {
      speakText(`This meal contains approximately ${Math.round(mealTotals.calories)} calories with ${Math.round(mealTotals.protein)} grams of protein.`);
    } else if (lowerCommand.includes('safety') || lowerCommand.includes('allergen')) {
      speakText(`Food safety score is ${analysis.safety.food_safety_score} out of 100. ${analysis.safety.allergen_alerts.length > 0 ? `Warning: ${analysis.safety.allergen_alerts.length} allergen alerts detected.` : 'No allergen alerts detected.'}`);
    } else if (lowerCommand.includes('sustainability') || lowerCommand.includes('environment')) {
      speakText(`Environmental impact score is ${analysis.sustainability.eco_score} out of 100. This meal has a ${analysis.sustainability.carbon_footprint} carbon footprint.`);
    } else {
      // Default response for unrecognized commands
      speakText("I can help you analyze your meal. Try saying 'analyze this meal' or 'tell me the calories'.");
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-700">
          <MessageSquare className="h-5 w-5 mr-2" />
          Speech Capabilities
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">Speech-to-Text</Badge>
          <Badge variant="outline" className="text-xs">Text-to-Speech</Badge>
          <Badge variant="outline" className="text-xs">Voice Commands</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Speech-to-Text Controls */}
        <div className="space-y-3">
          <h4 className="font-semibold text-purple-700">🎤 Voice Food Logging</h4>
          <div className="flex items-center gap-3">
            {isRecognitionSupported ? (
              <>
                <Button
                  onClick={isListening ? stopListening : startListening}
                  className={`${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                  data-testid={isListening ? 'button-stop-listening' : 'button-start-listening'}
                >
                  {isListening ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Voice Logging
                    </>
                  )}
                </Button>
                {isListening && (
                  <div className="flex items-center text-red-600 animate-pulse">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    Recording...
                  </div>
                )}
              </>
            ) : (
              <Badge variant="destructive">Speech recognition not supported</Badge>
            )}
          </div>
          
          {/* Live Transcript */}
          {transcript && (
            <div className="p-3 bg-white border border-purple-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Transcript:</div>
              <div className="text-sm font-medium">{transcript}</div>
            </div>
          )}
        </div>

        {/* Text-to-Speech Controls */}
        <div className="space-y-3">
          <h4 className="font-semibold text-purple-700">🔊 Hear Your Analysis</h4>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => analysisText ? speakText(analysisText) : speakText("Please analyze a meal first to hear the results.")}
              disabled={isSpeaking}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              data-testid="button-speak-analysis"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Speaking...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Hear Analysis
                </>
              )}
            </Button>
            
            {isSpeaking && (
              <Button
                onClick={stopSpeaking}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
                data-testid="button-stop-speaking"
              >
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Voice Commands Help */}
        <div className="space-y-3">
          <h4 className="font-semibold text-purple-700">💬 Voice Commands</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-white rounded border border-purple-200">
              <strong>"Analyze this meal"</strong> - Get full analysis
            </div>
            <div className="p-2 bg-white rounded border border-purple-200">
              <strong>"Tell me the calories"</strong> - Hear nutrition info
            </div>
            <div className="p-2 bg-white rounded border border-purple-200">
              <strong>"Safety information"</strong> - Hear allergen alerts
            </div>
            <div className="p-2 bg-white rounded border border-purple-200">
              <strong>"Environmental impact"</strong> - Hear eco analysis
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}