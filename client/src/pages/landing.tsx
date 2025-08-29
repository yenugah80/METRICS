import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BarChart3, CheckCircle, Brain, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen relative z-10">
      <main className="container mx-auto px-6 py-16 max-w-7xl">
        {/* iOS-Inspired Hero Section */}
        <section className="relative">
          {/* Calm brand background with radial gradients */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_-10%,rgba(99,102,241,.12),transparent_60%),radial-gradient(40%_60%_at_-10%_40%,rgba(16,185,129,.10),transparent_60%)]" />
          
          <div className="mx-auto w-[min(1100px,92%)] pt-24 pb-16 text-center">
            <p className="text-[13px] font-medium tracking-wide text-emerald-700/80 mb-4">
              Master your nutrition with AI-powered precision
            </p>
            
            <h1 className="mt-4 text-[44px] md:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-neutral-900 mb-6">
              Stop Guessing, <span className="text-emerald-700">Start Knowing</span>
            </h1>
            
            <p className="mx-auto mt-4 max-w-[720px] text-[16px] leading-7 text-neutral-600 mb-8">
              Photo, barcode, or voice—get instant macro & micro insights with a clean, iOS-grade experience.
            </p>

            {/* Distinct iOS-style CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 mb-16">
              <button
                className="rounded-full bg-neutral-900 text-white px-5 py-[10px] text-[15px] font-medium hover:opacity-90 transition-opacity ios-interactive"
                onClick={() => window.location.href = '/auth'}
                data-testid="button-signup-cta"
              >
                Begin Your Journey
              </button>
              <button
                className="rounded-full border border-black/10 bg-white/70 px-5 py-[10px] text-[15px] font-medium backdrop-blur hover:bg-white transition-colors ios-interactive"
                onClick={() => window.location.href = '/demo'}
                data-testid="button-demo"
              >
                View Demonstration
              </button>
            </div>
          </div>
        </section>

        {/* iOS-style Trust Metrics */}
        <section className="mb-24">
          <div className="mx-auto w-[min(1100px,92%)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="ios-card p-8 cursor-pointer group">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-[36px] font-semibold text-neutral-900 mb-2">99.7%</div>
                  <div className="text-[14px] font-medium text-neutral-600">Accuracy Rate</div>
                  <div className="mt-2 text-[12px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Industry-leading precision</div>
                </div>
              </div>
              <div className="ios-card p-8 cursor-pointer group">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-[36px] font-semibold text-neutral-900 mb-2">2M+</div>
                  <div className="text-[14px] font-medium text-neutral-600">Food Database</div>
                  <div className="mt-2 text-[12px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Comprehensive food library</div>
                </div>
              </div>
              <div className="ios-card p-8 cursor-pointer group">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-[36px] font-semibold text-neutral-900 mb-2">&lt; 2s</div>
                  <div className="text-[14px] font-medium text-neutral-600">Analysis Time</div>
                  <div className="mt-2 text-[12px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Lightning-fast results</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Glowing Features Section */}
        <div className="mb-32">
          <div className="text-center mb-20">
            <h2 className="professional-heading text-4xl lg:text-5xl font-bold mb-6">
              Comprehensive Nutrition Intelligence
            </h2>
            <p className="body-text text-xl max-w-3xl mx-auto">
              Advanced technologies working in harmony to provide unprecedented insight into your nutritional intake and health trajectory.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* AI-Powered Food Recognition - Hero Feature */}
            <Card className="feature-card-hero border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-12">
                <div className="mb-8">
                  <Badge className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 px-8 py-4 rounded-2xl font-bold text-sm tracking-wide">
                    🚀 PRIMARY TECHNOLOGY
                  </Badge>
                  <h3 className="professional-heading text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Artificial Intelligence
                    <br />
                    Food Recognition
                  </h3>
                  <p className="body-text text-lg leading-relaxed mb-8 text-gray-700">
                    Revolutionary computer vision technology that instantly identifies food items, estimates portion sizes, 
                    and calculates precise nutritional data. Our proprietary algorithms analyze texture, color, and shape 
                    to deliver unparalleled accuracy in nutritional assessment.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-black mb-2">99.7%</div>
                    <div className="text-sm text-gray-600 font-medium">Recognition Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-black mb-2">Instant</div>
                    <div className="text-sm text-gray-600 font-medium">Processing Speed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-black mb-2">2M+</div>
                    <div className="text-sm text-gray-600 font-medium">Food Database</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personalized Recommendations */}
            <Card className="feature-card-hero border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-12">
                <div className="mb-8">
                  <Badge className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 px-8 py-4 rounded-2xl font-bold text-sm tracking-wide">
                    🧠 MACHINE LEARNING
                  </Badge>
                  <h3 className="professional-heading text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Personalized Meal
                    <br />
                    Recommendations
                  </h3>
                  <p className="body-text text-lg leading-relaxed mb-8 text-gray-700">
                    Advanced machine learning algorithms analyze your dietary preferences, nutritional requirements, 
                    and health objectives to provide customized meal suggestions that align with your lifestyle and goals.
                  </p>
                </div>
                
                <div className="space-y-4 pt-8 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Dietary Preferences</span>
                    <span className="text-sm font-bold text-black">Adaptive Learning</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nutritional Goals</span>
                    <span className="text-sm font-bold text-black">Precision Targeting</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Health Objectives</span>
                    <span className="text-sm font-bold text-black">Intelligent Optimization</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Voice Logging */}
            <Card className="feature-card-premium border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-10">
                <div className="w-16 h-16 feature-icon-enhanced rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <span className="text-2xl">🎤</span>
                </div>
                <Badge className="mb-6 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-yellow-800 border-yellow-300/50 px-5 py-2 text-xs rounded-full font-bold tracking-wide">
                  ⭐ PREMIUM FEATURE
                </Badge>
                <h3 className="professional-heading text-2xl font-bold mb-6 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Voice-Powered Logging
                </h3>
                <p className="body-text text-gray-700 leading-relaxed mb-6">
                  Advanced speech recognition technology enables hands-free nutrition tracking. 
                  Simply speak your meal description for automatic identification and logging.
                </p>
                <div className="text-sm text-gray-600 font-medium">
                  Natural language processing • Contextual understanding • Instant transcription
                </div>
              </CardContent>
            </Card>

            {/* Sustainability Analysis */}
            <Card className="feature-card-primary border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-10">
                <div className="w-16 h-16 feature-icon-enhanced rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-green-50 to-teal-50">
                  <span className="text-2xl">🌱</span>
                </div>
                <Badge className="mb-6 bg-gradient-to-r from-green-400/30 to-emerald-400/30 text-green-800 border-green-300/50 px-5 py-2 text-xs rounded-full font-bold tracking-wide">
                  🌿 ECO TRACKING
                </Badge>
                <h3 className="professional-heading text-2xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Environmental Impact
                </h3>
                <p className="body-text text-gray-700 leading-relaxed mb-6">
                  Comprehensive analysis of carbon footprint, water usage, and ethical sourcing 
                  for every meal, enabling environmentally conscious dietary decisions.
                </p>
                <div className="text-sm text-gray-600 font-medium">
                  Carbon tracking • Water footprint • Ethical sourcing scores
                </div>
              </CardContent>
            </Card>

            {/* Advanced Analytics */}
            <Card className="feature-card-primary border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-10">
                <div className="w-16 h-16 feature-icon-enhanced rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <span className="text-2xl">📊</span>
                </div>
                <Badge className="mb-6 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 text-blue-800 border-blue-300/50 px-5 py-2 text-xs rounded-full font-bold tracking-wide">
                  📈 ANALYTICS PLATFORM
                </Badge>
                <h3 className="professional-heading text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Health Trend Analysis
                </h3>
                <p className="body-text text-gray-700 leading-relaxed mb-6">
                  Sophisticated analytics engine that correlates nutritional intake with energy levels, 
                  mood patterns, and overall health metrics for comprehensive insights.
                </p>
                <div className="text-sm text-gray-600 font-medium">
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
                className="btn-premium px-16 py-6 text-lg font-medium h-auto rounded-2xl transform hover:scale-105 transition-all duration-300"
                onClick={() => window.location.href = '/dashboard'}
                data-testid="button-premium-cta"
              >
                Start Professional Trial
              </Button>
              <Button 
                size="lg"
                className="btn-outline-glow px-12 py-6 text-lg font-medium h-auto rounded-2xl transform hover:scale-105 transition-all duration-300"
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