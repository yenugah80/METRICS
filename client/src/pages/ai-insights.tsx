import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIInsightsDashboard from '@/components/ai/AIInsightsDashboard';
import VoiceInputComponent from '@/components/ai/VoiceInputComponent';
import { Brain, Mic } from 'lucide-react';

const AIInsightsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI Intelligence Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the power of advanced AI: Vector Memory Store, RAG System, Voice Semantic Mapping, and Collaborative Filtering for personalized nutrition insights.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Dashboard
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AIInsightsDashboard />
          </TabsContent>

          <TabsContent value="voice">
            <VoiceInputComponent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIInsightsPage;