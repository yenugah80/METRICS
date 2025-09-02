import OpenAI from 'openai';
import { aiMemoryStore, PersonalizedInsight } from './memory-store';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15000,
  maxRetries: 2
});

export interface KnowledgeBase {
  nutrition_facts: Record<string, any>;
  recipe_database: Record<string, any>;
  dietary_guidelines: Record<string, any>;
  user_preferences: Record<string, any>;
}

export class RAGSystem {
  private knowledgeBase: KnowledgeBase = {
    nutrition_facts: {},
    recipe_database: {},
    dietary_guidelines: {},
    user_preferences: {}
  };
  
  // Initialize RAG system with comprehensive food knowledge
  async initialize() {
    await this.loadNutritionKnowledge();
    await this.loadRecipeKnowledge();
    await this.loadDietaryGuidelines();
  }
  
  // Load comprehensive nutrition knowledge base
  private async loadNutritionKnowledge() {
    this.knowledgeBase.nutrition_facts = {
      high_protein_foods: {
        'chicken_breast': { protein_per_100g: 31, calories_per_100g: 165, source: 'USDA' },
        'salmon': { protein_per_100g: 25, calories_per_100g: 208, omega3: 'high', source: 'USDA' },
        'lentils': { protein_per_100g: 9, calories_per_100g: 116, fiber: 'high', source: 'USDA' },
        'greek_yogurt': { protein_per_100g: 10, calories_per_100g: 97, probiotics: 'high', source: 'USDA' },
        'quinoa': { protein_per_100g: 4.4, calories_per_100g: 120, complete_protein: true, source: 'USDA' }
      },
      micronutrient_sources: {
        'iron': ['spinach', 'beef', 'lentils', 'dark_chocolate'],
        'vitamin_c': ['oranges', 'bell_peppers', 'broccoli', 'strawberries'],
        'calcium': ['dairy', 'leafy_greens', 'almonds', 'sardines'],
        'omega3': ['fatty_fish', 'walnuts', 'chia_seeds', 'flax_seeds']
      },
      allergen_database: {
        'gluten': ['wheat', 'barley', 'rye', 'oats'],
        'dairy': ['milk', 'cheese', 'yogurt', 'butter'],
        'nuts': ['almonds', 'walnuts', 'cashews', 'pecans'],
        'shellfish': ['shrimp', 'crab', 'lobster', 'mussels']
      }
    };
  }
  
  // Load recipe knowledge with nutrition optimization
  private async loadRecipeKnowledge() {
    this.knowledgeBase.recipe_database = {
      healthy_substitutions: {
        'white_rice': 'cauliflower_rice',
        'pasta': 'zucchini_noodles',
        'sugar': 'stevia',
        'butter': 'avocado',
        'cream': 'cashew_cream'
      },
      cooking_methods: {
        'high_nutrition': ['steaming', 'grilling', 'baking', 'sautéing'],
        'low_nutrition': ['deep_frying', 'heavy_breading', 'excess_oil']
      },
      meal_templates: {
        'balanced_plate': {
          protein: '25%',
          complex_carbs: '25%',
          vegetables: '50%',
          healthy_fats: 'moderate'
        }
      }
    };
  }
  
  // Load dietary guidelines and health recommendations
  private async loadDietaryGuidelines() {
    this.knowledgeBase.dietary_guidelines = {
      daily_targets: {
        'fiber': { min: 25, optimal: 35, unit: 'grams' },
        'protein': { percentage: '15-30%', min_per_kg: 0.8 },
        'sodium': { max: 2300, optimal: 1500, unit: 'mg' },
        'added_sugar': { max: '10%', unit: 'calories' }
      },
      health_conditions: {
        'pcos': {
          focus: ['low_glycemic', 'anti_inflammatory'],
          avoid: ['refined_sugars', 'processed_foods'],
          recommend: ['lean_proteins', 'fiber_rich_foods', 'omega3']
        },
        'diabetes': {
          focus: ['blood_sugar_control', 'portion_control'],
          monitor: ['carbohydrate_intake', 'glycemic_index'],
          recommend: ['complex_carbs', 'lean_proteins', 'healthy_fats']
        },
        'heart_health': {
          focus: ['low_sodium', 'healthy_fats'],
          limit: ['saturated_fats', 'trans_fats', 'sodium'],
          recommend: ['omega3', 'potassium_rich', 'antioxidants']
        }
      }
    };
  }
  
  // Enhanced RAG response generation with context retrieval
  async generateContextualResponse(
    userQuery: string,
    userId: string,
    userContext: any
  ): Promise<any> {
    try {
      // Retrieve relevant knowledge from multiple sources
      const relevantKnowledge = await this.retrieveRelevantKnowledge(userQuery, userId);
      const userInsights = await aiMemoryStore.generatePersonalizedInsights(userId);
      const collaborativeRecs = await aiMemoryStore.getCollaborativeRecommendations(userId);
      
      // Build enriched context for GPT
      const enrichedPrompt = this.buildEnrichedPrompt(
        userQuery,
        userContext,
        relevantKnowledge,
        userInsights,
        collaborativeRecs
      );
      
      // Call GPT-5 with enhanced context
      const completion = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: enrichedPrompt.systemPrompt
          },
          {
            role: "user",
            content: enrichedPrompt.userPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.7
      });
      
      const response = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Add RAG metadata to response
      response.rag_metadata = {
        knowledge_sources: relevantKnowledge.sources,
        personalization_level: userInsights.length > 0 ? 'high' : 'medium',
        collaborative_suggestions: collaborativeRecs.length,
        context_relevance: relevantKnowledge.relevance_score
      };
      
      return response;
      
    } catch (error) {
      console.error('RAG system error:', error);
      throw error;
    }
  }
  
  // Retrieve relevant knowledge based on query analysis
  private async retrieveRelevantKnowledge(query: string, userId: string) {
    const queryLower = query.toLowerCase();
    const sources: string[] = [];
    const knowledge: any = {};
    let relevance_score = 0;
    
    // Check for nutrition-related queries
    if (queryLower.includes('protein') || queryLower.includes('macro')) {
      knowledge.protein_sources = this.knowledgeBase.nutrition_facts.high_protein_foods;
      sources.push('nutrition_database');
      relevance_score += 0.3;
    }
    
    // Check for health condition queries
    if (queryLower.includes('pcos') || queryLower.includes('diabetes') || queryLower.includes('heart')) {
      const conditions = Object.keys(this.knowledgeBase.dietary_guidelines.health_conditions);
      for (const condition of conditions) {
        if (queryLower.includes(condition)) {
          knowledge.health_guidelines = this.knowledgeBase.dietary_guidelines.health_conditions[condition];
          sources.push('medical_guidelines');
          relevance_score += 0.4;
        }
      }
    }
    
    // Check for recipe/cooking queries
    if (queryLower.includes('recipe') || queryLower.includes('cook') || queryLower.includes('meal')) {
      knowledge.cooking_tips = this.knowledgeBase.recipe_database.cooking_methods;
      knowledge.substitutions = this.knowledgeBase.recipe_database.healthy_substitutions;
      sources.push('recipe_database');
      relevance_score += 0.3;
    }
    
    // Add user-specific patterns
    const userPatterns = await aiMemoryStore.getPatterns(userId);
    if (userPatterns.length > 0) {
      knowledge.user_patterns = userPatterns.slice(0, 5);
      sources.push('user_memory');
      relevance_score += 0.2;
    }
    
    return {
      knowledge,
      sources,
      relevance_score: Math.min(1.0, relevance_score)
    };
  }
  
  // Build enriched prompt with retrieved context
  private buildEnrichedPrompt(
    userQuery: string,
    userContext: any,
    relevantKnowledge: any,
    userInsights: PersonalizedInsight[],
    collaborativeRecs: string[]
  ) {
    const systemPrompt = `You are an advanced nutrition AI with access to comprehensive knowledge bases and user memory systems. 

KNOWLEDGE CONTEXT:
${JSON.stringify(relevantKnowledge.knowledge, null, 2)}

USER PERSONALIZATION INSIGHTS:
${userInsights.map(insight => `${insight.type.toUpperCase()}: ${insight.message}`).join('\n')}

COLLABORATIVE RECOMMENDATIONS:
${collaborativeRecs.join('\n')}

USER PATTERNS & PREFERENCES:
- Current goal progress: ${Math.round((userContext.dailyTotals?.totalCalories || 0) / (userContext.userGoals?.dailyCalories || 2000) * 100)}%
- Preferred cuisines: ${userContext.userProfile?.cuisinePreferences?.join(', ') || 'Not specified'}
- Health focus: ${userContext.userProfile?.healthGoals?.join(', ') || 'General health'}
- Allergies: ${userContext.userProfile?.allergens?.join(', ') || 'None'}

RESPONSE REQUIREMENTS:
- Use the retrieved knowledge to provide accurate, source-backed information
- Incorporate personalized insights naturally into your response
- Reference specific user patterns when relevant
- Suggest collaborative recommendations when appropriate
- Always prioritize user safety (allergies, health conditions)
- Include actionable next steps

Respond in JSON format with enhanced structure.`;

    const userPrompt = `Using all the context above, please respond to: "${userQuery}"

Include:
1. Direct answer using retrieved knowledge
2. Personalized recommendations based on user insights
3. Collaborative suggestions from similar users
4. Specific next steps they can take
5. Any relevant warnings or considerations`;

    return { systemPrompt, userPrompt };
  }
  
  // Update knowledge base with new information
  async updateKnowledge(category: keyof KnowledgeBase, key: string, data: any) {
    this.knowledgeBase[category][key] = data;
  }
  
  // Get knowledge base statistics
  getKnowledgeStats() {
    return {
      nutrition_facts: Object.keys(this.knowledgeBase.nutrition_facts).length,
      recipe_database: Object.keys(this.knowledgeBase.recipe_database).length,
      dietary_guidelines: Object.keys(this.knowledgeBase.dietary_guidelines).length,
      user_preferences: Object.keys(this.knowledgeBase.user_preferences).length
    };
  }
}

export const ragSystem = new RAGSystem();