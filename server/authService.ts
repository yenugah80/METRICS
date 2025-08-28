import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, authProviders, refreshTokens, passkeys } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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

// JWT configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "your-access-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
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
      return jwt.verify(token, JWT_ACCESS_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Compare password
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Store refresh token in database
  async storeRefreshToken(
    userId: string, 
    token: string, 
    family: string, 
    deviceInfo?: any
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await db.insert(refreshTokens).values({
      userId,
      token,
      family,
      deviceInfo,
      expiresAt,
    });
  }

  // Revoke refresh token family (security measure)
  async revokeTokenFamily(family: string): Promise<void> {
    await db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.family, family));
  }

  // Find valid refresh token
  async findValidRefreshToken(token: string): Promise<any> {
    const [tokenRecord] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, token),
          eq(refreshTokens.revokedAt, null)
        )
      );

    if (!tokenRecord) return null;
    
    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      await this.revokeTokenFamily(tokenRecord.family);
      return null;
    }

    return tokenRecord;
  }

  // Create or find user
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

    // Create auth provider record
    if (provider !== "email" || providerId) {
      await db.insert(authProviders).values({
        userId: user.id,
        provider,
        providerId: providerId || user.email,
      });
    }

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

  // Find user by provider
  async findUserByProvider(provider: string, providerId: string): Promise<any> {
    const [authProvider] = await db
      .select({
        user: users,
        provider: authProviders,
      })
      .from(authProviders)
      .innerJoin(users, eq(authProviders.userId, users.id))
      .where(
        and(
          eq(authProviders.provider, provider),
          eq(authProviders.providerId, providerId)
        )
      );

    return authProvider?.user || null;
  }

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Clean up expired tokens
  async cleanupExpiredTokens(): Promise<void> {
    await db.delete(refreshTokens)
      .where(eq(refreshTokens.expiresAt, new Date()));
  }

  // WebAuthn/Passkey support
  async storePasskey(
    userId: string,
    credentialId: string,
    publicKey: string,
    deviceName?: string,
    transports?: string[]
  ): Promise<void> {
    await db.insert(passkeys).values({
      userId,
      credentialId,
      publicKey,
      deviceName,
      transports,
    });
  }

  async findPasskey(credentialId: string): Promise<any> {
    const [passkey] = await db
      .select()
      .from(passkeys)
      .where(eq(passkeys.credentialId, credentialId));

    return passkey || null;
  }

  async updatePasskeyCounter(credentialId: string, counter: number): Promise<void> {
    await db.update(passkeys)
      .set({ 
        counter,
        lastUsedAt: new Date()
      })
      .where(eq(passkeys.credentialId, credentialId));
  }
}

// Middleware to verify JWT token
export async function verifyJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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