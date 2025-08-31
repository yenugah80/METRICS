/**
 * Freemium Model Middleware
 * Handles usage tracking and premium feature enforcement
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../../infrastructure/database/storage';

export interface FreemiumRequest extends Request {
  user?: any;
  isGuest?: boolean;
  usageStats?: {
    recipesGenerated: number;
    remainingFree: number;
    isPremium: boolean;
  };
}

// Track guest usage in memory (in production, use Redis or database)
const guestUsage = new Map<string, { recipesGenerated: number; firstUsed: Date }>();

// Clean up old guest sessions (24 hours)
setInterval(() => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  guestUsage.forEach((usage, sessionId) => {
    if (usage.firstUsed < oneDayAgo) {
      guestUsage.delete(sessionId);
    }
  });
}, 60 * 60 * 1000); // Clean every hour

/**
 * Middleware to handle guest users and authenticated users
 */
export async function freemiumMiddleware(req: FreemiumRequest, res: Response, next: NextFunction) {
  try {
    // Check if user is authenticated
    const userId = req.user?.id;
    
    if (userId) {
      // Authenticated user - check premium status
      const user = await storage.getUser(userId);
      
      req.usageStats = {
        recipesGenerated: 0, // Not tracking usage anymore - features are premium-only
        remainingFree: 0,    // No free access - features are premium-only
        isPremium: user?.isPremium || false
      };
      req.isGuest = false;
    } else {
      // Guest user - no access to premium features
      req.usageStats = {
        recipesGenerated: 0,
        remainingFree: 0,    // No free access for guests
        isPremium: false
      };
      req.isGuest = true;
    }

    next();
  } catch (error) {
    console.error('Freemium middleware error:', error);
    next(error);
  }
}

/**
 * Middleware to enforce premium features
 */
export function requirePremium(req: FreemiumRequest, res: Response, next: NextFunction) {
  if (!req.usageStats?.isPremium) {
    return res.status(402).json({
      error: 'Premium subscription required',
      message: 'This feature requires a premium subscription. Upgrade to unlock unlimited access.',
      upgradeUrl: '/api/stripe/create-subscription'
    });
  }
  next();
}

/**
 * Middleware to check recipe generation limits
 */
export async function checkRecipeLimit(req: FreemiumRequest, res: Response, next: NextFunction) {
  try {
    if (!req.usageStats) {
      return res.status(400).json({ error: 'Usage stats not available' });
    }

    // Premium users have unlimited access
    if (req.usageStats.isPremium) {
      return next();
    }

    // Check if user has exceeded free limit
    if (req.usageStats.remainingFree <= 0) {
      return res.status(402).json({
        error: 'Free recipe limit exceeded',
        message: 'You\'ve used your free recipe generation. Upgrade to premium for unlimited recipes!',
        usageStats: req.usageStats,
        upgradeUrl: '/api/stripe/create-subscription'
      });
    }

    next();
  } catch (error) {
    console.error('Recipe limit check error:', error);
    res.status(500).json({ error: 'Unable to check usage limits' });
  }
}

/**
 * Update usage stats after successful recipe generation
 * (Simplified since features are now premium-only)
 */
export async function incrementRecipeUsage(req: FreemiumRequest, res: Response, next: NextFunction) {
  try {
    // Features are premium-only now, so no usage tracking needed
    next();
  } catch (error) {
    console.error('Usage increment error:', error);
    next();
  }
}