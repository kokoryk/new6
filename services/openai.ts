import OpenAI from "openai";
import { storage } from "../storage";
import type { DetectedDish, InsertKoreanFood } from "@shared/schema";
import { unsplashService } from "./unsplash";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OCR-only function to extract Korean food names from menu images
export async function extractKoreanFoodNames(base64Image: string): Promise<{
  isKoreanMenu: boolean;
  extractedNames: string[];
  totalDetected?: number;
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    cost_aud: number;
  };
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a Korean OCR specialist. Your task is to:

1. Determine if this is a Korean restaurant menu
2. Extract ONLY the Korean food names from the image using OCR
3. Return the exact Korean text as it appears in the menu
4. IMPORTANT: Count ALL food items you can see. If you detect more than 3 items, still return the first 3 most clearly visible ones, but set totalDetected to the actual number you can see.

Do NOT provide descriptions, translations, or additional information. Focus only on accurate text extraction.

Respond in JSON format:
{
  "isKoreanMenu": boolean,
  "extractedNames": ["exact Korean food name 1", "exact Korean food name 2", "exact Korean food name 3"],
  "totalDetected": number (total items you could see, even if you only return 3)
}

If text is unclear or ambiguous, include your best interpretation but prioritize accuracy.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract only the Korean food names from this menu image.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const result = JSON.parse(content);
    
    // Calculate token usage and costs
    const usage = response.usage!;
    const promptTokenCost = 0.0025 / 1000; // $0.0025 per 1K prompt tokens
    const completionTokenCost = 0.01 / 1000; // $0.01 per 1K completion tokens
    const totalCostUSD = (usage.prompt_tokens * promptTokenCost) + (usage.completion_tokens * completionTokenCost);
    const totalCostAUD = totalCostUSD * 1.5; // Approximate AUD conversion

    return {
      isKoreanMenu: result.isKoreanMenu,
      extractedNames: result.extractedNames || [],
      totalDetected: result.totalDetected,
      tokenUsage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        cost_usd: totalCostUSD,
        cost_aud: totalCostAUD,
      },
    };
  } catch (error) {
    console.error("Error extracting food names with OpenAI:", error);
    throw new Error("Failed to extract food names from menu image");
  }
}

// Get detailed food information from AI when not found in database
export async function getFoodDetailsFromAI(koreanName: string): Promise<InsertKoreanFood> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a Korean food expert with extensive knowledge of authentic Korean cuisine. Provide accurate, detailed information about Korean dishes based on traditional recipes and nutritional data.

IMPORTANT: All information must be factually accurate. Do not make up or guess nutritional values or ingredients. Use your knowledge of authentic Korean cuisine.

Respond in JSON format with exact specifications:
{
  "nameKorean": "정확한 한국어 음식명",
  "nameEnglish": "Accurate English translation", 
  "description": "Detailed English description explaining what the dish is (no Korean words)",
  "descriptionEnglish": "Detailed English description explaining what the dish is",
  "ingredients": ["main ingredients in English (max 6 items)"],
  "calories": "accurate calories per serving (number only)",
  "category": "food category in English (Main Dish/Soup/Side Dish/Dessert/Beverage)",
  "spiciness": "spice level 0-5 (0=not spicy like plain meat/rice, 1=mild like bulgogi, 2=moderate like bibimbap, 3=spicy like kimchi jjigae, 4=very spicy like buldak, 5=extremely spicy like fire chicken)",
  "allergens": ["actual allergens in English - soy, gluten, seafood, nuts, egg, dairy"],
  "isVegetarian": true/false,
  "isVegan": true/false,
  "servingSize": "standard serving size in English",
  "cookingMethod": "cooking method in English",
  "region": "Korean region in English (Nationwide/Seoul/Busan/Jeju etc)",
  "imageUrl": "Leave this as null - images will be searched separately using Unsplash API"

}`,
        },
        {
          role: "user",
          content: `Please provide accurate, detailed information about this Korean dish: "${koreanName}"
          
Use your extensive knowledge of authentic Korean cuisine to provide:
- Correct Korean and English names
- Detailed English description (no Korean words allowed)
- Detailed English description in descriptionEnglish field 
- Real ingredients in English used in traditional recipes
- Accurate calorie count per serving
- Correct spiciness level (plain grilled meats like 삼겹살, 목살, 갈비살, 안심 should be 0 - not spicy)
- Actual allergen information in English
- All categories and details in English
- Appropriate food image URL using the specified format

All data must be factually correct and based on authentic Korean food knowledge.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const foodData = JSON.parse(content);
    
    return {
      nameKorean: foodData.nameKorean,
      nameEnglish: foodData.nameEnglish,
      description: foodData.description,
      descriptionEnglish: foodData.descriptionEnglish || `Traditional Korean ${foodData.nameEnglish}`,
      ingredients: foodData.ingredients || [],
      calories: foodData.calories || 0,
      category: foodData.category,
      spiciness: foodData.spiciness || 0,
      allergens: foodData.allergens || [],
      isVegetarian: foodData.isVegetarian || false,
      isVegan: foodData.isVegan || false,
      servingSize: foodData.servingSize,
      cookingMethod: foodData.cookingMethod,
      region: foodData.region,
      imageUrl: null // Images will be searched separately after AI data is available
    };
  } catch (error) {
    console.error("Error getting food details from AI:", error);
    throw new Error("Failed to get food details from AI");
  }
}

// Hybrid analysis function: OCR + Database + AI fallback
export async function analyzeKoreanMenu(base64Image: string): Promise<{
  isKoreanMenu: boolean;
  dishes: DetectedDish[];
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    cost_aud: number;
  };
}> {
  try {
    // Step 1: Extract food names using OCR (Send image to OpenAI)
    console.log("Step 1: Sending image to OpenAI for OCR extraction...");
    const ocrResult = await extractKoreanFoodNames(base64Image);
    console.log("Step 1 Complete: Extracted food names:", ocrResult.extractedNames);
    
    // Check if more than 3 items were detected (reject if totalDetected > 3)
    if (ocrResult.totalDetected && ocrResult.totalDetected > 3) {
      throw new Error(`FOOD_LIMIT_ERROR: Too many menu items detected (${ocrResult.totalDetected} items found). Please upload a photo with 3 or fewer menu items for analysis.`);
    }
    
    if (!ocrResult.isKoreanMenu) {
      return {
        isKoreanMenu: false,
        dishes: [],
        tokenUsage: ocrResult.tokenUsage,
      };
    }

    const dishes: DetectedDish[] = [];
    let totalTokenUsage = ocrResult.tokenUsage;

    // Step 2: For each extracted name, get details from database or AI
    for (const koreanName of ocrResult.extractedNames) {
      try {
        // Step 3: Search in local database first
        console.log(`Step 3: Searching for "${koreanName}" in local database...`);
        let foodData = await storage.findKoreanFood(koreanName);
        
        if (foodData) {
          // Step 4: Found in database, using local data
          console.log(`Step 4: Found "${koreanName}" in local database`);
          const imageResult = await unsplashService.searchKoreanFood(koreanName, foodData.nameEnglish);
          
          // Parse image URL and accuracy from result
          let imageUrl = null;
          let imageAccuracy = 'high';
          if (imageResult) {
            const [url, accuracy] = imageResult.split('|');
            imageUrl = url;
            imageAccuracy = accuracy || 'high';
          }
          
          console.log(`Step 4: Image URL for "${koreanName}" (${foodData.nameEnglish}): ${imageUrl} (accuracy: ${imageAccuracy})`);
          dishes.push({
            nameKorean: foodData.nameKorean,
            nameEnglish: foodData.nameEnglish,
            description: foodData.description,
            descriptionEnglish: `Traditional Korean ${foodData.nameEnglish}`,
            ingredients: foodData.ingredients,
            calories: foodData.calories,
            imageUrl: imageUrl,
            imageAccuracy: imageAccuracy,
            category: foodData.category,
            spiciness: foodData.spiciness,
            allergens: foodData.allergens,
            isVegetarian: foodData.isVegetarian,
            isVegan: foodData.isVegan,
            servingSize: foodData.servingSize,
            cookingMethod: foodData.cookingMethod,
            region: foodData.region,
            confidence: 1.0,
            source: 'database',
          });
        } else {
          // Step 5: Not found in database, get from AI and save to database
          console.log(`Step 5: "${koreanName}" not found in database, requesting from OpenAI...`);
          const aiData = await getFoodDetailsFromAI(koreanName);
          
          // Search for image using English name from AI data BEFORE saving to database
          console.log(`Step 5: Searching for image using English name: "${aiData.nameEnglish}"`);
          const imageResult = await unsplashService.searchKoreanFood(koreanName, aiData.nameEnglish);
          
          // Parse image URL and accuracy from result
          let imageUrl = null;
          let imageAccuracy = 'high';
          if (imageResult) {
            const [url, accuracy] = imageResult.split('|');
            imageUrl = url;
            imageAccuracy = accuracy || 'high';
          }
          
          console.log(`Step 5: Image URL for "${koreanName}" (${aiData.nameEnglish}): ${imageUrl} (accuracy: ${imageAccuracy})`);
          
          // Update AI data with the found image URL
          aiData.imageUrl = imageUrl;
          
          // Step 5: Save to database for future use with image URL
          console.log(`Step 5: Saving "${koreanName}" to local database...`);
          const savedFood = await storage.createKoreanFood(aiData);
          console.log(`Step 5 Complete: "${koreanName}" saved to database`);
          
          dishes.push({
            nameKorean: savedFood.nameKorean,
            nameEnglish: savedFood.nameEnglish,
            description: savedFood.description,
            descriptionEnglish: aiData.descriptionEnglish || `Traditional Korean ${savedFood.nameEnglish}`,
            ingredients: savedFood.ingredients,
            calories: savedFood.calories,
            imageUrl: imageUrl,
            imageAccuracy: imageAccuracy,
            category: savedFood.category,
            spiciness: savedFood.spiciness,
            allergens: savedFood.allergens,
            isVegetarian: savedFood.isVegetarian,
            isVegan: savedFood.isVegan,
            servingSize: savedFood.servingSize,
            cookingMethod: savedFood.cookingMethod,
            region: savedFood.region,
            confidence: 0.8, // Lower confidence for AI-generated data
            source: 'ai',
          });

          // Add AI token usage (rough estimate for food detail requests)
          totalTokenUsage.prompt_tokens += 200;
          totalTokenUsage.completion_tokens += 400;
          totalTokenUsage.total_tokens += 600;
          totalTokenUsage.cost_usd += 0.004; // Approximate cost
          totalTokenUsage.cost_aud += 0.006;
        }
      } catch (error) {
        console.error(`Error processing food "${koreanName}":`, error);
        // Continue with other foods even if one fails
      }
    }

    return {
      isKoreanMenu: true,
      dishes,
      tokenUsage: totalTokenUsage,
    };
  } catch (error) {
    console.error("Error in hybrid menu analysis:", error);
    
    // Re-throw food limit errors with their original message
    if (error instanceof Error && error.message.includes('FOOD_LIMIT_ERROR:')) {
      throw error;
    }
    
    throw new Error("Failed to analyze menu");
  }
}