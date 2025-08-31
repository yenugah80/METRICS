import { useState } from "react";
import { VoiceAssistant } from "@/components/data-display/VoiceAssistant";
import { TokenDisplay } from "@/components/business/TokenDisplay";

interface TokenInfo {
  aiAnalysisTokens: number;
  voiceAnalysisTokens: number;
  recipeGenerationTokens: number;
  isPremium: boolean;
  lastTokenReset: string;
}
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useLocalAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Heart, Brain, Lightbulb } from "lucide-react";

export default function VoiceAssistantPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: tokenInfo } = useQuery<TokenInfo>({
    queryKey: ['/api/user/tokens'],
    enabled: !!user
  });

  const handleTokenUsed = () => {
    // Invalidate token info to refresh the display
    queryClient.invalidateQueries({ queryKey: ['/api/user/tokens'] });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="ios-card p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center text-white mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Sign In Required</h2>
          <p className="text-neutral-600 mb-4">
            You need to sign in to use the voice assistant feature.
          </p>
          <a 
            href="/auth" 
            className="inline-block rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Sign In
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-indigo-50/30 to-purple-50/40 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg backdrop-blur-sm border border-emerald-200/50">
            <Sparkles className="w-4 h-4" />
            AI-Powered Voice Assistant
          </div>
          <h1 className="text-[32px] font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-4">
            Talk to Nutri, Your Personal Nutrition Coach
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed text-lg">
            Have natural conversations about nutrition, get meal recommendations, understand food labels, 
            and receive personalized health advice through voice interactions.
          </p>
        </div>

        {/* Token Display */}
        {tokenInfo && (
          <div className="mb-8">
            <TokenDisplay tokenInfo={tokenInfo} showUpgradePrompt />
          </div>
        )}

        {/* Voice Assistant Component */}
        <VoiceAssistant onTokenUsed={handleTokenUsed} />

        {/* Features Overview */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white/80 to-emerald-50/60 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6 text-center group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-105 transition-all duration-200 shadow-lg">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">Smart Nutrition Analysis</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Ask about any food and get detailed nutritional breakdown, health benefits, and dietary information.
            </p>
          </div>

          <div className="ios-card p-6 text-center group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-105 transition-all duration-200">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">Personalized Recommendations</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Get meal suggestions tailored to your dietary preferences, restrictions, and health goals.
            </p>
          </div>

          <div className="ios-card p-6 text-center group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-105 transition-all duration-200">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">Cooking & Health Tips</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Learn cooking techniques, food storage tips, and healthy eating strategies through conversation.
            </p>
          </div>
        </div>

        {/* Example Questions */}
        <div className="mt-12 ios-card p-6">
          <h3 className="font-semibold text-neutral-900 mb-4 text-center">
            Try asking Nutri questions like:
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              "What are the health benefits of avocados?",
              "Can you suggest a high-protein breakfast?",
              "How many calories are in a banana?",
              "What foods are rich in vitamin D?",
              "Is quinoa better than rice for weight loss?",
              "How can I increase my fiber intake?"
            ].map((question, index) => (
              <div key={index} className="bg-neutral-50 rounded-xl px-4 py-3 text-sm text-neutral-700 border border-neutral-200">
                "{question}"
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}