import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, Sparkles, Crown } from 'lucide-react';
import VoiceLogger from '@/components/VoiceLogger';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function VoiceLoggingPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleFoodLogged = (mealData: any) => {
    toast({
      title: "Success!",
      description: "Your meal has been logged via voice input",
    });
    
    // Navigate back to home or meals page
    navigate('/');
  };

  const handleUpgradeClick = () => {
    navigate('/subscribe');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Voice Logging</h1>
              {user?.isPremium && (
                <Badge className="bg-premium text-premium-foreground">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Feature Introduction */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Voice-Powered Meal Logging</h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Simply speak your meal description and our AI will automatically identify foods and quantities for instant logging.
          </p>
        </div>

        {/* Premium Features Highlight */}
        {!user?.isPremium && (
          <Card className="mb-6 border-premium/20 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-premium rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Unlock Premium Voice Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    <li>• Advanced natural language processing</li>
                    <li>• Brand name and variety recognition</li>
                    <li>• Higher accuracy food parsing</li>
                    <li>• Unlimited voice logging sessions</li>
                  </ul>
                  <Button 
                    onClick={handleUpgradeClick}
                    className="bg-premium hover:bg-premium/90"
                    size="sm"
                    data-testid="button-upgrade-premium"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How Voice Logging Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-lg">1</span>
                </div>
                <h4 className="font-medium mb-2">Speak Your Meal</h4>
                <p className="text-sm text-muted-foreground">
                  Describe what you ate with quantities: "I had two eggs and toast"
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-lg">2</span>
                </div>
                <h4 className="font-medium mb-2">AI Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI identifies foods and estimates quantities automatically
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-lg">3</span>
                </div>
                <h4 className="font-medium mb-2">Instant Logging</h4>
                <p className="text-sm text-muted-foreground">
                  Review and confirm to add to your nutrition tracking
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Logger Component */}
        <VoiceLogger 
          onFoodLogged={handleFoodLogged}
          onClose={() => navigate('/')}
        />

        {/* Tips for Best Results */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tips for Best Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm">Speak clearly and at a moderate pace</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm">Include specific quantities: "2 slices", "1 cup", "3 pieces"</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm">Mention cooking methods when relevant: "grilled chicken", "steamed rice"</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm">Use "and" to separate different foods: "apple and peanut butter"</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}