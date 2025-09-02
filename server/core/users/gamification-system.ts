/**
 * Comprehensive Gamification System v2
 * XP, Levels, Badges, Daily Quests, Streaks, and Anti-abuse measures
 * Performance SLO: User updates p95 < 200ms
 */

import crypto from 'crypto';

export interface UserGameProfile {
  userId: string;
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  dailyQuests: DailyQuest[];
  weeklyQuests: WeeklyQuest[];
  lastLoginDate: Date;
  lastQuestRefresh: Date;
  antiAbuse: {
    lastActionTimestamp: Date;
    actionCount24h: number;
    suspiciousActivity: boolean;
  };
  stats: {
    totalMealsLogged: number;
    perfectDays: number; // Days with 3+ meals logged
    recipesGenerated: number;
    voiceInputsUsed: number;
    avgNutritionScore: number;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt: Date;
  xpReward: number;
}

export interface DailyQuest {
  id: string;
  type: 'log_meals' | 'nutrition_score' | 'streak_maintain' | 'recipe_generate' | 'voice_input';
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
  expiresAt: Date;
}

export interface WeeklyQuest {
  id: string;
  type: 'weekly_meals' | 'weekly_recipes' | 'weekly_score_avg' | 'weekly_streak';
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
  expiresAt: Date;
}

export interface XPEvent {
  type: 'meal_logged' | 'recipe_generated' | 'streak_bonus' | 'quest_completed' | 'badge_earned' | 'perfect_day';
  baseXP: number;
  multiplier: number;
  reason: string;
}

// XP Calculation Rules
const XP_RULES = {
  meal_logged: 10,
  perfect_nutrition_score: 25, // Score >= 85
  good_nutrition_score: 15,    // Score >= 70
  recipe_generated: 8,
  voice_input_used: 5,         // Premium feature bonus
  daily_quest_completed: 50,
  weekly_quest_completed: 200,
  badge_earned: 100,
  perfect_day_bonus: 50,       // 3+ meals with avg score >= 75
  streak_bonus: 20,           // Daily streak continuation bonus
  quest_completed: 30,        // Generic quest completion
  streak_bonus_multiplier: 0.1 // +10% per day in streak (max 200%)
};

// Level thresholds (XP required for each level)
const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  850,   // Level 5
  1300,  // Level 6
  1850,  // Level 7
  2500,  // Level 8
  3250,  // Level 9
  4100,  // Level 10
  5000,  // Level 11
  6000,  // Level 12
  7100,  // Level 13
  8300,  // Level 14
  9600,  // Level 15
  11000, // Level 16
  12500, // Level 17
  14100, // Level 18
  15800, // Level 19
  17600, // Level 20
  // Continues scaling exponentially
];

// Badge definitions
const BADGE_DEFINITIONS = {
  // Meal Logging Badges
  first_meal: { name: "First Bite", description: "Log your first meal", icon: "🍽️", tier: "bronze", xp: 25 },
  meals_10: { name: "Getting Started", description: "Log 10 meals", icon: "📝", tier: "bronze", xp: 50 },
  meals_50: { name: "Consistent Logger", description: "Log 50 meals", icon: "📊", tier: "silver", xp: 100 },
  meals_200: { name: "Nutrition Master", description: "Log 200 meals", icon: "🏆", tier: "gold", xp: 200 },
  meals_500: { name: "Legendary Tracker", description: "Log 500 meals", icon: "👑", tier: "platinum", xp: 500 },

  // Streak Badges
  streak_3: { name: "On a Roll", description: "3-day logging streak", icon: "🔥", tier: "bronze", xp: 50 },
  streak_7: { name: "Week Warrior", description: "7-day logging streak", icon: "🗓️", tier: "silver", xp: 100 },
  streak_30: { name: "Month Master", description: "30-day logging streak", icon: "📅", tier: "gold", xp: 300 },
  streak_100: { name: "Centennial", description: "100-day logging streak", icon: "💯", tier: "platinum", xp: 1000 },

  // Nutrition Score Badges
  perfect_score: { name: "Perfect Score", description: "Achieve a 95+ nutrition score", icon: "💯", tier: "gold", xp: 100 },
  score_streak_7: { name: "Excellence Streak", description: "7 days of 80+ scores", icon: "⭐", tier: "silver", xp: 150 },
  avg_score_85: { name: "Nutrition Pro", description: "Maintain 85+ average score", icon: "🥇", tier: "gold", xp: 200 },

  // Recipe Badges
  first_recipe: { name: "Chef Beginner", description: "Generate your first recipe", icon: "👨‍🍳", tier: "bronze", xp: 25 },
  recipes_10: { name: "Home Cook", description: "Generate 10 recipes", icon: "📖", tier: "silver", xp: 75 },
  recipes_50: { name: "Master Chef", description: "Generate 50 recipes", icon: "🎩", tier: "gold", xp: 200 },

  // Premium Feature Badges
  voice_pioneer: { name: "Voice Pioneer", description: "Use voice input 10 times", icon: "🎤", tier: "silver", xp: 100 },
  premium_pro: { name: "Premium Pro", description: "Use all premium features", icon: "💎", tier: "platinum", xp: 300 },

  // Special Achievement Badges
  perfect_week: { name: "Perfect Week", description: "7 perfect days in a row", icon: "🌟", tier: "gold", xp: 500 },
  early_bird: { name: "Early Bird", description: "Log breakfast before 8 AM for 7 days", icon: "🌅", tier: "silver", xp: 100 },
  night_owl: { name: "Night Owl", description: "Log dinner after 8 PM for 7 days", icon: "🌙", tier: "silver", xp: 100 }
};

// Quest generators
function generateDailyQuests(userProfile: UserGameProfile): DailyQuest[] {
  const quests: DailyQuest[] = [];
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Always include basic meal logging quest
  quests.push({
    id: crypto.randomUUID(),
    type: 'log_meals',
    title: 'Daily Nutrition',
    description: 'Log 3 meals today',
    target: 3,
    progress: 0,
    xpReward: 30,
    completed: false,
    expiresAt: tomorrow
  });

  // Rotation of additional quests
  const questPool = [
    {
      type: 'nutrition_score' as const,
      title: 'Healthy Choices',
      description: 'Achieve an average nutrition score of 75+',
      target: 75,
      xpReward: 40
    },
    {
      type: 'recipe_generate' as const,
      title: 'Culinary Explorer',
      description: 'Generate 2 new recipes',
      target: 2,
      xpReward: 25
    }
  ];

  // Add premium quest for premium users
  if (userProfile.stats.voiceInputsUsed > 0) {
    questPool.push({
      type: 'voice_input' as const,
      title: 'Voice Master',
      description: 'Use voice input 3 times',
      target: 3,
      xpReward: 35
    });
  }

  // Select 2 additional quests randomly
  const shuffled = questPool.sort(() => 0.5 - Math.random());
  const selectedQuests = shuffled.slice(0, 2);

  for (const quest of selectedQuests) {
    quests.push({
      id: crypto.randomUUID(),
      type: quest.type,
      title: quest.title,
      description: quest.description,
      target: quest.target,
      progress: 0,
      xpReward: quest.xpReward,
      completed: false,
      expiresAt: tomorrow
    });
  }

  return quests;
}

function generateWeeklyQuests(userProfile: UserGameProfile): WeeklyQuest[] {
  const quests: WeeklyQuest[] = [];
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);

  // Weekly meal logging quest
  quests.push({
    id: crypto.randomUUID(),
    type: 'weekly_meals',
    title: 'Weekly Dedication',
    description: 'Log 15 meals this week',
    target: 15,
    progress: 0,
    xpReward: 150,
    completed: false,
    expiresAt: nextWeek
  });

  // Weekly recipe generation quest
  quests.push({
    id: crypto.randomUUID(),
    type: 'weekly_recipes',
    title: 'Recipe Explorer',
    description: 'Generate 5 recipes this week',
    target: 5,
    progress: 0,
    xpReward: 100,
    completed: false,
    expiresAt: nextWeek
  });

  return quests;
}

// Anti-abuse detection
function isActionSuspicious(userProfile: UserGameProfile, actionType: string): boolean {
  const now = new Date();
  const hoursSinceLastAction = (now.getTime() - userProfile.antiAbuse.lastActionTimestamp.getTime()) / (1000 * 60 * 60);
  
  // Rate limiting: max 50 actions per 24h
  if (userProfile.antiAbuse.actionCount24h >= 50) {
    return true;
  }

  // Detect rapid successive actions (potential automation)
  if (hoursSinceLastAction < 0.02) { // Less than ~1 minute
    return true;
  }

  // Detect unusual patterns (e.g., logging many meals at exact same time)
  if (actionType === 'meal_logged' && hoursSinceLastAction < 0.1) { // Less than 6 minutes
    return true;
  }

  return false;
}

// Level calculation
export function calculateLevel(totalXP: number): number {
  for (let level = LEVEL_THRESHOLDS.length - 1; level >= 0; level--) {
    if (totalXP >= LEVEL_THRESHOLDS[level]) {
      return level + 1;
    }
  }
  return 1;
}

export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    // Beyond predefined levels, use exponential scaling
    const baseXP = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const additionalLevels = currentLevel - LEVEL_THRESHOLDS.length + 1;
    return baseXP + (additionalLevels * 2000);
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

// Main XP award function with anti-abuse
export async function awardXP(userId: string, event: XPEvent, userProfile: UserGameProfile): Promise<{
  xpAwarded: number;
  newLevel: number;
  leveledUp: boolean;
  badgesEarned: Badge[];
  questsCompleted: (DailyQuest | WeeklyQuest)[];
}> {
  // Anti-abuse check
  if (isActionSuspicious(userProfile, event.type)) {
    console.warn(`Suspicious activity detected for user ${userId}: ${event.type}`);
    userProfile.antiAbuse.suspiciousActivity = true;
    return {
      xpAwarded: 0,
      newLevel: userProfile.currentLevel,
      leveledUp: false,
      badgesEarned: [],
      questsCompleted: []
    };
  }

  // Calculate base XP
  let baseXP = XP_RULES[event.type as keyof typeof XP_RULES] || event.baseXP || 0;
  
  // Apply streak multiplier
  const streakMultiplier = Math.min(1 + (userProfile.currentStreak * XP_RULES.streak_bonus_multiplier), 3.0); // Cap at 300%
  
  // Apply event-specific multiplier
  const totalMultiplier = streakMultiplier * (event.multiplier || 1);
  
  const xpAwarded = Math.floor(baseXP * totalMultiplier);
  
  // Update user profile
  const oldLevel = userProfile.currentLevel;
  userProfile.totalXP += xpAwarded;
  userProfile.currentLevel = calculateLevel(userProfile.totalXP);
  
  const leveledUp = userProfile.currentLevel > oldLevel;
  
  // Update anti-abuse tracking
  userProfile.antiAbuse.lastActionTimestamp = new Date();
  userProfile.antiAbuse.actionCount24h += 1;
  
  // Check for new badges
  const badgesEarned = checkForNewBadges(userProfile);
  
  // Update quest progress
  const questsCompleted = updateQuestProgress(userProfile, event);
  
  return {
    xpAwarded,
    newLevel: userProfile.currentLevel,
    leveledUp,
    badgesEarned,
    questsCompleted
  };
}

function checkForNewBadges(userProfile: UserGameProfile): Badge[] {
  const newBadges: Badge[] = [];
  const earnedBadgeIds = new Set(userProfile.badges.map(b => b.id));
  
  // Check meal logging badges
  if (userProfile.stats.totalMealsLogged === 1 && !earnedBadgeIds.has('first_meal')) {
    newBadges.push(createBadge('first_meal'));
  }
  if (userProfile.stats.totalMealsLogged >= 10 && !earnedBadgeIds.has('meals_10')) {
    newBadges.push(createBadge('meals_10'));
  }
  if (userProfile.stats.totalMealsLogged >= 50 && !earnedBadgeIds.has('meals_50')) {
    newBadges.push(createBadge('meals_50'));
  }
  if (userProfile.stats.totalMealsLogged >= 200 && !earnedBadgeIds.has('meals_200')) {
    newBadges.push(createBadge('meals_200'));
  }
  if (userProfile.stats.totalMealsLogged >= 500 && !earnedBadgeIds.has('meals_500')) {
    newBadges.push(createBadge('meals_500'));
  }
  
  // Check streak badges
  if (userProfile.currentStreak >= 3 && !earnedBadgeIds.has('streak_3')) {
    newBadges.push(createBadge('streak_3'));
  }
  if (userProfile.currentStreak >= 7 && !earnedBadgeIds.has('streak_7')) {
    newBadges.push(createBadge('streak_7'));
  }
  if (userProfile.currentStreak >= 30 && !earnedBadgeIds.has('streak_30')) {
    newBadges.push(createBadge('streak_30'));
  }
  if (userProfile.currentStreak >= 100 && !earnedBadgeIds.has('streak_100')) {
    newBadges.push(createBadge('streak_100'));
  }
  
  // Check recipe badges
  if (userProfile.stats.recipesGenerated === 1 && !earnedBadgeIds.has('first_recipe')) {
    newBadges.push(createBadge('first_recipe'));
  }
  if (userProfile.stats.recipesGenerated >= 10 && !earnedBadgeIds.has('recipes_10')) {
    newBadges.push(createBadge('recipes_10'));
  }
  if (userProfile.stats.recipesGenerated >= 50 && !earnedBadgeIds.has('recipes_50')) {
    newBadges.push(createBadge('recipes_50'));
  }
  
  // Check voice badges
  if (userProfile.stats.voiceInputsUsed >= 10 && !earnedBadgeIds.has('voice_pioneer')) {
    newBadges.push(createBadge('voice_pioneer'));
  }
  
  // Check nutrition score badges
  if (userProfile.stats.avgNutritionScore >= 85 && !earnedBadgeIds.has('avg_score_85')) {
    newBadges.push(createBadge('avg_score_85'));
  }
  
  return newBadges;
}

function createBadge(badgeId: string): Badge {
  const definition = BADGE_DEFINITIONS[badgeId as keyof typeof BADGE_DEFINITIONS];
  return {
    id: badgeId,
    name: definition.name,
    description: definition.description,
    icon: definition.icon,
    tier: definition.tier as 'bronze' | 'silver' | 'gold' | 'platinum',
    unlockedAt: new Date(),
    xpReward: definition.xp
  };
}

function updateQuestProgress(userProfile: UserGameProfile, event: XPEvent): (DailyQuest | WeeklyQuest)[] {
  const completedQuests: (DailyQuest | WeeklyQuest)[] = [];
  
  // Update daily quests
  for (const quest of userProfile.dailyQuests) {
    if (quest.completed) continue;
    
    let progressIncrement = 0;
    
    switch (quest.type) {
      case 'log_meals':
        if (event.type === 'meal_logged') progressIncrement = 1;
        break;
      case 'recipe_generate':
        if (event.type === 'recipe_generated') progressIncrement = 1;
        break;
      case 'voice_input':
        if (event.type === 'meal_logged' && event.reason.includes('voice')) progressIncrement = 1;
        break;
    }
    
    if (progressIncrement > 0) {
      quest.progress += progressIncrement;
      if (quest.progress >= quest.target) {
        quest.completed = true;
        completedQuests.push(quest);
      }
    }
  }
  
  // Update weekly quests
  for (const quest of userProfile.weeklyQuests) {
    if (quest.completed) continue;
    
    let progressIncrement = 0;
    
    switch (quest.type) {
      case 'weekly_meals':
        if (event.type === 'meal_logged') progressIncrement = 1;
        break;
      case 'weekly_recipes':
        if (event.type === 'recipe_generated') progressIncrement = 1;
        break;
    }
    
    if (progressIncrement > 0) {
      quest.progress += progressIncrement;
      if (quest.progress >= quest.target) {
        quest.completed = true;
        completedQuests.push(quest);
      }
    }
  }
  
  return completedQuests;
}

// Daily quest refresh
export function refreshDailyQuests(userProfile: UserGameProfile): boolean {
  const now = new Date();
  const lastRefresh = new Date(userProfile.lastQuestRefresh);
  
  // Check if it's a new day
  if (now.toDateString() !== lastRefresh.toDateString()) {
    userProfile.dailyQuests = generateDailyQuests(userProfile);
    userProfile.lastQuestRefresh = now;
    
    // Reset daily action count for anti-abuse
    userProfile.antiAbuse.actionCount24h = 0;
    
    return true;
  }
  
  return false;
}

// Weekly quest refresh
export function refreshWeeklyQuests(userProfile: UserGameProfile): boolean {
  const now = new Date();
  const lastRefresh = new Date(userProfile.lastQuestRefresh);
  
  // Check if it's a new week (assuming week starts on Monday)
  const currentWeek = getWeekNumber(now);
  const lastRefreshWeek = getWeekNumber(lastRefresh);
  
  if (currentWeek !== lastRefreshWeek) {
    userProfile.weeklyQuests = generateWeeklyQuests(userProfile);
    return true;
  }
  
  return false;
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

// Streak management
export function updateStreak(userProfile: UserGameProfile, mealLoggedToday: boolean): void {
  const today = new Date().toDateString();
  const lastLogin = new Date(userProfile.lastLoginDate).toDateString();
  
  if (mealLoggedToday) {
    if (today === lastLogin) {
      // Same day, no change to streak
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastLogin === yesterdayStr) {
      // Consecutive day, extend streak
      userProfile.currentStreak += 1;
      userProfile.longestStreak = Math.max(userProfile.longestStreak, userProfile.currentStreak);
    } else {
      // Streak broken, restart
      userProfile.currentStreak = 1;
    }
    
    userProfile.lastLoginDate = new Date();
  }
}

// Initialize new user profile
export function createInitialGameProfile(userId: string): UserGameProfile {
  return {
    userId,
    totalXP: 0,
    currentLevel: 1,
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
    dailyQuests: [],
    weeklyQuests: [],
    lastLoginDate: new Date(),
    lastQuestRefresh: new Date(),
    antiAbuse: {
      lastActionTimestamp: new Date(),
      actionCount24h: 0,
      suspiciousActivity: false
    },
    stats: {
      totalMealsLogged: 0,
      perfectDays: 0,
      recipesGenerated: 0,
      voiceInputsUsed: 0,
      avgNutritionScore: 0
    }
  };
}