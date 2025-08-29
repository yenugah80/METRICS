import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PricingPage() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-16 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-20 pt-16">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_-10%,rgba(99,102,241,.08),transparent_60%),radial-gradient(40%_60%_at_-10%_40%,rgba(16,185,129,.06),transparent_60%)]" />
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-neutral-900">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Start free and upgrade when you're ready for advanced features. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="border-2 border-gray-200 rounded-3xl shadow-lg bg-white/80 backdrop-blur relative">
            <CardContent className="p-10">
              <Badge className="mb-6 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 px-6 py-3 rounded-2xl font-semibold">
                FREE FOREVER
              </Badge>
              <h3 className="text-4xl font-bold mb-6 text-neutral-900">
                Free Plan
              </h3>
              <div className="mb-8">
                <span className="text-5xl font-bold text-neutral-900">$0</span>
                <span className="text-lg text-neutral-600">/month</span>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-700">Photo-based food analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-700">Basic nutrition tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-700">5 analyses per day</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-700">Basic allergen detection</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-700">Weekly nutrition reports</span>
                </div>
              </div>

              <Button
                onClick={() => setLocation('/auth')}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-4 rounded-full font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                data-testid="button-free-plan"
              >
                Start Free
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-purple-300 rounded-3xl shadow-xl bg-white/90 backdrop-blur relative overflow-hidden">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-b-xl text-sm font-semibold">
              MOST POPULAR
            </div>
            <CardContent className="p-10">
              <Badge className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 px-6 py-3 rounded-2xl font-semibold">
                PREMIUM
              </Badge>
              <h3 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Premium Plan
              </h3>
              <div className="mb-8">
                <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">$6.99</span>
                <span className="text-lg text-neutral-600">/month</span>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-gray-700">Everything in Free</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Unlimited daily analyses</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Voice-powered logging</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Advanced sustainability metrics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Personalized recipe generation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Priority processing speed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Advanced health insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Export data & reports</span>
                </div>
              </div>

              <Button
                onClick={() => setLocation('/auth')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                data-testid="button-premium-plan"
              >
                Start Premium Trial
              </Button>

              <p className="text-center text-sm text-gray-500 mt-4">
                7-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-neutral-900">
            Feature Comparison
          </h2>
          
          <Card className="border-0 rounded-3xl shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 text-lg font-semibold text-neutral-900">Feature</th>
                      <th className="text-center py-4 text-lg font-semibold text-neutral-600">Free</th>
                      <th className="text-center py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-4">Photo Analysis</td>
                      <td className="text-center py-4">5 per day</td>
                      <td className="text-center py-4 font-semibold text-purple-600">Unlimited</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4">Voice Logging</td>
                      <td className="text-center py-4 text-gray-400">—</td>
                      <td className="text-center py-4 font-semibold text-purple-600">✓</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4">Barcode Scanner</td>
                      <td className="text-center py-4">✓</td>
                      <td className="text-center py-4 font-semibold text-purple-600">✓</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4">Recipe Generation</td>
                      <td className="text-center py-4">3 per week</td>
                      <td className="text-center py-4 font-semibold text-purple-600">Unlimited</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4">Sustainability Tracking</td>
                      <td className="text-center py-4">Basic</td>
                      <td className="text-center py-4 font-semibold text-purple-600">Detailed</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4">Health Insights</td>
                      <td className="text-center py-4">Weekly</td>
                      <td className="text-center py-4 font-semibold text-purple-600">Real-time</td>
                    </tr>
                    <tr>
                      <td className="py-4">Data Export</td>
                      <td className="text-center py-4 text-gray-400">—</td>
                      <td className="text-center py-4 font-semibold text-purple-600">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-neutral-900">
            Frequently Asked Questions
          </h2>
          
          <div className="grid gap-6 max-w-3xl mx-auto">
            <Card className="border-0 rounded-2xl shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 text-neutral-900">
                  Can I cancel my subscription anytime?
                </h3>
                <p className="text-gray-700">
                  Yes, you can cancel your premium subscription at any time. You'll continue to have access to premium features until the end of your current billing period.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 rounded-2xl shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 text-neutral-900">
                  How accurate is the food analysis?
                </h3>
                <p className="text-gray-700">
                  Our AI-powered analysis achieves 99.7% accuracy through advanced computer vision and our database of over 2 million food items, making it the most reliable nutrition tracker available.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 rounded-2xl shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 text-neutral-900">
                  What makes voice logging premium?
                </h3>
                <p className="text-gray-700">
                  Voice logging requires advanced speech recognition and natural language processing, which involves higher computational costs. Premium users get unlimited voice entries with contextual understanding.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-3xl p-12">
            <h2 className="text-3xl font-bold mb-6 text-neutral-900">
              Ready to get started?
            </h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              Join thousands who trust MyFoodMatrics for their nutrition journey.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.href = '/auth'}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 rounded-full font-semibold"
                data-testid="button-start-free"
              >
                Start Free
              </Button>
              <Button
                onClick={() => window.location.href = '/auth'}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                data-testid="button-start-premium"
              >
                Start Premium Trial
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}