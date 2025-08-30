import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { db } from "../database/db";
import { users } from "../../../shared/schema";
import { eq, and, isNull } from "drizzle-orm";

export interface JWTPayload {
  userId: string;
  email: string;
  tokenFamily: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    isPremium: boolean | null;
  };
}

// JWT configuration - SECURITY: No fallback secrets allowed in production
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 
  (process.env.NODE_ENV === 'development' ? 'dev-access-secret-key-at-least-32-chars-long' : '');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 
  (process.env.NODE_ENV === 'development' ? 'dev-refresh-secret-key-at-least-32-chars-long' : '');

// Validate required secrets at startup
if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('SECURITY ERROR: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables must be set in production');
}

// Validate secret strength
if (JWT_ACCESS_SECRET.length < 32 || JWT_REFRESH_SECRET.length < 32) {
  throw new Error('SECURITY ERROR: JWT secrets must be at least 32 characters long');
}

// Warn in development if using default secrets
if (process.env.NODE_ENV === 'development' && 
    (JWT_ACCESS_SECRET.includes('dev-') || JWT_REFRESH_SECRET.includes('dev-'))) {
  console.warn('⚠️  WARNING: Using default JWT secrets in development. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET for production.');
}
const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES = "30d";

export class AuthService {
  // Generate JWT tokens
  generateTokens(userId: string, email: string): { accessToken: string; refreshToken: string; tokenFamily: string } {
    const tokenFamily = crypto.randomUUID();
    
    const accessToken = jwt.sign(
      { userId, email, tokenFamily },
      JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    const refreshToken = jwt.sign(
      { userId, email, tokenFamily },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES }
    );

    return { accessToken, refreshToken, tokenFamily };
  }

  // Verify JWT token
  verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        tokenFamily: decoded.tokenFamily,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      console.warn('JWT verification failed:', error.message);
      return null;
    }
  }

  verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        tokenFamily: decoded.tokenFamily,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      console.warn('Refresh token verification failed:', error.message);
      return null;
    }
  }

  // Password hashing
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // User authentication
  async authenticateUser(email: string, password: string): Promise<any> {
    const user = await this.findUserByEmail(email);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.password) {
      throw new Error('Password authentication not available for this account');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Update last login
    await this.updateLastLogin(user.id);

    return user;
  }

  // User creation
  async createUser(userData: {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    provider?: string;
    providerId?: string;
  }): Promise<any> {
    const { provider = "email", providerId, ...userInfo } = userData;

    // Hash password if provided
    const hashedPassword = userData.password 
      ? await this.hashPassword(userData.password)
      : null;

    // Create user
    const [user] = await db.insert(users).values({
      ...userInfo,
      password: hashedPassword,
    }).returning();

    return user;
  }

  // Find user by email
  async findUserByEmail(email: string): Promise<any> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return user || null;
  }

  // Find user by provider (simplified for production)
  async findUserByProvider(provider: string, providerId: string): Promise<any> {
    // For now, fallback to email-based lookup
    return this.findUserByEmail(providerId);
  }

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Clean up expired tokens - simplified for production
  async cleanupExpiredTokens(): Promise<void> {
    // Token cleanup handled by JWT expiration
    console.log('Token cleanup - using JWT expiration mechanism');
  }
}

// Middleware to verify JWT token
export async function verifyJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Try to get token from Authorization header first, then from cookies
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  const cookieToken = req.cookies?.accessToken;
  
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Access token required" 
    });
  }

  const authService = new AuthService();
  const payload = authService.verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
  }

  // Get full user data from database to ensure accurate info
  const user = await authService.findUserByEmail(payload.email);
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: "User not found" 
    });
  }

  // Add user info to request
  req.user = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    isPremium: user.isPremium,
  };

  next();
}

// Optional middleware (doesn't fail if no token)
export async function optionalJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const authService = new AuthService();
    const payload = authService.verifyAccessToken(token);
    
    if (payload) {
      const user = await authService.findUserByEmail(payload.email);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          isPremium: user.isPremium,
        };
      }
    }
  }

  next();
}

// Device fingerprinting for security
export function getDeviceInfo(req: Request): any {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    acceptLanguage: req.headers['accept-language'],
    timestamp: new Date().toISOString(),
  };
}

export const authService = new AuthService();