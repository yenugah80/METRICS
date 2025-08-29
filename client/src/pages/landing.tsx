import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-16 max-w-7xl">
        {/* Professional Hero Section */}
        <div className="text-center mb-32">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-8 bg-muted text-muted-foreground border-border px-6 py-2 text-sm tracking-wide uppercase">
              Revolutionary Nutrition Intelligence
            </Badge>
            
            <h1 className="professional-heading text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-none">
              Master Your
              <br />
              <span className="text-primary">Nutrition</span>
            </h1>
            
            <p className="body-text text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              The only nutrition tracking application that understands your food through advanced artificial intelligence, 
              providing precise macro-nutrient analysis and personalized health insights.
            </p>
            
            {/* Professional CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-medium h-auto"
                onClick={() => window.location.href = '/auth'}
                data-testid="button-signup-cta"
              >
                Begin Your Journey
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-border text-foreground hover:bg-muted px-8 py-4 text-lg font-medium h-auto"
                onClick={() => window.location.href = '/demo'}
                data-testid="button-demo"
              >
                View Demonstration
              </Button>
            </div>
            
            {/* Trust Indicators - Professional */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">99.7%</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">Accuracy Rate</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">2M+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">Food Database</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">&lt; 2s</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">Analysis Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Features Section */}
        <div className="mb-32">
          <div className="text-center mb-20">
            <h2 className="professional-heading text-4xl lg:text-5xl font-bold mb-6">
              Comprehensive Nutrition Intelligence
            </h2>
            <p className="body-text text-xl text-muted-foreground max-w-3xl mx-auto">
              Advanced technologies working in harmony to provide unprecedented insight into your nutritional intake and health trajectory.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* AI-Powered Food Recognition - Hero Feature */}
            <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-12">
                <div className="mb-8">
                  <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-2">
                    Primary Technology
                  </Badge>
                  <h3 className="professional-heading text-3xl font-bold mb-6">
                    Artificial Intelligence
                    <br />
                    Food Recognition
                  </h3>
                  <p className="body-text text-lg text-muted-foreground leading-relaxed mb-8">
                    Revolutionary computer vision technology that instantly identifies food items, estimates portion sizes, 
                    and calculates precise nutritional data. Our proprietary algorithms analyze texture, color, and shape 
                    to deliver unparalleled accuracy in nutritional assessment.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary mb-2">99.7%</div>
                    <div className="text-sm text-muted-foreground">Recognition Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary mb-2">Instant</div>
                    <div className="text-sm text-muted-foreground">Processing Speed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary mb-2">2M+</div>
                    <div className="text-sm text-muted-foreground">Food Database</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personalized Recommendations */}
            <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-12">
                <div className="mb-8">
                  <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20 px-4 py-2">
                    Machine Learning
                  </Badge>
                  <h3 className="professional-heading text-3xl font-bold mb-6">
                    Personalized Meal
                    <br />
                    Recommendations
                  </h3>
                  <p className="body-text text-lg text-muted-foreground leading-relaxed mb-8">
                    Advanced machine learning algorithms analyze your dietary preferences, nutritional requirements, 
                    and health objectives to provide customized meal suggestions that align with your lifestyle and goals.
                  </p>
                </div>
                
                <div className="space-y-4 pt-8 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Dietary Preferences</span>
                    <span className="text-sm font-medium">Adaptive Learning</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nutritional Goals</span>
                    <span className="text-sm font-medium">Precision Targeting</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Health Objectives</span>
                    <span className="text-sm font-medium">Intelligent Optimization</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Voice Logging */}
            <Card className="border border-border shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-premium/10 text-premium border-premium/20 px-3 py-1 text-xs">
                  Premium Feature
                </Badge>
                <h3 className="professional-heading text-xl font-bold mb-4">
                  Voice-Powered Logging
                </h3>
                <p className="body-text text-muted-foreground leading-relaxed mb-6">
                  Advanced speech recognition technology enables hands-free nutrition tracking. 
                  Simply speak your meal description for automatic identification and logging.
                </p>
                <div className="text-sm text-muted-foreground">
                  Natural language processing • Contextual understanding • Instant transcription
                </div>
              </CardContent>
            </Card>

            {/* Sustainability Analysis */}
            <Card className="border border-border shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-premium/10 text-premium border-premium/20 px-3 py-1 text-xs">
                  Premium Feature
                </Badge>
                <h3 className="professional-heading text-xl font-bold mb-4">
                  Environmental Impact
                </h3>
                <p className="body-text text-muted-foreground leading-relaxed mb-6">
                  Comprehensive analysis of carbon footprint, water usage, and ethical sourcing 
                  for every meal, enabling environmentally conscious dietary decisions.
                </p>
                <div className="text-sm text-muted-foreground">
                  Carbon tracking • Water footprint • Ethical sourcing scores
                </div>
              </CardContent>
            </Card>

            {/* Advanced Analytics */}
            <Card className="border border-border shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-accent/10 text-accent border-accent/20 px-3 py-1 text-xs">
                  Analytics Platform
                </Badge>
                <h3 className="professional-heading text-xl font-bold mb-4">
                  Health Trend Analysis
                </h3>
                <p className="body-text text-muted-foreground leading-relaxed mb-6">
                  Sophisticated analytics engine that correlates nutritional intake with energy levels, 
                  mood patterns, and overall health metrics for comprehensive insights.
                </p>
                <div className="text-sm text-muted-foreground">
                  Trend identification • Pattern analysis • Predictive modeling
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Professional Premium Section */}
        <Card className="border-2 border-border shadow-xl bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-16 text-center">
            <Badge className="mb-8 bg-premium/10 text-premium border-premium/20 px-6 py-3 text-sm">
              Professional Subscription
            </Badge>
            
            <h3 className="professional-heading text-4xl font-bold mb-6">
              Advanced Nutrition Mastery
            </h3>
            
            <p className="body-text text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Unlock the complete suite of professional-grade nutrition tools, including voice logging, 
              sustainability tracking, unlimited recipe generation, and advanced health analytics.
            </p>
            
            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Voice Logging</div>
                <div className="text-xs text-muted-foreground">Hands-free tracking</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Sustainability Metrics</div>
                <div className="text-xs text-muted-foreground">Environmental impact</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Unlimited Recipes</div>
                <div className="text-xs text-muted-foreground">AI-generated meals</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Advanced Analytics</div>
                <div className="text-xs text-muted-foreground">Health insights</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-premium hover:bg-premium/90 text-premium-foreground px-12 py-4 text-lg font-medium h-auto"
                onClick={() => window.location.href = '/dashboard'}
                data-testid="button-premium-cta"
              >
                Start Professional Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-border text-foreground hover:bg-muted px-8 py-4 text-lg font-medium h-auto"
                onClick={() => window.location.href = '/dashboard'}
                data-testid="button-free-trial"
              >
                Continue with Basic
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6">
              Seven-day complimentary trial • No payment required • $6.99 monthly thereafter
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Professional Footer */}
      <footer className="border-t border-border bg-muted/20 mt-32">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">
            <h3 className="professional-heading text-2xl font-bold mb-4">MyFoodMatrics</h3>
            <p className="body-text text-muted-foreground mb-8">
              Professional nutrition intelligence for optimal health outcomes.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 MyFoodMatrics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}