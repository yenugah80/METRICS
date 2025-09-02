// ============================================================================
// MAIN APP - Clean Production Architecture
// ============================================================================

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Import clean route modules
import apiRoutes from '../routes/api';
import aiRoutes from '../routes/ai';
import authRoutes from '../routes/auth';

// Import types for session
import '../types/session';

const app = express();

// ============================================================================
// MIDDLEWARE - Essential Only
// ============================================================================

// Security
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for dev
  crossOriginResourcePolicy: false
}));

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ============================================================================
// ROUTES - Clean & Organized
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// ============================================================================
// FRONTEND SERVING - Critical for user preview
// ============================================================================

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/public'));
}

// Vite dev server integration for development
if (process.env.NODE_ENV !== 'production') {
  try {
    const { createViteDevServer } = await import('../../server/createViteDevServer.js');
    app.use(createViteDevServer());
  } catch (err) {
    console.warn('Vite dev server not available, serving built files');
    app.use(express.static('dist/public'));
  }
}

// Catch-all for client-side routing (React Router)
app.get('*', (req, res) => {
  // Both production and development use dist/public after build
  res.sendFile('dist/public/index.html', { root: '.' });
});

// API 404 handler (only for API routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API route not found' 
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

export default app;