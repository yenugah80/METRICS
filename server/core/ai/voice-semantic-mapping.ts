import OpenAI from 'openai';
import { aiMemoryStore } from './memory-store';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20000,
  maxRetries: 2
});

export interface VoiceAnalysisResult {
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

export class VoiceSemanticMapping {
  
  // Process voice input through Whisper + GPT semantic analysis
  async processVoiceInput(audioData: string, userId: string): Promise<VoiceAnalysisResult> {
    try {
      // Step 1: Transcribe audio using Whisper
      const transcript = await this.transcribeAudio(audioData);
      
      // Step 2: Semantic analysis and food extraction
      const analysis = await this.extractSemanticMeaning(transcript, userId);
      
      // Step 3: Track patterns for learning
      await this.trackVoicePatterns(userId, analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('Voice semantic mapping error:', error);
      throw new Error('Failed to process voice input');
    }
  }
  
  // Transcribe audio using OpenAI Whisper
  private async transcribeAudio(audioData: string): Promise<string> {
    try {
      // Convert base64 audio to buffer (in real implementation)
      // For now, simulate transcription
      
      // In production, you would:
      // const audioBuffer = Buffer.from(audioData, 'base64');
      // const transcription = await openai.audio.transcriptions.create({
      //   file: audioBuffer,
      //   model: "whisper-1",
      //   language: "en",
      //   prompt: "Food logging, nutrition, meal description"
      // });
      // return transcription.text;
      
      // Simulated transcription for demo
      const sampleTranscripts = [
        "Had just a small bowl of curd rice — was feeling bloated",
        "Ate a big salad with grilled chicken for lunch, feeling great",
        "Had some oatmeal with berries this morning, trying to eat healthier",
        "Grabbed a quick sandwich and coffee on my way to work",
        "Made a veggie stir-fry for dinner, used too much oil though"
      ];
      
      return sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
      
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
  
  // Extract semantic meaning and food information from transcript
  private async extractSemanticMeaning(transcript: string, userId: string): Promise<VoiceAnalysisResult> {
    try {
      // Get user context for personalized analysis
      const userPatterns = await aiMemoryStore.getPatterns(userId);
      const userPreferences = userPatterns.filter(p => p.patternType === 'preference');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert food semantic analyzer. Extract detailed information from voice transcripts about food logging.

USER CONTEXT:
- Known preferences: ${userPreferences.map(p => p.pattern).join(', ')}
- Eating patterns: ${userPatterns.filter(p => p.patternType === 'eating_habit').map(p => p.pattern).join(', ')}

ANALYSIS REQUIREMENTS:
1. Extract all foods mentioned with quantities (estimate if not specified)
2. Understand meal context (when, where, how they felt)
3. Detect emotional/health intentions
4. Identify preparation methods and cooking styles
5. Understand portion awareness and satisfaction

Handle fuzzy inputs like:
- "small bowl" → estimate quantity
- "feeling bloated" → mood/satisfaction context
- "trying to eat healthier" → health intention
- "too much oil" → preparation awareness

Respond in detailed JSON format.`
          },
          {
            role: "user",
            content: `Analyze this food logging transcript: "${transcript}"`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.3
      });
      
      const rawAnalysis = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Structure the analysis with confidence scores
      const analysis: VoiceAnalysisResult = {
        foods: rawAnalysis.foods || [
          {
            name: this.extractMainFood(transcript),
            quantity: this.estimateQuantity(transcript),
            unit: this.estimateUnit(transcript),
            confidence: 0.8,
            preparation: this.extractPreparation(transcript)
          }
        ],
        meal_context: {
          meal_type: this.detectMealType(transcript),
          eating_location: this.detectLocation(transcript),
          mood: this.extractMood(transcript),
          satisfaction_level: this.extractSatisfaction(transcript),
          time_of_day: this.estimateTimeOfDay(transcript)
        },
        nutritional_intent: {
          health_goal: this.extractHealthGoal(transcript),
          dietary_preference: this.detectDietaryIntent(transcript),
          portion_awareness: this.extractPortionAwareness(transcript)
        },
        semantic_tags: this.generateSemanticTags(transcript),
        processing_metadata: {
          transcript_confidence: 0.9,
          food_extraction_confidence: 0.8,
          context_understanding: 0.85
        }
      };
      
      return analysis;
      
    } catch (error) {
      console.error('Semantic analysis error:', error);
      throw new Error('Failed to analyze transcript meaning');
    }
  }
  
  // Helper methods for semantic extraction
  private extractMainFood(transcript: string): string {
    const foodWords = ['rice', 'salad', 'chicken', 'oatmeal', 'sandwich', 'coffee', 'stir-fry'];
    for (const food of foodWords) {
      if (transcript.toLowerCase().includes(food)) {
        return food;
      }
    }
    return 'mixed meal';
  }
  
  private estimateQuantity(transcript: string): number {
    if (transcript.includes('small')) return 0.5;
    if (transcript.includes('big') || transcript.includes('large')) return 1.5;
    return 1.0;
  }
  
  private estimateUnit(transcript: string): string {
    if (transcript.includes('bowl')) return 'bowl';
    if (transcript.includes('cup')) return 'cup';
    if (transcript.includes('plate')) return 'plate';
    return 'portion';
  }
  
  private extractPreparation(transcript: string): string {
    if (transcript.includes('grilled')) return 'grilled';
    if (transcript.includes('fried')) return 'fried';
    if (transcript.includes('steamed')) return 'steamed';
    return 'cooked';
  }
  
  private detectMealType(transcript: string): string {
    if (transcript.includes('breakfast') || transcript.includes('morning')) return 'breakfast';
    if (transcript.includes('lunch')) return 'lunch';
    if (transcript.includes('dinner')) return 'dinner';
    return 'snack';
  }
  
  private detectLocation(transcript: string): string {
    if (transcript.includes('work') || transcript.includes('office')) return 'work';
    if (transcript.includes('home')) return 'home';
    if (transcript.includes('restaurant')) return 'restaurant';
    return 'unknown';
  }
  
  private extractMood(transcript: string): string {
    if (transcript.includes('great') || transcript.includes('good')) return 'positive';
    if (transcript.includes('bloated') || transcript.includes('tired')) return 'uncomfortable';
    if (transcript.includes('guilty')) return 'regret';
    return 'neutral';
  }
  
  private extractSatisfaction(transcript: string): number {
    if (transcript.includes('very satisfied') || transcript.includes('full')) return 0.9;
    if (transcript.includes('satisfied')) return 0.7;
    if (transcript.includes('still hungry')) return 0.3;
    return 0.6;
  }
  
  private estimateTimeOfDay(transcript: string): string {
    if (transcript.includes('morning')) return 'morning';
    if (transcript.includes('lunch')) return 'afternoon';
    if (transcript.includes('dinner') || transcript.includes('evening')) return 'evening';
    return 'unknown';
  }
  
  private extractHealthGoal(transcript: string): string {
    if (transcript.includes('healthier') || transcript.includes('healthy')) return 'eat_healthier';
    if (transcript.includes('weight') || transcript.includes('lose')) return 'weight_management';
    if (transcript.includes('energy')) return 'increase_energy';
    return 'maintenance';
  }
  
  private detectDietaryIntent(transcript: string): string {
    if (transcript.includes('vegan') || transcript.includes('plant')) return 'plant_based';
    if (transcript.includes('protein')) return 'high_protein';
    if (transcript.includes('carb')) return 'carb_conscious';
    return 'balanced';
  }
  
  private extractPortionAwareness(transcript: string): string {
    if (transcript.includes('too much') || transcript.includes('overate')) return 'overate';
    if (transcript.includes('small') || transcript.includes('light')) return 'mindful';
    if (transcript.includes('just right')) return 'appropriate';
    return 'unaware';
  }
  
  private generateSemanticTags(transcript: string): string[] {
    const tags: string[] = [];
    
    if (transcript.includes('quick') || transcript.includes('grab')) tags.push('convenience');
    if (transcript.includes('home') || transcript.includes('made')) tags.push('home_cooked');
    if (transcript.includes('trying') || transcript.includes('goal')) tags.push('intentional');
    if (transcript.includes('feeling') || transcript.includes('mood')) tags.push('emotional_context');
    if (transcript.includes('work') || transcript.includes('busy')) tags.push('time_constrained');
    
    return tags;
  }
  
  // Track voice patterns for learning
  private async trackVoicePatterns(userId: string, analysis: VoiceAnalysisResult) {
    // Track meal timing patterns
    await aiMemoryStore.trackUserPattern(
      userId,
      'eating_habit',
      `voice_${analysis.meal_context.meal_type}_${analysis.meal_context.time_of_day}`,
      { source: 'voice', mood: analysis.meal_context.mood }
    );
    
    // Track food preferences
    for (const food of analysis.foods) {
      await aiMemoryStore.trackUserPattern(
        userId,
        'preference',
        `voice_likes_${food.name}`,
        { 
          preparation: food.preparation,
          confidence: food.confidence,
          source: 'voice'
        }
      );
    }
    
    // Track health goals
    if (analysis.nutritional_intent.health_goal !== 'maintenance') {
      await aiMemoryStore.trackUserPattern(
        userId,
        'health_trend',
        analysis.nutritional_intent.health_goal,
        { source: 'voice', intent: analysis.nutritional_intent }
      );
    }
    
    // Track portion awareness
    await aiMemoryStore.trackUserPattern(
      userId,
      'eating_habit',
      `portion_${analysis.nutritional_intent.portion_awareness}`,
      { source: 'voice', satisfaction: analysis.meal_context.satisfaction_level }
    );
  }
  
  // Get voice logging insights for user
  async getVoiceInsights(userId: string): Promise<any> {
    const voicePatterns = await aiMemoryStore.getPatterns(userId);
    const voiceSpecificPatterns = voicePatterns.filter(p => 
      p.metadata.source === 'voice'
    );
    
    return {
      total_voice_logs: voiceSpecificPatterns.length,
      common_foods: this.getTopPatterns(voiceSpecificPatterns, 'preference'),
      eating_habits: this.getTopPatterns(voiceSpecificPatterns, 'eating_habit'),
      health_trends: this.getTopPatterns(voiceSpecificPatterns, 'health_trend'),
      voice_accuracy: this.calculateVoiceAccuracy(voiceSpecificPatterns)
    };
  }
  
  private getTopPatterns(patterns: any[], type: string) {
    return patterns
      .filter(p => p.patternType === type)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)
      .map(p => ({ pattern: p.pattern, frequency: p.frequency }));
  }
  
  private calculateVoiceAccuracy(patterns: any[]) {
    if (patterns.length === 0) return 0;
    const avgConfidence = patterns.reduce((sum, p) => sum + (p.confidence || 0.5), 0) / patterns.length;
    return Math.round(avgConfidence * 100);
  }
}

export const voiceSemanticMapping = new VoiceSemanticMapping();