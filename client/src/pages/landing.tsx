import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  return (
    <div className="min-h-screen relative z-10">
      <main className="container mx-auto px-6 py-16 max-w-7xl">
        {/* Dreamy Hero Section */}
        <div className="text-center mb-32">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-8 glow-card border-0 text-blue-600 px-8 py-3 text-sm tracking-wider uppercase font-medium">
              Revolutionary Nutrition Intelligence
            </Badge>
            
            <h1 className="professional-heading text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-none text-gradient bg-gradient-to-br from-blue-600 via-purple-500 to-teal-500 bg-clip-text text-transparent">
              Master Your
              <br />
              <span className="bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Nutrition
              </span>
            </h1>
            
            <p className="body-text text-xl lg:text-2xl text-blue-600/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              The only nutrition tracking application that understands your food through advanced artificial intelligence, 
              providing precise macro-nutrient analysis and personalized health insights.
            </p>
            
            {/* Creative CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button 
                size="lg"
                className="btn-gradient px-12 py-6 text-lg font-medium h-auto rounded-2xl transform hover:scale-105"
                onClick={() => window.location.href = '/auth'}
                data-testid="button-signup-cta"
              >
                Begin Your Journey
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="btn-outline-glow px-10 py-6 text-lg font-medium h-auto rounded-2xl"
                onClick={() => window.location.href = '/demo'}
                data-testid="button-demo"
              >
                View Demonstration
              </Button>
            </div>
            
            {/* Floating Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="glow-card p-6 rounded-3xl float-animation">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">99.7%</div>
                <div className="text-sm text-blue-600/70 uppercase tracking-wide mt-2">Accuracy Rate</div>
              </div>
              <div className="glow-card p-6 rounded-3xl float-animation" style={{animationDelay: '2s'}}>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-teal-500 bg-clip-text text-transparent">2M+</div>
                <div className="text-sm text-blue-600/70 uppercase tracking-wide mt-2">Food Database</div>
              </div>
              <div className="glow-card p-6 rounded-3xl float-animation" style={{animationDelay: '4s'}}>
                <div className="text-3xl font-bold bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">&lt; 2s</div>
                <div className="text-sm text-blue-600/70 uppercase tracking-wide mt-2">Analysis Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Glowing Features Section */}
        <div className="mb-32">
          <div className="text-center mb-20">
            <h2 className="professional-heading text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-br from-blue-600 via-purple-500 to-teal-500 bg-clip-text text-transparent">
              Comprehensive Nutrition Intelligence
            </h2>
            <p className="body-text text-xl text-blue-600/80 max-w-3xl mx-auto">
              Advanced technologies working in harmony to provide unprecedented insight into your nutritional intake and health trajectory.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* AI-Powered Food Recognition - Hero Feature */}
            <Card className="glow-card-hero border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-12">
                <div className="mb-8">
                  <Badge className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border-blue-300/30 px-6 py-3 rounded-full">
                    Primary Technology
                  </Badge>
                  <h3 className="professional-heading text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Artificial Intelligence
                    <br />
                    Food Recognition
                  </h3>
                  <p className="body-text text-lg text-blue-600/70 leading-relaxed mb-8">
                    Revolutionary computer vision technology that instantly identifies food items, estimates portion sizes, 
                    and calculates precise nutritional data. Our proprietary algorithms analyze texture, color, and shape 
                    to deliver unparalleled accuracy in nutritional assessment.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-blue-200/30">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 mb-2">99.7%</div>
                    <div className="text-sm text-blue-500/60">Recognition Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 mb-2">Instant</div>
                    <div className="text-sm text-blue-500/60">Processing Speed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 mb-2">2M+</div>
                    <div className="text-sm text-blue-500/60">Food Database</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personalized Recommendations */}
            <Card className="glow-card-hero border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-12">
                <div className="mb-8">
                  <Badge className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border-blue-300/30 px-6 py-3 rounded-full">
                    Machine Learning
                  </Badge>
                  <h3 className="professional-heading text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Personalized Meal
                    <br />
                    Recommendations
                  </h3>
                  <p className="body-text text-lg text-blue-600/70 leading-relaxed mb-8">
                    Advanced machine learning algorithms analyze your dietary preferences, nutritional requirements, 
                    and health objectives to provide customized meal suggestions that align with your lifestyle and goals.
                  </p>
                </div>
                
                <div className="space-y-4 pt-8 border-t border-blue-200/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600/60">Dietary Preferences</span>
                    <span className="text-sm font-medium text-blue-700">Adaptive Learning</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600/60">Nutritional Goals</span>
                    <span className="text-sm font-medium text-blue-700">Precision Targeting</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600/60">Health Objectives</span>
                    <span className="text-sm font-medium text-blue-700">Intelligent Optimization</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Voice Logging */}
            <Card className="glow-card border-0 rounded-3xl overflow-hidden pulse-glow">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-700 border-yellow-300/30 px-4 py-2 text-xs rounded-full">
                  Premium Feature
                </Badge>
                <h3 className="professional-heading text-xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Voice-Powered Logging
                </h3>
                <p className="body-text text-blue-600/70 leading-relaxed mb-6">
                  Advanced speech recognition technology enables hands-free nutrition tracking. 
                  Simply speak your meal description for automatic identification and logging.
                </p>
                <div className="text-sm text-blue-500/60">
                  Natural language processing • Contextual understanding • Instant transcription
                </div>
              </CardContent>
            </Card>

            {/* Sustainability Analysis */}
            <Card className="glow-card border-0 rounded-3xl overflow-hidden pulse-glow" style={{animationDelay: '1.5s'}}>
              <CardContent className="p-8">
                <Badge className="mb-4 bg-gradient-to-r from-green-400/20 to-emerald-400/20 text-green-700 border-green-300/30 px-4 py-2 text-xs rounded-full">
                  Premium Feature
                </Badge>
                <h3 className="professional-heading text-xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Environmental Impact
                </h3>
                <p className="body-text text-blue-600/70 leading-relaxed mb-6">
                  Comprehensive analysis of carbon footprint, water usage, and ethical sourcing 
                  for every meal, enabling environmentally conscious dietary decisions.
                </p>
                <div className="text-sm text-blue-500/60">
                  Carbon tracking • Water footprint • Ethical sourcing scores
                </div>
              </CardContent>
            </Card>

            {/* Advanced Analytics */}
            <Card className="glow-card border-0 rounded-3xl overflow-hidden pulse-glow" style={{animationDelay: '3s'}}>
              <CardContent className="p-8">
                <Badge className="mb-4 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 text-blue-700 border-blue-300/30 px-4 py-2 text-xs rounded-full">
                  Analytics Platform
                </Badge>
                <h3 className="professional-heading text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Health Trend Analysis
                </h3>
                <p className="body-text text-blue-600/70 leading-relaxed mb-6">
                  Sophisticated analytics engine that correlates nutritional intake with energy levels, 
                  mood patterns, and overall health metrics for comprehensive insights.
                </p>
                <div className="text-sm text-blue-500/60">
                  Trend identification • Pattern analysis • Predictive modeling
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Premium Section with Gradient Magic */}
        <Card className="glow-card-hero border-0 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-indigo-50/50">
          <CardContent className="p-16 text-center">
            <Badge className="mb-8 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-yellow-700 border-yellow-300/40 px-8 py-4 text-sm rounded-full">
              Professional Subscription
            </Badge>
            
            <h3 className="professional-heading text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
              Advanced Nutrition Mastery
            </h3>
            
            <p className="body-text text-xl text-blue-600/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              Unlock the complete suite of professional-grade nutrition tools, including voice logging, 
              sustainability tracking, unlimited recipe generation, and advanced health analytics.
            </p>
            
            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <div className="space-y-3">
                <div className="text-sm font-medium text-blue-700">Voice Logging</div>
                <div className="text-xs text-blue-600/60">Hands-free tracking</div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-medium text-blue-700">Sustainability Metrics</div>
                <div className="text-xs text-blue-600/60">Environmental impact</div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-medium text-blue-700">Unlimited Recipes</div>
                <div className="text-xs text-blue-600/60">AI-generated meals</div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-medium text-blue-700">Advanced Analytics</div>
                <div className="text-xs text-blue-600/60">Health insights</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="btn-gradient px-16 py-6 text-lg font-medium h-auto rounded-2xl transform hover:scale-105"
                onClick={() => window.location.href = '/dashboard'}
                data-testid="button-premium-cta"
              >
                Start Professional Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="btn-outline-glow px-12 py-6 text-lg font-medium h-auto rounded-2xl"
                onClick={() => window.location.href = '/dashboard'}
                data-testid="button-free-trial"
              >
                Continue with Basic
              </Button>
            </div>
            
            <p className="text-sm text-blue-600/60 mt-8">
              Seven-day complimentary trial • No payment required • $6.99 monthly thereafter
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Dreamy Footer */}
      <footer className="border-t border-blue-200/30 bg-gradient-to-r from-purple-50/30 to-pink-50/30 mt-32 relative z-10">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">
            <h3 className="professional-heading text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              MyFoodMatrics
            </h3>
            <p className="body-text text-blue-600/70 mb-8">
              Professional nutrition intelligence for optimal health outcomes.
            </p>
            <p className="text-sm text-blue-500/60">
              © 2025 MyFoodMatrics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}