import { useState, useRef, useEffect, useMemo, memo } from 'react';
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
  Plus,
  Package,
  ChefHat
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
  responseCard?: {
    title: string;
    summary: string;
    macros: {
      calories_kcal: number | null;
      protein_g: number | null;
      carbs_g: number | null;
      fat_g: number | null;
    };
    micros: {
      fiber_g: number | null;
      iron_mg: number | null;
      calcium_mg: number | null;
      vitamin_c_mg: number | null;
    };
    portion_size: string | null;
    allergens: string[];
    diet_flags: {
      keto: boolean;
      vegan: boolean;
      vegetarian: boolean;
      gluten_free: boolean;
      pcos_friendly: boolean;
    };
    ingredients: string[];
    preparation_steps: string[];
    health_benefits: string[];
    warnings: string[];
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
const ResponseCard = memo(({ title, children, icon, gradient }: {
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
));

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
              <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-blue-50/30 to-green-50/30">
                <div className="space-y-6 max-w-4xl mx-auto">
                  {messagesLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                        <div className="absolute inset-0 animate-pulse w-8 h-8 bg-gradient-to-r from-blue-200 to-teal-200 rounded-full opacity-75" />
                      </div>
                      <p className="text-gray-600 mt-3 text-sm">ChefAI is thinking...</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      // Pre-calculate animation delay for better performance
                      const animationDelay = `${index * 100}ms`;
                      
                      return (
                      <div key={msg.id || index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`} style={{animationDelay}}>
                        {/* Avatar */}
                        {msg.role === 'assistant' && (
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white">
                            <Bot className="w-6 h-6 text-white" />
                          </div>
                        )}
                        
                        {/* Message Content */}
                        <div className={`flex-1 max-w-3xl space-y-4 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                          {/* User Message */}
                          {msg.role === 'user' && (
                            <div className="group">
                              <div className="bg-blue-600 text-white rounded-3xl rounded-tr-lg px-6 py-4 shadow-lg max-w-lg hover:shadow-xl transition-shadow duration-200">
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* AI Response */}
                          {msg.role === 'assistant' && (
                            <div className="space-y-4">
                              {/* Main Response */}
                              <div className="bg-white rounded-3xl rounded-tl-lg border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                                <div className="flex items-start gap-4 mb-4">
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-bold text-blue-600 text-base">ChefAI</h4>
                                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    </div>
                                    <div className="prose prose-sm text-gray-700 leading-relaxed max-w-none">
                                      {msg.content.split('\n').map((paragraph, i) => {
                                        if (paragraph.startsWith('#')) {
                                          return <h3 key={i} className="font-bold text-gray-900 mt-4 mb-2 text-lg">{paragraph.replace(/^#+\s*/, '')}</h3>
                                        }
                                        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                                          return <h4 key={i} className="font-semibold text-gray-800 mt-3 mb-2">{paragraph.replace(/\*\*/g, '')}</h4>
                                        }
                                        if (paragraph.trim()) {
                                          return <p key={i} className="mb-3">{paragraph}</p>
                                        }
                                        return null;
                                      })}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Insights Section */}
                                {msg.insights && msg.insights.length > 0 && (
                                  <div className="relative z-10 bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-2xl border border-blue-100 mb-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <TrendingUp className="w-5 h-5 text-blue-600" />
                                      <h5 className="font-semibold text-gray-900">Key Insights</h5>
                                    </div>
                                    <div className="space-y-2">
                                      {msg.insights.map((insight: string, i: number) => (
                                        <div key={i} className="flex items-start gap-2">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                          <p className="text-sm text-gray-700">{insight}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
                                <div className="bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 rounded-3xl border-2 border-blue-200 p-8 shadow-2xl space-y-6 transform hover:scale-[1.01] transition-all duration-300 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-green-100/20 rounded-3xl" />
                                  <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <h4 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent mb-3">{msg.structuredData.recipe.name}</h4>
                                        <div className="flex flex-wrap gap-3 text-sm">
                                          <span className="bg-white/80 px-3 py-1 rounded-full border border-blue-200 text-blue-700 font-medium">🍽️ {msg.structuredData.recipe.servings} servings</span>
                                          <span className="bg-white/80 px-3 py-1 rounded-full border border-green-200 text-green-700 font-medium">⏱️ {msg.structuredData.recipe.prepTime}</span>
                                          <span className="bg-white/80 px-3 py-1 rounded-full border border-orange-200 text-orange-700 font-medium">🔥 {msg.structuredData.recipe.cookTime}</span>
                                          <span className="bg-white/80 px-3 py-1 rounded-full border border-purple-200 text-purple-700 font-medium">📊 {msg.structuredData.recipe.difficulty}</span>
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm" className="rounded-full bg-white/80 border-2 border-blue-200 hover:bg-blue-50">
                                        <Bookmark className="w-4 h-4 mr-1" />
                                        Save
                                      </Button>
                                    </div>
                                    
                                    {/* Enhanced Nutrition Display */}
                                    <div className="bg-gradient-to-r from-blue-100/80 via-purple-100/60 to-green-100/80 p-6 rounded-2xl border border-blue-200/50 backdrop-blur-sm">
                                      <h5 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-blue-600" />
                                        Nutrition (per serving)
                                      </h5>
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="text-center bg-white/70 p-3 rounded-xl border border-blue-200/50">
                                          <div className="text-2xl font-bold text-blue-600 mb-1">{msg.structuredData.recipe.nutritionPerServing.calories}</div>
                                          <div className="text-xs text-gray-600 font-medium">CALORIES</div>
                                        </div>
                                        <div className="text-center bg-white/70 p-3 rounded-xl border border-green-200/50">
                                          <div className="text-2xl font-bold text-green-600 mb-1">{msg.structuredData.recipe.nutritionPerServing.protein}g</div>
                                          <div className="text-xs text-gray-600 font-medium">PROTEIN</div>
                                        </div>
                                        <div className="text-center bg-white/70 p-3 rounded-xl border border-orange-200/50">
                                          <div className="text-2xl font-bold text-orange-600 mb-1">{msg.structuredData.recipe.nutritionPerServing.carbs}g</div>
                                          <div className="text-xs text-gray-600 font-medium">CARBS</div>
                                        </div>
                                        <div className="text-center bg-white/70 p-3 rounded-xl border border-purple-200/50">
                                          <div className="text-2xl font-bold text-purple-600 mb-1">{msg.structuredData.recipe.nutritionPerServing.fat}g</div>
                                          <div className="text-xs text-gray-600 font-medium">FAT</div>
                                        </div>
                                        <div className="text-center bg-white/70 p-3 rounded-xl border border-teal-200/50">
                                          <div className="text-2xl font-bold text-teal-600 mb-1">{msg.structuredData.recipe.nutritionPerServing.fiber}g</div>
                                          <div className="text-xs text-gray-600 font-medium">FIBER</div>
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
                              
                              {/* Structured Response Card */}
                              {msg.responseCard && (
                                <Card className="border-0 rounded-2xl shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-green-50/30">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                      <Utensils className="w-5 h-5 text-blue-600" />
                                      {msg.responseCard.title}
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                      {msg.responseCard.summary}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {/* Macros Section */}
                                    {(msg.responseCard.macros.calories_kcal || msg.responseCard.macros.protein_g || msg.responseCard.macros.carbs_g || msg.responseCard.macros.fat_g) && (
                                      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl">
                                        <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                          <BarChart3 className="w-4 h-4 text-blue-600" />
                                          Nutrition Facts
                                        </h5>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                          {msg.responseCard.macros.calories_kcal && (
                                            <div className="text-center p-3 bg-white/80 rounded-lg">
                                              <div className="text-lg font-bold text-orange-600">{msg.responseCard.macros.calories_kcal}</div>
                                              <div className="text-xs text-gray-600">Calories</div>
                                            </div>
                                          )}
                                          {msg.responseCard.macros.protein_g && (
                                            <div className="text-center p-3 bg-white/80 rounded-lg">
                                              <div className="text-lg font-bold text-green-600">{msg.responseCard.macros.protein_g}g</div>
                                              <div className="text-xs text-gray-600">Protein</div>
                                            </div>
                                          )}
                                          {msg.responseCard.macros.carbs_g && (
                                            <div className="text-center p-3 bg-white/80 rounded-lg">
                                              <div className="text-lg font-bold text-blue-600">{msg.responseCard.macros.carbs_g}g</div>
                                              <div className="text-xs text-gray-600">Carbs</div>
                                            </div>
                                          )}
                                          {msg.responseCard.macros.fat_g && (
                                            <div className="text-center p-3 bg-white/80 rounded-lg">
                                              <div className="text-lg font-bold text-purple-600">{msg.responseCard.macros.fat_g}g</div>
                                              <div className="text-xs text-gray-600">Fat</div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Diet Flags */}
                                    {Object.values(msg.responseCard.diet_flags).some(flag => flag) && (
                                      <div className="space-y-2">
                                        <h5 className="font-semibold text-gray-800 text-sm">Diet Compatibility</h5>
                                        <div className="flex flex-wrap gap-2">
                                          {msg.responseCard.diet_flags.keto && <Badge className="bg-orange-100 text-orange-700">Keto-Friendly</Badge>}
                                          {msg.responseCard.diet_flags.vegan && <Badge className="bg-green-100 text-green-700">Vegan</Badge>}
                                          {msg.responseCard.diet_flags.vegetarian && <Badge className="bg-green-100 text-green-700">Vegetarian</Badge>}
                                          {msg.responseCard.diet_flags.gluten_free && <Badge className="bg-blue-100 text-blue-700">Gluten-Free</Badge>}
                                          {msg.responseCard.diet_flags.pcos_friendly && <Badge className="bg-purple-100 text-purple-700">PCOS-Friendly</Badge>}
                                        </div>
                                      </div>
                                    )}

                                    {/* Allergens Warning */}
                                    {msg.responseCard.allergens.length > 0 && (
                                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-orange-800 font-medium mb-1">
                                          <AlertCircle className="w-4 h-4" />
                                          Allergen Warning
                                        </div>
                                        <div className="text-sm text-orange-700">
                                          Contains: {msg.responseCard.allergens.join(', ')}
                                        </div>
                                      </div>
                                    )}

                                    {/* Ingredients */}
                                    {msg.responseCard.ingredients.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                          <Package className="w-4 h-4 text-blue-600" />
                                          Ingredients
                                        </h5>
                                        <div className="space-y-1">
                                          {msg.responseCard.ingredients.map((ingredient, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                              {ingredient}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Preparation Steps */}
                                    {msg.responseCard.preparation_steps.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                          <ChefHat className="w-4 h-4 text-purple-600" />
                                          Instructions
                                        </h5>
                                        <div className="space-y-2">
                                          {msg.responseCard.preparation_steps.map((step, i) => (
                                            <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                                                {i + 1}
                                              </div>
                                              <span className="leading-relaxed">{step}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Health Benefits */}
                                    {msg.responseCard.health_benefits.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                          <Leaf className="w-4 h-4 text-green-600" />
                                          Health Benefits
                                        </h5>
                                        <div className="space-y-1">
                                          {msg.responseCard.health_benefits.map((benefit, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                              {benefit}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Warnings */}
                                    {msg.responseCard.warnings.length > 0 && (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                                          <AlertCircle className="w-4 h-4" />
                                          Important Notes
                                        </div>
                                        <div className="space-y-1">
                                          {msg.responseCard.warnings.map((warning, i) => (
                                            <div key={i} className="text-sm text-red-700">{warning}</div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
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
                      </div>
                      );
                    })
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