import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import IntegrationsGrid from "@/components/landing/IntegrationsGrid";
import BigDatabaseBanner from "@/components/landing/BigDatabaseBanner";
import OnboardingCTA from "@/components/landing/OnboardingCTA";
import FAQ from "@/components/landing/FAQ";
import BlogTeasers from "@/components/landing/BlogTeasers";
import FooterSlim from "@/components/landing/FooterSlim";

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
              Revolutionary AI-powered nutrition intelligence
            </p>
            
            <h1 className="mt-4 text-[44px] md:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-neutral-900 mb-6">
              Stop guessing what's in your food. 
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent"> Know instantly.</span>
            </h1>
            
            <p className="mx-auto mt-4 max-w-[720px] text-[18px] leading-7 text-neutral-600 mb-8">
              <strong>Tired of unreliable nutrition apps?</strong> Our professional-grade AI delivers <strong>99% accurate analysis</strong>, <strong>instant allergen alerts</strong>, and <strong>real sustainability scores</strong> — because your health deserves precision, not guesswork.
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

        {/* Pain Points Section - Why Choose Us */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              The nutrition tracking nightmare is <span className="text-red-600">finally over</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              We solved the biggest problems that make other nutrition apps frustrating and unreliable
            </p>
          </div>
          
          <div className="mx-auto w-[min(1100px,92%)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Problem 1: Inaccurate Food Data */}
              <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-red-50 to-orange-50">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <div className="text-white text-2xl">⚠️</div>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">Inaccurate Food Data</h3>
                    <div className="text-sm text-neutral-600 mb-4 space-y-2">
                      <p className="opacity-70">❌ Generic estimates</p>
                      <p className="opacity-70">❌ Missing allergen info</p>
                      <p className="opacity-70">❌ Outdated nutrition facts</p>
                    </div>
                    <div className="border-t pt-4">
                      <div className="text-emerald-600 font-bold mb-2">✅ Our Solution</div>
                      <p className="text-sm text-neutral-700"><strong>99% accuracy</strong> using computer vision + 20M global food database</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Problem 2: Time-Consuming Logging */}
              <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-yellow-50 to-amber-50">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <div className="text-white text-2xl">⏱️</div>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">Tedious Manual Entry</h3>
                    <div className="text-sm text-neutral-600 mb-4 space-y-2">
                      <p className="opacity-70">❌ 5+ minutes per meal</p>
                      <p className="opacity-70">❌ Complex portion guessing</p>
                      <p className="opacity-70">❌ Database searching</p>
                    </div>
                    <div className="border-t pt-4">
                      <div className="text-emerald-600 font-bold mb-2">✅ Our Solution</div>
                      <p className="text-sm text-neutral-700"><strong>3-second</strong> photo analysis + voice logging for hands-free tracking</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Problem 3: No Health Context */}
              <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <div className="text-white text-2xl">🤷‍♀️</div>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">No Personal Context</h3>
                    <div className="text-sm text-neutral-600 mb-4 space-y-2">
                      <p className="opacity-70">❌ Generic recommendations</p>
                      <p className="opacity-70">❌ Ignores health conditions</p>
                      <p className="opacity-70">❌ No diet compatibility</p>
                    </div>
                    <div className="border-t pt-4">
                      <div className="text-emerald-600 font-bold mb-2">✅ Our Solution</div>
                      <p className="text-sm text-neutral-700"><strong>Personalized insights</strong> for PCOS, fitness goals, allergies & lifestyle</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust & Transparency Section */}
        <section className="mb-24 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 py-16 rounded-3xl">
          <div className="mx-auto w-[min(1100px,92%)]">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Why 50,000+ users trust MyFoodMatrics
              </h2>
              <p className="text-lg text-neutral-600">
                Transparency and accuracy you can count on
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="text-3xl mb-3">🔒</div>
                  <h3 className="font-bold text-neutral-900 mb-2">Enterprise Security</h3>
                  <p className="text-sm text-neutral-600">Bank-level encryption, GDPR compliant, your data stays private</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="text-3xl mb-3">🧪</div>
                  <h3 className="font-bold text-neutral-900 mb-2">Lab-Tested Accuracy</h3>
                  <p className="text-sm text-neutral-600">99% precision validated against nutritionist analysis</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-bold text-neutral-900 mb-2">Lightning Fast</h3>
                  <p className="text-sm text-neutral-600">Real-time analysis in under 3 seconds, no waiting</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="text-3xl mb-3">🌍</div>
                  <h3 className="font-bold text-neutral-900 mb-2">Global Recognition</h3>
                  <p className="text-sm text-neutral-600">Understands cuisines from 195+ countries worldwide</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Advanced Features Section - Action Cards */}
        <div className="mb-32">
          <div className="text-center mb-20">
            <h2 className="professional-heading text-4xl lg:text-5xl font-bold mb-6 text-neutral-900">
              Revolutionary nutrition intelligence at your fingertips
            </h2>
            <p className="body-text text-xl max-w-3xl mx-auto text-neutral-600">
              Advanced AI technology that understands your food like a professional nutritionist — instantly analyzing safety, health impact, and sustainability with unmatched precision.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Instant Photo Analysis - Enhanced */}
            <Card className="feature-card-hero border-0 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-500 to-emerald-500 text-white relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40 group-hover:from-black/10 group-hover:to-black/30 transition-all duration-500"></div>
              <CardContent className="p-12 relative z-10">
                <div className="mb-8">
                  <Badge className="mb-6 bg-white/20 text-white border-white/30 px-8 py-4 rounded-2xl font-bold text-sm tracking-wide backdrop-blur-sm">
                    COMPUTER VISION AI
                  </Badge>
                  <h3 className="text-4xl font-bold mb-6 text-white">
                    3-Second Food
                    <br />
                    Recognition
                  </h3>
                  <p className="text-lg leading-relaxed mb-8 text-white/90">
                    <strong>No more guessing.</strong> Our military-grade computer vision analyzes your meal with the precision of a professional nutritionist. 
                    Instant identification of every ingredient, accurate portions, and comprehensive nutritional breakdown.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">⚡</div>
                    <div className="text-sm text-white/80 font-medium">&lt; 3 seconds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">🎯</div>
                    <div className="text-sm text-white/80 font-medium">99% accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">🌐</div>
                    <div className="text-sm text-white/80 font-medium">Global cuisines</div>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-8 bg-white text-indigo-600 hover:bg-white/90 font-semibold py-4 rounded-2xl"
                  onClick={() => navigate('/camera')}
                  data-testid="button-try-camera"
                >
                  Try Photo Analysis Now
                </Button>
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
                    Intelligent recommendations powered by machine learning provide personalized guidance. 
                    Discover optimal food swaps, health improvements, and eco-friendly alternatives tailored to your goals.
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

        {/* Integration Capabilities */}
        <IntegrationsGrid />
        
        {/* Database Trust Banner */}
        <BigDatabaseBanner />
        
        {/* Blog Expert Content */}
        <BlogTeasers />
        
        {/* Frequently Asked Questions */}
        <FAQ />
        
        {/* Onboarding Call to Action */}
        <OnboardingCTA />
        
      {/* Professional Footer */}
      <FooterSlim />
    </div>
  );
}