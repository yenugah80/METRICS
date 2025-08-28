/**
 * Frontend Performance Optimization Utilities
 * Lazy loading, image optimization, and performance monitoring
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Lazy loading with loading states
export function lazyLoadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
): LazyExoticComponent<T> {
  return lazy(async () => {
    // Add artificial delay in development to test loading states
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return importFunc();
  });
}

// Image optimization utilities
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

// Utility function to generate optimized image props
export function getOptimizedImageProps({
  src,
  alt,
  width,
  height,
  quality = 80,
  className,
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) {
  // Generate responsive image URLs (would integrate with image CDN in production)
  const getSrcSet = (baseSrc: string) => {
    if (baseSrc.startsWith('http')) {
      // For external images, return as-is (would add CDN transformations)
      return baseSrc;
    }
    
    // For local images, generate responsive variants
    const sizes = [400, 800, 1200];
    return sizes
      .map(size => `${baseSrc}?w=${size}&q=${quality} ${size}w`)
      .join(', ');
  };

  return {
    src,
    srcSet: getSrcSet(src),
    sizes: "(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px",
    alt,
    width,
    height,
    className,
    loading,
    onLoad,
    onError,
    style: {
      objectFit: 'cover' as const,
      backgroundColor: '#f3f4f6' // Loading placeholder color
    }
  };
}

// Performance monitoring
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  
  start(label: string): void {
    this.metrics.set(label, performance.now());
  }
  
  end(label: string): number {
    const start = this.metrics.get(label);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.metrics.delete(label);
    
    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`Slow operation: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  measure<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.start(label);
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        this.end(label);
      });
    } else {
      this.end(label);
      return result;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Web Vitals monitoring
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;
  
  // Monitor Core Web Vitals only in development
  if (process.env.NODE_ENV === 'development') {
    const vitalsHandler = (metric: any) => {
      console.info('Web Vital:', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating
      });
    };
    
    // Monitor Core Web Vitals (only import if needed)
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(vitalsHandler);
      getFID(vitalsHandler);
      getFCP(vitalsHandler);
      getLCP(vitalsHandler);
      getTTFB(vitalsHandler);
    }).catch(() => {
      // Gracefully handle if web-vitals is not available
    });
  }
}

// Bundle analysis utilities
export function logBundleSize(): void {
  if (process.env.NODE_ENV === 'development') {
    // Estimate bundle size from loaded modules
    const scripts = document.querySelectorAll('script[src]');
    const styles = document.querySelectorAll('link[rel="stylesheet"]');
    
    console.info('Bundle Analysis:', {
      scripts: scripts.length,
      styles: styles.length,
      estimate: 'Use bundler analyzer for accurate measurements'
    });
  }
}

// Memory usage monitoring
export function monitorMemoryUsage(): void {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memInfo = (performance as any).memory;
    
    if (memInfo) {
      const memoryMB = {
        used: Math.round(memInfo.usedJSHeapSize / 1048576),
        total: Math.round(memInfo.totalJSHeapSize / 1048576),
        limit: Math.round(memInfo.jsHeapSizeLimit / 1048576)
      };
      
      console.info('Memory Usage:', memoryMB);
      
      // Warn if memory usage is high
      if (memoryMB.used > memoryMB.limit * 0.8) {
        console.warn('High memory usage detected');
      }
    }
  }
}

// Virtual scrolling utilities for large lists
export interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
}

export function useVirtualScroll({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: Omit<VirtualScrollProps, 'renderItem'>) {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;
  
  return {
    visibleCount,
    totalHeight,
    getVisibleRange: (scrollTop: number) => {
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const end = Math.min(items.length, start + visibleCount + overscan * 2);
      
      return { start, end };
    }
  };
}

// Debounce utility for search and input optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Cache utilities for expensive computations
const computationCache = new Map<string, any>();

export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (computationCache.has(key)) {
      return computationCache.get(key);
    }
    
    const result = func(...args);
    computationCache.set(key, result);
    
    // Clear cache if it gets too large
    if (computationCache.size > 1000) {
      const firstKey = computationCache.keys().next().value;
      computationCache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

// Component preloading
export function preloadRoute(routeName: string): void {
  // Preload route components when user hovers over navigation
  const preloadMap: Record<string, () => Promise<any>> = {
    dashboard: () => import('../pages/dashboard'),
    recipes: () => import('../pages/recipes-page'),
    profile: () => import('../pages/profile'),
    nutrition: () => import('../pages/nutrition-search')
  };
  
  const preloader = preloadMap[routeName];
  if (preloader) {
    preloader().catch(() => {
      // Silently fail preload attempts
    });
  }
}

// Image preloading
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Critical resource hints
export function addResourceHints(): void {
  if (typeof document === 'undefined') return;
  
  const head = document.head;
  
  // Preconnect to external domains
  const domains = [
    'https://api.openai.com',
    'https://storage.googleapis.com',
    'https://js.stripe.com'
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    head.appendChild(link);
  });
}

// Initialize performance optimizations
export function initPerformanceOptimizations(): void {
  if (typeof window === 'undefined') return;
  
  // Add resource hints
  addResourceHints();
  
  // Monitor web vitals
  initWebVitals();
  
  // Log bundle information in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      logBundleSize();
      monitorMemoryUsage();
    }, 2000);
  }
}