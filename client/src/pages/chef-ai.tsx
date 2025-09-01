import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { RecipeCard } from '@/components/chef-ai/RecipeCard';
import { MealPlanCard } from '@/components/chef-ai/MealPlanCard';
import { 
  Send, 
  Bot, 
  User, 
  ArrowLeft, 
  Sparkles, 
  MessageCircle, 
  Clock,
  Utensils,
  TrendingUp,
  Mic,
  BarChart3,
  Target,
  Leaf,
  Apple,
  AlertCircle,
  Trash2,
  Bookmark,
  Plus
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
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
  nutritionContext?: {
    timeframe?: string;
    metrics?: string[];
    insights?: string[];
  };
}

interface Conversation {
  id: string;
  title: string;
  lastInteractionAt: string;
  messageCount: number;
}

// Nutrition Macro Component
const NutritionBadge = ({ label, value, unit, color, icon }: {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: string;
}) => (
  <div className="text-center p-3 rounded-xl bg-white/50 border border-gray-100">
    <div className={`text-xl font-bold ${color} mb-1`}>
      {icon} {value}{unit}
    </div>
    <div className="text-xs text-gray-600 font-medium">{label}</div>
  </div>
);

// AI Response Card Component
const ResponseCard = ({ title, children, icon, gradient }: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  gradient?: string;
}) => (
  <Card className={`border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${gradient || 'bg-white'}`}>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      {children}
    </CardContent>
  </Card>
);

export default function ChefAI() {
  const [message, setMessage] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation suggestions
  const { data: suggestionsData } = useQuery({
    queryKey: ['/api/chef-ai/suggestions'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user conversations
  const { data: conversationsData } = useQuery({
    queryKey: ['/api/chef-ai/conversations'],
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch active conversation messages
  const { data: conversationData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/chef-ai/conversations', activeConversationId],
    enabled: !!activeConversationId,
    staleTime: 10 * 1000, // 10 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const payload: any = {
        message: messageText,
      };
      if (activeConversationId) {
        payload.conversationId = activeConversationId;
      }
      return await apiRequest('POST', '/api/chef-ai/chat', payload);
    },
    onSuccess: (data: any) => {
      const newConversationId = data.conversationId;
      
      // Update activeConversationId for new conversations OR ensure consistency
      if (!activeConversationId || activeConversationId !== newConversationId) {
        setActiveConversationId(newConversationId);
      }
      setMessage('');
      
      // Invalidate and refetch conversations list and the specific conversation
      queryClient.invalidateQueries({ queryKey: ['/api/chef-ai/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chef-ai/conversations', newConversationId] });
      
      // If this was an existing conversation, also invalidate the old one to be safe
      if (activeConversationId && activeConversationId !== newConversationId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chef-ai/conversations', activeConversationId] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Message Failed",
        description: error.message || "ChefAI is taking a break. Please try again!",
        variant: "destructive",
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return await apiRequest('DELETE', `/api/chef-ai/conversations/${conversationId}`);
    },
    onSuccess: () => {
      // Clear active conversation if it was deleted
      setActiveConversationId(null);
      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: ['/api/chef-ai/conversations'] });
      toast({
        title: "Conversation Deleted",
        description: "Your conversation has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Unable to delete conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation selection
    deleteConversationMutation.mutate(conversationId);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [(conversationData as any)?.messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || message.trim();
    if (!textToSend || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(textToSend);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    handleSendMessage(suggestion);
  };

  const suggestions = (suggestionsData as any)?.suggestions || [];
  const conversations = (conversationsData as any)?.conversations || [];
  const messages: Message[] = (conversationData as any)?.messages || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-teal-50/30 to-green-50/20">
      <div className="flex h-screen">
        {/* Sidebar - Conversations */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-r p-4 overflow-y-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/dashboard')}
              className="mb-4 w-full justify-start"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Bot className="w-6 h-6 text-blue-600" />
              ChefAI Coach
            </h2>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setActiveConversationId(null)}
              data-testid="button-new-conversation"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>

          {/* Recent Conversations */}
          {conversations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Chats</h3>
              {conversations.map((conversation: Conversation) => (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer transition-colors border group ${
                    activeConversationId === conversation.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveConversationId(conversation.id)}
                  data-testid={`card-conversation-${conversation.id}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{conversation.title}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {conversation.messageCount} messages
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(conversation.lastInteractionAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 h-auto hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        disabled={deleteConversationMutation.isPending}
                        data-testid={`button-delete-${conversation.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversationId ? (
            <>
              {/* Chat Header */}
              <div className="bg-white/80 backdrop-blur-sm border-b p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">ChefAI</h3>
                    <p className="text-sm text-gray-600">Your Personal Nutrition Coach</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {/* Avatar */}
                        {msg.role === 'assistant' && (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        )}
                        
                        {/* Message Content */}
                        <div className={`flex-1 max-w-3xl space-y-3 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                          {/* User Message */}
                          {msg.role === 'user' && (
                            <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-lg max-w-lg">
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          )}
                          
                          {/* AI Response */}
                          {msg.role === 'assistant' && (
                            <div className="space-y-4">
                              {/* Main Response */}
                              <div className="bg-white rounded-2xl rounded-tl-md border border-gray-100 p-4 shadow-lg">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Apple className="w-3 h-3 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm mb-1">ChefAI</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">{msg.content}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Structured Meal Plan */}
                              {msg.structuredData?.mealPlan && (
                                <MealPlanCard 
                                  mealPlan={msg.structuredData.mealPlan}
                                  onSave={() => {
                                    toast({
                                      title: "Meal Plan Saved",
                                      description: "Added to your saved meal plans",
                                    });
                                  }}
                                  onShare={() => {
                                    toast({
                                      title: "Meal Plan Shared",
                                      description: "Link copied to clipboard",
                                    });
                                  }}
                                  onDownload={() => {
                                    toast({
                                      title: "Meal Plan Downloaded",
                                      description: "PDF downloaded to your device",
                                    });
                                  }}
                                />
                              )}

                              {/* Enhanced Recipe Card for Structured Data */}
                              {msg.structuredData?.recipe && (
                                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-lg space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{msg.structuredData.recipe.name}</h4>
                                      <div className="flex gap-4 text-sm text-gray-600">
                                        <span>🍽️ {msg.structuredData.recipe.servings} servings</span>
                                        <span>⏱️ Prep: {msg.structuredData.recipe.prepTime}</span>
                                        <span>🔥 Cook: {msg.structuredData.recipe.cookTime}</span>
                                        <span>📊 {msg.structuredData.recipe.difficulty}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Enhanced Nutrition Display */}
                                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
                                    <h5 className="font-medium text-gray-900 mb-3">Nutrition (per serving)</h5>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                                      <div className="text-center">
                                        <div className="font-semibold text-blue-600">{msg.structuredData.recipe.nutritionPerServing.calories}</div>
                                        <div className="text-gray-600">calories</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-semibold text-green-600">{msg.structuredData.recipe.nutritionPerServing.protein}g</div>
                                        <div className="text-gray-600">protein</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-semibold text-orange-600">{msg.structuredData.recipe.nutritionPerServing.carbs}g</div>
                                        <div className="text-gray-600">carbs</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-semibold text-purple-600">{msg.structuredData.recipe.nutritionPerServing.fat}g</div>
                                        <div className="text-gray-600">fat</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-semibold text-teal-600">{msg.structuredData.recipe.nutritionPerServing.fiber}g</div>
                                        <div className="text-gray-600">fiber</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Ingredients Section */}
                                  {msg.structuredData.recipe.ingredients && msg.structuredData.recipe.ingredients.length > 0 && (
                                    <div className="space-y-3">
                                      <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                        🛒 Ingredients
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {msg.structuredData.recipe.ingredients.map((ingredient, i) => (
                                          <div key={i} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-700">
                                              <span className="font-medium">{ingredient.amount}</span> {ingredient.item}
                                            </span>
                                            {ingredient.calories > 0 && (
                                              <Badge variant="secondary" className="text-xs">
                                                {ingredient.calories} cal
                                              </Badge>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Instructions Section */}
                                  {msg.structuredData.recipe.instructions && msg.structuredData.recipe.instructions.length > 0 && (
                                    <div className="space-y-3">
                                      <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                        👩‍🍳 Instructions
                                      </h5>
                                      <ol className="space-y-2">
                                        {msg.structuredData.recipe.instructions.map((instruction, i) => (
                                          <li key={i} className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                                              {i + 1}
                                            </span>
                                            <span className="text-gray-700 leading-relaxed">{instruction}</span>
                                          </li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}

                                  {/* Health Benefits */}
                                  {msg.structuredData.recipe.healthBenefits && msg.structuredData.recipe.healthBenefits.length > 0 && (
                                    <div className="space-y-2">
                                      <h5 className="font-medium text-gray-900">Health Benefits</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {msg.structuredData.recipe.healthBenefits.map((benefit, i) => (
                                          <Badge key={i} className="bg-green-100 text-green-700 hover:bg-green-200">
                                            {benefit}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Recipe Actions */}
                                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        toast({
                                          title: "Recipe Saved",
                                          description: "Added to your saved recipes",
                                        });
                                      }}
                                      className="text-xs"
                                    >
                                      <Bookmark className="w-3 h-3 mr-1" />
                                      Save Recipe
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        toast({
                                          title: "Added to Meal Plan",
                                          description: "Recipe added to your meal plan",
                                        });
                                      }}
                                      className="text-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add to Plan
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Recipe Details Card */}
                              {(msg as any).recipeDetails && (
                                <RecipeCard 
                                  recipe={(msg as any).recipeDetails}
                                  onSave={() => {
                                    toast({
                                      title: "Recipe Saved",
                                      description: "Added to your saved recipes",
                                    });
                                  }}
                                  onShare={() => {
                                    toast({
                                      title: "Recipe Shared",
                                      description: "Link copied to clipboard",
                                    });
                                  }}
                                  onAddToMealPlan={() => {
                                    toast({
                                      title: "Added to Meal Plan",
                                      description: "Recipe added to your meal plan",
                                    });
                                  }}
                                />
                              )}
                              
                              {/* Meal Analysis Cards */}
                              {msg.mealCards && msg.mealCards.length > 0 && (
                                <div className="space-y-3">
                                  {msg.mealCards.map((meal) => (
                                    <ResponseCard 
                                      key={meal.mealId}
                                      title={meal.mealName}
                                      icon={<Utensils className="w-4 h-4 text-green-600" />}
                                      gradient="bg-gradient-to-br from-green-50 to-green-100"
                                    >
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600">{meal.nutritionSummary}</p>
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                                          🔥 {meal.calories} cal
                                        </Badge>
                                      </div>
                                    </ResponseCard>
                                  ))}
                                </div>
                              )}
                              
                              {/* Insights Cards */}
                              {msg.insights && msg.insights.length > 0 && (
                                <div className="space-y-2">
                                  {msg.insights.map((insight, i) => (
                                    <ResponseCard 
                                      key={i}
                                      title="Nutrition Insight"
                                      icon={<Sparkles className="w-4 h-4 text-blue-600" />}
                                      gradient="bg-gradient-to-br from-blue-50 to-blue-100"
                                    >
                                      <p className="text-sm text-gray-700">{insight}</p>
                                    </ResponseCard>
                                  ))}
                                </div>
                              )}

                              {/* Follow-up Questions */}
                              {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    Try asking:
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                    {msg.followUpQuestions.map((question, i) => (
                                      <Button
                                        key={i}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                                        onClick={() => handleSuggestionClick(question)}
                                        data-testid={`button-followup-${i}`}
                                      >
                                        {question}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Timestamp */}
                              <div className="text-xs text-gray-400 mt-2">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* User Avatar */}
                        {msg.role === 'user' && (
                          <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Enhanced Message Input */}
              <div className="bg-white border-t border-gray-100 p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex gap-3">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask ChefAI about nutrition, recipes, or meal planning..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={sendMessageMutation.isPending}
                        className="flex-1 border-0 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                        data-testid="input-chat-message"
                      />
                      <Button
                        variant="outline"
                        className="rounded-xl border-gray-200 hover:bg-gray-100 px-4"
                        data-testid="button-voice-input"
                      >
                        <Mic className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={!message.trim() || sendMessageMutation.isPending}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 px-6"
                        data-testid="button-send-message"
                      >
                        {sendMessageMutation.isPending ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Typing indicator */}
                    {sendMessageMutation.isPending && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                        </div>
                        ChefAI is thinking...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Production ChefAI Welcome */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-3xl w-full text-center space-y-8">
                {/* ChefAI Coach Header */}
                <div className="space-y-4">
                  <div className="relative mx-auto w-fit">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 rounded-full flex items-center justify-center shadow-2xl">
                      <Bot className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
                
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Meet ChefAI</h1>
                    <p className="text-lg text-gray-600 max-w-lg mx-auto">
                      Your AI nutrition coach is ready to help you eat better!
                    </p>
                  </div>

                {/* Quick Action Pills */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quick Actions</h3>
                  <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                    {[
                      { text: "What's a healthy lunch today?", emoji: "🥗", bg: "bg-green-500 hover:bg-green-600" },
                      { text: "Suggest 400-calorie dinners", emoji: "🍽️", bg: "bg-blue-500 hover:bg-blue-600" },
                      { text: "How can I increase my protein?", emoji: "💪", bg: "bg-purple-500 hover:bg-purple-600" },
                      { text: "Make me a meal plan", emoji: "📋", bg: "bg-orange-500 hover:bg-orange-600" }
                    ].map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={`${suggestion.bg} text-white border-0 rounded-full px-4 py-2 text-sm font-medium hover:scale-105 transition-all duration-200 shadow-lg`}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        data-testid={`button-suggestion-${index}`}
                      >
                        <span className="mr-2">{suggestion.emoji}</span>
                        {suggestion.text}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Feature Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <ResponseCard
                    title="Meal Analysis"
                    icon={<Utensils className="w-5 h-5 text-blue-600" />}
                    gradient="bg-gradient-to-br from-blue-50 to-blue-100"
                  >
                    <p className="text-sm text-gray-600">
                      Instant insights about calories, macros, and nutrition quality
                    </p>
                  </ResponseCard>
                  
                  <ResponseCard
                    title="Progress Tracking"
                    icon={<BarChart3 className="w-5 h-5 text-green-600" />}
                    gradient="bg-gradient-to-br from-green-50 to-green-100"
                  >
                    <p className="text-sm text-gray-600">
                      See your nutrition trends and celebrate improvements
                    </p>
                  </ResponseCard>
                  
                  <ResponseCard
                    title="Smart Coaching"
                    icon={<Target className="w-5 h-5 text-purple-600" />}
                    gradient="bg-gradient-to-br from-purple-50 to-purple-100"
                  >
                    <p className="text-sm text-gray-600">
                      Get personalized advice based on your goals and data
                    </p>
                  </ResponseCard>
                </div>

                {/* Start Chat Input */}
                <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-4">
                  <div className="flex gap-3">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask ChefAI about your nutrition..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={sendMessageMutation.isPending}
                      className="flex-1 border-0 bg-gray-50 rounded-xl focus:bg-white transition-colors"
                      data-testid="input-welcome-message"
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 px-4"
                      data-testid="button-send-welcome-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl border-gray-200 hover:bg-gray-50 px-4"
                      data-testid="button-voice-input"
                    >
                      <Mic className="w-4 h-4 text-gray-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}