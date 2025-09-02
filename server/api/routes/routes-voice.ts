import type { Express } from "express";
import { verifyJWT, type AuthenticatedRequest } from "../../infrastructure/auth/authService";
import { OpenAIManager } from "../../integrations/openai/openai-manager";
import { parseVoiceFoodInput } from './voice-logging';

export async function registerVoiceRoutes(app: Express) {
  const { logger } = await import("../../infrastructure/monitoring/logging/logger");
  const { secureErrorResponse } = await import("../../infrastructure/security/security");

  // Voice assistant endpoint
  app.post('/api/voice-assistant', verifyJWT, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { message, conversationHistory = [] } = req.body;
      if (!message?.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Build conversation context for the AI
      const systemPrompt = `You are Nutri, a friendly and knowledgeable nutrition assistant. You help users with:
      - Nutrition information and food facts
      - Meal planning and recipe suggestions
      - Dietary advice and healthy eating tips
      - Food safety and storage information
      - Understanding nutrition labels
      - Weight management guidance
      
      Respond in a conversational, warm, and encouraging tone. Keep responses concise but informative (2-3 sentences max). 
      Focus on practical, actionable advice. If asked about medical conditions, remind users to consult healthcare professionals.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-4).map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      if (!OpenAIManager.isAvailable()) {
        return res.status(503).json({ error: 'Voice assistant is temporarily unavailable. AI services are not configured.' });
      }
      
      const openai = await OpenAIManager.getInstance();
      const completion = await openai.chat.completions.create({
        model: 'gpt-5', // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages,
        max_completion_tokens: 200,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      // Voice sessions are unlimited in development mode
      // Token consumption disabled for development

      res.json({ response });
    } catch (error) {
      logger.error('Voice assistant error', error, req);
      res.status(500).json(secureErrorResponse(error, req));
    }
  });

  // Voice food parsing endpoint
  app.post('/api/voice-food-parsing', verifyJWT, parseVoiceFoodInput);
}