import { Router, Request, Response } from "express";
import { z } from "zod";
import { authService, verifyJWT, AuthenticatedRequest, getDeviceInfo } from "./authService";

const router = Router();

// Validation schemas
const signUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// Helper function to set authentication cookies
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  // Set HTTP-only cookies for security
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

// Clear authentication cookies
function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}

// Sign Up with email/password
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const validatedData = signUpSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await authService.findUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    // Create new user
    const user = await authService.createUser({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      provider: "email",
    });

    // Generate JWT tokens
    const { accessToken, refreshToken, tokenFamily } = authService.generateTokens(
      user.id, 
      user.email
    );

    // Store refresh token
    await authService.storeRefreshToken(
      user.id,
      refreshToken,
      tokenFamily,
      getDeviceInfo(req)
    );

    // Update last login
    await authService.updateLastLogin(user.id);

    // Set cookies and return response
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        isPremium: user.isPremium,
      },
      accessToken, // Also return in body for frontend
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    console.error("Sign up error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during sign up"
    });
  }
});

// Sign In with email/password
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const validatedData = signInSchema.parse(req.body);

    // Find user by email
    const user = await authService.findUserByEmail(validatedData.email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check password
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "This account uses a different sign-in method"
      });
    }

    const isPasswordValid = await authService.comparePassword(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT tokens
    const { accessToken, refreshToken, tokenFamily } = authService.generateTokens(
      user.id, 
      user.email
    );

    // Store refresh token
    await authService.storeRefreshToken(
      user.id,
      refreshToken,
      tokenFamily,
      getDeviceInfo(req)
    );

    // Update last login
    await authService.updateLastLogin(user.id);

    // Set cookies and return response
    setAuthCookies(res, accessToken, refreshToken);

    return res.json({
      success: true,
      message: "Signed in successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        isPremium: user.isPremium,
      },
      accessToken,
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    console.error("Sign in error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during sign in"
    });
  }
});

// Refresh access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const payload = authService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    // Check if token exists and is valid in database
    const tokenRecord = await authService.findValidRefreshToken(refreshToken);
    if (!tokenRecord) {
      // Token reuse detected - revoke entire family
      await authService.revokeTokenFamily(payload.tokenFamily);
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    // Generate new token pair
    const { 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken, 
      tokenFamily 
    } = authService.generateTokens(payload.userId, payload.email);

    // Store new refresh token
    await authService.storeRefreshToken(
      payload.userId,
      newRefreshToken,
      tokenFamily,
      getDeviceInfo(req)
    );

    // Revoke old refresh token
    await authService.revokeTokenFamily(tokenRecord.family);

    // Set new cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.json({
      success: true,
      accessToken: newAccessToken,
    });

  } catch (error: any) {
    console.error("Token refresh error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during token refresh"
    });
  }
});

// Sign out
router.post('/signout', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Find and revoke token family
      const tokenRecord = await authService.findValidRefreshToken(refreshToken);
      if (tokenRecord) {
        await authService.revokeTokenFamily(tokenRecord.family);
      }
    }

    // Clear cookies
    clearAuthCookies(res);

    return res.json({
      success: true,
      message: "Signed out successfully"
    });

  } catch (error: any) {
    console.error("Sign out error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during sign out"
    });
  }
});

// Get current user
router.get('/me', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // Get full user data from database
    const user = await authService.findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        isPremium: user.isPremium,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
      }
    });

  } catch (error: any) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching user data"
    });
  }
});

// Google OAuth initiation
router.get('/google', (req: Request, res: Response) => {
  // This would typically redirect to Google OAuth
  // For now, return a placeholder
  return res.status(501).json({
    success: false,
    message: "Google OAuth integration coming soon. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
  });
});

// Google OAuth callback
router.get('/google/callback', async (req: Request, res: Response) => {
  // This would handle the OAuth callback
  return res.status(501).json({
    success: false,
    message: "Google OAuth callback not implemented yet"
  });
});

// WebAuthn/Passkey registration initiation
router.post('/passkey/register/begin', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would generate WebAuthn registration options
    return res.status(501).json({
      success: false,
      message: "Passkey registration coming soon. WebAuthn implementation in progress."
    });

  } catch (error: any) {
    console.error("Passkey registration error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during passkey registration"
    });
  }
});

// WebAuthn/Passkey authentication initiation
router.post('/passkey/authenticate/begin', async (req: Request, res: Response) => {
  try {
    // This would generate WebAuthn authentication options
    return res.status(501).json({
      success: false,
      message: "Passkey authentication coming soon. WebAuthn implementation in progress."
    });

  } catch (error: any) {
    console.error("Passkey authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during passkey authentication"
    });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: "Authentication service is running",
    timestamp: new Date().toISOString(),
    features: {
      emailPassword: true,
      googleOAuth: false, // Coming soon
      replitSSO: true,
      passkeys: false, // Coming soon
      jwtTokens: true,
      refreshTokens: true,
    }
  });
});

export default router;