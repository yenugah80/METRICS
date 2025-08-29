import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-20 pt-16">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_-10%,rgba(99,102,241,.08),transparent_60%),radial-gradient(40%_60%_at_-10%_40%,rgba(16,185,129,.06),transparent_60%)]" />
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-neutral-900">
            Powerful Features
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Advanced AI technology meets intuitive design to deliver the most comprehensive nutrition tracking experience available.
          </p>
        </div>

        {/* Core Features */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* AI Food Recognition */}
          <Card className="border-0 rounded-3xl shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-10">
              <Badge className="mb-6 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200 px-6 py-3 rounded-2xl font-semibold">
                CORE TECHNOLOGY
              </Badge>
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Food Recognition
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Simply take a photo of your meal and get instant nutritional analysis with 99.7% accuracy. Our computer vision technology identifies foods, estimates portions, and provides detailed macro and micronutrient breakdowns.
              </p>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Recognition Accuracy</span>
                  <span className="font-bold">99.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Time</span>
                  <span className="font-bold">&lt; 2 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Food Database</span>
                  <span className="font-bold">2M+ items</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice Logging */}
          <Card className="border-0 rounded-3xl shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-10">
              <Badge className="mb-6 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200 px-6 py-3 rounded-2xl font-semibold">
                PREMIUM FEATURE
              </Badge>
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Voice-Powered Logging
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Just speak your meals naturally - "I had oatmeal with blueberries and almond milk" - and watch as our advanced speech recognition automatically logs your nutrition with perfect accuracy.
              </p>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Language Support</span>
                  <span className="font-bold">15+ Languages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recognition Speed</span>
                  <span className="font-bold">Real-time</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Background Noise</span>
                  <span className="font-bold">Filtered Out</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Scanner */}
          <Card className="border-0 rounded-3xl shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-10">
              <Badge className="mb-6 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200 px-6 py-3 rounded-2xl font-semibold">
                INSTANT ACCESS
              </Badge>
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Smart Barcode Scanner
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Scan any product barcode to instantly access complete nutritional information, ingredients lists, allergen warnings, and sustainability ratings from our comprehensive database.
              </p>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Database</span>
                  <span className="font-bold">500K+ Items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Scan Speed</span>
                  <span className="font-bold">Instant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ingredient Analysis</span>
                  <span className="font-bold">Complete</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sustainability Tracking */}
          <Card className="border-0 rounded-3xl shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-10">
              <Badge className="mb-6 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-6 py-3 rounded-2xl font-semibold">
                ECO-CONSCIOUS
              </Badge>
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Environmental Impact Scoring
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Make environmentally conscious food choices with detailed carbon footprint analysis, water usage metrics, and ethical sourcing scores for every meal you log.
              </p>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Carbon Footprint</span>
                  <span className="font-bold">Per Meal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Water Usage</span>
                  <span className="font-bold">Tracked</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ethical Sourcing</span>
                  <span className="font-bold">Verified</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Features */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-neutral-900">
            Advanced Health Intelligence
          </h2>
          
          <div className="grid gap-6">
            {/* Health Trend Analysis */}
            <Card className="border-0 rounded-3xl shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-10">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200 px-6 py-3 rounded-2xl font-semibold">
                      ANALYTICS ENGINE
                    </Badge>
                    <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Personalized Health Insights
                    </h3>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      Our AI correlates your nutrition data with energy levels, mood patterns, and health metrics to provide personalized insights and actionable recommendations for optimal wellness.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl">
                      <div className="text-sm text-gray-600 mb-2">Weekly Energy Correlation</div>
                      <div className="text-2xl font-bold text-blue-600">+23% improvement</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
                      <div className="text-sm text-gray-600 mb-2">Mood Pattern Analysis</div>
                      <div className="text-2xl font-bold text-purple-600">92% accuracy</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recipe Recommendations */}
            <Card className="border-0 rounded-3xl shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-10">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 px-6 py-3 rounded-2xl font-semibold">
                      AI CHEF
                    </Badge>
                    <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Smart Recipe Generation
                    </h3>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      Get personalized recipe suggestions based on your dietary preferences, nutritional goals, available ingredients, and taste preferences. Our AI creates recipes tailored specifically for you.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
                      <div className="text-sm text-gray-600 mb-2">Recipe Database</div>
                      <div className="text-2xl font-bold text-purple-600">50K+ recipes</div>
                    </div>
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-2xl">
                      <div className="text-sm text-gray-600 mb-2">Dietary Filters</div>
                      <div className="text-2xl font-bold text-pink-600">20+ options</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-3xl p-12">
            <h2 className="text-3xl font-bold mb-6 text-neutral-900">
              Ready to transform your nutrition?
            </h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              Join thousands who have already discovered the power of AI-driven nutrition intelligence.
            </p>
            <Button
              onClick={() => window.location.href = '/auth'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              data-testid="button-get-started-features"
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}