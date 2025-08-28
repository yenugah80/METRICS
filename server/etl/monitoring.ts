import { db } from "../db";
import { dataQualityMetrics, etlJobs, ingredients, nutritionData } from "@shared/schema";
import { eq, gte, count, avg, and } from "drizzle-orm";

// Data Quality Monitoring System
export class DataQualityMonitor {
  async evaluateIngredientQuality(ingredientId: string): Promise<number> {
    const checks = [
      await this.checkNutritionCompleteness(ingredientId),
      await this.checkDataConsistency(ingredientId),
      await this.checkDataFreshness(ingredientId),
      await this.checkSourceReliability(ingredientId)
    ];

    const overallScore = checks.reduce((sum, score) => sum + score, 0) / checks.length;
    
    // Store the quality metric
    await db.insert(dataQualityMetrics).values({
      metricType: 'ingredient_overall_quality',
      entityType: 'ingredient',
      entityId: ingredientId,
      score: overallScore.toFixed(4),
      details: {
        completeness: checks[0],
        consistency: checks[1],
        freshness: checks[2],
        reliability: checks[3]
      }
    });

    return overallScore;
  }

  private async checkNutritionCompleteness(ingredientId: string): Promise<number> {
    const [nutrition] = await db.select()
      .from(nutritionData)
      .where(eq(nutritionData.ingredientId, ingredientId))
      .limit(1);

    if (!nutrition) return 0;

    // Check how many essential nutrition fields are present
    const essentialFields = [
      'calories', 'protein', 'totalFat', 'carbohydrates',
      'fiber', 'sugar', 'sodium'
    ];

    let presentFields = 0;
    for (const field of essentialFields) {
      const value = nutrition[field as keyof typeof nutrition];
      if (value !== null && value !== undefined && value !== '0') {
        presentFields++;
      }
    }

    return presentFields / essentialFields.length;
  }

  private async checkDataConsistency(ingredientId: string): Promise<number> {
    const [nutrition] = await db.select()
      .from(nutritionData)
      .where(eq(nutritionData.ingredientId, ingredientId))
      .limit(1);

    if (!nutrition) return 0;

    let consistencyScore = 1.0;
    const issues: string[] = [];

    // Check if calories roughly match macronutrients
    if (nutrition.calories && nutrition.protein && nutrition.totalFat && nutrition.carbohydrates) {
      const calories = parseFloat(nutrition.calories);
      const protein = parseFloat(nutrition.protein);
      const fat = parseFloat(nutrition.totalFat);
      const carbs = parseFloat(nutrition.carbohydrates);

      const calculatedCalories = (protein * 4) + (fat * 9) + (carbs * 4);
      const difference = Math.abs(calories - calculatedCalories);
      const percentDifference = difference / calories;

      if (percentDifference > 0.2) { // More than 20% difference
        consistencyScore -= 0.3;
        issues.push('calories_macros_mismatch');
      }
    }

    // Check for impossible values
    if (nutrition.protein && parseFloat(nutrition.protein) > 100) {
      consistencyScore -= 0.2;
      issues.push('protein_over_100g');
    }

    if (nutrition.totalFat && parseFloat(nutrition.totalFat) > 100) {
      consistencyScore -= 0.2;
      issues.push('fat_over_100g');
    }

    // Store consistency issues if any
    if (issues.length > 0) {
      await db.insert(dataQualityMetrics).values({
        metricType: 'data_consistency',
        entityType: 'ingredient',
        entityId: ingredientId,
        score: consistencyScore.toFixed(4),
        details: { issues }
      });
    }

    return Math.max(0, consistencyScore);
  }

  private async checkDataFreshness(ingredientId: string): Promise<number> {
    const [ingredient] = await db.select()
      .from(ingredients)
      .where(eq(ingredients.id, ingredientId))
      .limit(1);

    if (!ingredient || !ingredient.lastUpdated) return 0.5;

    const daysSinceUpdate = (Date.now() - ingredient.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    // Fresh data (< 30 days) gets full score
    if (daysSinceUpdate < 30) return 1.0;
    
    // Data older than 365 days gets minimum score
    if (daysSinceUpdate > 365) return 0.1;
    
    // Linear decay between 30 and 365 days
    return 1.0 - ((daysSinceUpdate - 30) / 335) * 0.9;
  }

  private async checkSourceReliability(ingredientId: string): Promise<number> {
    const [ingredient] = await db.select()
      .from(ingredients)
      .where(eq(ingredients.id, ingredientId))
      .limit(1);

    if (!ingredient) return 0;

    // Source reliability scores
    const sourceScores: { [key: string]: number } = {
      'usda_fdc': 0.95,
      'open_food_facts': 0.80,
      'user_input': 0.60,
      'estimated': 0.40
    };

    return sourceScores[ingredient.source] || 0.50;
  }

  async generateDataQualityReport(): Promise<any> {
    // Get overall quality statistics
    const [qualityStats] = await db.select({
      avgScore: avg(dataQualityMetrics.score),
      totalChecks: count()
    })
    .from(dataQualityMetrics)
    .where(eq(dataQualityMetrics.metricType, 'ingredient_overall_quality'));

    // Get quality distribution
    const qualityDistribution = await db.select({
      score: dataQualityMetrics.score,
      count: count()
    })
    .from(dataQualityMetrics)
    .where(eq(dataQualityMetrics.metricType, 'ingredient_overall_quality'))
    .groupBy(dataQualityMetrics.score);

    // Get recent quality trends
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentQuality = await db.select({
      avgScore: avg(dataQualityMetrics.score)
    })
    .from(dataQualityMetrics)
    .where(and(
      eq(dataQualityMetrics.metricType, 'ingredient_overall_quality'),
      gte(dataQualityMetrics.measuredAt, oneDayAgo)
    ));

    return {
      overview: {
        averageQualityScore: qualityStats.avgScore,
        totalIngredientsChecked: qualityStats.totalChecks,
        recentAverageScore: recentQuality[0]?.avgScore || null
      },
      distribution: qualityDistribution,
      lastUpdated: new Date().toISOString()
    };
  }
}

// ETL Job Monitoring System
export class ETLJobMonitor {
  async getJobStatistics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    const timeAgo = this.getTimeframeDate(timeframe);

    const jobStats = await db.select({
      jobType: etlJobs.jobType,
      status: etlJobs.status,
      count: count(),
      avgDuration: avg(etlJobs.recordsProcessed)
    })
    .from(etlJobs)
    .where(gte(etlJobs.startedAt, timeAgo))
    .groupBy(etlJobs.jobType, etlJobs.status);

    return {
      timeframe,
      statistics: jobStats,
      lastUpdated: new Date().toISOString()
    };
  }

  async getFailedJobs(limit: number = 10): Promise<any[]> {
    const failedJobs = await db.select()
      .from(etlJobs)
      .where(eq(etlJobs.status, 'failed'))
      .orderBy(etlJobs.startedAt)
      .limit(limit);

    return failedJobs.map(job => ({
      id: job.id,
      jobType: job.jobType,
      startedAt: job.startedAt,
      error: job.errorLog,
      metadata: job.metadata
    }));
  }

  async getJobPerformanceMetrics(): Promise<any> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Success rate by job type
    const allJobs = await db.select({
      jobType: etlJobs.jobType,
      status: etlJobs.status
    })
    .from(etlJobs)
    .where(gte(etlJobs.startedAt, oneDayAgo));

    // Calculate success rates manually
    const successRates = allJobs.reduce((acc: any[], job) => {
      const existing = acc.find(item => item.jobType === job.jobType);
      if (existing) {
        existing.total++;
        if (job.status === 'completed') existing.successful++;
      } else {
        acc.push({
          jobType: job.jobType,
          total: 1,
          successful: job.status === 'completed' ? 1 : 0
        });
      }
      return acc;
    }, []);

    // Processing throughput
    const throughput = await db.select({
      jobType: etlJobs.jobType,
      totalRecords: count(etlJobs.recordsProcessed),
      avgRecordsPerJob: avg(etlJobs.recordsProcessed)
    })
    .from(etlJobs)
    .where(and(
      gte(etlJobs.startedAt, oneDayAgo),
      eq(etlJobs.status, 'completed')
    ))
    .groupBy(etlJobs.jobType);

    return {
      successRates: successRates.map(sr => ({
        jobType: sr.jobType,
        successRate: sr.total > 0 ? (sr.successful / sr.total) * 100 : 0,
        totalJobs: sr.total
      })),
      throughput,
      period: '24 hours'
    };
  }

  private getTimeframeDate(timeframe: 'hour' | 'day' | 'week'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }
}

// System Health Monitor
export class SystemHealthMonitor {
  private dataQualityMonitor = new DataQualityMonitor();
  private etlJobMonitor = new ETLJobMonitor();

  async getSystemHealth(): Promise<any> {
    const [
      dataQuality,
      etlPerformance,
      recentFailures
    ] = await Promise.all([
      this.dataQualityMonitor.generateDataQualityReport(),
      this.etlJobMonitor.getJobPerformanceMetrics(),
      this.etlJobMonitor.getFailedJobs(5)
    ]);

    // Calculate overall system health score
    const healthFactors = {
      dataQuality: parseFloat(dataQuality.overview.averageQualityScore) || 0,
      etlReliability: this.calculateETLReliability(etlPerformance.successRates),
      systemUptime: this.calculateSystemUptime(recentFailures)
    };

    const overallHealth = Object.values(healthFactors).reduce((sum, score) => sum + score, 0) / 3;

    return {
      overallHealth: overallHealth,
      healthGrade: this.getHealthGrade(overallHealth),
      factors: healthFactors,
      details: {
        dataQuality,
        etlPerformance,
        recentFailures: recentFailures.length
      },
      alerts: this.generateHealthAlerts(healthFactors, recentFailures),
      lastChecked: new Date().toISOString()
    };
  }

  private calculateETLReliability(successRates: any[]): number {
    if (successRates.length === 0) return 0.5;
    
    const avgSuccessRate = successRates.reduce((sum, sr) => sum + sr.successRate, 0) / successRates.length;
    return avgSuccessRate / 100; // Convert percentage to 0-1 scale
  }

  private calculateSystemUptime(recentFailures: any[]): number {
    // Simple uptime calculation based on recent failures
    // In production, this would be more sophisticated
    const failureCount = recentFailures.length;
    if (failureCount === 0) return 1.0;
    if (failureCount > 10) return 0.5;
    
    return 1.0 - (failureCount * 0.05); // Each failure reduces uptime by 5%
  }

  private getHealthGrade(score: number): string {
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }

  private generateHealthAlerts(healthFactors: any, recentFailures: any[]): string[] {
    const alerts: string[] = [];

    if (healthFactors.dataQuality < 0.7) {
      alerts.push('Data quality below acceptable threshold');
    }

    if (healthFactors.etlReliability < 0.8) {
      alerts.push('ETL job failure rate is high');
    }

    if (recentFailures.length > 5) {
      alerts.push('Multiple recent system failures detected');
    }

    if (healthFactors.systemUptime < 0.9) {
      alerts.push('System uptime is below target');
    }

    return alerts;
  }
}

// Alerting System
export class AlertingSystem {
  private healthMonitor = new SystemHealthMonitor();

  async checkAndSendAlerts(): Promise<void> {
    const health = await this.healthMonitor.getSystemHealth();
    
    if (health.alerts.length > 0) {
      await this.sendAlerts(health.alerts, health);
    }
  }

  private async sendAlerts(alerts: string[], healthData: any): Promise<void> {
    // In production, this would send emails, Slack messages, etc.
    console.warn('SYSTEM ALERTS:', {
      timestamp: new Date().toISOString(),
      overallHealth: healthData.overallHealth,
      grade: healthData.healthGrade,
      alerts
    });

    // Store alert in database for tracking
    for (const alert of alerts) {
      await db.insert(dataQualityMetrics).values({
        metricType: 'system_alert',
        entityType: 'system',
        score: healthData.overallHealth.toFixed(4),
        details: { alert, healthData }
      });
    }
  }
}