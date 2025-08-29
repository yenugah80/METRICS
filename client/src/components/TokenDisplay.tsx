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
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "Voice Logging",
      icon: Mic,
      current: tokenInfo.voiceAnalysisTokens || 0,
      max: 5,
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "AI Recipes",
      icon: ChefHat,
      current: tokenInfo.recipeGenerationTokens || 0,
      max: 3,
      color: "from-green-500 to-emerald-500"
    }
  ];

  if (tokenInfo.isPremium) {
    return (
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">Premium Active</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
              Unlimited
            </Badge>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-800">Monthly Usage</CardTitle>
            <CardDescription className="text-slate-600">
              Resets {new Date(tokenInfo.lastTokenReset).toLocaleDateString()}
            </CardDescription>
          </div>
          {showUpgradePrompt && (
            <Button
              size="sm"
              className="btn-premium"
              onClick={() => navigate("/upgrade")}
            >
              <Zap className="h-4 w-4 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {tokenTypes.map((token, index) => {
            const Icon = token.icon;
            const percentage = (token.current / token.max) * 100;
            
            return (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-800 mb-1">
                  {token.current}/{token.max}
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2 mb-1"
                />
                <div className="text-xs text-slate-600">{token.name}</div>
              </div>
            );
          })}
        </div>
        
        {(tokenInfo.aiAnalysisTokens <= 3 || tokenInfo.voiceAnalysisTokens <= 1) && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-orange-800">
                Running low on tokens?
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/tokens")}
                  className="text-xs"
                >
                  Buy More
                </Button>
                <Button 
                  size="sm" 
                  className="btn-premium text-xs"
                  onClick={() => navigate("/upgrade")}
                >
                  Go Premium
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}