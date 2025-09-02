import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Sparkles, 
  Brain,
  Heart,
  Target,
  Activity
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface VoiceAnalysis {
  foods: Array<{
    name: string;
    quantity: number;
    unit: string;
    confidence: number;
    preparation?: string;
  }>;
  meal_context: {
    meal_type: string;
    eating_location: string;
    mood: string;
    satisfaction_level: number;
    time_of_day: string;
  };
  nutritional_intent: {
    health_goal: string;
    dietary_preference: string;
    portion_awareness: string;
  };
  semantic_tags: string[];
  processing_metadata: {
    transcript_confidence: number;
    food_extraction_confidence: number;
    context_understanding: number;
  };
}

const VoiceInputComponent: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const queryClient = useQueryClient();

  // Process voice input mutation
  const processVoiceMutation = useMutation({
    mutationFn: async (audioData: string) => {
      return apiRequest('/api/ai/voice-input', {
        method: 'POST',
        body: { audioData }
      });
    },
    onSuccess: (data) => {
      setVoiceAnalysis(data.data.voice_analysis);
      queryClient.invalidateQueries({ queryKey: ['/api/ai/insights'] });
    },
    onError: (error) => {
      console.error('Voice processing error:', error);
    }
  });

  const startRecording = async () => {
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
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    
    // Convert audio blob to base64 for demo
    // In production, you'd send the actual audio file
    const mockAudioData = btoa("demo-audio-data");
    
    try {
      await processVoiceMutation.mutateAsync(mockAudioData);
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMoodIcon = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      case 'uncomfortable': return '😰';
      case 'neutral': return '😐';
      default: return '🤔';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-6 h-6 text-blue-500" />
            Voice-to-Food Semantic Mapping
          </CardTitle>
          <p className="text-sm text-gray-600">
            Speak naturally about your meals and let AI extract detailed nutrition insights
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recording Controls */}
          <div className="flex justify-center space-x-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full"
                data-testid="button-start-recording"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-full animate-pulse"
                data-testid="button-stop-recording"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {audioBlob && !isRecording && (
              <Button
                onClick={processAudio}
                disabled={isProcessing}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full"
                data-testid="button-process-audio"
              >
                {isProcessing ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Brain className="w-5 h-5 mr-2" />
                )}
                {isProcessing ? 'Processing...' : 'Analyze with AI'}
              </Button>
            )}
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-700 text-sm font-medium">Recording in progress...</span>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                AI is analyzing your voice input using semantic mapping, food recognition, and mood detection...
              </AlertDescription>
            </Alert>
          )}

          {/* Voice Analysis Results */}
          {voiceAnalysis && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Voice Analysis Results
                </h3>

                {/* Foods Detected */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      Foods Detected
                    </h4>
                    {voiceAnalysis.foods.map((food, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <div>
                          <span className="font-medium">{food.name}</span>
                          <div className="text-sm text-gray-600">
                            {food.quantity} {food.unit}
                            {food.preparation && ` (${food.preparation})`}
                          </div>
                        </div>
                        <Badge className={getConfidenceColor(food.confidence)}>
                          {Math.round(food.confidence * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Meal Context */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      Meal Context
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm">Meal Type</span>
                        <Badge variant="secondary">{voiceAnalysis.meal_context.meal_type}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm">Mood</span>
                        <div className="flex items-center gap-2">
                          <span>{getMoodIcon(voiceAnalysis.meal_context.mood)}</span>
                          <Badge variant="outline">{voiceAnalysis.meal_context.mood}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm">Satisfaction</span>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={voiceAnalysis.meal_context.satisfaction_level * 100} 
                            className="w-16"
                          />
                          <span className="text-sm font-medium">
                            {Math.round(voiceAnalysis.meal_context.satisfaction_level * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health Intent & Processing Metadata */}
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      Health Intent
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-sm text-gray-600">Goal</div>
                        <div className="font-medium">{voiceAnalysis.nutritional_intent.health_goal}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-sm text-gray-600">Portion Awareness</div>
                        <div className="font-medium">{voiceAnalysis.nutritional_intent.portion_awareness}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      AI Processing Stats
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm">Transcript</span>
                        <Badge className={getConfidenceColor(voiceAnalysis.processing_metadata.transcript_confidence)}>
                          {Math.round(voiceAnalysis.processing_metadata.transcript_confidence * 100)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm">Food Extraction</span>
                        <Badge className={getConfidenceColor(voiceAnalysis.processing_metadata.food_extraction_confidence)}>
                          {Math.round(voiceAnalysis.processing_metadata.food_extraction_confidence * 100)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm">Context</span>
                        <Badge className={getConfidenceColor(voiceAnalysis.processing_metadata.context_understanding)}>
                          {Math.round(voiceAnalysis.processing_metadata.context_understanding * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Semantic Tags */}
                {voiceAnalysis.semantic_tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Semantic Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {voiceAnalysis.semantic_tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Example Prompts */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Try saying something like:</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>"Had just a small bowl of curd rice — was feeling bloated"</p>
              <p>"Ate a big salad with grilled chicken for lunch, feeling great"</p>
              <p>"Made a veggie stir-fry for dinner, used too much oil though"</p>
              <p>"Grabbed a quick sandwich and coffee on my way to work"</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceInputComponent;