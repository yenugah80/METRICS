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
}

"two eggs and toast" →
{
  "foods": [
    {"name": "eggs", "quantity": 2, "unit": "pieces", "confidence": 0.9},
    {"name": "toast", "quantity": 1, "unit": "slices", "confidence": 0.8}
  ],
  "mealType": "breakfast",
  "confidence": 0.85
}

"I had a banana and some yogurt" →
{
  "foods": [
    {"name": "banana", "quantity": 1, "unit": "pieces", "confidence": 0.9},
    {"name": "yogurt", "quantity": 1, "unit": "serving", "confidence": 0.8}
  ],
  "mealType": "snack",
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
      
      console.log('OpenAI parsing result for transcript "' + transcript + '":', result);
      
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
      console.error('OpenAI parsing error for transcript "' + transcript + '":', aiError);
      
      // Fallback to basic text parsing
      const fallbackResult = basicTextParsing(transcript);
      
      console.log('Fallback parsing result for transcript "' + transcript + '":', fallbackResult);
      
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
  
  // Enhanced regex patterns for natural speech
  const patterns = [
    // Number + unit + food ("2 cups of rice")
    /(\d+)\s*(cups?|cup|slices?|slice|pieces?|piece|tablespoons?|tbsp|teaspoons?|tsp|bowls?|bowl)\s+(?:of\s+)?([^,\.]+)/gi,
    
    // Number + food without unit ("two eggs", "3 apples")
    /(\d+|two|three|four|five|six|seven|eight|nine|ten)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*?)(?:\s+(?:and|,|\.|$))/gi,
    
    // Words like "a", "an", "one", "some" + food
    /(?:a|an|one|some)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*?)(?:\s+(?:and|,|\.|$|with))/gi,
    
    // Food words without quantities ("toast", "coffee")
    /(?:^|\s)(toast|bread|egg|eggs|apple|apples|banana|bananas|coffee|tea|milk|cheese|chicken|beef|rice|pasta|salad|sandwich|pizza)(?:\s|$|,|\.)/gi
  ];

  // Convert number words to digits
  const convertWordToNumber = (word: string): number => {
    const numberMap: { [key: string]: number } = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    return numberMap[word.toLowerCase()] || 1;
  };

  patterns.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (index === 0) {
        // Pattern with unit: [quantity, unit, food]
        const [, quantityStr, unit, food] = match;
        const quantity = parseInt(quantityStr) || 1;
        
        if (food && food.trim()) {
          foods.push({
            name: food.trim().toLowerCase(),
            quantity,
            unit: unit || 'serving',
            confidence: 0.8
          });
        }
      } else if (index === 1) {
        // Number + food: [quantity, food]
        const [, quantityStr, food] = match;
        const quantity = isNaN(parseInt(quantityStr)) ? convertWordToNumber(quantityStr) : parseInt(quantityStr);
        
        if (food && food.trim()) {
          // Determine unit based on food type
          let unit = 'pieces';
          const foodLower = food.toLowerCase();
          if (foodLower.includes('slice') || foodLower.includes('bread') || foodLower.includes('toast')) {
            unit = 'slices';
          } else if (foodLower.includes('cup') || foodLower.includes('liquid')) {
            unit = 'cups';
          }
          
          foods.push({
            name: food.trim().toLowerCase(),
            quantity,
            unit,
            confidence: 0.7
          });
        }
      } else if (index === 2) {
        // "a", "an", "one", "some" + food
        const [, food] = match;
        
        if (food && food.trim()) {
          foods.push({
            name: food.trim().toLowerCase(),
            quantity: 1,
            unit: 'serving',
            confidence: 0.6
          });
        }
      } else if (index === 3) {
        // Common food words
        const [food] = match;
        
        if (food && food.trim()) {
          foods.push({
            name: food.trim().toLowerCase(),
            quantity: 1,
            unit: 'serving',
            confidence: 0.5
          });
        }
      }
    }
  });

  // Remove duplicates (same food name)
  const uniqueFoods = foods.filter((food, index, self) => 
    index === self.findIndex(f => f.name === food.name)
  );

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
    foods: uniqueFoods,
    mealType,
    confidence: uniqueFoods.length > 0 ? 0.6 : 0.1
  };
}