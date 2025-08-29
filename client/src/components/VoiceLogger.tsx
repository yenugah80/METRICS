import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Volume2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceLoggerProps {
  onVoiceResult: (audioText: string) => void;
  disabled?: boolean;
}

export default function VoiceLogger({ onVoiceResult, disabled = false }: VoiceLoggerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          setTranscript(finalTranscript + interimTranscript);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          toast({
            title: "Voice Recognition Error",
            description: "Failed to recognize speech. Please try again or type manually.",
            variant: "destructive",
          });
          setIsRecording(false);
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
      } else {
        toast({
          title: "Voice Recognition Not Supported",
          description: "Your browser doesn't support voice recognition. Please type manually.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const startRecording = useCallback(async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup MediaRecorder for audio recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

      // Start speech recognition
      if (recognition) {
        recognition.start();
      }

      setIsRecording(true);
      setTranscript("");

      toast({
        title: "Recording Started",
        description: "Speak clearly about what you ate...",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [disabled, recognition, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (recognition) {
      recognition.stop();
    }

    setIsRecording(false);
    
    toast({
      title: "Recording Stopped",
      description: "Processing your speech...",
    });
  }, [recognition, toast]);

  const playRecording = useCallback(() => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioUrl, isPlaying]);

  const processVoiceInput = useCallback(() => {
    if (transcript.trim()) {
      onVoiceResult(transcript.trim());
      toast({
        title: "Voice Processed",
        description: "Analyzing your meal description...",
      });
    } else {
      toast({
        title: "No Speech Detected",
        description: "Please try recording again or type manually.",
        variant: "destructive",
      });
    }
  }, [transcript, onVoiceResult, toast]);

  return (
    <div className="space-y-4">
      {/* Recording Interface */}
      <Card className="border-2 border-dashed border-secondary/30 hover:border-secondary transition-colors" data-testid="voice-logger">
        <CardContent className="p-8 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
            isRecording 
              ? 'bg-danger animate-pulse' 
              : 'bg-secondary/10'
          }`}>
            {isRecording ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-secondary" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold mb-2">
            {isRecording ? "Listening..." : "Voice Meal Logging"}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            {isRecording 
              ? "Speak naturally about what you ate..." 
              : "Describe your meal using natural language"
            }
          </p>

          <div className="flex justify-center space-x-4">
            {!isRecording ? (
              <Button 
                className="btn-gradient px-8"
                onClick={startRecording}
                disabled={disabled}
                data-testid="button-start-recording"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button 
                variant="destructive"
                onClick={stopRecording}
                data-testid="button-stop-recording"
              >
                <MicOff className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      {transcript && (
        <Card data-testid="voice-transcript">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Speech Transcript</h4>
              {audioUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={playRecording}
                  data-testid="button-play-recording"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
              )}
            </div>
            
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your speech will appear here..."
              className="min-h-[100px] mb-4"
              data-testid="textarea-transcript"
            />
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline"
                onClick={() => setTranscript("")}
                disabled={disabled}
              >
                Clear
              </Button>
              <Button 
                className="btn-gradient"
                onClick={processVoiceInput}
                disabled={!transcript.trim() || disabled}
                data-testid="button-process-voice"
              >
                Analyze Meal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio 
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Example Prompts */}
      <Card className="bg-muted/5" data-testid="voice-examples">
        <CardContent className="p-4">
          <h5 className="text-sm font-medium mb-2">Example voice inputs:</h5>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>"I had a bowl of Greek yogurt with mixed berries and granola for breakfast"</p>
            <p>"Two slices of whole wheat toast with avocado and a scrambled egg"</p>
            <p>"A large salad with grilled chicken, cherry tomatoes, and olive oil dressing"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
