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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
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