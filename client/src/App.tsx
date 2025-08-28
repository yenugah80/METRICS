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
import Dashboard from "@/pages/dashboard";
import MealCamera from "@/pages/meal-camera";
import RecipesPage from "@/pages/recipes-page";
import DailyProgress from "@/pages/daily-progress";
import Sustainability from "@/pages/sustainability";
import NotFound from "@/pages/not-found";
import RecommendationsPage from "@/pages/recommendations-page";
import Profile from "@/pages/profile";

function App() {
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
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              </Route>
              <Route path="/search">
                <ProtectedRoute><SearchPage /></ProtectedRoute>
              </Route>
              <Route path="/camera" component={MealCamera} />
              <Route path="/demo" component={MealCamera} />
              <Route path="/recipes">
                <ProtectedRoute><RecipesPage /></ProtectedRoute>
              </Route>
              <Route path="/progress">
                <ProtectedRoute><DailyProgress /></ProtectedRoute>
              </Route>
              <Route path="/voice">
                <ProtectedRoute><MealCamera /></ProtectedRoute>
              </Route>
              <Route path="/sustainability">
                <ProtectedRoute><Sustainability /></ProtectedRoute>
              </Route>
              <Route path="/recommendations">
                <ProtectedRoute><RecommendationsPage /></ProtectedRoute>
              </Route>
              <Route path="/profile">
                <ProtectedRoute><Profile /></ProtectedRoute>
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