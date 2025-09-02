import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Mic, 
  Users, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Database,
  Sparkles,
  Activity,
  BarChart3,
  MessageCircle,
  Bot
} from 'lucide-react';

interface AIInsights {
  personalized_insights: Array<{
    type: 'warning' | 'suggestion' | 'achievement' | 'trend';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    actionable: boolean;
    data?: Record<string, any>;
  }>;
  voice_learning: {
    total_voice_logs: number;
    common_foods: Array<{pattern: string; frequency: number}>;
    eating_habits: Array<{pattern: string; frequency: number}>;
    health_trends: Array<{pattern: string; frequency: number}>;
    voice_accuracy: number;
  };
  collaborative_suggestions: string[];
  learning_patterns: {
    total_patterns: number;
    eating_habits: number;
    preferences: number;
    health_trends: number;
  };
  knowledge_base: {
    nutrition_facts: number;
    recipe_database: number;
    dietary_guidelines: number;
    user_preferences: number;
  };
  ai_capabilities: {
    memory_store: boolean;
    rag_system: boolean;
    voice_mapping: boolean;
    collaborative_filtering: boolean;
    pattern_recognition: boolean;
  };
}

const AIInsightsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('insights');

  // Fetch AI insights
  const { data: aiInsights, isLoading, error } = useQuery<AIInsights>({
    queryKey: ['/api/ai/insights'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch knowledge base stats
  const { data: knowledgeStats } = useQuery({
    queryKey: ['/api/ai/knowledge-base-stats'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="relative">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
          <div className="absolute inset-0 animate-pulse w-12 h-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-75" />
        </div>
        <div className="ml-4">
          <p className="text-lg font-semibold text-gray-700">Loading AI Insights</p>
          <p className="text-sm text-gray-500">Analyzing your patterns...</p>
        </div>
      </div>
    );
  }

  if (error || !aiInsights) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load AI insights. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'achievement': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'trend': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default: return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* AI Capabilities Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">AI Intelligence Dashboard</h1>
            <p className="text-blue-100">Advanced machine learning insights for personalized nutrition</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(aiInsights.ai_capabilities).map(([capability, enabled]) => (
            <div key={capability} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm capitalize">{capability.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice AI
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="collaborative" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Social AI
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Knowledge
          </TabsTrigger>
        </TabsList>

        {/* Personalized Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Personalized Nutrition Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiInsights.personalized_insights.map((insight, index) => (
                <div 
                  key={index}
                  className="flex gap-4 p-4 rounded-lg border bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex-shrink-0">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800">{insight.title}</h4>
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{insight.message}</p>
                    {insight.actionable && (
                      <Button size="sm" variant="outline" className="text-xs">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice AI Tab */}
        <TabsContent value="voice" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-blue-500" />
                  Voice Learning Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-blue-50">
                    <div className="text-2xl font-bold text-blue-600">
                      {aiInsights.voice_learning.total_voice_logs}
                    </div>
                    <div className="text-sm text-gray-600">Voice Logs</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <div className="text-2xl font-bold text-green-600">
                      {aiInsights.voice_learning.voice_accuracy}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Common Foods from Voice
                  </h4>
                  {aiInsights.voice_learning.common_foods.map((food, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <span className="text-sm">{food.pattern.replace('likes_', '')}</span>
                      <Badge variant="secondary">{food.frequency}x</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-500" />
                  Semantic Understanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Voice Processing Features</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Food Recognition</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mood Detection</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Portion Estimation</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Context Understanding</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learning Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                AI Learning Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {aiInsights.learning_patterns.eating_habits}
                  </div>
                  <div className="text-sm font-semibold text-orange-700">Eating Habits</div>
                  <div className="text-xs text-gray-600 mt-1">Tracked patterns</div>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {aiInsights.learning_patterns.preferences}
                  </div>
                  <div className="text-sm font-semibold text-blue-700">Preferences</div>
                  <div className="text-xs text-gray-600 mt-1">Food likes/dislikes</div>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {aiInsights.learning_patterns.health_trends}
                  </div>
                  <div className="text-sm font-semibold text-green-700">Health Trends</div>
                  <div className="text-xs text-gray-600 mt-1">Progress patterns</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  Total AI Memory Patterns: {aiInsights.learning_patterns.total_patterns}
                </h4>
                <Progress 
                  value={(aiInsights.learning_patterns.total_patterns / 100) * 100} 
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Your AI is constantly learning from your nutrition habits to provide better recommendations
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collaborative AI Tab */}
        <TabsContent value="collaborative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-500" />
                Collaborative Filtering Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiInsights.collaborative_suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                    <Users className="w-5 h-5 text-teal-500 mt-0.5" />
                    <div>
                      <p className="text-gray-700">{suggestion}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on users with similar preferences
                      </p>
                    </div>
                  </div>
                ))}
                
                {aiInsights.collaborative_suggestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Keep logging meals to unlock collaborative recommendations!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                AI Knowledge Base & RAG System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Knowledge Sources</h4>
                  {Object.entries(aiInsights.knowledge_base).map(([source, count]) => (
                    <div key={source} className="flex justify-between items-center p-3 rounded-lg bg-indigo-50">
                      <span className="capitalize text-sm">{source.replace('_', ' ')}</span>
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                        {count} entries
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">RAG Features</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Retrieval Augmented Generation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Vector Memory Store</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Contextual Understanding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Personalized Responses</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {knowledgeStats && (
                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                  <h4 className="font-semibold mb-2">System Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">AI Systems: </span>
                      <span className="font-semibold text-green-600">All Active</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Knowledge: </span>
                      <span className="font-semibold text-blue-600">Up to Date</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInsightsDashboard;