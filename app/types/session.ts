// ============================================================================
// SESSION TYPES - Clean Type Definitions
// ============================================================================

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
    };
  }
}