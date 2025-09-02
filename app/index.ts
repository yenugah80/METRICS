// ============================================================================
// SERVER ENTRY POINT - Clean & Simple
// ============================================================================

import app from './core/app';
import { checkDatabaseConnection } from './core/database';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Check database connection (graceful fallback)
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed - running in demo mode');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Clean Nutrition App running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`💾 Database: ${dbConnected ? 'Connected' : 'Demo Mode'}`);
      console.log(`✨ Clean Architecture: Active`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();