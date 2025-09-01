import { Router } from 'express';
import { z } from 'zod';
import { verifyJWT, type AuthenticatedRequest } from '../../infrastructure/auth/authService';
import { chefAiService, type ChefAiChatRequest } from '../../core/chef-ai/chefAiService';

const router = Router();

// Chat message schema for validation
const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000), // Increased limit for comprehensive meal plans
  messageType: z.enum(['text', 'voice']).optional(),
  voiceTranscript: z.string().optional(),
  conversationId: z.string().nullable().optional(),
});

// Send message to ChefAI
router.post('/api/chef-ai/chat', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // ChefAI is now available to all users
    // Premium subscription checks removed for better user experience

    const validatedData = chatMessageSchema.parse(req.body);
    
    const chatRequest: ChefAiChatRequest = {
      userId,
      message: validatedData.message,
      messageType: validatedData.messageType,
      voiceTranscript: validatedData.voiceTranscript,
      conversationId: validatedData.conversationId || undefined,
    };

    const response = await chefAiService.processChat(chatRequest);
    
    res.json({
      success: true,
      ...response
    });
  } catch (error: any) {
    console.error('ChefAI chat error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid message data',
        details: error.errors
      });
    }
    res.status(500).json({
      error: 'ChefAI temporarily unavailable',
      message: 'Our nutrition coach is taking a quick break. Please try again in a moment!'
    });
  }
});

// Get conversation history
router.get('/api/chef-ai/conversations/:conversationId', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { conversationId } = req.params;
    
    const conversation = await chefAiService.getConversationWithMessages(conversationId, userId);
    
    res.json({
      success: true,
      ...conversation
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      error: 'Failed to fetch conversation'
    });
  }
});

// Get user's recent conversations
router.get('/api/chef-ai/conversations', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const conversations = await chefAiService.getUserConversations(userId);
    
    res.json({
      success: true,
      conversations
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      error: 'Failed to fetch conversations'
    });
  }
});

// Get suggested conversation starters
router.get('/api/chef-ai/suggestions', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const suggestions = await chefAiService.generateSuggestedQuestions(userId);
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      error: 'Failed to generate suggestions'
    });
  }
});

// Health check endpoint
router.get('/api/chef-ai/health', (_req, res) => {
  res.json({ 
    ok: true, 
    time: Date.now(),
    service: 'ChefAI',
    status: 'operational'
  });
});

// Delete conversation
router.delete('/api/chef-ai/conversations/:conversationId', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { conversationId } = req.params;
    
    await chefAiService.deleteConversation(conversationId, userId);
    
    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      error: 'Failed to delete conversation',
      message: 'Unable to delete conversation. Please try again.'
    });
  }
});

export default router;