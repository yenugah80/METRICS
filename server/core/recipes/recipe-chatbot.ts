/**
 * Professional Recipe Chatbot with Global Cuisine Knowledge
 * Real-world recipe generation using authentic culinary data
 */

import { OpenAIManager } from '../../integrations/openai/openai-manager';
import { searchFoodInDatabase } from '../nutrition/comprehensive-food-database';

export interface ChatbotMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  messageId: string;
}

export interface RecipeRequest {
  userId: string;
  conversationId: string;
  preferences: {
    cuisines: string[];
    dietaryRestrictions: string[];
    allergies: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    cookingTime: number; // minutes
    servings: number;
    ingredients?: string[]; // ingredients they have
    equipment?: string[]; // available cooking equipment
  };
  context?: {
    occasion?: string; // dinner party, quick lunch, etc.
    mood?: string; // comfort food, healthy, indulgent, etc.
    season?: string; // spring, summer, fall, winter
    budget?: 'low' | 'medium' | 'high';
  };
}

export interface GlobalCuisineKnowledge {
  region: string;
  country: string;
  authenticTechniques: string[];
  stapleIngredients: string[];
  commonSpices: string[];
  traditionalEquipment: string[];
  culturalContext: string;
  seasonalConsiderations: string[];
}

// Comprehensive global cuisine database with authentic culinary knowledge
const GLOBAL_CUISINE_DATABASE: Record<string, GlobalCuisineKnowledge> = {
  'italian': {
    region: 'Southern Europe',
    country: 'Italy',
    authenticTechniques: ['al dente pasta cooking', 'soffritto base', 'slow simmering', 'wood-fired cooking', 'fresh herb finishing'],
    stapleIngredients: ['extra virgin olive oil', 'san marzano tomatoes', 'parmigiano reggiano', 'fresh basil', 'garlic', 'pancetta', 'arborio rice'],
    commonSpices: ['oregano', 'rosemary', 'sage', 'thyme', 'black pepper', 'sea salt', 'red pepper flakes'],
    traditionalEquipment: ['pasta machine', 'wooden spoon', 'mortar and pestle', 'pizza stone', 'risotto pan'],
    culturalContext: 'Italian cuisine emphasizes high-quality, fresh ingredients with minimal processing. Regional variations are significant, from Northern dairy-rich dishes to Southern tomato-based cuisine.',
    seasonalConsiderations: ['spring artichokes', 'summer tomatoes', 'fall mushrooms', 'winter citrus']
  },
  'japanese': {
    region: 'East Asia',
    country: 'Japan',
    authenticTechniques: ['dashi preparation', 'knife skills', 'umami balancing', 'seasonal presentation', 'precise timing'],
    stapleIngredients: ['soy sauce', 'miso paste', 'kombu seaweed', 'bonito flakes', 'sake', 'mirin', 'rice vinegar', 'short-grain rice'],
    commonSpices: ['wasabi', 'ginger', 'sesame seeds', 'shichimi togarashi', 'yuzu zest'],
    traditionalEquipment: ['santoku knife', 'bamboo steamer', 'rice cooker', 'chopsticks', 'ceramic bowls'],
    culturalContext: 'Japanese cuisine emphasizes harmony, balance, and seasonal ingredients. The concept of umami and visual presentation are fundamental.',
    seasonalConsiderations: ['spring bamboo shoots', 'summer cucumber', 'fall persimmons', 'winter daikon radish']
  },
  'indian': {
    region: 'South Asia',
    country: 'India',
    authenticTechniques: ['spice tempering (tadka)', 'layered cooking', 'yogurt marination', 'slow braising', 'tandoor cooking'],
    stapleIngredients: ['basmati rice', 'ghee', 'onions', 'tomatoes', 'yogurt', 'lentils', 'coconut', 'tamarind'],
    commonSpices: ['turmeric', 'cumin', 'coriander', 'cardamom', 'cinnamon', 'cloves', 'fenugreek', 'mustard seeds', 'curry leaves'],
    traditionalEquipment: ['pressure cooker', 'tawa griddle', 'mortar and pestle', 'tandoor oven', 'kadai wok'],
    culturalContext: 'Indian cuisine varies dramatically by region, with complex spice blends and cooking techniques developed over millennia. Vegetarian traditions are deeply rooted.',
    seasonalConsiderations: ['monsoon gourds', 'winter root vegetables', 'summer cooling dishes', 'festival specialties']
  },
  'mexican': {
    region: 'North America',
    country: 'Mexico',
    authenticTechniques: ['masa preparation', 'chili roasting', 'slow braising', 'charcoal grilling', 'mole preparation'],
    stapleIngredients: ['corn masa', 'dried chiles', 'beans', 'tomatoes', 'onions', 'garlic', 'lime', 'avocado', 'cilantro'],
    commonSpices: ['cumin', 'oregano', 'paprika', 'cinnamon', 'cloves', 'epazote'],
    traditionalEquipment: ['comal griddle', 'molcajete mortar', 'clay pots', 'tortilla press'],
    culturalContext: 'Mexican cuisine reflects indigenous, Spanish, and other influences. Regional specialties are distinct, from Oaxacan moles to Yucatecan cochinita pibil.',
    seasonalConsiderations: ['rainy season corn', 'dry season preserved chiles', 'coastal seafood seasons']
  },
  'thai': {
    region: 'Southeast Asia',
    country: 'Thailand',
    authenticTechniques: ['balance of flavors', 'quick stir-frying', 'curry paste making', 'som tam pounding', 'coconut extraction'],
    stapleIngredients: ['coconut milk', 'fish sauce', 'tamarind paste', 'palm sugar', 'Thai basil', 'lemongrass', 'galangal', 'kaffir lime leaves'],
    commonSpices: ['Thai chilies', 'white pepper', 'coriander seeds', 'cardamom'],
    traditionalEquipment: ['wok', 'mortar and pestle', 'coconut grater', 'bamboo steamer'],
    culturalContext: 'Thai cuisine balances sweet, sour, salty, and spicy flavors. Regional variations include Northern khao soi and Southern curries.',
    seasonalConsiderations: ['hot season fruits', 'rainy season vegetables', 'cool season herbs']
  },
  'french': {
    region: 'Western Europe',
    country: 'France',
    authenticTechniques: ['mother sauces', 'knife skills', 'braising', 'confit', 'precise timing', 'clarification'],
    stapleIngredients: ['butter', 'cream', 'wine', 'herbs de provence', 'shallots', 'mushrooms', 'cheese'],
    commonSpices: ['herbes de provence', 'bay leaves', 'thyme', 'tarragon', 'chervil'],
    traditionalEquipment: ['copper pots', 'mandoline', 'ramekins', 'chef\'s knife', 'whisk'],
    culturalContext: 'French cuisine emphasizes technique, quality ingredients, and culinary tradition. Regional specialties range from Provençal to Normandy styles.',
    seasonalConsiderations: ['spring asparagus', 'summer stone fruits', 'fall game season', 'winter preserves']
  },
  'middle_eastern': {
    region: 'Middle East',
    country: 'Various (Lebanon, Iran, Turkey, etc.)',
    authenticTechniques: ['spice grinding', 'yogurt straining', 'rice pilaf', 'kebab grilling', 'phyllo handling'],
    stapleIngredients: ['olive oil', 'tahini', 'bulgur', 'lamb', 'yogurt', 'lemon', 'pomegranate', 'nuts', 'dates'],
    commonSpices: ['za\'atar', 'sumac', 'baharat', 'cardamom', 'cinnamon', 'allspice'],
    traditionalEquipment: ['mortar and pestle', 'tagine', 'grill', 'rice pot'],
    culturalContext: 'Middle Eastern cuisine emphasizes hospitality, shared meals, and ancient cooking traditions with Persian, Arab, and Turkish influences.',
    seasonalConsiderations: ['spring herbs', 'summer vegetables', 'fall nuts and dates', 'winter preserves']
  },
  'chinese': {
    region: 'East Asia',
    country: 'China',
    authenticTechniques: ['wok hei (breath of wok)', 'steaming', 'red cooking', 'velvet marinating', 'tea smoking'],
    stapleIngredients: ['soy sauce', 'rice wine', 'sesame oil', 'ginger', 'scallions', 'garlic', 'star anise'],
    commonSpices: ['five-spice powder', 'Sichuan peppercorns', 'white pepper', 'fermented black beans'],
    traditionalEquipment: ['wok', 'bamboo steamer', 'cleaver', 'chopsticks', 'clay pot'],
    culturalContext: 'Chinese cuisine varies by region (Cantonese, Sichuan, Hunan, etc.) with emphasis on balance, texture, and medicinal properties of food.',
    seasonalConsiderations: ['spring vegetables', 'summer cooling foods', 'fall nourishing soups', 'winter warming dishes']
  }
};

// Professional recipe chatbot with global knowledge
export class RecipeChatbot {
  private conversationHistory: Map<string, ChatbotMessage[]> = new Map();

  async generateResponse(request: RecipeRequest, userMessage: string): Promise<{
    response: string;
    recipes?: any[];
    suggestions?: string[];
  }> {
    const conversation = this.getConversation(request.conversationId);
    
    // Add user message to conversation
    conversation.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      messageId: this.generateMessageId()
    });

    // Analyze user intent and generate appropriate response
    const intent = await this.analyzeUserIntent(userMessage, request);
    
    let response: string;
    let recipes: any[] = [];
    let suggestions: string[] = [];

    switch (intent.type) {
      case 'recipe_request':
        const recipeResult = await this.generateRecipes(request, intent.details);
        response = recipeResult.message;
        recipes = recipeResult.recipes;
        suggestions = recipeResult.suggestions;
        break;
      
      case 'cuisine_info':
        response = await this.provideCuisineInformation(intent.cuisine || 'general');
        break;
      
      case 'cooking_advice':
        response = await this.provideCookingAdvice(intent.topic || 'general', request.preferences);
        break;
      
      case 'ingredient_help':
        response = await this.provideIngredientGuidance(intent.ingredients || []);
        break;
      
      default:
        response = await this.generateGeneralResponse(userMessage, request);
        break;
    }

    // Add assistant response to conversation
    conversation.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      messageId: this.generateMessageId()
    });

    this.conversationHistory.set(request.conversationId, conversation);

    return { response, recipes, suggestions };
  }

  private async analyzeUserIntent(message: string, request: RecipeRequest): Promise<{
    type: 'recipe_request' | 'cuisine_info' | 'cooking_advice' | 'ingredient_help' | 'general';
    details?: any;
    cuisine?: string;
    topic?: string;
    ingredients?: string[];
  }> {
    // Pre-process message to identify specific dishes and their cuisines
    const dishToCuisineMap: Record<string, string> = {
      'biryani': 'indian',
      'curry': 'indian', 
      'tandoori': 'indian',
      'naan': 'indian',
      'dal': 'indian',
      'samosa': 'indian',
      'masala': 'indian',
      'pasta': 'italian',
      'pizza': 'italian',
      'risotto': 'italian',
      'ramen': 'japanese',
      'sushi': 'japanese',
      'tempura': 'japanese',
      'tacos': 'mexican',
      'burrito': 'mexican',
      'paella': 'spanish',
      'pad thai': 'thai',
      'pho': 'vietnamese',
      'dim sum': 'chinese',
      'couscous': 'moroccan'
    };
    
    const lowerMessage = message.toLowerCase();
    let detectedCuisine = '';
    
    for (const [dish, cuisine] of Object.entries(dishToCuisineMap)) {
      if (lowerMessage.includes(dish)) {
        detectedCuisine = cuisine;
        break;
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert culinary AI that analyzes user cooking requests. Classify the user's intent and extract relevant details.

Categories:
- recipe_request: User wants specific recipes
- cuisine_info: User asks about cuisine history, techniques, or culture  
- cooking_advice: User needs cooking tips, techniques, or troubleshooting
- ingredient_help: User asks about ingredients, substitutions, or storage
- general: Casual conversation or unclear intent

IMPORTANT: When identifying cuisine, use these mappings:
- biryani, curry, tandoori, naan, dal, samosa, masala → "indian"
- pasta, pizza, risotto → "italian" 
- ramen, sushi, tempura → "japanese"
- tacos, burrito → "mexican"
- paella → "spanish"
- pad thai → "thai"
- pho → "vietnamese"
- dim sum → "chinese"

Return JSON with:
{
  "type": "category",
  "details": "extracted details for recipes",
  "cuisine": "specific cuisine detected (use mappings above)", 
  "topic": "cooking topic if relevant",
  "ingredients": ["list of ingredients mentioned"]
}`
        },
        {
          role: "user",
          content: `User preferences: ${JSON.stringify(request.preferences)}
Context: ${JSON.stringify(request.context)}
Message: "${message}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || '{"type": "general"}');
      
      // Override with detected cuisine if AI missed it
      if (detectedCuisine && !result.cuisine) {
        result.cuisine = detectedCuisine;
      }
      
      return result;
    } catch {
      return { 
        type: 'general',
        cuisine: detectedCuisine || undefined
      };
    }
  }

  private async generateRecipes(request: RecipeRequest, details: any): Promise<{
    message: string;
    recipes: any[];
    suggestions: string[];
  }> {
    // Use detected cuisine from intent analysis if available
    const cuisinesToUse = details.cuisine ? [details.cuisine] : request.preferences.cuisines;
    
    // Get authentic cuisine knowledge
    const cuisineKnowledge = this.getCuisineKnowledge(cuisinesToUse);
    
    // Generate professional recipe prompt with real culinary knowledge
    const systemPrompt = `You are a professional chef and culinary expert with deep knowledge of global cuisines. Generate authentic, restaurant-quality recipes using traditional techniques and ingredients.

STRICT REQUIREMENTS:
- Only use authentic, traditional techniques and ingredients for the specified cuisine
- Provide precise cooking instructions with timing and temperatures
- Include cultural context and variations
- Never invent fake ingredients or techniques
- Ensure dietary restrictions are properly handled
- Scale recipes to exact serving sizes requested

Cuisine Knowledge Available: ${JSON.stringify(cuisineKnowledge)}`;

    const userPrompt = `Create ${request.preferences.servings} authentic recipes for:
- Cuisines: ${request.preferences.cuisines.join(', ')}
- Dietary needs: ${request.preferences.dietaryRestrictions.join(', ')}
- Allergies: ${request.preferences.allergies.join(', ')}
- Skill level: ${request.preferences.skillLevel}
- Time limit: ${request.preferences.cookingTime} minutes
- Available ingredients: ${request.preferences.ingredients?.join(', ') || 'none specified'}
- Occasion: ${request.context?.occasion || 'general cooking'}
- Mood: ${request.context?.mood || 'balanced'}

Requirements: ${details}

Return JSON with:
{
  "message": "Professional, friendly response explaining the recipes",
  "recipes": [
    {
      "name": "Authentic recipe name",
      "cuisine": "Specific cuisine",
      "description": "Cultural context and appeal",
      "servings": ${request.preferences.servings},
      "cookTime": 0,
      "prepTime": 0,
      "difficulty": "${request.preferences.skillLevel}",
      "ingredients": [
        {
          "item": "Authentic ingredient name",
          "amount": "Precise amount",
          "notes": "Selection tips or cultural notes"
        }
      ],
      "instructions": [
        "Detailed step with timing and technique explanation"
      ],
      "techniques": ["Traditional techniques used"],
      "culturalNotes": "Authentic background and variations",
      "nutrition": {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0
      }
    }
  ],
  "suggestions": ["Related authentic dishes or cooking tips"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 3000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate that we have real recipes
      if (!result.recipes || result.recipes.length === 0) {
        throw new Error('No authentic recipes generated');
      }

      return {
        message: result.message || "I've created some authentic recipes for you based on traditional techniques and ingredients.",
        recipes: result.recipes,
        suggestions: result.suggestions || []
      };

    } catch (error) {
      console.error('Recipe generation error:', error);
      
      // Instead of mock data, provide helpful guidance
      return {
        message: "I'm having trouble accessing my culinary database right now. Let me suggest some authentic cooking approaches based on your preferences instead. Would you like me to recommend traditional techniques for your chosen cuisine, or help you work with specific ingredients you have on hand?",
        recipes: [],
        suggestions: [
          "Try browsing traditional cookbooks for your cuisine",
          "Visit local specialty markets for authentic ingredients", 
          "Consider taking a cooking class for hands-on learning"
        ]
      };
    }
  }

  private async provideCuisineInformation(cuisine: string): Promise<string> {
    const knowledge = GLOBAL_CUISINE_DATABASE[cuisine.toLowerCase()];
    
    if (!knowledge) {
      return `I'd be happy to share information about ${cuisine} cuisine! While I don't have detailed information about this specific cuisine in my current database, I can help you learn about its techniques, ingredients, and cultural significance. What specific aspect interests you most?`;
    }

    return `${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} cuisine is truly fascinating! 

**Cultural Background**: ${knowledge.culturalContext}

**Authentic Techniques**: The foundation of this cuisine includes ${knowledge.authenticTechniques.join(', ')}. These techniques have been perfected over generations and create the distinctive flavors and textures.

**Essential Ingredients**: Traditional cooks rely on ${knowledge.stapleIngredients.join(', ')}. These ingredients form the backbone of authentic dishes.

**Signature Spices**: The flavor profile comes from ${knowledge.commonSpices.join(', ')}, each contributing to the complex taste layers.

**Traditional Equipment**: Authentic preparation often uses ${knowledge.traditionalEquipment.join(', ')}, which helps achieve the proper textures and cooking results.

**Seasonal Cooking**: This cuisine celebrates ${knowledge.seasonalConsiderations.join(', ')}, reflecting the natural rhythm of ingredients.

Would you like me to suggest some authentic recipes from this cuisine, or would you prefer to learn about specific techniques?`;
  }

  private async provideCookingAdvice(topic: string, preferences: any): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional chef providing authentic cooking advice. Give practical, real-world guidance based on culinary science and traditional techniques. Never provide generic or made-up advice."
        },
        {
          role: "user", 
          content: `Provide cooking advice about: ${topic}
User preferences: ${JSON.stringify(preferences)}
Focus on authentic techniques and real culinary science.`
        }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    return response.choices[0].message.content || "I'd be happy to help with your cooking question! Could you provide more specific details about what you'd like to learn?";
  }

  private async provideIngredientGuidance(ingredients: string[]): Promise<string> {
    // Use our comprehensive food database for real ingredient information
    const ingredientInfo = ingredients.map(ingredient => {
      const data = searchFoodInDatabase(ingredient);
      return { name: ingredient, data };
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a culinary expert providing ingredient guidance. Use real nutritional data and authentic culinary knowledge. Provide practical selection, storage, and preparation tips."
        },
        {
          role: "user",
          content: `Provide guidance about these ingredients: ${ingredients.join(', ')}
Available nutrition data: ${JSON.stringify(ingredientInfo)}
Include selection tips, storage methods, preparation techniques, and flavor profiles.`
        }
      ],
      temperature: 0.4,
      max_tokens: 800
    });

    return response.choices[0].message.content || "I'd be happy to help you with ingredient selection and preparation techniques!";
  }

  private async generateGeneralResponse(message: string, request: RecipeRequest): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional yet friendly culinary expert. Engage naturally about cooking, food, and recipes. Offer helpful suggestions and maintain enthusiasm for authentic cooking."
        },
        {
          role: "user",
          content: `User message: "${message}"
User preferences: ${JSON.stringify(request.preferences)}
Respond professionally but warmly, and guide toward helpful culinary topics.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || "I'm here to help with all your cooking questions and recipe needs! What would you like to explore today?";
  }

  private getCuisineKnowledge(cuisines: string[]): GlobalCuisineKnowledge[] {
    return cuisines.map(cuisine => 
      GLOBAL_CUISINE_DATABASE[cuisine.toLowerCase()]
    ).filter(Boolean);
  }

  private getConversation(conversationId: string): ChatbotMessage[] {
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    return this.conversationHistory.get(conversationId)!;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const recipeChatbot = new RecipeChatbot();