// ============================================================================
// SIMPLE AI SERVICE - Production Grade, No Bloat
// ============================================================================

import OpenAI from 'openai';
import { db } from './database';
import { chefAiConversations, chefAiMessages } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 5000,
  maxRetries: 0
});

export class SimpleChefAI {
  async chat(userId: string, message: string, conversationId?: string) {
    const startTime = Date.now();
    
    try {
      // Create or get conversation
      if (!conversationId) {
        conversationId = uuidv4();
        await db.insert(chefAiConversations).values({
          id: conversationId,
          userId,
          title: message.slice(0, 50) + '...'
        });
      }

      // Save user message
      await db.insert(chefAiMessages).values({
        conversationId,
        role: 'user',
        content: message,
        sentiment: this.detectSentiment(message)
      });

      // Get AI response
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful nutrition coach. Provide practical, actionable advice about food and nutrition. Keep responses concise and encouraging.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const responseMessage = aiResponse.choices[0]?.message?.content || "I'm here to help with your nutrition goals!";

      // Save AI response
      await db.insert(chefAiMessages).values({
        conversationId,
        role: 'assistant',
        content: responseMessage
      });

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        conversationId,
        message: responseMessage,
        suggestions: [],
        insights: ["Let's keep working on your health goals together"],
        followUpQuestions: ["What would you like to know about nutrition?"],
        responseTime,
        adaptations: {
          sentiment: this.detectSentiment(message),
          quickResponse: responseTime < 3000
        }
      };

    } catch (error) {
      console.error('AI chat error:', error);
      return {
        success: false,
        message: "I'm having trouble right now, but I'm here to help with your nutrition goals!",
        insights: ["Let's keep working on your health journey together"],
        responseTime: Date.now() - startTime
      };
    }
  }

  private detectSentiment(message: string): string {
    const frustrated = /frustrated|annoyed|angry|upset/i.test(message);
    const excited = /excited|love|amazing|great/i.test(message);
    const curious = /how|why|what|when|where/i.test(message);
    
    if (frustrated) return 'frustrated';
    if (excited) return 'excited';
    if (curious) return 'curious';
    return 'neutral';
  }
}

export const simpleChefAI = new SimpleChefAI();