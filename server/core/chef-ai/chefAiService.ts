import OpenAI from 'openai';
import { db } from '../../infrastructure/database/db';
import { chefAiConversations, chefAiMessages, meals, mealItems, dailyNutrition, users } from '@shared/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI Tools Definitions for Real User Data Integration  
const CHEF_AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_user_daily_nutrition",
      description: "Get user's actual daily nutrition data for a specific date",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "User ID" },
          date: { type: "string", description: "Date in YYYY-MM-DD format" }
        },
        required: ["userId", "date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_meal_suggestions",
      description: "Get personalized meal suggestions based on user's dietary preferences and health goals",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "User ID" },
          mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"], description: "Type of meal" },
          cuisine: { type: "string", description: "Preferred cuisine type" },
          healthFocus: { type: "string", description: "Health focus like gut health, heart health, etc." },
          calorieRange: { type: "object", properties: { min: { type: "number" }, max: { type: "number" } } }
        },
        required: ["userId", "mealType"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_recipe_details",
      description: "Get detailed recipe information with nutritional breakdown",
      parameters: {
        type: "object",
        properties: {
          mealName: { type: "string", description: "Name of the meal/recipe" },
          servings: { type: "number", description: "Number of servings" },
          dietaryRestrictions: { type: "array", items: { type: "string" }, description: "Any dietary restrictions" }
        },
        required: ["mealName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_user_health_profile",
      description: "Get user's health goals, dietary preferences, and restrictions",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "User ID" }
        },
        required: ["userId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_portion_size_guidance",
      description: "Get personalized portion size recommendations based on user's goals",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "User ID" },
          foodItem: { type: "string", description: "Name of the food item" },
          mealType: { type: "string", description: "Type of meal" }
        },
        required: ["userId", "foodItem"]
      }
    }
  }
];

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
        responseType: aiResponse.responseType,
        structuredData: aiResponse.structuredData,
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

  // OpenAI Function Calling Implementation
  private async executeFunctionCall(functionName: string, args: any, userId: string): Promise<any> {
    try {
      switch (functionName) {
        case 'get_user_daily_nutrition':
          return await this.getUserDailyNutrition(args.userId, args.date);
        
        case 'get_meal_suggestions':
          return await this.getMealSuggestions(args.userId, args.mealType, args.cuisine, args.healthFocus, args.calorieRange);
        
        case 'get_recipe_details':
          return await this.getRecipeDetails(args.mealName, args.servings, args.dietaryRestrictions);
        
        case 'get_user_health_profile':
          return await this.getUserHealthProfile(args.userId);
        
        case 'get_portion_size_guidance':
          return await this.getPortionSizeGuidance(args.userId, args.foodItem, args.mealType);
        
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }
    } catch (error) {
      console.error(`Function call error for ${functionName}:`, error);
      return { error: `Failed to execute ${functionName}: ${error.message}` };
    }
  }

  // Function implementations for real user data
  private async getUserDailyNutrition(userId: string, date: string): Promise<any> {
    try {
      const [dailyData] = await db.select()
        .from(dailyNutrition)
        .where(and(
          eq(dailyNutrition.userId, userId),
          eq(dailyNutrition.date, date)
        ))
        .limit(1);
      
      return {
        date,
        calories: dailyData?.totalCalories || 0,
        protein: dailyData?.totalProtein || 0,
        carbs: dailyData?.totalCarbs || 0,
        fat: dailyData?.totalFat || 0,
        fiber: dailyData?.totalFiber || 0,
        mealsLogged: dailyData?.mealsLogged || 0
      };
    } catch (error) {
      return { error: 'Unable to fetch daily nutrition data', calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  }

  private async getMealSuggestions(userId: string, mealType: string, cuisine?: string, healthFocus?: string, calorieRange?: any): Promise<any> {
    // Get user's dietary preferences and goals
    const userGoals = await this.getUserHealthProfile(userId);
    
    const suggestions = [
      {
        name: `Healthy ${cuisine || 'Mediterranean'} ${mealType}`,
        calories: calorieRange?.min || 350,
        protein: Math.round((calorieRange?.min || 350) * 0.25 / 4),
        carbs: Math.round((calorieRange?.min || 350) * 0.45 / 4),
        fat: Math.round((calorieRange?.min || 350) * 0.30 / 9),
        healthBenefits: [healthFocus || 'Balanced nutrition', 'Energy boost'],
        portionSize: mealType === 'breakfast' ? '1 medium bowl' : mealType === 'lunch' ? '1 large plate' : '1 standard serving'
      }
    ];
    
    return { suggestions, userPreferences: userGoals };
  }

  private async getRecipeDetails(mealName: string, servings: number = 4, dietaryRestrictions?: string[]): Promise<any> {
    // This would typically query a recipe database or generate via AI
    return {
      name: mealName,
      servings,
      prepTime: '15 minutes',
      cookTime: '25 minutes',
      difficulty: 'Easy',
      ingredients: [
        { item: 'Main protein', amount: '6 oz', calories: 200, protein: 25, carbs: 0, fat: 8 },
        { item: 'Vegetables', amount: '2 cups', calories: 50, protein: 3, carbs: 10, fat: 0 },
        { item: 'Whole grains', amount: '1 cup cooked', calories: 150, protein: 5, carbs: 30, fat: 2 }
      ],
      instructions: [
        'Prepare all ingredients',
        'Cook protein according to method',
        'Steam or sauté vegetables',
        'Combine and serve'
      ],
      nutritionPerServing: {
        calories: 400,
        protein: 33,
        carbs: 40,
        fat: 10,
        fiber: 8
      },
      dietaryInfo: dietaryRestrictions || []
    };
  }

  private async getUserHealthProfile(userId: string): Promise<any> {
    try {
      // Get user goals and preferences
      const userResult = await db.execute(sql`
        SELECT 
          daily_calorie_goal,
          daily_protein_goal,
          daily_carb_goal,
          daily_fat_goal
        FROM users 
        WHERE id = ${userId} 
        LIMIT 1
      `);
      
      const user = userResult.rows[0];
      
      return {
        dailyCalories: user?.daily_calorie_goal || 2000,
        dailyProtein: user?.daily_protein_goal || 150,
        dailyCarbs: user?.daily_carb_goal || 200,
        dailyFat: user?.daily_fat_goal || 67,
        healthGoals: user?.health_goals || { primary: 'maintenance' }
      };
    } catch (error) {
      console.error('Error getting user health profile:', error);
      return {
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 200,
        dailyFat: 67,
        healthGoals: { primary: 'maintenance' }
      };
    }
  }

  private async getPortionSizeGuidance(userId: string, foodItem: string, mealType: string): Promise<any> {
    const userProfile = await this.getUserHealthProfile(userId);
    
    // Calculate portion based on user's daily goals and meal type
    const mealCalorieTarget = mealType === 'breakfast' ? userProfile.dailyCalories * 0.25 :
                             mealType === 'lunch' ? userProfile.dailyCalories * 0.35 :
                             mealType === 'dinner' ? userProfile.dailyCalories * 0.30 :
                             userProfile.dailyCalories * 0.10; // snack
    
    return {
      recommendedPortion: `${Math.round(mealCalorieTarget / 100)} servings`,
      calorieTarget: Math.round(mealCalorieTarget),
      proteinTarget: Math.round(mealCalorieTarget * 0.25 / 4),
      guidance: `For ${mealType}, aim for ${Math.round(mealCalorieTarget)} calories with this ${foodItem}`
    };
  }

  // Generate contextual AI response with professional nutrition guidance and function calling
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

      // Call OpenAI GPT with function calling capabilities
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
        tools: CHEF_AI_TOOLS,
        tool_choice: "auto", // Let AI decide when to use tools
        max_tokens: requestType === 'meal_plan' ? 1500 : 800,
        temperature: requestType === 'meal_plan' ? 0.2 : 0.6,
      });
      
      let response = completion.choices[0].message;
      
      // Handle tool calls (modern OpenAI API)
      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolCalls = response.tool_calls;
        const toolResults = [];
        
        // Execute all tool calls
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`ChefAI calling function: ${functionName}`, functionArgs);
          
          const functionResult = await this.executeFunctionCall(functionName, functionArgs, userId);
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            content: JSON.stringify(functionResult)
          });
        }
        
        // Call OpenAI again with the tool results
        const followUpCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user", 
              content: `Recent conversation:\n${historyContext}\n\nCurrent message: ${userMessage}`
            },
            {
              role: "assistant",
              content: response.content,
              tool_calls: response.tool_calls
            },
            ...toolResults
          ],
          response_format: { type: "json_object" },
          max_tokens: requestType === 'meal_plan' ? 1500 : 800,
          temperature: requestType === 'meal_plan' ? 0.2 : 0.6,
        });
        
        response = followUpCompletion.choices[0].message;
      }

      const responseContent = response.content;
      if (!responseContent) {
        throw new Error('Empty response from OpenAI');
      }

      const parsedResponse = JSON.parse(responseContent);
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
        return `You are ChefAI, your friendly personal nutrition coach! 😊 You're genuinely excited to help people eat healthily and reach their goals.

${baseContext}

## Your Conversational Style:
- Warm, enthusiastic, and genuinely excited about food and nutrition! 
- Use emojis naturally (🍳, 👋, 😊, 🥗, etc.) - but don't overdo it
- Talk like a caring friend who happens to be a nutrition expert
- Ask follow-up questions to personalize recommendations better
- Keep things conversational - "Hey there!" "How's your week going?" "What sounds good?"
- Show genuine interest in their goals and preferences
- Be encouraging and supportive about their progress

## Available Functions:
You can call these functions to get REAL user data:
- get_user_daily_nutrition(userId, date) - Get actual nutrition intake
- get_user_health_profile(userId) - Get real dietary goals and health focus  
- get_meal_suggestions(userId, mealType, cuisine, healthFocus) - Get personalized suggestions
- get_recipe_details(mealName, servings) - Get detailed recipes
- get_portion_size_guidance(userId, foodItem, mealType) - Get personalized portions

## Response Strategy:
1. **IMMEDIATELY** call relevant functions to get user's real data
2. **CREATE** comprehensive meal plans using their actual goals and preferences
3. **PROVIDE** specific portion sizes based on their daily targets
4. **INCLUDE** precise nutritional calculations tailored to them

RESPONSE FORMAT (required JSON):
{
  "response": "Hey there! I'm super excited to help you with your nutrition goals! 😊 [Be conversational, ask what they're looking for, offer specific suggestions based on their data]",
  "structuredData": {
    "mealPlan": {
      "title": "Personalized plan name",
      "duration": "Number of days",
      "overview": "Brief description with user-specific details",
      "dailyPlans": [
        {
          "day": "Day 1",
          "meals": [
            {
              "mealType": "Breakfast",
              "name": "Specific meal name",
              "foods": ["real food1", "real food2", "real food3"],
              "portionControl": "Exact measurements based on user goals",
              "macros": {"calories": 350, "protein": 25, "carbs": 35, "fat": 12, "fiber": 8},
              "benefits": ["health benefit 1", "health benefit 2"]
            }
          ],
          "dailyTotals": {"calories": 1950, "protein": 145, "carbs": 185, "fat": 65, "fiber": 35}
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
  "insights": ["Personalized insights using real user data"],
  "confidence": 0.95
}`;

      case 'recipe':
        return `You are ChefAI, a friendly cooking enthusiast who loves sharing delicious, healthy recipes! 🍳

${baseContext}

## Your Recipe Style:
- Be conversational and encouraging about cooking
- Share recipes like you're chatting with a friend in the kitchen
- Include helpful cooking tips and substitutions
- Make cooking feel accessible and fun, not intimidating
- Ask about their preferences (spice level, dietary needs, etc.)

RESPONSE FORMAT (required JSON):
{
  "response": "Hey! I've got the perfect recipe for you! 😊 [Share recipe conversationally with enthusiasm]",
  "structuredData": {
    "recipe": {
      "name": "Recipe Name",
      "servings": 4,
      "prepTime": "15 minutes",
      "cookTime": "25 minutes",
      "difficulty": "Easy",
      "ingredients": [{"item": "ingredient", "amount": "1 cup", "calories": 150, "protein": 8, "carbs": 20, "fat": 5}],
      "instructions": ["Step 1", "Step 2"],
      "nutritionPerServing": {"calories": 385, "protein": 28, "carbs": 35, "fat": 18, "fiber": 6, "micronutrients": {"vitamin_c": 45}},
      "healthBenefits": ["High protein", "Rich in fiber"]
    }
  },
  "insights": ["Key insights"],
  "confidence": 0.9
}`;

      case 'analysis':
        return `Professional nutrition AI. Analyze nutrition data and provide evidence-based recommendations.

${baseContext}

Provide data-driven analysis with specific numbers and actionable insights.

RESPONSE FORMAT (required JSON):
{
  "response": "Let me take a look at your progress! 📊 [Share analysis in an encouraging, conversational way]",
  "insights": ["Encouraging insights with specific progress points"],
  "followUpQuestions": ["Warm, helpful questions about their preferences"],
  "confidence": 0.9
}`;

      default: // 'general'
        return `You are ChefAI, everyone's favorite friendly nutrition coach! 👋 You're here to chat about food, nutrition, and help people feel great about their eating choices.

${baseContext}

## Your Conversational Approach:
- Always greet users warmly and show genuine interest in their day/week
- Ask follow-up questions to understand what they're really looking for
- Share meal ideas in a friendly, non-overwhelming way
- Be encouraging about their progress and goals
- Use casual, warm language that feels like talking to a supportive friend
- Offer specific, actionable suggestions they can easily try

## Response Examples:
- "Hey! I'm so glad you're reaching out! 👋 How's your week been going with meals?"
- "I'd love to help you with some meal suggestions! 🍳 To make them just right for you, can you tell me..."
- "Hey there! I'm super excited to help you eat healthy! 😊 Let's kick things off with..."

Give specific, actionable advice focused on practical solutions.

RESPONSE FORMAT (required JSON):
{
  "response": "Helpful professional response",
  "insights": ["Nutrition insights"],
  "followUpQuestions": ["Follow-up questions"],
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