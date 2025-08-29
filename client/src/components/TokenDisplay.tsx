import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, Mic, ChefHat, Crown, Zap } from "lucide-react";
import { useLocation } from "wouter";

interface TokenInfo {
  aiAnalysisTokens: number;
  voiceAnalysisTokens: number;
  recipeGenerationTokens: number;
  isPremium: boolean;
  lastTokenReset: string;
}

interface TokenDisplayProps {
  tokenInfo: TokenInfo;
  showUpgradePrompt?: boolean;
}

export function TokenDisplay({ tokenInfo, showUpgradePrompt = false }: TokenDisplayProps) {
  const [, navigate] = useLocation();

  const tokenTypes = [
    {
      name: "Food Analysis",
      icon: Camera,
      current: tokenInfo.aiAnalysisTokens || 0,
      max: 20,
      color: "from-indigo-500 to-indigo-600"
    },
    {
      name: "Voice Logging",
      icon: Mic,
      current: tokenInfo.voiceAnalysisTokens || 0,
      max: 5,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      name: "AI Recipes",
      icon: ChefHat,
      current: tokenInfo.recipeGenerationTokens || 0,
      max: 3,
      color: "from-indigo-500 to-emerald-500"
    }
  ];

  if (tokenInfo.isPremium) {
    return (
      <div className="rounded-2xl border border-white/50 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Premium Active</h3>
                <p className="text-sm text-neutral-600">Unlimited access to all features</p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 rounded-full px-3 py-1 text-xs font-medium">
              Unlimited
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/50 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-neutral-900">Monthly Usage</h3>
            <p className="text-sm text-neutral-600">
              Resets {new Date(tokenInfo.lastTokenReset).toLocaleDateString()}
            </p>
          </div>
          {showUpgradePrompt && (
            <button
              className="rounded-full bg-black text-white px-4 py-2 text-[14px] font-medium hover:opacity-90 transition-opacity"
              onClick={() => navigate("/upgrade")}
            >
              <Zap className="h-3 w-3 mr-1.5 inline" />
              Upgrade
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {tokenTypes.map((token, index) => {
            const Icon = token.icon;
            const percentage = (token.current / token.max) * 100;
            
            return (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${token.color} flex items-center justify-center text-white shadow-sm`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-[17px] font-semibold text-neutral-900 mb-2">
                  {token.current}/{token.max}
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 bg-gradient-to-r ${token.color} rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-[13px] font-medium text-neutral-600">{token.name}</div>
              </div>
            );
          })}
        </div>
        
        {(tokenInfo.aiAnalysisTokens <= 3 || tokenInfo.voiceAnalysisTokens <= 1) && (
          <div className="mt-4 p-3 rounded-xl bg-orange-50/80 border border-orange-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-medium text-orange-800">
                Running low on tokens?
              </div>
              <div className="flex space-x-2">
                <button 
                  className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[12px] font-medium backdrop-blur hover:bg-white transition-colors"
                  onClick={() => navigate("/tokens")}
                >
                  Buy More
                </button>
                <button 
                  className="rounded-full bg-black text-white px-3 py-1.5 text-[12px] font-medium hover:opacity-90 transition-opacity"
                  onClick={() => navigate("/upgrade")}
                >
                  Go Premium
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}