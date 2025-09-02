/**
 * Gamification API Routes
 * XP, Levels, Badges, Quests, and Achievement System
 */

import { Router } from 'express';
import { verifyJWT, type AuthenticatedRequest } from '../../infrastructure/auth/authService';
import { GamificationEngine } from '../../core/gamification/gamification-engine';
import { EventProcessor } from '../../core/events/event-processor';
import { storage } from '../../infrastructure/database/storage';

const router = Router();

// Get user's gamification status
router.get('/api/gamification/status', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const status = await GamificationEngine.getUserGamificationStatus(userId);
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error fetching gamification status:', error);
    res.status(500).json({
      error: 'Failed to fetch gamification status'
    });
  }
});

// Trigger XP award (for testing or manual awards)
router.post('/api/gamification/award-xp', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { eventType, xpAmount, description, metadata } = req.body;
    
    if (!eventType || !xpAmount || !description) {
      return res.status(400).json({
        error: 'eventType, xpAmount, and description are required'
      });
    }

    await GamificationEngine.awardXP({
      userId,
      eventType,
      xpAmount,
      description,
      metadata
    });

    const updatedStatus = await GamificationEngine.getUserGamificationStatus(userId);
    
    res.json({
      success: true,
      message: 'XP awarded successfully',
      status: updatedStatus
    });
  } catch (error) {
    console.error('Error awarding XP:', error);
    res.status(500).json({
      error: 'Failed to award XP'
    });
  }
});

// Get user's active quests
router.get('/api/gamification/quests', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    
    // Initialize quests if this is a new user
    await GamificationEngine.initializeUserQuests(userId);
    
    // Get user's quest progress
    const quests = await storage.db
      .select({
        questId: storage.userQuests.questId,
        questName: storage.quests.name,
        questDescription: storage.quests.description,
        questType: storage.quests.questType,
        category: storage.quests.category,
        targetValue: storage.quests.targetValue,
        currentProgress: storage.userQuests.currentProgress,
        isCompleted: storage.userQuests.isCompleted,
        xpReward: storage.quests.xpReward,
        badgeReward: storage.quests.badgeReward,
      })
      .from(storage.userQuests)
      .innerJoin(storage.quests, storage.eq(storage.userQuests.questId, storage.quests.id))
      .where(storage.eq(storage.userQuests.userId, userId));
    
    res.json({
      success: true,
      quests
    });
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({
      error: 'Failed to fetch quests'
    });
  }
});

// Process pending events for user
router.post('/api/gamification/process-events', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const results = await EventProcessor.processPendingEvents(userId);
    
    res.json({
      success: true,
      eventsProcessed: results.length,
      results
    });
  } catch (error) {
    console.error('Error processing events:', error);
    res.status(500).json({
      error: 'Failed to process events'
    });
  }
});

// Get user's recent achievements
router.get('/api/gamification/achievements', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent XP events
    const recentEvents = await storage.db
      .select()
      .from(storage.events)
      .where(storage.and(
        storage.eq(storage.events.userId, userId),
        storage.eq(storage.events.eventType, 'xp.awarded')
      ))
      .orderBy(storage.desc(storage.events.createdAt))
      .limit(20);
    
    // Get recent badge awards
    const recentBadges = await storage.db
      .select()
      .from(storage.events)
      .where(storage.and(
        storage.eq(storage.events.userId, userId),
        storage.eq(storage.events.eventType, 'badge.awarded')
      ))
      .orderBy(storage.desc(storage.events.createdAt))
      .limit(10);
    
    res.json({
      success: true,
      recentXP: recentEvents.map(event => ({
        xpAmount: event.xpAwarded,
        description: event.eventData?.description,
        timestamp: event.createdAt,
        eventType: event.eventData?.eventType
      })),
      recentBadges: recentBadges.map(event => ({
        badge: event.eventData?.badge,
        timestamp: event.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      error: 'Failed to fetch achievements'
    });
  }
});

// Update user streak manually (for testing)
router.post('/api/gamification/update-streak', verifyJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    await GamificationEngine.updateStreaks(userId);
    
    const updatedStatus = await GamificationEngine.getUserGamificationStatus(userId);
    
    res.json({
      success: true,
      message: 'Streak updated',
      currentStreak: updatedStatus.currentStreak,
      longestStreak: updatedStatus.longestStreak
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({
      error: 'Failed to update streak'
    });
  }
});

export { router as gamificationRoutes };