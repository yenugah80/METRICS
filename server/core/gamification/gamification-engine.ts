/**
 * Comprehensive Gamification Engine
 * XP, Levels, Streaks, Quests, Badges, and Achievement System
 */

import { storage } from '../../infrastructure/database/storage';
import { db } from '../../infrastructure/database/db';
import { eq, and, gte, sql } from 'drizzle-orm';
import { users, events, quests, userQuests, activities } from '../../../shared/schema';

export interface XPEvent {
  userId: string;
  eventType: 'meal_logged' | 'recipe_generated' | 'goal_achieved' | 'streak_milestone' | 'quest_completed';
  xpAmount: number;
  description: string;
  metadata?: any;
}

export interface QuestProgress {
  questId: string;
  currentProgress: number;
  targetValue: number;
  isCompleted: boolean;
  xpReward: number;
  badgeReward?: string;
}

export interface UserLevel {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  totalXPNeeded: number;
  badgesUnlocked: string[];
}

class GamificationEngine {
  
  // XP System
  static readonly XP_REWARDS = {
    MEAL_LOGGED: 10,
    RECIPE_GENERATED: 25,
    DAILY_GOAL_ACHIEVED: 50,
    WEEKLY_STREAK: 100,
    MONTHLY_STREAK: 300,
    QUEST_COMPLETED: 75,
    PERFECT_DAY: 150, // All macros + micros achieved
    SUSTAINABILITY_GOAL: 40,
    FOOD_GRADE_A: 30,
  };

  static readonly LEVEL_THRESHOLDS = [
    0,     // Level 1
    100,   // Level 2
    250,   // Level 3
    500,   // Level 4
    1000,  // Level 5
    1800,  // Level 6
    2800,  // Level 7
    4000,  // Level 8
    5500,  // Level 9
    7500,  // Level 10
    10000, // Level 11+
  ];

  // Award XP for various actions
  static async awardXP(xpEvent: XPEvent): Promise<void> {
    try {
      // Update user XP and level
      const user = await storage.getUser(xpEvent.userId);
      if (!user) return;

      const newXP = (user.xp || 0) + xpEvent.xpAmount;
      const newLevel = this.calculateLevel(newXP);
      const leveledUp = newLevel > (user.level || 1);

      // Update user record
      await db
        .update(users)
        .set({
          xp: newXP,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(users.id, xpEvent.userId));

      // Log the XP event
      await db.insert(events).values({
        userId: xpEvent.userId,
        eventType: 'xp.awarded',
        entityType: 'user',
        entityId: xpEvent.userId,
        eventData: {
          xpAmount: xpEvent.xpAmount,
          eventType: xpEvent.eventType,
          description: xpEvent.description,
          leveledUp,
          newLevel,
          metadata: xpEvent.metadata,
        },
        xpAwarded: xpEvent.xpAmount,
      });

      // Check for level-up achievements
      if (leveledUp) {
        await this.handleLevelUp(xpEvent.userId, newLevel);
      }

      // Check quest progress
      await this.updateQuestProgress(xpEvent.userId, xpEvent.eventType, 1);

    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }

  // Calculate user level based on XP
  static calculateLevel(xp: number): number {
    for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= this.LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // Calculate XP needed for next level
  static getXPForNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    const nextThreshold = this.LEVEL_THRESHOLDS[currentLevel] || this.LEVEL_THRESHOLDS[this.LEVEL_THRESHOLDS.length - 1] + (currentLevel - this.LEVEL_THRESHOLDS.length + 1) * 2500;
    return Math.max(0, nextThreshold - currentXP);
  }

  // Handle level up rewards and badges
  static async handleLevelUp(userId: string, newLevel: number): Promise<void> {
    const badges = [];
    
    // Level milestone badges
    if (newLevel === 5) badges.push('fitness_rookie');
    if (newLevel === 10) badges.push('nutrition_enthusiast');
    if (newLevel === 15) badges.push('health_champion');
    if (newLevel === 20) badges.push('wellness_expert');
    if (newLevel === 25) badges.push('nutrition_master');

    if (badges.length > 0) {
      await this.awardBadges(userId, badges);
    }

    // Award bonus XP for level up
    await this.awardXP({
      userId,
      eventType: 'goal_achieved',
      xpAmount: newLevel * 10,
      description: `Level ${newLevel} achieved! Bonus XP awarded.`,
      metadata: { levelUp: true, newLevel }
    });
  }

  // Award badges
  static async awardBadges(userId: string, badges: string[]): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    const currentBadges = user.badges || [];
    const newBadges = badges.filter(badge => !currentBadges.includes(badge));
    
    if (newBadges.length > 0) {
      const updatedBadges = [...currentBadges, ...newBadges];
      
      await db
        .update(users)
        .set({
          badges: updatedBadges,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Log badge events
      for (const badge of newBadges) {
        await db.insert(events).values({
          userId,
          eventType: 'badge.awarded',
          entityType: 'user',
          entityId: userId,
          eventData: { badge },
          newBadges: [badge],
        });
      }
    }
  }

  // Update quest progress
  static async updateQuestProgress(userId: string, eventType: string, progressAmount: number): Promise<void> {
    // Get active user quests
    const activeQuests = await db
      .select()
      .from(userQuests)
      .where(and(
        eq(userQuests.userId, userId),
        eq(userQuests.isCompleted, false)
      ));

    for (const userQuest of activeQuests) {
      const quest = await db
        .select()
        .from(quests)
        .where(eq(quests.id, userQuest.questId))
        .limit(1);

      if (quest.length === 0) continue;

      const questData = quest[0];
      
      // Check if this event type matches the quest category
      if (this.doesEventMatchQuest(eventType, questData.category)) {
        const newProgress = Math.min((userQuest.currentProgress || 0) + progressAmount, questData.targetValue);
        const isCompleted = newProgress >= questData.targetValue;

        await db
          .update(userQuests)
          .set({
            currentProgress: newProgress,
            isCompleted,
            completedAt: isCompleted ? new Date() : userQuest.completedAt,
            updatedAt: new Date(),
          })
          .where(eq(userQuests.id, userQuest.id));

        // Award quest completion rewards
        if (isCompleted && !userQuest.isCompleted) {
          await this.awardXP({
            userId,
            eventType: 'quest_completed',
            xpAmount: questData.xpReward,
            description: `Quest "${questData.name}" completed!`,
            metadata: { questId: questData.id }
          });

          if (questData.badgeReward) {
            await this.awardBadges(userId, [questData.badgeReward]);
          }
        }
      }
    }
  }

  // Check if event matches quest category
  static doesEventMatchQuest(eventType: string, questCategory: string): boolean {
    const eventQuestMap = {
      'meal_logged': ['nutrition', 'activity'],
      'recipe_generated': ['nutrition'],
      'goal_achieved': ['nutrition', 'activity'],
      'streak_milestone': ['streak'],
    };

    return (eventQuestMap as any)[eventType]?.includes(questCategory) || false;
  }

  // Calculate and update streaks
  static async updateStreaks(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check if user has activity today
    const todayActivities = await db
      .select()
      .from(activities)
      .where(and(
        eq(activities.userId, userId),
        gte(activities.createdAt, new Date(today))
      ));

    if (todayActivities.length > 0) {
      const currentStreak = user.currentStreak || 0;
      let newStreak = currentStreak;

      // Check if this continues yesterday's streak
      const yesterdayActivities = await db
        .select()
        .from(activities)
        .where(and(
          eq(activities.userId, userId),
          gte(activities.createdAt, new Date(yesterday)),
          gte(activities.createdAt, new Date(today))
        ));

      if (yesterdayActivities.length > 0 || currentStreak === 0) {
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1; // Reset streak
      }

      const longestStreak = Math.max(user.longestStreak || 0, newStreak);

      await db
        .update(users)
        .set({
          currentStreak: newStreak,
          longestStreak,
          lastActiveDate: today,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Award streak milestone XP
      if (newStreak > currentStreak) {
        let xpAmount = 0;
        let description = '';

        if (newStreak % 7 === 0) {
          xpAmount = this.XP_REWARDS.WEEKLY_STREAK;
          description = `${newStreak}-day streak! Weekly milestone achieved.`;
        } else if (newStreak % 30 === 0) {
          xpAmount = this.XP_REWARDS.MONTHLY_STREAK;
          description = `${newStreak}-day streak! Monthly milestone achieved.`;
        }

        if (xpAmount > 0) {
          await this.awardXP({
            userId,
            eventType: 'streak_milestone',
            xpAmount,
            description,
            metadata: { streak: newStreak }
          });
        }
      }
    }
  }

  // Get user's gamification status
  static async getUserGamificationStatus(userId: string): Promise<UserLevel & { currentStreak: number; longestStreak: number; badges: string[]; recentXP: any[] }> {
    const user = await storage.getUser(userId);
    if (!user) {
      return {
        level: 1,
        currentXP: 0,
        xpForNextLevel: 100,
        totalXPNeeded: 100,
        badgesUnlocked: [],
        currentStreak: 0,
        longestStreak: 0,
        badges: [],
        recentXP: [],
      };
    }

    const currentXP = user.xp || 0;
    const level = user.level || 1;
    const xpForNextLevel = this.getXPForNextLevel(currentXP);
    const currentLevelThreshold = this.LEVEL_THRESHOLDS[level - 1] || 0;
    const nextLevelThreshold = this.LEVEL_THRESHOLDS[level] || this.LEVEL_THRESHOLDS[this.LEVEL_THRESHOLDS.length - 1] + (level - this.LEVEL_THRESHOLDS.length + 1) * 2500;
    const totalXPNeeded = nextLevelThreshold - currentLevelThreshold;

    // Get recent XP events
    const recentXPEvents = await db
      .select()
      .from(events)
      .where(and(
        eq(events.userId, userId),
        eq(events.eventType, 'xp.awarded')
      ))
      .orderBy(sql`${events.createdAt} DESC`)
      .limit(10);

    return {
      level,
      currentXP: currentXP - currentLevelThreshold,
      xpForNextLevel,
      totalXPNeeded,
      badgesUnlocked: user.badges || [],
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      badges: user.badges || [],
      recentXP: recentXPEvents.map(event => ({
        xpAmount: event.xpAwarded,
        description: (event.eventData as any)?.description,
        timestamp: event.createdAt,
      })),
    };
  }

  // Initialize default quests for new users
  static async initializeUserQuests(userId: string): Promise<void> {
    const defaultQuests = [
      {
        name: 'First Steps',
        description: 'Log your first 3 meals',
        questType: 'daily',
        category: 'nutrition',
        targetValue: 3,
        xpReward: 50,
        badgeReward: 'first_steps',
      },
      {
        name: 'Weekly Warrior',
        description: 'Log meals for 7 consecutive days',
        questType: 'weekly',
        category: 'streak',
        targetValue: 7,
        xpReward: 200,
        badgeReward: 'weekly_warrior',
      },
      {
        name: 'Recipe Explorer',
        description: 'Generate 5 AI recipes',
        questType: 'monthly',
        category: 'nutrition',
        targetValue: 5,
        xpReward: 150,
        badgeReward: 'recipe_explorer',
      },
    ];

    for (const questData of defaultQuests) {
      // Create quest if it doesn't exist
      const existingQuest = await db
        .select()
        .from(quests)
        .where(eq(quests.name, questData.name))
        .limit(1);

      let questId: string;
      if (existingQuest.length === 0) {
        const [newQuest] = await db.insert(quests).values(questData).returning();
        questId = newQuest.id;
      } else {
        questId = existingQuest[0].id;
      }

      // Check if user already has this quest
      const existingUserQuest = await db
        .select()
        .from(userQuests)
        .where(and(
          eq(userQuests.userId, userId),
          eq(userQuests.questId, questId)
        ))
        .limit(1);

      if (existingUserQuest.length === 0) {
        await db.insert(userQuests).values({
          userId,
          questId,
          currentProgress: 0,
          isCompleted: false,
        });
      }
    }
  }
}

export { GamificationEngine };