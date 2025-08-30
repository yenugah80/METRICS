/**
 * OpenAI Manager - Lazy Loading with Feature Flags
 * No startup initialization - only loads when actually needed
 */

let openaiInstance: any = null;

export class OpenAIManager {
  private static initialized = false;

  /**
   * Check if OpenAI features are available (without initializing)
   */
  static isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * Get OpenAI instance (lazy-loaded)
   */
  static async getInstance() {
    if (!OpenAIManager.isAvailable()) {
      throw new Error('OpenAI API key not configured. OpenAI features are disabled.');
    }

    if (!openaiInstance) {
      try {
        // Dynamic import to avoid startup initialization
        const { default: OpenAI } = await import('openai');
        openaiInstance = new OpenAI({ 
          apiKey: process.env.OPENAI_API_KEY 
        });
        OpenAIManager.initialized = true;
      } catch (error) {
        throw new Error('Failed to initialize OpenAI: ' + error.message);
      }
    }

    return openaiInstance;
  }

  /**
   * Reset instance (for testing)
   */
  static reset(): void {
    openaiInstance = null;
    OpenAIManager.initialized = false;
  }

  /**
   * Check if already initialized
   */
  static isInitialized(): boolean {
    return OpenAIManager.initialized;
  }
}