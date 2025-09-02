import type { Express } from "express";

export async function registerHealthRoutes(app: Express) {
  // Health monitoring endpoints
  app.get('/health', async (req, res) => {
    const { healthCheck } = await import('./health/monitoring');
    await healthCheck(req, res);
  });
  
  app.get('/health/live', async (req, res) => {
    const { livenessProbe } = await import('./health/monitoring');
    livenessProbe(req, res);
  });
  
  app.get('/health/ready', async (req, res) => {
    const { readinessProbe } = await import('./health/monitoring');
    await readinessProbe(req, res);
  });
  
  app.get('/metrics', async (req, res) => {
    const { metricsEndpoint } = await import('./health/monitoring');
    metricsEndpoint(req, res);
  });
}