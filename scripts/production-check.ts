#!/usr/bin/env tsx
/**
 * Production Readiness Check Script
 * Validates environment and configuration for production deployment
 */

import { envConfig } from '../server/infrastructure/config/environment';
import { validateDeployment, getDeploymentSummary } from '../server/infrastructure/deployment/production';
import { getDatabaseHealth } from '../server/infrastructure/performance/database';

async function runProductionCheck(): Promise<void> {
  console.log('🚀 Production Readiness Check\n');
  
  try {
    // Environment validation
    console.log('📋 Environment Configuration:');
    console.log(`   NODE_ENV: ${envConfig.NODE_ENV}`);
    console.log(`   PORT: ${envConfig.PORT}`);
    console.log(`   Database: ${envConfig.DATABASE_URL ? '✅ Connected' : '❌ Missing'}`);
    console.log(`   JWT Secrets: ${envConfig.JWT_ACCESS_SECRET ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   OpenAI: ${envConfig.OPENAI_API_KEY ? '✅ Available' : '⚠️  Optional'}`);
    console.log(`   Stripe: ${envConfig.STRIPE_SECRET_KEY ? '✅ Available' : '⚠️  Optional'}`);
    console.log('');

    // Deployment validation
    console.log('🔧 Deployment Validation:');
    const deploymentSummary = getDeploymentSummary();
    
    if (deploymentSummary.ready) {
      console.log('   ✅ All requirements met');
    } else {
      console.log('   ❌ Issues found:');
      deploymentSummary.issues.forEach((issue: string) => {
        console.log(`     • ${issue}`);
      });
    }
    console.log('');

    // Database health check
    console.log('🗄️  Database Health:');
    try {
      const dbHealth = await getDatabaseHealth();
      console.log(`   Status: ${dbHealth.status === 'healthy' ? '✅' : '❌'} ${dbHealth.status}`);
      console.log(`   Connection Time: ${dbHealth.connectionTime}`);
      console.log(`   Total Queries: ${dbHealth.monitor?.totalQueries || 0}`);
    } catch (error) {
      console.log('   ❌ Database connection failed');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');

    // Production readiness score
    console.log('📊 Production Readiness Score:');
    console.log(`   Score: ${deploymentSummary.readinessScore}%`);
    
    if (deploymentSummary.readinessScore >= 95) {
      console.log('   🎉 Excellent! Ready for production deployment');
    } else if (deploymentSummary.readinessScore >= 80) {
      console.log('   ⚠️  Good, but some improvements recommended');
    } else {
      console.log('   ❌ Not ready for production deployment');
    }
    console.log('');

    // Recommendations
    if (deploymentSummary.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      deploymentSummary.recommendations.forEach((rec: string) => {
        console.log(`   • ${rec}`);
      });
      console.log('');
    }

    // Security check
    console.log('🔐 Security Features:');
    const features = deploymentSummary.features;
    console.log(`   Authentication: ${features.authentication ? '✅' : '❌'}`);
    console.log(`   Security Headers: ${features.security ? '✅' : '❌'}`);
    console.log(`   Rate Limiting: ${features.security ? '✅' : '❌'}`);
    console.log(`   Analytics: ${features.analytics ? '✅' : '⚠️ '}`);
    console.log(`   Monitoring: ${features.monitoring ? '✅' : '❌'}`);
    console.log('');

    // Final status
    if (deploymentSummary.ready && deploymentSummary.readinessScore >= 95) {
      console.log('🚀 STATUS: READY FOR PRODUCTION DEPLOYMENT');
      process.exit(0);
    } else {
      console.log('⚠️  STATUS: ADDITIONAL CONFIGURATION REQUIRED');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Production check failed:', error.message);
    process.exit(1);
  }
}

// Run the check
runProductionCheck();