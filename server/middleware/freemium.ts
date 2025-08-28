/**
 * Freemium Model Middleware
 * Handles usage tracking and premium feature enforcement
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

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
    const userId = req.user?.id || req.user?.claims?.sub;
    
    if (userId) {
      // Authenticated user - get their usage stats
      const userProfile = await storage.getUserProfile(userId);
      const usageStats = await storage.getUserUsageStats(userId);
      
      req.usageStats = {
        recipesGenerated: usageStats?.recipesGenerated || 0,
        remainingFree: Math.max(0, 1 - (usageStats?.recipesGenerated || 0)),
        isPremium: false // Will be updated from user data
      };
      req.isGuest = false;
    } else {
      // Guest user - track by session/IP
      const sessionId = req.headers['x-session-id'] as string || req.ip || 'unknown';
      const guestStats = guestUsage.get(sessionId) || { recipesGenerated: 0, firstUsed: new Date() };
      
      req.usageStats = {
        recipesGenerated: guestStats.recipesGenerated,
        remainingFree: Math.max(0, 1 - guestStats.recipesGenerated),
        isPremium: false
      };
      req.isGuest = true;
      
      // Update guest usage
      guestUsage.set(sessionId, guestStats);
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
 */
export async function incrementRecipeUsage(req: FreemiumRequest, res: Response, next: NextFunction) {
  try {
    if (req.isGuest) {
      // Update guest usage
      const sessionId = req.headers['x-session-id'] as string || req.ip || 'unknown';
      const guestStats = guestUsage.get(sessionId) || { recipesGenerated: 0, firstUsed: new Date() };
      guestStats.recipesGenerated += 1;
      guestUsage.set(sessionId, guestStats);
    } else if (req.user?.id || req.user?.claims?.sub) {
      // Update authenticated user usage
      const userId = req.user.id || req.user.claims.sub;
      await storage.incrementUserRecipeUsage(userId);
    }

    next();
  } catch (error) {
    console.error('Usage increment error:', error);
    // Don't fail the request for usage tracking errors
    next();
  }
}