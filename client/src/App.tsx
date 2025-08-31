import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useLocalAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/navigation";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import SearchPage from "@/pages/search";
import VoiceAssistantPage from "@/pages/voice-assistant";
import VoiceLoggingPage from "@/pages/voice-logging";
import FitnessDashboard from "@/pages/fitness-dashboard";
import FeaturesPage from "@/pages/features";
import PricingPage from "@/pages/pricing";
import NotFound from "@/pages/not-found";
import { initPerformanceOptimizations } from "@/lib/performance";

// Lazy-loaded components for better performance
import {
  LazyDashboard,
  LazyRecipesPage,
  LazyMealCamera,
  LazyDailyProgress,
  LazySustainability,
  LazyRecommendations,
  LazyProfile,
  SafeLazyWrapper
} from "@/components/LazyComponents";

function App() {
  // Initialize performance optimizations
  React.useEffect(() => {
    initPerformanceOptimizations();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Toaster />
            {/* Mobile-optimized main content with bottom navigation spacing */}
            <main className="pb-20 mobile-scroll">
              <Switch>
                <Route path="/" component={Landing} />
                <Route path="/auth" component={AuthPage} />
                <Route path="/features" component={FeaturesPage} />
                <Route path="/pricing" component={PricingPage} />
                <Route path="/dashboard">
                  <ProtectedRoute>
                    <FitnessDashboard />
                  </ProtectedRoute>
                </Route>
                <Route path="/search">
                  <ProtectedRoute><SearchPage /></ProtectedRoute>
                </Route>
                <Route path="/camera">
                  <SafeLazyWrapper message="Loading camera...">
                    <LazyMealCamera />
                  </SafeLazyWrapper>
                </Route>
                <Route path="/demo">
                  <SafeLazyWrapper message="Loading demo...">
                    <LazyMealCamera />
                  </SafeLazyWrapper>
                </Route>
                <Route path="/voice-logging">
                  <ProtectedRoute>
                    <VoiceLoggingPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/recipes">
                  <ProtectedRoute>
                    <SafeLazyWrapper message="Loading recipes...">
                      <LazyRecipesPage />
                    </SafeLazyWrapper>
                  </ProtectedRoute>
                </Route>
                <Route path="/progress">
                  <ProtectedRoute>
                    <SafeLazyWrapper message="Loading progress...">
                      <LazyDailyProgress />
                    </SafeLazyWrapper>
                  </ProtectedRoute>
                </Route>
                <Route path="/voice-assistant">
                  <ProtectedRoute>
                    <VoiceAssistantPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/sustainability">
                  <ProtectedRoute>
                    <SafeLazyWrapper message="Loading sustainability...">
                      <LazySustainability />
                    </SafeLazyWrapper>
                  </ProtectedRoute>
                </Route>
                <Route path="/recommendations">
                  <ProtectedRoute>
                    <SafeLazyWrapper message="Loading recommendations...">
                      <LazyRecommendations />
                    </SafeLazyWrapper>
                  </ProtectedRoute>
                </Route>
                <Route path="/profile">
                  <ProtectedRoute>
                    <SafeLazyWrapper message="Loading profile...">
                      <LazyProfile />
                    </SafeLazyWrapper>
                  </ProtectedRoute>
                </Route>
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;