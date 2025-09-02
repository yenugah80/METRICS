import { z } from 'zod';

// Runtime environment validation schema
const envSchema = z.object({
  // Core application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  
  // Database (required)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Authentication & Security (required)
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  
  // AI Features (required for core functionality)
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required for AI features'),
  
  // Payment Processing (required for premium features)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Cloud Storage (required for file uploads)
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GCS_BUCKET_NAME: z.string().optional(),
  
  // External APIs (optional but recommended)
  USDA_API_KEY: z.string().optional(),
  OPEN_FOOD_FACTS_USER_AGENT: z.string().optional(),
  
  // Security & Performance
  CORS_ORIGIN: z.string().default('http://localhost:5000'),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  
  // Feature flags
  ENABLE_VOICE_LOGGING: z.string().default('true').transform(v => v === 'true'),
  ENABLE_PREMIUM_FEATURES: z.string().default('true').transform(v => v === 'true'),
  ENABLE_ANALYTICS: z.string().default('false').transform(v => v === 'true'),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  REQUEST_ID_HEADER: z.string().default('x-request-id'),
});

type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig;

export function validateEnvironment(): EnvConfig {
  try {
    validatedEnv = envSchema.parse(process.env);
    
    // Additional validation warnings
    const warnings: string[] = [];
    
    if (!validatedEnv.STRIPE_SECRET_KEY && validatedEnv.ENABLE_PREMIUM_FEATURES) {
      warnings.push('Premium features enabled but Stripe not configured');
    }
    
    if (!validatedEnv.USDA_API_KEY) {
      warnings.push('USDA API key missing - nutrition data may be limited');
    }
    
    if (!validatedEnv.GOOGLE_CLOUD_PROJECT_ID) {
      warnings.push('Google Cloud not configured - file uploads may fail');
    }
    
    if (warnings.length > 0) {
      console.warn('Environment validation warnings:', warnings);
    }
    
    console.log('✅ Environment validation successful');
    return validatedEnv;
    
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Missing/invalid environment variables:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    
    throw new Error('Environment validation failed - check your .env file');
  }
}

export function getValidatedEnv(): EnvConfig {
  if (!validatedEnv) {
    throw new Error('Environment not validated yet - call validateEnvironment() first');
  }
  return validatedEnv;
}

// Export individual env vars for convenience
export const env = new Proxy({} as EnvConfig, {
  get(target, prop) {
    return getValidatedEnv()[prop as keyof EnvConfig];
  }
});