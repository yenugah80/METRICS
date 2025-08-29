import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  return (
    <div className="min-h-screen relative z-10">
      <main className="container mx-auto px-6 py-16 max-w-7xl">
        {/* Hero Section */}
        <section className="relative">
          {/* Calm brand background with radial gradients */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_-10%,rgba(99,102,241,.12),transparent_60%),radial-gradient(40%_60%_at_-10%_40%,rgba(16,185,129,.10),transparent_60%)]" />
          
          <div className="mx-auto w-[min(1100px,92%)] pt-24 pb-16 text-center">
            <p className="text-[13px] font-medium tracking-wide text-emerald-700/80 mb-4">
              Master your nutrition with AI-powered precision
            </p>
            
            <h1 className="mt-4 text-[44px] md:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-neutral-900 mb-6">
              Stop relying on guesswork
            </h1>
            
            <p className="mx-auto mt-4 max-w-[720px] text-[18px] leading-7 text-neutral-600 mb-6">
              MyFoodMatrics delivers <strong>99.7% accurate</strong> food analysis backed by a database of <strong>2M+ items</strong>
            </p>

            <p className="mx-auto mt-4 max-w-[720px] text-[16px] leading-7 text-neutral-600 mb-6">
              Understand how your meals impact your health, energy, and goals with AI that works in real time.
            </p>

            <p className="mx-auto mt-4 max-w-[720px] text-[16px] leading-7 text-neutral-600 mb-8">
              Every meal matters. Get nutrition breakdowns and environmental impact scores to make smarter choices.
            </p>

            {/* Glowing Gradient Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 mb-16">
              <button
                className="relative rounded-full px-8 py-4 text-[15px] font-semibold text-white overflow-hidden group transform hover:scale-105 transition-all duration-300"
                onClick={() => window.location.href = '/auth'}
                data-testid="button-journey-cta"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-indigo-400/20 blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <span className="relative z-10">Begin Your Journey</span>
              </button>
              <button
                className="relative rounded-full px-8 py-4 text-[15px] font-semibold text-white overflow-hidden group transform hover:scale-105 transition-all duration-300"
                onClick={() => window.location.href = '/demo'}
                data-testid="button-demo"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-cyan-400/20 blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <span className="relative z-10">View Demonstration</span>
              </button>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
              <button
                className="rounded-full border border-neutral-200 bg-white/70 px-6 py-3 text-[14px] font-medium backdrop-blur hover:bg-white hover:shadow-md transition-all duration-200"
                onClick={() => window.location.href = '/features'}
                data-testid="button-features"
              >
                Features
              </button>
              <button
                className="rounded-full border border-neutral-200 bg-white/70 px-6 py-3 text-[14px] font-medium backdrop-blur hover:bg-white hover:shadow-md transition-all duration-200"
                onClick={() => window.location.href = '/pricing'}
                data-testid="button-pricing"
              >
                Pricing
              </button>
              <button
                className="rounded-full border border-neutral-200 bg-white/70 px-6 py-3 text-[14px] font-medium backdrop-blur hover:bg-white hover:shadow-md transition-all duration-200"
                onClick={() => window.location.href = '/auth'}
                data-testid="button-get-started"
              >
                Get Started
              </button>
            </div>
          </div>
        </section>

        {/* Trust Metrics - Clean Design */}
        <section className="mb-24">
          <div className="mx-auto w-[min(1100px,92%)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="ios-card p-8 cursor-pointer group">
                <div className="text-center">
                  <div className="text-[36px] font-semibold text-neutral-900 mb-2">99.7%</div>
                  <div className="text-[14px] font-medium text-neutral-600">Accuracy Rate</div>
                  <div className="mt-2 text-[12px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Industry-leading precision</div>
                </div>
              </div>
              <div className="ios-card p-8 cursor-pointer group">
                <div className="text-center">
                  <div className="text-[36px] font-semibold text-neutral-900 mb-2">2M+</div>
                  <div className="text-[14px] font-medium text-neutral-600">Food Database</div>
                  <div className="mt-2 text-[12px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Comprehensive food library</div>
                </div>
              </div>
              <div className="ios-card p-8 cursor-pointer group">
                <div className="text-center">
                  <div className="text-[36px] font-semibold text-neutral-900 mb-2">&lt; 2s</div>
                  <div className="text-[14px] font-medium text-neutral-600">Analysis Time</div>
                  <div className="mt-2 text-[12px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Lightning-fast results</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Clean Design */}
        <div className="mb-32">
          <div className="text-center mb-20">
            <h2 className="professional-heading text-4xl lg:text-5xl font-bold mb-6 text-neutral-900">
              Comprehensive Nutrition Intelligence
            </h2>
            <p className="body-text text-xl max-w-3xl mx-auto text-neutral-600">
              Advanced technologies working in harmony to provide unprecedented insight into your nutritional intake and health trajectory.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* AI-Powered Food Recognition */}
            <Card className="feature-card-hero border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-12">
                <div className="mb-8">
                  <Badge className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 px-8 py-4 rounded-2xl font-bold text-sm tracking-wide">
                    PRIMARY TECHNOLOGY
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
                    MACHINE LEARNING
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

          {/* Secondary Features Grid - Clean Design */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Voice Logging */}
            <Card className="feature-card-premium border-0 rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-yellow-50/50 to-orange-50/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group">
              <CardContent className="p-10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 to-orange-100/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative z-10">
                  <Badge className="mb-6 bg-gradient-to-r from-yellow-400/40 to-orange-400/40 text-yellow-800 border-yellow-300/60 px-6 py-3 text-sm rounded-full font-bold tracking-wide shadow-lg backdrop-blur-sm">
                    PREMIUM FEATURE
                  </Badge>
                  <h3 className="professional-heading text-2xl font-bold mb-6 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    Voice-Powered Logging
                  </h3>
                  <p className="body-text text-gray-700 leading-relaxed mb-6">
                    Advanced speech recognition technology enables hands-free nutrition tracking. 
                    Simply speak your meal description for automatic identification and logging.
                  </p>
                  <div className="text-sm text-gray-600 font-medium mb-6">
                    Natural language processing • Contextual understanding • Instant transcription
                  </div>
                  <button className="w-full relative overflow-hidden rounded-xl py-3 px-6 text-white font-semibold transform hover:scale-105 transition-all duration-300 group/btn" onClick={() => window.location.href = '/auth'}>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 opacity-90 group-hover/btn:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/30 via-orange-300/30 to-red-300/30 blur-lg group-hover/btn:blur-xl transition-all duration-300"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.3)_0%,transparent_50%,rgba(255,255,255,0.3)_100%)] opacity-50"></div>
                    <span className="relative z-10">Try Voice Logging</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Sustainability Analysis */}
            <Card className="feature-card-primary border-0 rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-green-50/50 to-teal-50/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group">
              <CardContent className="p-10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-teal-100/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative z-10">
                  <Badge className="mb-6 bg-gradient-to-r from-green-400/40 to-emerald-400/40 text-green-800 border-green-300/60 px-6 py-3 text-sm rounded-full font-bold tracking-wide shadow-lg backdrop-blur-sm">
                    ECO TRACKING
                  </Badge>
                  <h3 className="professional-heading text-2xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Environmental Impact
                  </h3>
                  <p className="body-text text-gray-700 leading-relaxed mb-6">
                    Comprehensive analysis of carbon footprint, water usage, and ethical sourcing 
                    for every meal, enabling environmentally conscious dietary decisions.
                  </p>
                  <div className="text-sm text-gray-600 font-medium mb-6">
                    Carbon tracking • Water footprint • Ethical sourcing scores
                  </div>
                  <button className="w-full relative overflow-hidden rounded-xl py-3 px-6 text-white font-semibold transform hover:scale-105 transition-all duration-300 group/btn" onClick={() => window.location.href = '/auth'}>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 opacity-90 group-hover/btn:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-300/30 via-emerald-300/30 to-teal-300/30 blur-lg group-hover/btn:blur-xl transition-all duration-300"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.3)_0%,transparent_50%,rgba(255,255,255,0.3)_100%)] opacity-50"></div>
                    <span className="relative z-10">Track Impact</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Analytics */}
            <Card className="feature-card-primary border-0 rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group">
              <CardContent className="p-10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-indigo-100/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative z-10">
                  <Badge className="mb-6 bg-gradient-to-r from-blue-400/40 to-indigo-400/40 text-blue-800 border-blue-300/60 px-6 py-3 text-sm rounded-full font-bold tracking-wide shadow-lg backdrop-blur-sm">
                    ANALYTICS PLATFORM
                  </Badge>
                  <h3 className="professional-heading text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Health Trend Analysis
                  </h3>
                  <p className="body-text text-gray-700 leading-relaxed mb-6">
                    Sophisticated analytics engine that correlates nutritional intake with energy levels, 
                    mood patterns, and overall health metrics for comprehensive insights.
                  </p>
                  <div className="text-sm text-gray-600 font-medium mb-6">
                    Trend identification • Pattern analysis • Predictive modeling
                  </div>
                  <button className="w-full relative overflow-hidden rounded-xl py-3 px-6 text-white font-semibold transform hover:scale-105 transition-all duration-300 group/btn" onClick={() => window.location.href = '/auth'}>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-90 group-hover/btn:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-300/30 via-indigo-300/30 to-purple-300/30 blur-lg group-hover/btn:blur-xl transition-all duration-300"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.3)_0%,transparent_50%,rgba(255,255,255,0.3)_100%)] opacity-50"></div>
                    <span className="relative z-10">View Analytics</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Professional Premium CTA */}
        <div className="mt-24 mb-16">
          <Card className="border-0 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-700 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 opacity-30"></div>
            <CardContent className="p-16 text-center relative z-10">
              <Badge className="mb-8 bg-white/20 text-white border-white/30 px-8 py-3 text-sm rounded-full font-bold tracking-wide backdrop-blur-sm">
                UNLOCK PREMIUM FEATURES
              </Badge>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                Transform Your Nutrition Journey
              </h2>
              
              <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
                Unlimited analyses, priority speed, and advanced insights. 
                Get voice logging, detailed sustainability metrics, and personalized AI recommendations.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <div className="w-6 h-6 bg-white rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Unlimited Analysis</h3>
                  <p className="text-white/80 text-sm">No daily limits on food recognition</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <div className="w-6 h-6 bg-white rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Voice Logging</h3>
                  <p className="text-white/80 text-sm">Hands-free nutrition tracking</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <div className="w-6 h-6 bg-white rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Advanced Insights</h3>
                  <p className="text-white/80 text-sm">Real-time health correlations</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  className="relative overflow-hidden rounded-2xl py-4 px-12 text-purple-700 font-bold text-lg bg-white hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-xl group"
                  onClick={() => window.location.href = '/auth'}
                  data-testid="button-start-premium"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10">Start 7-Day Free Trial</span>
                </button>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">$6.99<span className="text-lg font-normal text-white/80">/month</span></div>
                  <div className="text-white/70 text-sm">Cancel anytime • No commitment</div>
                </div>
              </div>

              <p className="text-white/60 text-sm mt-8">
                Join 50,000+ users who trust MyFoodMatrics for their nutrition intelligence
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
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