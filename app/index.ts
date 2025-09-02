// ============================================================================
// SERVER ENTRY POINT - Clean & Simple
// ============================================================================

import app from './core/app';
import { checkDatabaseConnection } from './core/database';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Clean Nutrition App running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`💾 Database: Connected`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();