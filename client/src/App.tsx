import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import SearchPage from "@/pages/search";
import Dashboard from "@/pages/dashboard";
import MealCamera from "@/pages/meal-camera";
import RecipesPage from "@/pages/recipes-page";
import DailyProgress from "@/pages/daily-progress";
import VoiceLogging from "@/pages/voice-logging";
import Sustainability from "@/pages/sustainability";
import NotFound from "@/pages/not-found";
import RecommendationsPage from "@/pages/recommendations-page";

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
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/search" component={SearchPage} />
              <Route path="/camera" component={MealCamera} />
              <Route path="/recipes" component={RecipesPage} />
              <Route path="/progress" component={DailyProgress} />
              <Route path="/voice" component={VoiceLogging} />
              <Route path="/sustainability" component={Sustainability} />
              <Route path="/recommendations" component={RecommendationsPage} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;