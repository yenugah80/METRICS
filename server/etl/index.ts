// ETL System Entry Point and Scheduler

import { ETLJobRunner, DiscoveryService } from './dataFetchers';
import { NutritionCalculationEngine } from './dataTransformation';
import { SystemHealthMonitor, AlertingSystem } from './monitoring';

// Main ETL System Controller
export class ETLSystem {
  private jobRunner = new ETLJobRunner();
  private discoveryService = new DiscoveryService();
  private calculationEngine = new NutritionCalculationEngine();
  private healthMonitor = new SystemHealthMonitor();
  private alerting = new AlertingSystem();

  async initialize(): Promise<void> {
    console.log('Initializing ETL system...');
    
    try {
      // Initialize calculation engine (sets up conversions, densities, etc.)
      await this.calculationEngine.initialize();
      
      console.log('ETL system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ETL system:', error);
      throw error;
    }
  }

  // Run scheduled discovery jobs
  async runDiscoveryJobs(): Promise<void> {
    console.log('Running discovery jobs...');
    await this.jobRunner.runDiscoveryJob();
  }

  // Run data refresh jobs
  async runRefreshJobs(): Promise<void> {
    console.log('Running data refresh jobs...');
    await this.jobRunner.runUSDARefreshJob();
  }

  // Monitor system health and send alerts
  async monitorHealth(): Promise<void> {
    await this.alerting.checkAndSendAlerts();
  }

  // Get system status
  async getSystemStatus(): Promise<any> {
    return await this.healthMonitor.getSystemHealth();
  }

  // Add ingredient to discovery queue
  async discoverIngredient(name: string, source: string = 'manual'): Promise<void> {
    await this.discoveryService.queueForDiscovery(name, source);
  }

  // Calculate nutrition for a specific ingredient and quantity
  async calculateNutrition(
    ingredientId: string,
    quantity: number,
    unit: string,
    context?: string,
    preparation?: string
  ): Promise<any> {
    return await this.calculationEngine.calculateNutritionForQuantity(
      ingredientId,
      quantity,
      unit,
      context,
      preparation
    );
  }
}

// Global ETL system instance
export const etlSystem = new ETLSystem();

// Job Scheduler Functions (called by cron jobs or background tasks)
export async function runScheduledTasks() {
  try {
    console.log('Running scheduled ETL tasks...');
    
    // Run discovery queue processing every hour
    await etlSystem.runDiscoveryJobs();
    
    // Monitor system health every 15 minutes
    await etlSystem.monitorHealth();
    
    console.log('Scheduled ETL tasks completed');
  } catch (error) {
    console.error('Error in scheduled ETL tasks:', error);
  }
}

export async function runDailyTasks() {
  try {
    console.log('Running daily ETL tasks...');
    
    // Refresh old ingredient data daily
    await etlSystem.runRefreshJobs();
    
    console.log('Daily ETL tasks completed');
  } catch (error) {
    console.error('Error in daily ETL tasks:', error);
  }
}

// Export all ETL components for use in routes
export { USDAFetcher, OpenFoodFactsFetcher, DiscoveryService } from './dataFetchers';
export { UnitConverter, DensityCalculator, NutritionCalculationEngine } from './dataTransformation';
export { DataQualityMonitor, ETLJobMonitor, SystemHealthMonitor } from './monitoring';