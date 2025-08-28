/**
 * Professional Recipe Chatbot API Routes
 * Handles conversational recipe generation with global cuisine knowledge
 */

import { Router } from 'express';
import { recipeChatbot, type RecipeRequest } from './recipe-chatbot';
import { isAuthenticated } from './replitAuth';

const router = Router();

// Generate chatbot response for recipe requests
router.post('/api/chatbot/recipe', isAuthenticated, async (req, res) => {
  try {
    const { message, preferences, context, conversationId } = req.body;
    
    if (!message || !preferences) {
      return res.status(400).json({
        error: 'Message and preferences are required'
      });
    }

    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const request: RecipeRequest = {
      userId,
      conversationId: conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      preferences: {
        cuisines: preferences.cuisines || ['international'],
        dietaryRestrictions: preferences.dietaryRestrictions || [],
        allergies: preferences.allergies || [],
        skillLevel: preferences.skillLevel || 'intermediate',
        cookingTime: preferences.cookingTime || 60,
        servings: preferences.servings || 4,
        ingredients: preferences.ingredients || [],
        equipment: preferences.equipment || []
      },
      context: context || {}
    };

    const result = await recipeChatbot.generateResponse(request, message);

    res.json({
      success: true,
      conversationId: request.conversationId,
      response: result.response,
      recipes: result.recipes || [],
      suggestions: result.suggestions || [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      error: 'I apologize, but I\'m experiencing technical difficulties. Please try your request again, or contact support if the issue persists.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get cuisine information
router.get('/api/chatbot/cuisine/:cuisine', isAuthenticated, async (req, res) => {
  try {
    const { cuisine } = req.params;
    const userId = req.user?.claims?.sub;

    const dummyRequest: RecipeRequest = {
      userId: userId || 'anonymous',
      conversationId: `info_${Date.now()}`,
      preferences: {
        cuisines: [cuisine],
        dietaryRestrictions: [],
        allergies: [],
        skillLevel: 'intermediate',
        cookingTime: 60,
        servings: 4
      }
    };

    const result = await recipeChatbot.generateResponse(dummyRequest, `Tell me about ${cuisine} cuisine`);

    res.json({
      success: true,
      cuisine,
      information: result.response,
      suggestions: result.suggestions || []
    });

  } catch (error: any) {
    console.error('Cuisine info error:', error);
    res.status(500).json({
      error: 'Unable to retrieve cuisine information at this time'
    });
  }
});

// Get cooking advice
router.post('/api/chatbot/advice', isAuthenticated, async (req, res) => {
  try {
    const { topic, context } = req.body;
    const userId = req.user?.claims?.sub;

    if (!topic) {
      return res.status(400).json({
        error: 'Topic is required for cooking advice'
      });
    }

    const dummyRequest: RecipeRequest = {
      userId: userId || 'anonymous',
      conversationId: `advice_${Date.now()}`,
      preferences: {
        cuisines: ['international'],
        dietaryRestrictions: [],
        allergies: [],
        skillLevel: context?.skillLevel || 'intermediate',
        cookingTime: 60,
        servings: 4
      },
      context: context || {}
    };

    const result = await recipeChatbot.generateResponse(dummyRequest, `I need cooking advice about: ${topic}`);

    res.json({
      success: true,
      topic,
      advice: result.response,
      suggestions: result.suggestions || []
    });

  } catch (error: any) {
    console.error('Cooking advice error:', error);
    res.status(500).json({
      error: 'Unable to provide cooking advice at this time'
    });
  }
});

// Get ingredient guidance
router.post('/api/chatbot/ingredients', isAuthenticated, async (req, res) => {
  try {
    const { ingredients, question } = req.body;
    const userId = req.user?.claims?.sub;

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        error: 'Ingredients array is required'
      });
    }

    const dummyRequest: RecipeRequest = {
      userId: userId || 'anonymous',
      conversationId: `ingredients_${Date.now()}`,
      preferences: {
        cuisines: ['international'],
        dietaryRestrictions: [],
        allergies: [],
        skillLevel: 'intermediate',
        cookingTime: 60,
        servings: 4,
        ingredients
      }
    };

    const message = question || `Tell me about these ingredients: ${ingredients.join(', ')}`;
    const result = await recipeChatbot.generateResponse(dummyRequest, message);

    res.json({
      success: true,
      ingredients,
      guidance: result.response,
      suggestions: result.suggestions || []
    });

  } catch (error: any) {
    console.error('Ingredient guidance error:', error);
    res.status(500).json({
      error: 'Unable to provide ingredient guidance at this time'
    });
  }
});

// List available cuisines with authentic information
router.get('/api/chatbot/cuisines', async (req, res) => {
  try {
    const availableCuisines = [
      {
        name: 'Italian',
        key: 'italian',
        description: 'Authentic Italian cuisine emphasizing fresh ingredients and traditional techniques',
        regions: ['Northern Italy', 'Central Italy', 'Southern Italy'],
        popularDishes: ['Pasta', 'Risotto', 'Pizza Napoletana', 'Osso Buco']
      },
      {
        name: 'Japanese',
        key: 'japanese',
        description: 'Traditional Japanese cooking focusing on seasonal ingredients and precise techniques',
        regions: ['Kanto', 'Kansai', 'Kyushu', 'Hokkaido'],
        popularDishes: ['Sushi', 'Ramen', 'Tempura', 'Kaiseki']
      },
      {
        name: 'Indian',
        key: 'indian',
        description: 'Rich and diverse Indian cuisine with complex spice blends and regional variations',
        regions: ['North Indian', 'South Indian', 'Bengali', 'Punjabi'],
        popularDishes: ['Curry', 'Biryani', 'Tandoori', 'Dosa']
      },
      {
        name: 'Mexican',
        key: 'mexican',
        description: 'Authentic Mexican cuisine featuring traditional techniques and indigenous ingredients',
        regions: ['Oaxaca', 'Yucatan', 'Puebla', 'Jalisco'],
        popularDishes: ['Mole', 'Tacos', 'Pozole', 'Cochinita Pibil']
      },
      {
        name: 'Thai',
        key: 'thai',
        description: 'Thai cuisine balancing sweet, sour, salty, and spicy flavors',
        regions: ['Northern', 'Central', 'Southern', 'Northeastern'],
        popularDishes: ['Tom Yum', 'Green Curry', 'Pad Thai', 'Som Tam']
      },
      {
        name: 'French',
        key: 'french',
        description: 'Classic French cuisine emphasizing technique and quality ingredients',
        regions: ['Provence', 'Normandy', 'Burgundy', 'Alsace'],
        popularDishes: ['Coq au Vin', 'Bouillabaisse', 'Ratatouille', 'Confit']
      },
      {
        name: 'Middle Eastern',
        key: 'middle_eastern',
        description: 'Traditional Middle Eastern cuisine with ancient cooking methods',
        regions: ['Levantine', 'Persian', 'Turkish', 'Moroccan'],
        popularDishes: ['Hummus', 'Kebab', 'Tagine', 'Pilaf']
      },
      {
        name: 'Chinese',
        key: 'chinese',
        description: 'Diverse Chinese cuisine with regional specialties and traditional techniques',
        regions: ['Cantonese', 'Sichuan', 'Hunan', 'Beijing'],
        popularDishes: ['Dim Sum', 'Kung Pao', 'Peking Duck', 'Hot Pot']
      }
    ];

    res.json({
      success: true,
      cuisines: availableCuisines
    });

  } catch (error: any) {
    console.error('Cuisines list error:', error);
    res.status(500).json({
      error: 'Unable to retrieve cuisine information'
    });
  }
});

export { router as chatbotRoutes };