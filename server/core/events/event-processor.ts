/**
 * Real-time Event Processing System
 * Handles meal.created, meal.updated, activity.synced events
 * Triggers recalculations, XP updates, and real-time notifications
 */

import { storage } from '../../infrastructure/database/storage';
import { db } from '../../infrastructure/database/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { events, meals, dailyNutrition, users, activities } from '../../../shared/schema';
import { GamificationEngine } from '../gamification/gamification-engine';

export interface EventPayload {
  userId: string;
  eventType: 'meal.created' | 'meal.updated' | 'activity.synced' | 'sleep.synced' | 'goal.achieved';
  entityType: 'meal' | 'activity' | 'sleep' | 'goal';
  entityId: string;
  eventData: any;
}

export interface ProcessedEvent {
  eventId: string;
  triggeredRecalculation: boolean;
  xpAwarded: number;
  newBadges: string[];
  notificationsSent: string[];
}

export class EventProcessor {

  // Main event processing entry point
  static async processEvent(payload: EventPayload): Promise<ProcessedEvent> {
    try {
      // Log the event
      const [event] = await db.insert(events).values({
        userId: payload.userId,
        eventType: payload.eventType,
        entityType: payload.entityType,
        entityId: payload.entityId,
        eventData: payload.eventData,
        processed: false,
      }).returning();

      const result: ProcessedEvent = {
        eventId: event.id,
        triggeredRecalculation: false,
        xpAwarded: 0,
        newBadges: [],
        notificationsSent: [],
      };

      // Process based on event type
      switch (payload.eventType) {
        case 'meal.created':
          await this.handleMealCreated(payload, result);
          break;
        case 'meal.updated':
          await this.handleMealUpdated(payload, result);
          break;
        case 'activity.synced':
          await this.handleActivitySynced(payload, result);
          break;
        case 'sleep.synced':
          await this.handleSleepSynced(payload, result);
          break;
        case 'goal.achieved':
          await this.handleGoalAchieved(payload, result);
          break;
      }

      // Update event as processed
      await db
        .update(events)
        .set({
          processed: true,
          processedAt: new Date(),
          triggeredRecalculation: result.triggeredRecalculation,
          xpAwarded: result.xpAwarded,
          newBadges: result.newBadges,
        })
        .where(eq(events.id, event.id));

      return result;
    } catch (error) {
      console.error('Event processing error:', error);
      throw error;
    }
  }

  // Handle meal creation events
  private static async handleMealCreated(payload: EventPayload, result: ProcessedEvent): Promise<void> {
    const meal = await storage.getMeal(payload.entityId);
    if (!meal) return;

    // Recalculate daily nutrition
    await this.recalculateDailyNutrition(payload.userId, meal.loggedAt);
    result.triggeredRecalculation = true;

    // Award XP for meal logging
    const xpAmount = GamificationEngine.XP_REWARDS.MEAL_LOGGED;
    await GamificationEngine.awardXP({
      userId: payload.userId,
      eventType: 'meal_logged',
      xpAmount,
      description: `Logged ${meal.name || 'a meal'} via ${meal.loggedVia}`,
      metadata: { mealId: meal.id, loggedVia: meal.loggedVia }
    });
    result.xpAwarded += xpAmount;

    // Update streaks
    await GamificationEngine.updateStreaks(payload.userId);

    // Check for food grade achievements
    if (meal.nutritionScore && meal.nutritionScore >= 85) {
      const gradeXP = GamificationEngine.XP_REWARDS.FOOD_GRADE_A;
      await GamificationEngine.awardXP({
        userId: payload.userId,
        eventType: 'goal_achieved',
        xpAmount: gradeXP,
        description: 'Excellent nutrition score! Grade A meal.',
        metadata: { mealId: meal.id, nutritionScore: meal.nutritionScore }
      });
      result.xpAwarded += gradeXP;
    }

    // Check for sustainability achievements
    if (meal.sustainabilityScore && meal.sustainabilityScore >= 8) {
      const sustainXP = GamificationEngine.XP_REWARDS.SUSTAINABILITY_GOAL;
      await GamificationEngine.awardXP({
        userId: payload.userId,
        eventType: 'goal_achieved',
        xpAmount: sustainXP,
        description: 'Eco-friendly meal choice! Sustainability bonus.',
        metadata: { mealId: meal.id, sustainabilityScore: meal.sustainabilityScore }
      });
      result.xpAwarded += sustainXP;
    }

    // Push real-time notification
    result.notificationsSent.push('meal_logged');
  }

  // Handle meal update events
  private static async handleMealUpdated(payload: EventPayload, result: ProcessedEvent): Promise<void> {
    const meal = await storage.getMeal(payload.entityId);
    if (!meal) return;

    // Recalculate daily nutrition
    await this.recalculateDailyNutrition(payload.userId, meal.loggedAt);
    result.triggeredRecalculation = true;

    // Push real-time notification for updated nutrition
    result.notificationsSent.push('nutrition_updated');
  }

  // Handle activity sync events
  private static async handleActivitySynced(payload: EventPayload, result: ProcessedEvent): Promise<void> {
    // Award XP for activity logging
    const xpAmount = GamificationEngine.XP_REWARDS.MEAL_LOGGED; // Same as meal for now
    await GamificationEngine.awardXP({
      userId: payload.userId,
      eventType: 'meal_logged', // Map to existing type
      xpAmount,
      description: 'Activity synced from fitness tracker',
      metadata: payload.eventData
    });
    result.xpAwarded += xpAmount;

    // Update streaks
    await GamificationEngine.updateStreaks(payload.userId);

    result.notificationsSent.push('activity_synced');
  }

  // Handle sleep sync events
  private static async handleSleepSynced(payload: EventPayload, result: ProcessedEvent): Promise<void> {
    // Award XP for good sleep
    if (payload.eventData?.hours >= 7) {
      const xpAmount = 20;
      await GamificationEngine.awardXP({
        userId: payload.userId,
        eventType: 'goal_achieved',
        xpAmount,
        description: 'Good sleep! Recovery bonus.',
        metadata: payload.eventData
      });
      result.xpAwarded += xpAmount;
    }

    result.notificationsSent.push('sleep_synced');
  }

  // Handle goal achievement events
  private static async handleGoalAchieved(payload: EventPayload, result: ProcessedEvent): Promise<void> {
    const xpAmount = GamificationEngine.XP_REWARDS.DAILY_GOAL_ACHIEVED;
    await GamificationEngine.awardXP({
      userId: payload.userId,
      eventType: 'goal_achieved',
      xpAmount,
      description: 'Daily nutrition goal achieved!',
      metadata: payload.eventData
    });
    result.xpAwarded += xpAmount;

    // Check for perfect day
    const isPerfectDay = await this.checkPerfectDay(payload.userId);
    if (isPerfectDay) {
      const perfectXP = GamificationEngine.XP_REWARDS.PERFECT_DAY;
      await GamificationEngine.awardXP({
        userId: payload.userId,
        eventType: 'goal_achieved',
        xpAmount: perfectXP,
        description: 'Perfect nutrition day! All goals achieved.',
        metadata: { perfectDay: true }
      });
      result.xpAwarded += perfectXP;
    }

    result.notificationsSent.push('goal_achieved');
  }

  // Recalculate daily nutrition totals
  private static async recalculateDailyNutrition(userId: string, mealDate: Date): Promise<void> {
    const dateStr = mealDate.toISOString().split('T')[0];
    
    // Get all meals for this date
    const dayMeals = await db
      .select()
      .from(meals)
      .where(and(
        eq(meals.userId, userId),
        sql`DATE(${meals.loggedAt}) = ${dateStr}`
      ));

    // Calculate totals
    const totals = dayMeals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.totalCalories || 0),
      protein: acc.protein + (meal.totalProtein || 0),
      carbs: acc.carbs + (meal.totalCarbs || 0),
      fat: acc.fat + (meal.totalFat || 0),
      fiber: acc.fiber + (meal.totalFiber || 0),
      sodium: acc.sodium + (meal.totalSodium || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 });

    // Get user goals
    const user = await storage.getUser(userId);
    const goals = {
      calories: user?.dailyCalorieGoal || 2000,
      protein: user?.dailyProteinGoal || 150,
      carbs: user?.dailyCarbGoal || 250,
      fat: user?.dailyFatGoal || 65,
    };

    // Check goal achievements
    const achievements = {
      calorieGoalAchieved: totals.calories >= goals.calories * 0.9 && totals.calories <= goals.calories * 1.1,
      proteinGoalAchieved: totals.protein >= goals.protein,
      carbGoalAchieved: totals.carbs >= goals.carbs * 0.8 && totals.carbs <= goals.carbs * 1.2,
      fatGoalAchieved: totals.fat >= goals.fat * 0.8 && totals.fat <= goals.fat * 1.2,
    };

    // Calculate nutrition score
    const nutritionScore = this.calculateNutritionScore(totals, goals);

    // Upsert daily nutrition record
    await storage.createOrUpdateDailyNutrition({
      userId,
      date: dateStr,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
      totalSodium: totals.sodium,
      mealsLogged: dayMeals.length,
      ...achievements,
      overallNutritionScore: nutritionScore,
    });
  }

  // Calculate nutrition score (1-100)
  private static calculateNutritionScore(totals: any, goals: any): number {
    let score = 0;
    
    // Calorie accuracy (25 points)
    const calorieRatio = totals.calories / goals.calories;
    if (calorieRatio >= 0.9 && calorieRatio <= 1.1) {
      score += 25;
    } else if (calorieRatio >= 0.8 && calorieRatio <= 1.2) {
      score += 15;
    }

    // Protein adequacy (25 points)
    if (totals.protein >= goals.protein) {
      score += 25;
    } else if (totals.protein >= goals.protein * 0.8) {
      score += 15;
    }

    // Carb balance (25 points)
    const carbRatio = totals.carbs / goals.carbs;
    if (carbRatio >= 0.8 && carbRatio <= 1.2) {
      score += 25;
    } else if (carbRatio >= 0.6 && carbRatio <= 1.4) {
      score += 15;
    }

    // Fat balance (25 points)
    const fatRatio = totals.fat / goals.fat;
    if (fatRatio >= 0.8 && fatRatio <= 1.2) {
      score += 25;
    } else if (fatRatio >= 0.6 && fatRatio <= 1.4) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Check if user achieved perfect day
  private static async checkPerfectDay(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const todayNutrition = await storage.getDailyNutrition(userId, today);
    
    if (!todayNutrition) return false;

    return todayNutrition.calorieGoalAchieved && 
           todayNutrition.proteinGoalAchieved && 
           todayNutrition.carbGoalAchieved && 
           todayNutrition.fatGoalAchieved;
  }

  // Get unprocessed events for a user
  static async getUnprocessedEvents(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(events)
      .where(and(
        eq(events.userId, userId),
        eq(events.processed, false)
      ))
      .orderBy(desc(events.createdAt));
  }

  // Process all pending events for a user
  static async processPendingEvents(userId: string): Promise<ProcessedEvent[]> {
    const pendingEvents = await this.getUnprocessedEvents(userId);
    const results: ProcessedEvent[] = [];

    for (const event of pendingEvents) {
      try {
        const result = await this.processEvent({
          userId: event.userId,
          eventType: event.eventType as any,
          entityType: event.entityType as any,
          entityId: event.entityId,
          eventData: event.eventData,
        });
        results.push(result);
      } catch (error) {
        console.error('Error processing pending event:', error);
      }
    }

    return results;
  }
}

