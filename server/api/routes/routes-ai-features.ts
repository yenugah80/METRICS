import { Router, Request, Response } from 'express';
import { chefAiService } from '../../core/chef-ai/chefAiService';
// Temporary auth check - using session-based auth
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/ai/insights
 * Get comprehensive AI insights for the user including:
 * - Personalized nutrition insights
 * - Voice logging patterns
 * - Collaborative recommendations
 * - Learning patterns
 * - AI capabilities overview
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    const insights = await chefAiService.getAIInsights(userId);
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI insights'
    });
  }
});

/**
 * POST /api/ai/voice-input
 * Process voice input using semantic mapping
 * Body: { audioData: string (base64), format?: string }
 */
router.post('/voice-input', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const { audioData, format = 'mp3' } = req.body;
    
    if (!audioData) {
      return res.status(400).json({
        success: false,
        error: 'Audio data is required'
      });
    }
    
    const analysis = await chefAiService.processVoiceInput(audioData, userId);
    
    res.json({
      success: true,
      data: analysis,
      processing_time: Date.now(),
      voice_features: {
        semantic_mapping: true,
        mood_detection: true,
        food_extraction: true,
        pattern_learning: true
      }
    });
  } catch (error) {
    console.error('Error processing voice input:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice input'
    });
  }
});

/**
 * GET /api/ai/personalized-suggestions
 * Get personalized meal suggestions using collaborative filtering
 */
router.get('/personalized-suggestions', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const { mealType, cuisine, healthFocus } = req.query;
    
    // This would integrate with the memory store for enhanced suggestions
    const suggestions = await chefAiService.getMealSuggestions(
      userId, 
      mealType as string || 'lunch',
      cuisine as string,
      healthFocus as string,
      undefined
    );
    
    res.json({
      success: true,
      data: suggestions,
      personalization_level: 'enhanced',
      collaborative_filtering: true
    });
  } catch (error) {
    console.error('Error getting personalized suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get personalized suggestions'
    });
  }
});

/**
 * GET /api/ai/learning-patterns
 * Get user learning patterns and AI memory insights
 */
router.get('/learning-patterns', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    const insights = await chefAiService.getAIInsights(userId);
    
    res.json({
      success: true,
      data: {
        learning_patterns: insights.learning_patterns,
        personalized_insights: insights.personalized_insights,
        collaborative_suggestions: insights.collaborative_suggestions,
        ai_capabilities: insights.ai_capabilities,
        memory_stats: {
          total_patterns: insights.learning_patterns.total_patterns,
          categories: {
            eating_habits: insights.learning_patterns.eating_habits,
            preferences: insights.learning_patterns.preferences,
            health_trends: insights.learning_patterns.health_trends
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching learning patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning patterns'
    });
  }
});

/**
 * GET /api/ai/knowledge-base-stats
 * Get knowledge base statistics and RAG system info
 */
router.get('/knowledge-base-stats', async (req: Request, res: Response) => {
  try {
    const insights = await chefAiService.getAIInsights('system');
    
    res.json({
      success: true,
      data: {
        knowledge_base: insights.knowledge_base,
        ai_systems: {
          vector_memory_store: true,
          rag_system: true,
          voice_semantic_mapping: true,
          collaborative_filtering: true,
          pattern_recognition: true
        },
        features: {
          personalized_insights: true,
          voice_logging: true,
          semantic_analysis: true,
          mood_detection: true,
          habit_tracking: true,
          collaborative_recommendations: true
        }
      }
    });
  } catch (error) {
    console.error('Error fetching knowledge base stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge base statistics'
    });
  }
});

/**
 * POST /api/ai/enhanced-chat
 * Enhanced chat with RAG system
 * Body: { message: string, conversationId?: string }
 */
router.post('/enhanced-chat', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    const response = await chefAiService.generateResponse(
      message,
      userId,
      conversationId,
      []
    );
    
    res.json({
      success: true,
      data: response,
      enhanced_features: {
        rag_system: true,
        personalized_context: true,
        memory_integration: true,
        collaborative_insights: true
      }
    });
  } catch (error) {
    console.error('Error in enhanced chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process enhanced chat'
    });
  }
});

export function registerAIFeaturesRoutes(app: any) {
  app.use('/api/ai', router);
}