import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Apple, Camera, Scan, Zap, Crown, Leaf, ChefHat, Target, Star, Users, TrendingUp, Shield, Mic } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section - Completely Redesigned */}
        <div className="text-center mb-20 relative">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
              🚀 New revolutionary nutrition tracking app
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Stop Guessing.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Start Knowing.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              The only nutrition app that actually understands your food. Snap a photo, get instant macro breakdowns, 
              and finally take control of your health journey.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
                onClick={() => window.location.href = '/dashboard'}
                data-testid="button-hero-cta"
              >
                <Zap className="w-5 h-5 mr-2" />
                Try Free Now
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg border-2 hover:bg-gray-50"
                onClick={() => window.location.href = '/camera'}
                data-testid="button-demo-cta"
              >
                <Camera className="w-5 h-5 mr-2" />
                See Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 mb-12">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">Privacy focused</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">Lightning fast AI</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="font-semibold">Science-backed data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section - Completely Redesigned */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              ✨ Revolutionary Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to master nutrition
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools that make healthy eating effortless and enjoyable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Photo Analysis - Primary Feature */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-cyan-50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Instant Photo Analysis</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Point, shoot, done! Our AI instantly recognizes your food and breaks down every macro and micronutrient.
                </p>
                <div className="text-sm text-emerald-600 font-semibold">
                  🚀 Works with any food • 99% accuracy
                </div>
              </CardContent>
            </Card>

            {/* Barcode Scanner */}
            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Scan className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning-Fast Barcode Scan</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Scan any package and get comprehensive nutrition data from our database of 2M+ products.
                </p>
              </CardContent>
            </Card>

            {/* Smart Scoring */}
            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Nutrition Scoring</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Get A-F grades for every meal based on nutritional quality, processing level, and your goals.
                </p>
              </CardContent>
            </Card>

            {/* Premium Features Row */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">Sustainability Impact</h3>
                      <Crown className="w-5 h-5 text-amber-500" />
                      <Badge className="bg-amber-100 text-amber-800 text-xs">PREMIUM</Badge>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Track your environmental footprint with CO₂ emissions, water usage, and ethical sourcing insights for every meal.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">🌱 Carbon Footprint</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">💧 Water Usage</span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">🌍 Ethical Sourcing</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Recipes */}
            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Personalized Recipes</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Get AI-generated recipes tailored to your dietary preferences, restrictions, and nutrition goals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modern Premium CTA */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-purple-900 to-violet-900 border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 opacity-20"></div>
          <CardContent className="relative p-12 text-center text-white">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <Badge className="mb-4 bg-amber-500/20 text-amber-300 border-amber-500/30">
              🎯 LIMITED TIME OFFER
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Become a Nutrition Master
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your health with advanced AI coaching, unlimited recipes, 
              voice logging, and sustainability tracking. Be among the first to experience the future of nutrition.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Mic className="w-4 h-4 mr-2 text-amber-400" />
                <span className="text-sm font-medium">Voice Logging</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Leaf className="w-4 h-4 mr-2 text-green-400" />
                <span className="text-sm font-medium">Sustainability Impact</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <ChefHat className="w-4 h-4 mr-2 text-purple-400" />
                <span className="text-sm font-medium">Unlimited Recipes</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Shield className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-sm font-medium">AI Health Coach</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-12 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
                onClick={() => window.location.href = '/dashboard'}
                data-testid="button-premium-cta"
              >
                <Crown className="w-5 h-5 mr-2" />
                Start 7-Day Free Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg backdrop-blur-sm"
                onClick={() => window.location.href = '/dashboard'}
                data-testid="button-free-trial"
              >
                Try Free Version
              </Button>
            </div>
            
            <p className="text-sm text-gray-400 mt-4">
              💳 No credit card required • Cancel anytime • Only $6.99/month after trial
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Modern Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">MyFoodMatrics</h3>
            <p className="text-gray-400 mb-6">Smart nutrition tracking for a healthier you.</p>
            <p className="text-sm text-gray-500">
              © 2025 MyFoodMatrics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
