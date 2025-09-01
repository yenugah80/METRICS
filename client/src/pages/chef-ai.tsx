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
import { 
  Send, 
  Bot, 
  User, 
  ArrowLeft, 
  Sparkles, 
  MessageCircle, 
  Clock,
  Utensils,
  TrendingUp
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  mealCards?: Array<{
    mealId: string;
    mealName: string;
    calories: number;
    nutritionSummary: string;
  }>;
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
      setActiveConversationId(data.conversationId);
      setMessage('');
      
      // Invalidate and refetch conversations and messages
      queryClient.invalidateQueries({ queryKey: ['/api/chef-ai/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chef-ai/conversations', data.conversationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Message Failed",
        description: error.message || "ChefAI is taking a break. Please try again!",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationData?.messages]);

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
                  className={`cursor-pointer transition-colors border ${
                    activeConversationId === conversation.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveConversationId(conversation.id)}
                  data-testid={`card-conversation-${conversation.id}`}
                >
                  <CardContent className="p-3">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{conversation.title}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {conversation.messageCount} messages
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.lastInteractionAt).toLocaleDateString()}
                      </span>
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
                      <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-2xl ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                          <div className="flex items-start gap-3">
                            {msg.role === 'assistant' && (
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {msg.role === 'user' && (
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                            
                            <div className={`rounded-lg p-3 ${
                              msg.role === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/80 backdrop-blur-sm border text-gray-900'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                              
                              {/* Recipe Details Display */}
                              {msg.role === 'assistant' && (msg as any).recipeDetails && (
                                <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-3 border-b">
                                    <h4 className="font-bold text-lg text-gray-800">{(msg as any).recipeDetails.recipeName}</h4>
                                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                                      <span>Servings: <strong>{(msg as any).recipeDetails.servings}</strong></span>
                                      <span>Prep: <strong>{(msg as any).recipeDetails.prepTime}</strong></span>
                                      <span>Cook: <strong>{(msg as any).recipeDetails.cookTime}</strong></span>
                                    </div>
                                  </div>
                                  
                                  <div className="grid md:grid-cols-2 gap-6 p-4">
                                    {/* Ingredients */}
                                    <div>
                                      <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        Ingredients
                                      </h5>
                                      <ul className="space-y-2">
                                        {(msg as any).recipeDetails.ingredients.map((ingredient: any, idx: number) => (
                                          <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></span>
                                            <span><strong>{ingredient.amount}</strong> {ingredient.item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    {/* Instructions */}
                                    <div>
                                      <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        Instructions
                                      </h5>
                                      <ol className="space-y-3">
                                        {(msg as any).recipeDetails.instructions.map((instruction: string, idx: number) => (
                                          <li key={idx} className="text-sm text-gray-700 flex gap-3">
                                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                              {idx + 1}
                                            </span>
                                            <span>{instruction}</span>
                                          </li>
                                        ))}
                                      </ol>
                                    </div>
                                  </div>
                                  
                                  {/* Nutrition Breakdown */}
                                  <div className="bg-gray-50 px-4 py-3 border-t">
                                    <h5 className="font-semibold text-gray-800 mb-3">Nutrition Per Serving</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-green-600">{(msg as any).recipeDetails.nutritionPerServing.calories}</div>
                                        <div className="text-xs text-gray-500">Calories</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-blue-600">{(msg as any).recipeDetails.nutritionPerServing.protein}g</div>
                                        <div className="text-xs text-gray-500">Protein</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-purple-600">{(msg as any).recipeDetails.nutritionPerServing.carbs}g</div>
                                        <div className="text-xs text-gray-500">Carbs</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-orange-600">{(msg as any).recipeDetails.nutritionPerServing.fat}g</div>
                                        <div className="text-xs text-gray-500">Fat</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-teal-600">{(msg as any).recipeDetails.nutritionPerServing.fiber}g</div>
                                        <div className="text-xs text-gray-500">Fiber</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Meal Cards */}
                              {msg.mealCards && msg.mealCards.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {msg.mealCards.map((meal) => (
                                    <Card key={meal.mealId} className="border border-blue-200 bg-blue-50">
                                      <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <h4 className="font-medium text-sm">{meal.mealName}</h4>
                                            <p className="text-xs text-gray-600">{meal.nutritionSummary}</p>
                                          </div>
                                          <Badge variant="secondary">{meal.calories} cal</Badge>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}
                              
                              {/* Insights */}
                              {msg.nutritionContext?.insights && msg.nutritionContext.insights.length > 0 && (
                                <div className="mt-3 space-y-1">
                                  {msg.nutritionContext.insights.map((insight, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded p-2">
                                      <Sparkles className="w-3 h-3" />
                                      {insight}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-500 mt-2">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="bg-white/80 backdrop-blur-sm border-t p-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask ChefAI about your nutrition..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={sendMessageMutation.isPending}
                      className="flex-1"
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Welcome Screen - More Visual & Engaging */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-2xl text-center space-y-8">
                {/* Animated ChefAI Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                    <Bot className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-transparent mb-3">Meet ChefAI</h2>
                  <p className="text-gray-600 text-lg mb-6">
                    🍽️ Your AI nutrition coach is ready to help you eat better!
                  </p>
                </div>

                {/* Quick Action Chips */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">🚀 Quick Actions</h3>
                  <div className="grid gap-3 max-w-lg mx-auto">
                    {[
                      { text: "What's a healthy lunch today?", emoji: "🥗", color: "from-green-400 to-green-600" },
                      { text: "Suggest 400-calorie dinners", emoji: "🍽️", color: "from-blue-400 to-blue-600" },
                      { text: "How can I increase my protein?", emoji: "💪", color: "from-purple-400 to-purple-600" },
                      { text: "Make me a meal plan", emoji: "📋", color: "from-orange-400 to-orange-600" }
                    ].map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={`justify-start p-4 h-auto text-left hover:shadow-lg border-0 bg-gradient-to-r ${suggestion.color} text-white hover:scale-105 transition-all duration-200`}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        data-testid={`button-suggestion-${index}`}
                      >
                        <span className="text-xl mr-3">{suggestion.emoji}</span>
                        <span className="text-sm font-medium">{suggestion.text}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Visual Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Utensils className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-800 mb-2">🔍 Meal Analysis</h4>
                      <p className="text-sm text-gray-600">
                        Get instant insights about calories, macros, and nutrition quality
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-800 mb-2">📊 Progress Tracking</h4>
                      <p className="text-sm text-gray-600">
                        See your nutrition trends and celebrate improvements
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-800 mb-2">✨ Smart Coaching</h4>
                      <p className="text-sm text-gray-600">
                        Get personalized advice based on your goals and data
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Start Input */}
                <div className="max-w-md mx-auto">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask me anything about nutrition..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={sendMessageMutation.isPending}
                      className="bg-white/80 backdrop-blur-sm"
                      data-testid="input-welcome-message"
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                      data-testid="button-send-welcome-message"
                    >
                      <Send className="w-4 h-4" />
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