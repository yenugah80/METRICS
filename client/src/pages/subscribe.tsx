import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useLocalAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  ArrowLeft, 
  Check, 
  Mic, 
  Leaf, 
  ChefHat, 
  Target,
  Shield,
  BarChart3,
  Sparkles 
} from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to Premium!",
        description: "You are now subscribed to Premium!",
      });
      navigate("/");
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="subscribe-form">
      <Card className="card-shadow border-0 rounded-2xl mb-6">
        <CardContent className="p-6">
          <PaymentElement />
          <Button 
            type="submit" 
            className="w-full mt-6 btn-gradient py-3 text-lg font-semibold"
            disabled={!stripe || !elements}
            data-testid="button-confirm-payment"
          >
            <Crown className="w-5 h-5 mr-2" />
            Subscribe to Premium
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

export default function Subscribe() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Get or create subscription
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user is already premium
      if (user.isPremium) {
        toast({
          title: "Already Premium",
          description: "You already have a premium subscription!",
        });
        navigate("/");
        return;
      }

      // Create subscription
      const createSubscription = async () => {
        try {
          const response = await apiRequest("POST", "/api/create-subscription");
          const data = await response.json();
          setClientSecret(data.clientSecret);
        } catch (error) {
          if (isUnauthorizedError(error as Error)) {
            toast({
              title: "Unauthorized",
              description: "You are logged out. Logging in again...",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = "/api/login";
            }, 500);
            return;
          }
          console.error('Error creating subscription:', error);
          toast({
            title: "Subscription Error",
            description: "Failed to create subscription. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingSubscription(false);
        }
      };

      createSubscription();
    }
  }, [isAuthenticated, user, navigate, toast]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isLoadingSubscription || !clientSecret) {
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
              <h1 className="text-xl font-bold text-foreground">Premium Subscription</h1>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Setting up your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-foreground">Premium Subscription</h1>
          </div>
          <Crown className="w-6 h-6 text-premium" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* Premium Features Overview */}
        <Card className="bg-gradient-to-br from-secondary via-secondary to-primary card-shadow border-0 rounded-2xl text-white mb-6" data-testid="premium-overview">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 mx-auto mb-4 text-premium" />
            <h2 className="text-2xl font-bold mb-2">Premium Subscription</h2>
            <p className="text-white/90 mb-6">
              Unlock advanced nutrition insights, unlimited recipes, and personalized coaching
            </p>
            <Badge variant="secondary" className="bg-premium text-premium-foreground text-lg px-4 py-2 font-bold">
              $6.99/month
            </Badge>
          </CardContent>
        </Card>

        {/* Features List */}
        <Card className="card-shadow border-0 rounded-2xl mb-6" data-testid="premium-features">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-premium" />
              Premium Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Mic className="w-4 h-4 text-secondary" />
                  <h3 className="font-semibold">Voice Logging</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Log meals using natural speech recognition. Just speak what you ate!
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Leaf className="w-4 h-4 text-success" />
                  <h3 className="font-semibold">Sustainability Tracking</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Track environmental impact with CO₂, water usage, and sourcing insights.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <ChefHat className="w-4 h-4 text-warning" />
                  <h3 className="font-semibold">Unlimited Recipes</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Access unlimited personalized recipes with mood filters and shopping lists.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold">Advanced Allergen Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Detailed allergen detection with severity levels and safety conditions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-4 h-4 text-danger" />
                  <h3 className="font-semibold">Wellness Tracking</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Monitor biometrics, mood-food connections, and personalized health insights.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-info" />
                  <h3 className="font-semibold">Advanced Analytics</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Detailed nutrition reports, trends analysis, and progress tracking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SubscribeForm />
        </Elements>

        {/* Terms and Guarantee */}
        <Card className="bg-muted/5 border-0 rounded-2xl" data-testid="subscription-terms">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">30-Day Money Back Guarantee</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try Premium risk-free! Cancel anytime within 30 days for a full refund.
            </p>
            <div className="flex justify-center space-x-6 text-xs text-muted-foreground">
              <span>✓ Cancel anytime</span>
              <span>✓ No hidden fees</span>
              <span>✓ Secure payments</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
