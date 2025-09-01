import OpenAI from 'openai';
import { db } from '../../infrastructure/database/db';
import { chefAiConversations, chefAiMessages, meals, mealItems, dailyNutrition, users } from '@shared/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

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
  responseType?: 'meal_plan' | 'recipe' | 'analysis' | 'general';
  structuredData?: {
    mealPlan?: {
      title: string;
      duration: string;
      overview: string;
      dailyPlans: Array<{
        day: string;
        meals: Array<{
          mealType: string;
          name: string;
          foods: string[];
          portionControl: string;
          macros: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            fiber: number;
          };
          benefits: string[];
        }>;
        dailyTotals: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
        };
      }>;
      nutritionalAnalysis: {
        averageDailyCalories: number;
        proteinRange: string;
        carbRange: string;
        fatRange: string;
        keyBenefits: string[];
      };
    };
    recipe?: {
      name: string;
      servings: number;
      prepTime: string;
      cookTime: string;
      difficulty: string;
      ingredients: Array<{
        item: string;
        amount: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }>;
      instructions: string[];
      nutritionPerServing: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        micronutrients: Record<string, number>;
      };
      healthBenefits: string[];
    };
  };
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
        content: aiResponse.message,
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
        message: aiResponse.message,
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

    // Get user goals and profile - using raw SQL to avoid schema mismatch
    const userResult = await db.execute(sql`
      SELECT 
        id,
        daily_calorie_goal,
        daily_protein_goal,
        daily_carb_goal,
        daily_fat_goal
      FROM users 
      WHERE id = ${userId} 
      LIMIT 1
    `);
    const user = userResult.rows[0] || null;

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
        dailyCalories: user?.daily_calorie_goal || 2000,
        dailyProtein: user?.daily_protein_goal || 150,
        dailyCarbs: user?.daily_carb_goal || 200,
        dailyFat: user?.daily_fat_goal || 67,
      },
    };
  }

  // Detect the type of request and determine response approach
  private detectRequestType(message: string): 'meal_plan' | 'recipe' | 'analysis' | 'general' {
    const lowerMessage = message.toLowerCase();
    
    // Meal plan indicators
    if (lowerMessage.includes('meal plan') || lowerMessage.includes('weekly plan') || 
        lowerMessage.includes('daily plan') || lowerMessage.includes('day meal') ||
        (lowerMessage.includes('plan') && (lowerMessage.includes('week') || lowerMessage.includes('day'))) ||
        lowerMessage.includes('weekly menu') || lowerMessage.includes('menu plan')) {
      return 'meal_plan';
    }
    
    // Recipe indicators
    if (lowerMessage.includes('recipe') || lowerMessage.includes('how to make') ||
        lowerMessage.includes('ingredients') || lowerMessage.includes('cooking') ||
        lowerMessage.includes('preparation') || lowerMessage.includes('instructions')) {
      return 'recipe';
    }
    
    // Analysis indicators
    if (lowerMessage.includes('analyze') || lowerMessage.includes('compare') ||
        lowerMessage.includes('nutrition') || lowerMessage.includes('calories') ||
        lowerMessage.includes('macros') || lowerMessage.includes('progress')) {
      return 'analysis';
    }
    
    return 'general';
  }

  // Generate contextual AI response with professional nutrition guidance
  private async generateContextualResponse(
    userMessage: string,
    context: NutritionContext,
    history: any[],
    userId: string
  ) {
    const startTime = Date.now();
    const requestType = this.detectRequestType(userMessage);
    
    // Professional, comprehensive prompt system
    const systemPrompt = this.buildSystemPrompt(requestType, context);

    try {
      // Get conversation history context
      const historyContext = history.slice(-6).map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');

      // Call OpenAI GPT with enhanced context
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using latest efficient model
        messages: [
          {
            role: "system", 
            content: systemPrompt
          },
          {
            role: "user",
            content: `Recent conversation:\n${historyContext}\n\nCurrent message: ${userMessage}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: requestType === 'meal_plan' ? 2000 : 1200, // More tokens for comprehensive plans
        temperature: requestType === 'meal_plan' ? 0.3 : 0.7, // Lower temperature for structured plans
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      const parsedResponse = JSON.parse(response);
      const responseTime = Date.now() - startTime;
      
      console.log(`ChefAI response generated in ${responseTime}ms`);
      
      return {
        message: parsedResponse.response || "I'm here to help with your nutrition goals!",
        responseType: requestType,
        structuredData: parsedResponse.structuredData || null,
        insights: parsedResponse.insights || [],
        followUpQuestions: parsedResponse.followUpQuestions || [],
        recipeDetails: parsedResponse.recipeDetails || null,
        confidence: parsedResponse.confidence || 0.8,
        tokensUsed: completion.usage?.total_tokens ?? null,
        responseTime
      };

    } catch (error: any) {
      console.error('Error generating AI response:', error);
      
      // Fallback response if OpenAI fails
      return {
        message: `Hey! I'm having a little trouble processing that right now, but I'm here for you! 😊\n\nI can see you've had ${context.dailyTotals.totalCalories} calories today - you're doing great! What would you like to chat about? I'm ready to help with meal ideas, recipes, or just talk food!`,
        insights: [`You're at ${Math.round((context.dailyTotals.totalCalories / context.userGoals.dailyCalories) * 100)}% of your daily goal - nice work!`],
        followUpQuestions: ["What sounds good to eat right now?", "Want some quick meal ideas?"],
        recipeDetails: null,
        confidence: 0.6,
        responseTime: Date.now() - startTime
      };
    }
  }

  // Build comprehensive system prompts based on request type
  private buildSystemPrompt(requestType: 'meal_plan' | 'recipe' | 'analysis' | 'general', context: NutritionContext): string {
    const baseContext = `## User Nutrition Profile:
- Daily Goals: ${context.userGoals.dailyCalories} calories, ${context.userGoals.dailyProtein}g protein, ${context.userGoals.dailyCarbs}g carbs, ${context.userGoals.dailyFat}g fat
- Current Progress: ${context.dailyTotals.totalCalories}/${context.userGoals.dailyCalories} calories (${Math.round((context.dailyTotals.totalCalories / context.userGoals.dailyCalories) * 100)}%)
- Weekly Activity: ${context.recentMeals.length} meals logged, Average: ${Math.round(context.weeklyTrends.avgCalories)} cal/day`;

    switch (requestType) {
      case 'meal_plan':
        return `You are a professional nutrition AI assistant specializing in comprehensive meal planning. You provide structured, detailed meal plans with precise nutritional analysis comparable to industry-leading nutrition platforms.

${baseContext}

## Core Capabilities:
- Generate complete multi-day meal plans with exact nutritional breakdowns
- Provide professional table-formatted responses with organized data
- Calculate precise macro and micronutrient values for each meal
- Offer immediate comprehensive solutions for complex requests
- Adapt meal plans instantly based on dietary requirements

## Response Requirements:
1. **Immediate Comprehensive Response**: For meal plan requests, provide complete plans immediately without asking clarifying questions
2. **Professional Structure**: Use organized formatting with clear meal breakdowns
3. **Precise Nutrition**: Calculate exact calories, protein, carbs, fat, and fiber for each meal
4. **Practical Portions**: Provide specific portion sizes and measurements
5. **Health Benefits**: Include relevant nutritional benefits for each meal

## Response Format:
Provide responses in this JSON structure:
{
  "response": "Professional introduction with plan overview",
  "structuredData": {
    "mealPlan": {
      "title": "[Plan Name]",
      "duration": "[Number of days]",
      "overview": "Brief plan description",
      "dailyPlans": [
        {
          "day": "Day 1",
          "meals": [
            {
              "mealType": "Breakfast",
              "name": "[Meal Name]",
              "foods": ["food1", "food2", "food3"],
              "portionControl": "Specific portions and measurements",
              "macros": {
                "calories": 350,
                "protein": 25,
                "carbs": 35,
                "fat": 12,
                "fiber": 8
              },
              "benefits": ["health benefit 1", "health benefit 2"]
            }
          ],
          "dailyTotals": {
            "calories": 1950,
            "protein": 145,
            "carbs": 185,
            "fat": 65,
            "fiber": 35
          }
        }
      ],
      "nutritionalAnalysis": {
        "averageDailyCalories": 1950,
        "proteinRange": "140-160g",
        "carbRange": "180-200g",
        "fatRange": "60-70g",
        "keyBenefits": ["benefit1", "benefit2"]
      }
    }
  },
  "insights": ["Professional nutritional insights"],
  "confidence": 0.95
}`;

      case 'recipe':
        return `You are a professional nutrition AI assistant specializing in detailed recipe creation with comprehensive nutritional analysis.

${baseContext}

## Recipe Development Expertise:
- Create detailed recipes with exact ingredient measurements
- Calculate precise nutritional values per serving
- Provide step-by-step cooking instructions
- Include health benefits and nutritional highlights
- Optimize recipes for user's nutritional goals

## Response Format:
Provide responses in this JSON structure:
{
  "response": "Professional recipe introduction",
  "structuredData": {
    "recipe": {
      "name": "[Recipe Name]",
      "servings": 4,
      "prepTime": "15 minutes",
      "cookTime": "25 minutes",
      "difficulty": "Easy",
      "ingredients": [
        {
          "item": "ingredient name",
          "amount": "1 cup",
          "calories": 150,
          "protein": 8,
          "carbs": 20,
          "fat": 5
        }
      ],
      "instructions": ["Step 1", "Step 2"],
      "nutritionPerServing": {
        "calories": 385,
        "protein": 28,
        "carbs": 35,
        "fat": 18,
        "fiber": 6,
        "micronutrients": {
          "vitamin_c": 45,
          "iron": 8,
          "calcium": 150
        }
      },
      "healthBenefits": ["High protein for muscle building", "Rich in fiber for digestion"]
    }
  },
  "insights": ["Nutritional insights about the recipe"],
  "confidence": 0.9
}`;

      case 'analysis':
        return `You are a professional nutrition AI assistant specializing in comprehensive nutritional analysis and personalized recommendations.

${baseContext}

## Analysis Capabilities:
- Provide detailed nutritional progress assessments
- Compare current intake to optimal nutrition targets
- Identify nutritional gaps and opportunities
- Offer evidence-based recommendations
- Track trends and provide actionable insights

## Response Approach:
- Be direct and data-driven with clear analysis
- Provide specific numbers and percentages
- Highlight both strengths and areas for improvement
- Give actionable next steps

Respond in JSON:
{
  "response": "Professional analysis with specific data points",
  "insights": ["Data-driven insights with specific numbers"],
  "followUpQuestions": ["Relevant analytical questions"],
  "confidence": 0.9
}`;

      default: // 'general'
        return `You are a professional nutrition AI assistant providing helpful, accurate nutrition guidance and food recommendations.

${baseContext}

## Communication Style:
- Professional yet approachable
- Provide specific, actionable advice
- Focus on practical solutions
- Give immediate helpful responses

Respond in JSON:
{
  "response": "Helpful, professional response",
  "insights": ["Relevant nutrition insights"],
  "followUpQuestions": ["Helpful follow-up questions"],
  "confidence": 0.85
}`;
    }
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

  // Delete conversation and all its messages
  async deleteConversation(conversationId: string, userId: string) {
    // First verify the conversation belongs to the user
    const conversation = await db.select()
      .from(chefAiConversations)
      .where(
        and(
          eq(chefAiConversations.id, conversationId),
          eq(chefAiConversations.userId, userId)
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      throw new Error('Conversation not found or access denied');
    }

    // Delete all messages in the conversation
    await db.delete(chefAiMessages)
      .where(eq(chefAiMessages.conversationId, conversationId));

    // Delete the conversation
    await db.delete(chefAiConversations)
      .where(eq(chefAiConversations.id, conversationId));

    return { success: true, message: 'Conversation deleted successfully' };
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
    try {
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
    } catch (error) {
      console.error('Error in generateSuggestedQuestions:', error);
      // Return default suggestions if there's an error
      return [
        "What's a healthy lunch today?",
        "How can I increase my protein?",
        "Suggest 400-calorie dinners",
        "What should I eat for lunch today?"
      ];
    }
  }
}

export const chefAiService = new ChefAiService();