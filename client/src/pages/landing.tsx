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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Photo Analysis - Hero Feature */}
            <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-emerald-200 via-cyan-200 to-blue-300 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 group lg:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5"></div>
              <CardContent className="relative p-8 text-gray-800">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-white/30 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <Camera className="w-10 h-10 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <Badge className="mb-4 bg-white/40 text-gray-700 border-white/50 backdrop-blur-sm">
                      🔥 Most Popular Feature
                    </Badge>
                    <h3 className="text-3xl font-bold mb-4 text-gray-800">AI-Powered Food Recognition</h3>
                    <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                      Revolutionary computer vision that instantly identifies your food, estimates portions, and calculates precise nutrition data. Works with any meal, anywhere.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">📸 99.7% Accuracy</span>
                      <span className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">⚡ Instant Results</span>
                      <span className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">🌍 2M+ Foods</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personalized Meal Engine */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-200 to-pink-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <CardContent className="relative p-6 text-gray-800">
                <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                  <Star className="w-7 h-7 text-gray-700" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Smart Meal Recommendations</h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  AI learns your taste preferences, dietary restrictions, and nutrition goals to suggest perfect meals every time.
                </p>
                <Badge className="bg-white/40 text-gray-700 border-white/50 text-xs">
                  🧠 Machine Learning Powered
                </Badge>
              </CardContent>
            </Card>

            {/* AR Food Scanning */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-orange-200 to-red-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:-rotate-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
              <CardContent className="relative p-6 text-gray-800">
                <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                  <Scan className="w-7 h-7 text-gray-700" />
                </div>
                <Badge className="mb-3 bg-white/40 text-gray-700 border-white/50 text-xs">
                  🚀 Coming Soon
                </Badge>
                <h3 className="text-xl font-bold mb-3 text-gray-800">AR Nutrition Overlay</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Point your camera at any food and see nutrition facts floating in real-time with augmented reality technology.
                </p>
              </CardContent>
            </Card>

            {/* Voice Logging with Animation */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-indigo-200 to-purple-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform -translate-x-16 -translate-y-16"></div>
              <CardContent className="relative p-6 text-gray-800">
                <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
                  <Mic className="w-7 h-7 text-gray-700 group-hover:animate-pulse" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-bold text-gray-800">Voice-Powered Logging</h3>
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  Just speak your meal aloud. Our AI transcribes, identifies foods, and logs everything automatically. Hands-free nutrition tracking.
                </p>
                <Badge className="bg-amber-200/50 text-amber-800 border-amber-300 text-xs">
                  PREMIUM FEATURE
                </Badge>
              </CardContent>
            </Card>

            {/* Social Health Challenges */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-teal-200 to-cyan-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1 group lg:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
              <CardContent className="relative p-8 text-gray-800">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                    <Users className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <Badge className="mb-4 bg-white/40 text-gray-700 border-white/50 backdrop-blur-sm">
                      🎯 Social Features
                    </Badge>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Health Challenges & Social Sharing</h3>
                    <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                      Join community challenges, share progress with friends, and compete in nutrition goals. Make healthy eating social and fun.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">🏆 Weekly Challenges</span>
                      <span className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">👥 Friend Leaderboards</span>
                      <span className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">📱 Social Sharing</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mood & Nutrition Tracker */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-pink-200 to-rose-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:-rotate-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
              <CardContent className="relative p-6 text-gray-800">
                <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                  <TrendingUp className="w-7 h-7 text-gray-700" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Mood & Energy Correlation</h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  Track how different foods affect your mood, energy levels, and overall wellbeing with intelligent pattern recognition.
                </p>
                <Badge className="bg-white/40 text-gray-700 border-white/50 text-xs">
                  🧠 Behavioral Analytics
                </Badge>
              </CardContent>
            </Card>

            {/* Gamified Nutrition Education */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-amber-200 to-orange-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1 group lg:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform -translate-x-16 -translate-y-8"></div>
              <CardContent className="relative p-8 text-gray-800">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Target className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <Badge className="mb-4 bg-white/40 text-gray-700 border-white/50 backdrop-blur-sm">
                      🎮 Gamification
                    </Badge>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Interactive Nutrition Games</h3>
                    <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                      Learn nutrition science through engaging mini-games, quizzes, and challenges. Earn badges, level up your knowledge, and unlock achievements.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">🎲 Mini Games</span>
                      <span className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">🏅 Achievement System</span>
                      <span className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">📚 Learn Science</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sustainability Scoring */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-green-200 to-emerald-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:-rotate-1 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
              <CardContent className="relative p-6 text-gray-800">
                <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                  <Leaf className="w-7 h-7 text-gray-700" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-bold text-gray-800">Environmental Impact</h3>
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  See the carbon footprint, water usage, and ethical sourcing score for every meal. Make choices that are good for you and the planet.
                </p>
                <Badge className="bg-amber-200/50 text-amber-800 border-amber-300 text-xs">
                  PREMIUM FEATURE
                </Badge>
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
