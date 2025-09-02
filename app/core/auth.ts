// ============================================================================
// AUTHENTICATION - Clean Replit Auth Integration
// ============================================================================

import { Request, Response } from 'express';
import { db } from './database';
import { users } from '../types/schema';
import { eq } from 'drizzle-orm';

// Import session types
import '../types/session';

export class AuthService {
  async login(req: Request, res: Response) {
    try {
      // In production, this would handle Replit OAuth
      const mockUser = {
        id: 'test-user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null
      };

      // Store in session
      if (req.session) {
        req.session.user = mockUser;
      }

      // Upsert user in database
      await db.insert(users)
        .values(mockUser)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: mockUser.name,
            email: mockUser.email,
            avatar: mockUser.avatar
          }
        });

      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getCurrentUser(req: Request) {
    return req.session?.user || null;
  }

  isAuthenticated(req: Request): boolean {
    return !!req.session?.user;
  }
}

export const auth = new AuthService();