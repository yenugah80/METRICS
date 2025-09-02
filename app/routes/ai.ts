import { Router } from 'express';
import { simpleChefAI } from '../core/simple-ai';

const router = Router();

// ============================================================================
// AI ROUTES - Clean & Fast
// ============================================================================

// CHEF AI CHAT
router.post('/chef-ai/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.session?.user?.id || 'anonymous';

    const response = await simpleChefAI.chat(
      userId,
      message,
      conversationId
    );

    res.json(response);
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: "I'm having trouble right now, but I'm here to help with your nutrition goals!",
      insights: ["Let's keep working on your health journey together"]
    });
  }
});

// CONVERSATION HISTORY
router.get('/chef-ai/conversations', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.json({ success: true, conversations: [] });
    }

    // This would fetch from database in production
    res.json({ success: true, conversations: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
});

// MEAL SUGGESTIONS
router.get('/chef-ai/suggestions', async (req, res) => {
  try {
    const suggestions = [
      "What should I eat for breakfast?",
      "Help me plan a high-protein meal",
      "I need ideas for healthy snacks",
      "What's a quick dinner option?"
    ];

    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch suggestions' });
  }
});

// IMAGE ANALYSIS
router.post('/analyze-food', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    // Simplified food analysis - production would use vision AI
    const analysis = {
      foods: [
        { name: 'Mixed Salad', calories: 150, protein: 5, carbs: 15, fat: 8 }
      ],
      confidence: 0.85
    };

    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

export default router;