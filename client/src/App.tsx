import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/navigation";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import SearchPage from "@/pages/search";
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
            <Switch>
              <Route path="/" component={Landing} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/dashboard">
                <ProtectedRoute>
                  <SafeLazyWrapper message="Loading dashboard...">
                    <LazyDashboard />
                  </SafeLazyWrapper>
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
              <Route path="/voice">
                <ProtectedRoute>
                  <SafeLazyWrapper message="Loading voice logger...">
                    <LazyMealCamera />
                  </SafeLazyWrapper>
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
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;