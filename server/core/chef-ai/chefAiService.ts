import OpenAI from 'openai';
import { db } from '../../infrastructure/database/db';
import { chefAiConversations, chefAiMessages, meals, mealItems, dailyNutrition, users } from '@shared/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChefAiChatRequest {
  userId: string;
  message: string;
  messageType?: 'text' | 'voice';
  voiceTranscript?: string;
  conversationId?: string | null;
}

export interface ChefAiChatResponse {
  conversationId: string;
  message: string;
  recipeDetails?: {
    recipeName: string;
    servings: number;
    prepTime: string;
    cookTime: string;
    ingredients: Array<{
      item: string;
      amount: string;
      calories: number;
      protein: number;
    }>;
    instructions: string[];
    nutritionPerServing: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
  };
  mealCards?: Array<{
    mealId: string;
    mealName: string;
    calories: number;
    nutritionSummary: string;
  }>;
  insights?: string[];
  followUpQuestions?: string[];
}

export interface NutritionContext {
  recentMeals: any[];
  dailyTotals: any;
  weeklyTrends: any;
  userGoals: any;
  dietPlan?: any;
}

export class ChefAiService {
  // Main chat interaction handler
  async processChat(request: ChefAiChatRequest): Promise<ChefAiChatResponse> {
    try {
      // Get or create conversation
      let conversationId = request.conversationId;
      if (!conversationId) {
        conversationId = await this.createNewConversation(request.userId, request.message);
      }

      // Gather nutrition context for the user
      const context = await this.gatherNutritionContext(request.userId);
      
      // Get conversation history for context
      const history = await this.getConversationHistory(conversationId, 10);
      
      // Generate AI response with nutrition context
      const aiResponse = await this.generateContextualResponse(
        request.message, 
        context, 
        history,
        request.userId
      );

      // Save user message
      await db.insert(chefAiMessages).values({
        conversationId,
        role: 'user',
        content: request.message,
        messageType: request.messageType || 'text',
        voiceTranscript: request.voiceTranscript,
      });

      // Save AI response
      await db.insert(chefAiMessages).values({
        conversationId,
        role: 'assistant',
        content: aiResponse.response,
        messageType: 'text',
        relatedMealIds: aiResponse.mealCards?.map((card: any) => card.mealId) || [],
        nutritionContext: {
          timeframe: aiResponse.timeframe,
          metrics: aiResponse.metrics,
          insights: aiResponse.insights,
        },
        tokensUsed: aiResponse.tokensUsed,
        responseTime: aiResponse.responseTime,
        confidence: aiResponse.confidence,
      });

      // Update conversation metadata
      await db.update(chefAiConversations)
        .set({
          lastInteractionAt: new Date(),
          messageCount: history.length + 2, // +2 for user message and AI response
          updatedAt: new Date(),
        })
        .where(eq(chefAiConversations.id, conversationId));

      return {
        conversationId,
        message: aiResponse.response,
        recipeDetails: aiResponse.recipeDetails,
        mealCards: aiResponse.mealCards,
        insights: aiResponse.insights,
        followUpQuestions: aiResponse.followUpQuestions,
      };
    } catch (error: any) {
      console.error('ChefAI service error:', {
        message: error.message,
        stack: error.stack,
        userId: request.userId,
        conversationId: request.conversationId,
        timestamp: new Date().toISOString()
      });
      
      // Provide specific error details for debugging
      if (error.message?.includes('API key')) {
        throw new Error('OpenAI API configuration error');
      } else if (error.message?.includes('rate limit')) {
        throw new Error('AI service is busy, please try again in a moment');
      } else if (error.message?.includes('timeout')) {
        throw new Error('AI response took too long, please try again');
      } else {
        throw new Error(`AI processing failed: ${error.message}`);
      }
    }
  }

  // Create new conversation
  private async createNewConversation(userId: string, firstMessage: string): Promise<string> {
    const title = firstMessage.length > 50 ? 
      firstMessage.substring(0, 50) + '...' : 
      firstMessage;

    const [conversation] = await db.insert(chefAiConversations).values({
      userId,
      title,
      context: this.detectContext(firstMessage),
      lastInteractionAt: new Date(),
    }).returning();

    return conversation.id;
  }

  // Detect conversation context from user message
  private detectContext(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('versus')) {
      return 'comparison';
    } else if (lowerMessage.includes('week') || lowerMessage.includes('month') || lowerMessage.includes('trend')) {
      return 'timeline';
    } else if (lowerMessage.includes('meal') || lowerMessage.includes('food') || lowerMessage.includes('ate')) {
      return 'meal_analysis';
    }
    
    return 'general';
  }

  // Gather comprehensive nutrition context for AI
  private async gatherNutritionContext(userId: string): Promise<NutritionContext> {
    // Get recent meals (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentMeals = await db.select({
      id: meals.id,
      name: meals.name,
      mealType: meals.mealType,
      totalCalories: meals.totalCalories,
      totalProtein: meals.totalProtein,
      totalCarbs: meals.totalCarbs,
      totalFat: meals.totalFat,
      nutritionScore: meals.nutritionScore,
      sustainabilityScore: meals.sustainabilityScore,
      loggedAt: meals.loggedAt,
    })
    .from(meals)
    .where(and(
      eq(meals.userId, userId),
      gte(meals.loggedAt, sevenDaysAgo)
    ))
    .orderBy(desc(meals.loggedAt))
    .limit(20);

    // Get today's nutrition totals
    const today = new Date().toISOString().split('T')[0];
    const [dailyTotals] = await db.select()
      .from(dailyNutrition)
      .where(and(
        eq(dailyNutrition.userId, userId),
        eq(dailyNutrition.date, today)
      ))
      .limit(1);

    // Get user goals and profile
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      recentMeals,
      dailyTotals: dailyTotals || {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
      },
      weeklyTrends: {
        avgCalories: recentMeals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0) / Math.max(recentMeals.length, 1),
        avgNutritionScore: recentMeals.reduce((sum, meal) => sum + (meal.nutritionScore || 0), 0) / Math.max(recentMeals.length, 1),
      },
      userGoals: {
        dailyCalories: user?.dailyCalorieGoal || 2000,
        dailyProtein: user?.dailyProteinGoal || 150,
        dailyCarbs: user?.dailyCarbGoal || 200,
        dailyFat: user?.dailyFatGoal || 67,
      },
    };
  }

  // Generate contextual AI response with nutrition insights
  private async generateContextualResponse(
    userMessage: string,
    context: NutritionContext,
    history: any[],
    userId: string
  ) {
    const startTime = Date.now();
    
    // Build comprehensive context for AI
    const systemPrompt = `You are ChefAI, a world-class nutrition expert and culinary specialist trained extensively on food science, nutrition databases, cooking techniques, and dietary optimization. You have comprehensive knowledge of:

FOOD & NUTRITION EXPERTISE:
- Complete USDA nutrition database with precise macro/micronutrient values
- Accurate portion sizes, weights, and measurements for all ingredients
- Cooking method impacts on nutritional content (raw vs cooked conversions)
- Regional food variations, seasonal availability, and quality indicators
- Allergen profiles, dietary restrictions, and substitution strategies
- Food safety, storage, and preparation best practices

RECIPE MASTERY:
- Precise ingredient measurements with metric and imperial conversions
- Step-by-step cooking instructions with timing and temperature details
- Serving calculations and portion control for accurate nutrition tracking
- Cooking techniques that preserve nutrients and enhance flavors
- Recipe scaling and modification for different dietary needs

User's Current Nutrition Context:
- Daily Goals: ${context.userGoals.dailyCalories} calories, ${context.userGoals.dailyProtein}g protein, ${context.userGoals.dailyCarbs}g carbs, ${context.userGoals.dailyFat}g fat
- Today's Progress: ${context.dailyTotals.totalCalories}/${context.userGoals.dailyCalories} calories, ${context.dailyTotals.totalProtein}/${context.userGoals.dailyProtein}g protein
- Recent Meals: ${context.recentMeals.length} meals logged in past week
- Weekly Averages: ${Math.round(context.weeklyTrends.avgCalories)} calories/day, ${Math.round(context.weeklyTrends.avgNutritionScore)}/100 nutrition score
- Recent Foods: ${context.recentMeals.slice(0, 5).map(m => m.name).join(', ')}

RESPONSE REQUIREMENTS:
1. FOOD INFORMATION: Provide 100% accurate nutritional data, precise portions, and exact measurements
2. RECIPES: Include complete ingredient lists with exact amounts, detailed step-by-step instructions, prep/cook times, and per-serving nutrition breakdown
3. PERSONALIZATION: Reference user's actual eating patterns, goals, and logged meals
4. COACHING TONE: Use encouraging, motivational language while maintaining scientific accuracy
5. ACTIONABLE ADVICE: Give specific, implementable suggestions based on their nutrition data

For recipes, always include:
- Exact ingredient measurements (cups, grams, tablespoons, etc.)
- Numbered step-by-step instructions with cooking times/temperatures
- Accurate per-serving nutritional breakdown (calories, protein, carbs, fat, fiber)
- Total servings and portion sizes
- Prep time and cook time

ALWAYS respond with valid JSON in this exact format:
{
  "response": "Your encouraging, detailed coaching response with precise nutrition information",
  "recipeDetails": {
    "recipeName": "Recipe Name",
    "servings": 4,
    "prepTime": "15 mins",
    "cookTime": "30 mins", 
    "ingredients": [{"item": "ingredient name", "amount": "1 cup", "calories": 120, "protein": 4}],
    "instructions": ["Step 1: Detailed instruction with timing", "Step 2: Next step"],
    "nutritionPerServing": {"calories": 350, "protein": 25, "carbs": 30, "fat": 15, "fiber": 8}
  },
  "insights": ["Personalized nutrition insight based on their actual data and goals"],
  "followUpQuestions": ["What about breakfast options?", "Need meal prep ideas?"],
  "timeframe": "today/this week/recent",
  "metrics": ["calories", "protein"],
  "confidence": 0.95
}

Only include recipeDetails when user specifically asks for recipes. Always include insights and followUpQuestions.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage }
    ];

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: messages as any,
      response_format: { type: "json_object" },
      max_completion_tokens: 1500, // Increased for detailed recipe responses
    });

    const responseTime = (Date.now() - startTime) / 1000;
    const aiData = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      response: aiData.response || "I'm here to help with your nutrition questions!",
      recipeDetails: aiData.recipeDetails || null,
      mealCards: aiData.mealCards || [],
      insights: aiData.insights || [],
      followUpQuestions: aiData.followUpQuestions || [],
      timeframe: aiData.timeframe,
      metrics: aiData.metrics || [],
      confidence: aiData.confidence || 0.95,
      tokensUsed: response.usage?.total_tokens || 0,
      responseTime,
    };
  }

  // Get conversation history
  private async getConversationHistory(conversationId: string, limit = 10) {
    return await db.select({
      role: chefAiMessages.role,
      content: chefAiMessages.content,
      createdAt: chefAiMessages.createdAt,
    })
    .from(chefAiMessages)
    .where(eq(chefAiMessages.conversationId, conversationId))
    .orderBy(desc(chefAiMessages.createdAt))
    .limit(limit);
  }

  // Get user's recent conversations
  async getUserConversations(userId: string, limit = 10) {
    return await db.select()
      .from(chefAiConversations)
      .where(eq(chefAiConversations.userId, userId))
      .orderBy(desc(chefAiConversations.lastInteractionAt))
      .limit(limit);
  }

  // Get full conversation with messages
  async getConversationWithMessages(conversationId: string, userId: string) {
    const [conversation] = await db.select()
      .from(chefAiConversations)
      .where(and(
        eq(chefAiConversations.id, conversationId),
        eq(chefAiConversations.userId, userId)
      ))
      .limit(1);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messages = await db.select()
      .from(chefAiMessages)
      .where(eq(chefAiMessages.conversationId, conversationId))
      .orderBy(chefAiMessages.createdAt);

    return {
      conversation,
      messages,
    };
  }

  // Generate suggested conversation starters based on user's recent activity
  async generateSuggestedQuestions(userId: string): Promise<string[]> {
    const context = await this.gatherNutritionContext(userId);
    
    const suggestions = [];
    
    // Dynamic suggestions based on user's actual data
    if (context.recentMeals.length > 3) {
      suggestions.push("What were my best nutrition meals this week?");
      suggestions.push("How does my weekend eating compare to weekdays?");
    }
    
    if (context.dailyTotals.totalCalories > 0) {
      suggestions.push("How close am I to my goals today?");
      suggestions.push("What should I eat next to balance my macros?");
    }
    
    if (context.recentMeals.length === 0) {
      suggestions.push("What's a great first meal to log?");
      suggestions.push("How do I start tracking my nutrition?");
    }
    
    // Default suggestions if no meals
    if (suggestions.length === 0) {
      suggestions.push(
        "What did I eat yesterday?",
        "Help me plan a healthy dinner",
        "What are my nutrition strengths?",
        "Show me my eating patterns"
      );
    }
    
    return suggestions.slice(0, 4); // Return max 4 suggestions
  }
}

export const chefAiService = new ChefAiService();