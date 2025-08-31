import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Sparkles, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useLocalAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface VoiceAssistantProps {
  onTokenUsed?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function VoiceAssistant({ onTokenUsed }: VoiceAssistantProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0].transcript;
          handleVoiceInput(transcript);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: "Voice Recognition Error",
            description: "There was an issue with voice recognition. Please try again.",
            variant: "destructive"
          });
        };
      }
    }
    
    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Add initial welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hi there! I'm Nutri, your friendly nutrition assistant! Ask me anything about food, nutrition, meal planning, or healthy eating. I'm here to help you make better food choices!",
      timestamp: new Date()
    }]);
  }, [toast]);

  const startListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      toast({
        title: "Speech Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast({
        title: "Voice Error",
        description: "Could not start voice recognition. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: transcript,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Send to AI assistant
      const response = await apiRequest('POST', '/api/voice-assistant', {
        message: transcript,
        conversationHistory: messages.slice(-5) // Send last 5 messages for context
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get assistant response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response
      speakText(data.response);
      
      // Notify token usage
      onTokenUsed?.();
      
      toast({
        title: "Voice Session Used",
        description: "One voice session token has been consumed.",
        variant: "default"
      });

    } catch (error) {
      console.error('Voice assistant error:', error);
      toast({
        title: "Assistant Error",
        description: error instanceof Error ? error.message : "Failed to process your request",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current || isSpeaking) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Try to use a female voice if available
    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('samantha')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const clearConversation = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hi there! I'm Nutri, your friendly nutrition assistant! Ask me anything about food, nutrition, meal planning, or healthy eating. I'm here to help you make better food choices!",
      timestamp: new Date()
    }]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Voice Assistant Character */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center text-white shadow-lg transition-all duration-300 ${
            isListening ? 'animate-pulse scale-110' : ''
          } ${isProcessing ? 'animate-bounce' : ''}`}>
            {isProcessing ? (
              <Brain className="w-10 h-10" />
            ) : isListening ? (
              <Mic className="w-10 h-10" />
            ) : (
              <Sparkles className="w-10 h-10" />
            )}
          </div>
          {isListening && (
            <div className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping"></div>
          )}
        </div>
        <h2 className="text-2xl font-semibold text-neutral-900 mt-4 mb-2">
          Meet Nutri, Your AI Nutrition Assistant
        </h2>
        <p className="text-neutral-600">
          {isProcessing ? "Thinking about your question..." : 
           isListening ? "I'm listening... speak now!" :
           "Tap the microphone to start a conversation"}
        </p>
      </div>

      {/* Voice Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!speechSupported || isProcessing}
          className={`rounded-full p-4 text-white font-medium transition-all duration-200 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-emerald-500 hover:bg-emerald-600'
          } ${!speechSupported || isProcessing ? 'opacity-50 cursor-not-allowed' : 'ios-interactive'}`}
          data-testid="button-voice-toggle"
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={isSpeaking ? stopSpeaking : undefined}
          disabled={!isSpeaking}
          className={`rounded-full p-4 text-white font-medium transition-all duration-200 ${
            isSpeaking 
              ? 'bg-indigo-500 hover:bg-indigo-600' 
              : 'bg-gray-400'
          } ${!isSpeaking ? 'opacity-50 cursor-not-allowed' : 'ios-interactive'}`}
          data-testid="button-speaker-toggle"
        >
          {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>

        <button
          onClick={clearConversation}
          className="rounded-full border border-black/10 bg-white/70 p-4 text-neutral-900 font-medium backdrop-blur hover:bg-white transition-colors ios-interactive"
          data-testid="button-clear-conversation"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Conversation History */}
      <div className="ios-card p-6 max-h-96 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation by tapping the microphone!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-neutral-100 text-neutral-900'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 opacity-70`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Info */}
      {!user?.isPremium && (
        <div className="ios-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-orange-100 text-orange-800 border-orange-300 rounded-full px-3 py-1 text-xs font-medium">
                Free Plan
              </Badge>
              <span className="text-sm text-neutral-600">
                Voice sessions consume tokens from your monthly limit
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}