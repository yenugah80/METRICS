import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen relative z-10">
      <main className="container mx-auto px-6 py-16 max-w-7xl">
        {/* Hero Section */}
        <section className="relative">
          {/* Calm brand background with radial gradients */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_-10%,rgba(99,102,241,.12),transparent_60%),radial-gradient(40%_60%_at_-10%_40%,rgba(16,185,129,.10),transparent_60%)]" />
          
          <div className="mx-auto w-[min(1100px,92%)] pt-24 pb-16 text-center">
            <p className="text-[13px] font-medium tracking-wide text-emerald-700/80 mb-4">
              The first nutrition app that checks everything
            </p>
            
            <h1 className="mt-4 text-[44px] md:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-neutral-900 mb-6">
              Snap, and see if this meal is safe, healthy, AND planet-friendly
            </h1>
            
            <p className="mx-auto mt-4 max-w-[720px] text-[18px] leading-7 text-neutral-600 mb-8">
              Get instant analysis with <strong>safety alerts</strong>, <strong>health scoring</strong>, and <strong>sustainability impact</strong> — all with clarity and action built in.
            </p>

            {/* Single Strong CTA */}
            <div className="mt-8 flex justify-center mb-16">
              <button
                className="rounded-full px-12 py-5 text-[17px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-2xl"
                onClick={() => navigate('/camera')}
                data-testid="button-main-cta"
              >
                🍽️ Try It Now - Snap Your Meal
              </button>
            </div>

            <p className="text-[14px] text-neutral-500 mb-8">
              No signup required • Instant results • Free to try
            </p>

          </div>
        </section>

        {/* Trust Metrics - MVP Focus */}
        <section className="mb-24">
          <div className="mx-auto w-[min(1100px,92%)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="ios-card p-8 cursor-pointer group">
                <div className="text-center">
                  <div className="text-[32px] font-semibold text-red-600 mb-2">🚨 Safety</div>
                  <div className="text-[14px] font-medium text-neutral-600">Allergen Detection</div>
                  <div className="mt-2 text-[12px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Instant allergy and safety alerts</div>
                </div>
              </div>
              <div className="ios-card p-8 cursor-pointer group">
                <div className="text-center">
                  <div className="text-[32px] font-semibold text-green-600 mb-2">💚 Health</div>
                  <div className="text-[14px] font-medium text-neutral-600">Nutrition Scoring</div>
                  <div className="mt-2 text-[12px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Real-time health impact analysis</div>
                </div>
              </div>
              <div className="ios-card p-8 cursor-pointer group">
                <div className="text-center">
                  <div className="text-[32px] font-semibold text-blue-600 mb-2">🌍 Planet</div>
                  <div className="text-[14px] font-medium text-neutral-600">Eco Impact</div>
                  <div className="mt-2 text-[12px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Carbon and sustainability metrics</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - MVP Focus */}
        <div className="mb-32">
          <div className="text-center mb-20">
            <h2 className="professional-heading text-4xl lg:text-5xl font-bold mb-6 text-neutral-900">
              Everything you need to know about your meal
            </h2>
            <p className="body-text text-xl max-w-3xl mx-auto text-neutral-600">
              Snap a photo and get instant analysis of safety, health, and environmental impact — with clear explanations and actionable insights.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Instant Photo Analysis */}
            <Card className="feature-card-hero border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-12">
                <div className="mb-8">
                  <Badge className="mb-6 bg-gradient-to-r from-indigo-50 to-emerald-50 text-indigo-700 border-indigo-200 px-8 py-4 rounded-2xl font-bold text-sm tracking-wide">
                    SNAP & ANALYZE
                  </Badge>
                  <h3 className="professional-heading text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                    Instant Food
                    <br />
                    Analysis
                  </h3>
                  <p className="body-text text-lg leading-relaxed mb-8 text-gray-700">
                    Simply snap a photo of your meal and get comprehensive analysis in seconds. Our AI identifies ingredients, 
                    checks for allergens, evaluates nutritional value, and calculates environmental impact.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600 mb-2">🚨</div>
                    <div className="text-sm text-gray-600 font-medium">Safety Alerts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600 mb-2">💚</div>
                    <div className="text-sm text-gray-600 font-medium">Health Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 mb-2">🌍</div>
                    <div className="text-sm text-gray-600 font-medium">Eco Impact</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Recommendations */}
            <Card className="feature-card-hero border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-12">
                <div className="mb-8">
                  <Badge className="mb-6 bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700 border-emerald-200 px-8 py-4 rounded-2xl font-bold text-sm tracking-wide">
                    SMART INSIGHTS
                  </Badge>
                  <h3 className="professional-heading text-4xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    Actionable
                    <br />
                    Recommendations
                  </h3>
                  <p className="body-text text-lg leading-relaxed mb-8 text-gray-700">
                    Get clear explanations for every score and specific actions you can take. 
                    Discover safer alternatives, healthier swaps, and more sustainable choices.
                  </p>
                </div>
                
                <div className="space-y-4 pt-8 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Alternative Foods</span>
                    <span className="text-sm font-bold text-emerald-600">Suggested</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Health Improvements</span>
                    <span className="text-sm font-bold text-green-600">Explained</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Eco-Friendly Options</span>
                    <span className="text-sm font-bold text-blue-600">Identified</span>
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
                  <button className="w-full rounded-xl py-3 px-6 text-amber-800 font-semibold bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transform hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-lg" onClick={() => navigate('/auth')} data-testid="button-voice-logging">
                    Try Voice Logging
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
                  <button className="w-full rounded-xl py-3 px-6 text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transform hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-lg" onClick={() => navigate('/auth')} data-testid="button-track-impact">
                    Track Impact
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
                  <button className="w-full rounded-xl py-3 px-6 text-blue-800 font-semibold bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transform hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-lg" onClick={() => navigate('/auth')} data-testid="button-view-analytics">
                    View Analytics
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Premium Subscription Card */}
        <div className="mt-24 mb-16">
          <Card className="border-0 rounded-3xl shadow-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-700 max-w-5xl mx-auto">
            <CardContent className="p-12 text-center">
              <Badge className="mb-6 bg-white/20 text-white border-white/30 px-6 py-2 text-sm rounded-full font-bold">
                UNLOCK PREMIUM FEATURES
              </Badge>
              
              <h2 className="text-4xl font-bold mb-4 text-white">
                Transform Your Nutrition Journey
              </h2>
              
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Unlimited analyses, priority speed, and advanced insights. Get voice logging,
                detailed sustainability metrics, and personalized AI recommendations.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Unlimited Analysis</h3>
                  <p className="text-white/80 text-sm">No daily limits on food recognition</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Voice Logging</h3>
                  <p className="text-white/80 text-sm">Hands-free nutrition tracking</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Advanced Insights</h3>
                  <p className="text-white/80 text-sm">Real-time health correlations</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  className="rounded-2xl py-4 px-8 text-lg font-bold bg-white hover:bg-white/90 text-purple-700"
                  onClick={() => navigate('/auth')}
                  data-testid="button-start-premium"
                >
                  Start 7-Day Free Trial
                </Button>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">$6.99<span className="text-base font-normal text-white/80">/month</span></div>
                  <div className="text-white/70 text-sm">Cancel anytime • No commitment</div>
                </div>
              </div>

              <p className="text-white/60 text-sm mt-6">
                Join 50,000+ users who trust our platform for their nutrition intelligence
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-200/30 bg-gradient-to-r from-purple-50/30 to-pink-50/30 mt-32 relative z-10">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">
            {/* Footer content removed */}
          </div>
        </div>
      </footer>
    </div>
  );
}