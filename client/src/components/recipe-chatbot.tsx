/**
 * Professional Recipe Chatbot Component
 * Real-world conversational recipe generation with global cuisine knowledge
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ChefHat, Send, Clock, Users, Star, Globe, Crown, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recipes?: Recipe[];
  suggestions?: string[];
}

interface Recipe {
  name: string;
  cuisine: string;
  description: string;
  servings: number;
  cookTime: number;
  prepTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  ingredients: Array<{
    item: string;
    amount: string;
    notes?: string;
  }>;
  instructions: string[];
  techniques: string[];
  culturalNotes: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface RecipePreferences {
  cuisines: string[];
  dietaryRestrictions: string[];
  allergies: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  cookingTime: number;
  servings: number;
  ingredients?: string[];
}

const DEFAULT_PREFERENCES: RecipePreferences = {
  cuisines: ['international'],
  dietaryRestrictions: [],
  allergies: [],
  skillLevel: 'intermediate',
  cookingTime: 60,
  servings: 4,
  ingredients: []
};

export function RecipeChatbot() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [usageStats, setUsageStats] = useState<{
    recipesGenerated: number;
    remainingFree: number;
    isPremium: boolean;
  } | null>(null);
  const [preferences, setPreferences] = useState<RecipePreferences>(DEFAULT_PREFERENCES);
  const [conversationId, setConversationId] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial usage stats
  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const response = await apiRequest('GET', '/api/usage-stats');
        const data = await response.json();
        if (data.usageStats) {
          setUsageStats(data.usageStats);
        }
      } catch (error) {
        console.error('Error fetching usage stats:', error);
      }
    };

    fetchUsageStats();
  }, [isAuthenticated]);

  const chatMutation = useMutation({
    mutationFn: async ({ message, prefs }: { message: string; prefs: RecipePreferences }) => {
      const response = await apiRequest('POST', '/api/chatbot/recipe', {
        message,
        preferences: prefs,
        conversationId
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      // Update usage stats from response
      if (data.usageStats) {
        setUsageStats(data.usageStats);
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        recipes: data.recipes,
        suggestions: data.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error: any) => {
      let content = error.message || 'I apologize, but I\'m experiencing technical difficulties. Please try again.';
      
      // Handle freemium limit errors
      if (error.message?.includes('402') || error.message?.includes('Free recipe limit exceeded')) {
        content = "🎯 You've reached your monthly limit of 5 free recipes! Upgrade to Premium for unlimited AI recipe generation, advanced culinary features, and personalized meal planning.";
      }

      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ message: input.trim(), prefs: preferences });
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <Avatar className="h-10 w-10">
          <AvatarImage src="/chef-avatar.png" alt="Chef AI" />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <ChefHat className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">Chef AI</h3>
          <p className="text-sm text-muted-foreground">Your professional culinary assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Usage Stats Display */}
          {usageStats && (
            <div className="flex items-center gap-2">
              {usageStats.isPremium ? (
                <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-600 to-blue-600">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium - Unlimited
                </Badge>
              ) : (
                <Badge 
                  variant={usageStats.remainingFree > 0 ? "secondary" : "destructive"} 
                  className="text-xs"
                >
                  {usageStats.remainingFree > 0 ? (
                    `${usageStats.remainingFree}/5 free recipes left`
                  ) : (
                    <><AlertTriangle className="h-3 w-3 mr-1" />Limit reached</>
                  )}
                </Badge>
              )}
            </div>
          )}
          <Badge variant="secondary" className="text-xs">
            <Globe className="h-3 w-3 mr-1" />
            Global Cuisine Expert
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium text-lg mb-2">Welcome to Chef AI!</h4>
              <p className="text-muted-foreground mb-4">
                I'm your professional culinary assistant with authentic knowledge of global cuisines.
              </p>
              {/* Freemium welcome message */}
              {!isAuthenticated && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    🎯 Try 2 free recipes as a guest, or sign in for 5 free recipes per month!
                  </p>
                </div>
              )}
              {isAuthenticated && usageStats && !usageStats.isPremium && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    🎯 You have {usageStats.remainingFree} out of 5 free recipes this month.
                    {usageStats.remainingFree === 0 && (
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          onClick={async () => {
                            try {
                              const response = await apiRequest('POST', '/api/upgrade-premium');
                              const data = await response.json();
                              if (data.checkoutUrl) {
                                window.open(data.checkoutUrl, '_blank');
                              }
                            } catch (error) {
                              console.error('Upgrade error:', error);
                            }
                          }}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade to Premium - $9.99/month
                        </Button>
                      </div>
                    )}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <strong>Ask me about:</strong><br />
                  • Authentic recipes from any cuisine<br />
                  • Cooking techniques and tips<br />
                  • Ingredient substitutions
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <strong>Try saying:</strong><br />
                  • "Show me an authentic Italian pasta recipe"<br />
                  • "I have chicken and vegetables, what can I make?"<br />
                  • "Tell me about Japanese cooking techniques"
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <ChefHat className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                <div className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Recipes */}
                {message.recipes && message.recipes.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {message.recipes.map((recipe, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{recipe.name}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>
                            </div>
                            <Badge className={getDifficultyColor(recipe.difficulty)}>
                              {recipe.difficulty}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(recipe.prepTime + recipe.cookTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {recipe.servings} servings
                            </div>
                            <Badge variant="outline">{recipe.cuisine}</Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Nutrition */}
                          <div className="grid grid-cols-4 gap-2 text-center text-sm">
                            <div className="p-2 bg-muted/30 rounded">
                              <div className="font-medium">{recipe.nutrition.calories}</div>
                              <div className="text-xs text-muted-foreground">cal</div>
                            </div>
                            <div className="p-2 bg-muted/30 rounded">
                              <div className="font-medium">{recipe.nutrition.protein}g</div>
                              <div className="text-xs text-muted-foreground">protein</div>
                            </div>
                            <div className="p-2 bg-muted/30 rounded">
                              <div className="font-medium">{recipe.nutrition.carbs}g</div>
                              <div className="text-xs text-muted-foreground">carbs</div>
                            </div>
                            <div className="p-2 bg-muted/30 rounded">
                              <div className="font-medium">{recipe.nutrition.fat}g</div>
                              <div className="text-xs text-muted-foreground">fat</div>
                            </div>
                          </div>

                          {/* Ingredients */}
                          <div>
                            <h4 className="font-medium mb-2">Ingredients</h4>
                            <ul className="space-y-1 text-sm">
                              {recipe.ingredients.map((ingredient, i) => (
                                <li key={i} className="flex justify-between">
                                  <span>{ingredient.item}</span>
                                  <span className="text-muted-foreground">{ingredient.amount}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Cultural Notes */}
                          {recipe.culturalNotes && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <h4 className="font-medium text-sm mb-1">Cultural Notes</h4>
                              <p className="text-sm text-muted-foreground">{recipe.culturalNotes}</p>
                            </div>
                          )}

                          {/* Techniques */}
                          {recipe.techniques.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Key Techniques</h4>
                              <div className="flex flex-wrap gap-1">
                                {recipe.techniques.map((technique, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {technique}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">You might also like:</h4>
                    <div className="space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button 
                          key={index}
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-2 text-left justify-start text-xs"
                          onClick={() => setInput(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.role === 'user' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || 'You'} />
                  <AvatarFallback>
                    {user?.firstName?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {chatMutation.isPending && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  <ChefHat className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse">Thinking...</div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about recipes, cooking techniques, or ingredients..."
            disabled={chatMutation.isPending}
            className="flex-1"
            data-testid="input-recipe-chat"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || chatMutation.isPending}
            size="icon"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* AI Disclaimer */}
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground">
            AI can make mistakes. Please verify recipes and cooking instructions before use.
          </p>
        </div>
      </div>
    </div>
  );
}