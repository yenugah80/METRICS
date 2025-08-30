/**
 * Voice Logging API Routes
 * Handles voice-to-text processing and food parsing from natural language
 */

import { Request, Response } from 'express';
import { verifyJWT, AuthenticatedRequest } from '../../infrastructure/auth/authService';
import { OpenAIManager } from '../../integrations/openai/openai-manager';

export interface VoiceFoodParsingRequest {
  transcript: string;
  isPremium: boolean;
}

export interface ParsedFoodResult {
  foods: Array<{
    name: string;
    quantity: number;
    unit: string;
    confidence: number;
  }>;
  mealType?: string;
  confidence: number;
}

/**
 * Parse natural language food description into structured food data
 */
export async function parseVoiceFoodInput(
  req: AuthenticatedRequest<VoiceFoodParsingRequest>,
  res: Response
): Promise<void> {
  try {
    const { transcript, isPremium } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Transcript is required and must be a string'
      });
      return;
    }

    // Check if OpenAI is available
    if (!OpenAIManager.isAvailable()) {
      res.status(503).json({
        success: false,
        error: 'Voice logging is temporarily unavailable. AI services are not configured.'
      });
      return;
    }

    // For premium users, provide more detailed parsing
    const maxTokens = isPremium ? 800 : 400;
    const detailLevel = isPremium ? 'comprehensive' : 'basic';

    try {
      const openai = await OpenAIManager.getInstance();
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a nutrition expert that parses natural language food descriptions into structured data.

Extract food items and quantities from the user's speech. Be intelligent about interpreting:
- Common food names and synonyms
- Quantities (numbers, portions, sizes)
- Units (cups, slices, pieces, grams, etc.)
- Meal context and timing

Return JSON in this exact format:
{
  "foods": [
    {
      "name": "standardized food name",
      "quantity": numeric_value,
      "unit": "standard_unit",
      "confidence": 0.0_to_1.0
    }
  ],
  "mealType": "breakfast|lunch|dinner|snack|unknown",
  "confidence": overall_confidence_0_to_1.0
}

${detailLevel === 'comprehensive' ? `
For Premium users:
- Include more precise quantity estimates
- Recognize brand names and specific varieties
- Provide higher confidence scores for complex descriptions
- Interpret cooking methods (grilled, fried, etc.)
` : `
For Basic users:
- Focus on main food items only
- Use standard portions when exact quantities aren't clear
- Keep confidence scores realistic
`}

Examples:
"I had two slices of whole wheat toast with butter" →
{
  "foods": [
    {"name": "whole wheat bread", "quantity": 2, "unit": "slices", "confidence": 0.9},
    {"name": "butter", "quantity": 1, "unit": "tablespoon", "confidence": 0.7}
  ],
  "mealType": "breakfast",
  "confidence": 0.85
}`
          },
          {
            role: "user",
            content: `Parse this food description: "${transcript}"`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        temperature: 0.1 // Low temperature for consistent parsing
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate the response structure
      if (!result.foods || !Array.isArray(result.foods)) {
        throw new Error('Invalid response format from AI parser');
      }

      // Clean and validate each food item
      const validatedFoods = result.foods
        .filter((food: any) => food.name && typeof food.name === 'string')
        .map((food: any) => ({
          name: food.name.trim(),
          quantity: Math.max(0, Number(food.quantity) || 1),
          unit: food.unit || 'serving',
          confidence: Math.min(1, Math.max(0, Number(food.confidence) || 0.5))
        }));

      if (validatedFoods.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            foods: [],
            mealType: 'unknown',
            confidence: 0,
            message: 'No foods could be identified from the description. Please try being more specific.'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          foods: validatedFoods,
          mealType: result.mealType || 'unknown',
          confidence: Math.min(1, Math.max(0, Number(result.confidence) || 0.5)),
          transcript: transcript // Echo back for confirmation
        }
      });

    } catch (aiError: any) {
      console.error('OpenAI parsing error:', aiError);
      
      // Fallback to basic text parsing
      const fallbackResult = basicTextParsing(transcript);
      
      res.json({
        success: true,
        data: {
          ...fallbackResult,
          message: 'AI parsing unavailable, used basic text analysis. Results may be less accurate.'
        }
      });
    }

  } catch (error: any) {
    console.error('Voice food parsing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse voice input. Please try again.'
    });
  }
}

/**
 * Fallback text parsing when AI is unavailable
 */
function basicTextParsing(text: string): ParsedFoodResult {
  const foods: Array<{ name: string; quantity: number; unit: string; confidence: number }> = [];
  
  // Simple regex patterns for common food descriptions
  const patterns = [
    /(\d+)\s*(cups?|cup)\s+(?:of\s+)?([^,\.]+)/gi,
    /(\d+)\s*(slices?|slice)\s+(?:of\s+)?([^,\.]+)/gi,
    /(\d+)\s*(pieces?|piece)\s+(?:of\s+)?([^,\.]+)/gi,
    /(\d+)\s*(tablespoons?|tbsp|teaspoons?|tsp)\s+(?:of\s+)?([^,\.]+)/gi,
    /(?:a|an|one)\s+([^,\.]+)/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const [, quantityStr, unit, food] = match;
      const quantity = quantityStr ? parseInt(quantityStr) : 1;
      
      if (food && food.trim()) {
        foods.push({
          name: food.trim().toLowerCase(),
          quantity,
          unit: unit || 'serving',
          confidence: 0.4 // Lower confidence for basic parsing
        });
      }
    }
  });

  // Determine meal type based on keywords
  const lowerText = text.toLowerCase();
  let mealType = 'unknown';
  
  if (lowerText.includes('breakfast') || lowerText.includes('morning')) {
    mealType = 'breakfast';
  } else if (lowerText.includes('lunch') || lowerText.includes('noon')) {
    mealType = 'lunch';
  } else if (lowerText.includes('dinner') || lowerText.includes('evening')) {
    mealType = 'dinner';
  } else if (lowerText.includes('snack')) {
    mealType = 'snack';
  }

  return {
    foods,
    mealType,
    confidence: foods.length > 0 ? 0.5 : 0.1
  };
}