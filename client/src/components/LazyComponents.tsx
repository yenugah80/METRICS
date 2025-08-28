/**
 * Lazy-loaded Components for Performance Optimization
 * Code splitting and dynamic imports for better performance
 */

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { lazyLoadComponent } from '@/lib/performance';

// Loading component
function ComponentLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Lazy-loaded page components
export const LazyDashboard = lazyLoadComponent(
  () => import('../pages/dashboard')
);

export const LazyRecipesPage = lazyLoadComponent(
  () => import('../pages/recipes-page')
);

export const LazyRecipeGenerator = lazyLoadComponent(
  () => import('../pages/recipe-generator')
);

export const LazyProfile = lazyLoadComponent(
  () => import('../pages/profile')
);

export const LazyNutritionSearch = lazyLoadComponent(
  () => import('../pages/nutrition-search')
);

export const LazyMealCamera = lazyLoadComponent(
  () => import('../pages/meal-camera')
);

export const LazySustainability = lazyLoadComponent(
  () => import('../pages/sustainability')
);

export const LazyDailyProgress = lazyLoadComponent(
  () => import('../pages/daily-progress')
);

export const LazyRecommendations = lazyLoadComponent(
  () => import('../pages/recommendations-page')
);

export const LazySubscribe = lazyLoadComponent(
  () => import('../pages/subscribe')
);

// Lazy-loaded heavy components
export const LazyRecipeChatbot = lazyLoadComponent(
  () => import('../components/recipe-chatbot')
);

export const LazyBarcodeScanner = lazyLoadComponent(
  () => import('../components/BarcodeScanner')
);

export const LazyCameraCapture = lazyLoadComponent(
  () => import('../components/CameraCapture')
);

export const LazyVoiceLogger = lazyLoadComponent(
  () => import('../components/VoiceLogger')
);

export const LazyObjectUploader = lazyLoadComponent(
  () => import('../components/ObjectUploader')
);

// Wrapper component with Suspense boundary
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
}

export function LazyWrapper({ 
  children, 
  fallback, 
  message = 'Loading component...' 
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <ComponentLoader message={message} />}>
      {children}
    </Suspense>
  );
}

// Error boundary for lazy components
interface LazyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  LazyErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">Failed to load component</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Combined wrapper with error boundary and suspense
export function SafeLazyWrapper({ 
  children, 
  fallback, 
  message = 'Loading...' 
}: LazyWrapperProps) {
  return (
    <LazyErrorBoundary>
      <LazyWrapper fallback={fallback} message={message}>
        {children}
      </LazyWrapper>
    </LazyErrorBoundary>
  );
}