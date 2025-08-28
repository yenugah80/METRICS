import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Apple, Camera, Scan, Mic, Crown, Leaf, ChefHat, Target } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Apple className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">MyFoodMatrics</h1>
          </div>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="btn-gradient font-semibold"
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Smart Nutrition Tracking
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered food analysis, personalized insights, and comprehensive nutrition tracking. 
            Make every meal count with MyFoodMatrics.
          </p>
          <Button 
            size="lg" 
            className="btn-gradient font-semibold px-8 py-4 text-lg"
            onClick={() => window.location.href = '/dashboard'}
            data-testid="button-hero-cta"
          >
            Launch Dashboard
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="card-shadow border-0">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Photo Analysis</h3>
              <p className="text-muted-foreground">
                Snap a photo and get instant food recognition with detailed nutrition breakdown.
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow border-0">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Scan className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Barcode Scanner</h3>
              <p className="text-muted-foreground">
                Quick product lookup with comprehensive nutrition data from OpenFoodFacts database.
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow border-0">
            <CardContent className="p-6 relative">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                Voice Logging
                <Crown className="w-4 h-4 ml-2 text-premium" />
              </h3>
              <p className="text-muted-foreground">
                Speak your meals naturally and get intelligent food parsing with voice recognition.
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow border-0">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nutrition Scoring</h3>
              <p className="text-muted-foreground">
                Advanced A-E grading system based on macros, micronutrients, and processing levels.
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow border-0">
            <CardContent className="p-6 relative">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                Sustainability
                <Crown className="w-4 h-4 ml-2 text-premium" />
              </h3>
              <p className="text-muted-foreground">
                Track your environmental impact with CO₂, water usage, and sourcing insights.
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow border-0">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-4">
                <ChefHat className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Recipes</h3>
              <p className="text-muted-foreground">
                Personalized recipe recommendations based on your diet preferences and nutrition goals.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Premium CTA */}
        <Card className="bg-gradient-to-br from-secondary via-secondary to-primary card-shadow border-0 text-white">
          <CardContent className="p-8 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-premium" />
            <h3 className="text-2xl font-bold mb-2">Unlock Premium Features</h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Get advanced nutrition insights, unlimited recipes, voice logging, sustainability tracking, 
              and personalized coaching to reach your health goals faster.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
              <span className="flex items-center">
                <Mic className="w-4 h-4 mr-2 text-premium" />
                Voice Logging
              </span>
              <span className="flex items-center">
                <Leaf className="w-4 h-4 mr-2 text-premium" />
                Sustainability Scores
              </span>
              <span className="flex items-center">
                <ChefHat className="w-4 h-4 mr-2 text-premium" />
                Unlimited Recipes
              </span>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-secondary hover:bg-white/95 font-semibold px-8"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-premium-cta"
            >
              Start Free Trial - $6.99/mo
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white/50 backdrop-blur-lg mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          © 2025 MyFoodMatrics. Smart nutrition tracking for a healthier you.
        </div>
      </footer>
    </div>
  );
}
