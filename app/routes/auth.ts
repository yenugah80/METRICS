import { Router } from 'express';
import { auth } from '../core/auth';

// Import session types
import '../types/session';

const router = Router();

// ============================================================================
// AUTH ROUTES - Simple & Secure
// ============================================================================

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const result = await auth.login(req, res);
    res.json(result);
  } catch (error) {
    res.status(401).json({ success: false, error: 'Login failed' });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// GET CURRENT USER
router.get('/me', (req, res) => {
  if (req.session?.user) {
    res.json({ success: true, user: req.session.user });
  } else {
    res.status(401).json({ success: false, error: 'Not authenticated' });
  }
});

// CHECK AUTH STATUS
router.get('/status', (req, res) => {
  res.json({ 
    success: true, 
    authenticated: !!req.session?.user,
    user: req.session?.user || null
  });
});

export default router;